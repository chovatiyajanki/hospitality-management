from datetime import date, datetime
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
import models, schemas, crud
from websocket_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Ensure default settings exist
    db = SessionLocal()
    try:
        crud.get_or_create_settings(db)
    finally:
        db.close()
    yield

tags_metadata = [
    {
        "name": "Status",
        "description": "Real-time queue tokens, current patient serving, and live doctor availability.",
    },
    {
        "name": "Settings",
        "description": "Hospital configuration, doctor information, session patient limits, and timings.",
    },
    {
        "name": "Availability",
        "description": "Check appointment slots and session quota capacity for today or selected dates.",
    },
    {
        "name": "Appointments",
        "description": "Patient appointment booking, token search, and daily patient list.",
    },
    {
        "name": "Doctor",
        "description": "Doctor cabin controls: call next patient, recall, mark complete, skip, toggle duty status, and switch session.",
    },
    {
        "name": "Demo",
        "description": "Seed sample patients to test queue logic, token numbering, and capacity constraints.",
    },
]

app = FastAPI(
    title="Gurukrupa Clinic - Online Appointment & Queue Management",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/queue")
async def websocket_queue_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = SessionLocal()
    try:
        # Send current status immediately upon connection
        status = crud.get_live_queue_status(db)
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": status.dict()
        })
        while True:
            # Keep connection open / listen for ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        db.close()

async def broadcast_status_update(db: Session, event_type: str = "QUEUE_UPDATED", extra: Optional[dict] = None):
    status = crud.get_live_queue_status(db)
    payload = {
        "type": event_type,
        "data": status.dict(),
        "extra": extra or {}
    }
    await manager.broadcast(payload)

@app.get("/api/status", response_model=schemas.LiveQueueStatus, tags=["Status"])
def get_live_status(db: Session = Depends(get_db)):
    return crud.get_live_queue_status(db)

@app.get("/api/settings", response_model=schemas.ClinicSettingOut, tags=["Settings"])
def get_settings(db: Session = Depends(get_db)):
    return crud.get_or_create_settings(db)

@app.put("/api/settings", response_model=schemas.ClinicSettingOut, tags=["Settings"])
async def update_settings(update_data: schemas.ClinicSettingUpdate, db: Session = Depends(get_db)):
    setting = crud.get_or_create_settings(db)
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(setting, key, value)
    db.commit()
    db.refresh(setting)
    await broadcast_status_update(db, "SETTINGS_UPDATED")
    return setting

@app.get("/api/availability", response_model=schemas.AvailabilityResponse, tags=["Availability"])
def get_availability(date_str: Optional[str] = None, db: Session = Depends(get_db)):
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()
    else:
        target_date = date.today()
    return crud.get_availability(db, target_date)

@app.post("/api/appointments", response_model=schemas.AppointmentOut, tags=["Appointments"])
async def book_appointment(appt_in: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    new_appt = crud.create_appointment(db, appt_in)
    await broadcast_status_update(
        db, 
        "NEW_APPOINTMENT_BOOKED", 
        {"token_number": new_appt.token_number, "patient_name": new_appt.patient_name}
    )
    return new_appt

@app.get("/api/appointments/search", tags=["Appointments"])
def search_appointment(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return crud.search_patient_token(db, q)

@app.get("/api/appointments/today", tags=["Appointments"])
def get_today_appointments(
    session: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_date = date.today()
    query = db.query(models.Appointment).filter(models.Appointment.appointment_date == target_date)
    if session:
        query = query.filter(models.Appointment.session == session.upper())
    if status:
        query = query.filter(models.Appointment.status == status.upper())
    return query.order_by(models.Appointment.sequence_in_session.asc()).all()

@app.post("/api/doctor/call-next", tags=["Doctor"])
async def doctor_call_next(db: Session = Depends(get_db)):
    called = crud.doctor_call_next(db)
    if called:
        await broadcast_status_update(
            db, 
            "PATIENT_CALLED", 
            {
                "token_number": called.token_number,
                "patient_name": called.patient_name,
                "appointment_id": called.id
            }
        )
        return {"success": True, "called": schemas.AppointmentOut.from_orm(called)}
    else:
        await broadcast_status_update(db, "QUEUE_EMPTY")
        return {"success": False, "message": "No patients currently waiting in queue."}

@app.post("/api/doctor/recall", tags=["Doctor"])
async def doctor_recall(db: Session = Depends(get_db)):
    current = crud.doctor_recall_current(db)
    if current:
        await broadcast_status_update(
            db, 
            "PATIENT_RECALLED", 
            {
                "token_number": current.token_number,
                "patient_name": current.patient_name,
                "appointment_id": current.id
            }
        )
        return {"success": True, "recalled": schemas.AppointmentOut.from_orm(current)}
    return {"success": False, "message": "No patient is currently called."}

@app.post("/api/doctor/complete/{appt_id}", tags=["Doctor"])
async def doctor_complete(appt_id: int, notes: Optional[str] = None, db: Session = Depends(get_db)):
    completed = crud.doctor_complete_patient(db, appt_id, notes)
    await broadcast_status_update(db, "PATIENT_COMPLETED", {"appointment_id": appt_id})
    return {"success": True, "completed": schemas.AppointmentOut.from_orm(completed)}

@app.post("/api/doctor/skip/{appt_id}", tags=["Doctor"])
async def doctor_skip(appt_id: int, db: Session = Depends(get_db)):
    skipped = crud.doctor_skip_patient(db, appt_id)
    await broadcast_status_update(db, "PATIENT_SKIPPED", {"appointment_id": appt_id})
    return {"success": True, "skipped": schemas.AppointmentOut.from_orm(skipped)}

@app.post("/api/doctor/status", tags=["Doctor"])
async def update_doctor_status(status: str = Query(...), db: Session = Depends(get_db)):
    setting = crud.get_or_create_settings(db)
    setting.doctor_status = status.upper()
    db.commit()
    await broadcast_status_update(db, "DOCTOR_STATUS_CHANGED", {"doctor_status": status})
    return {"success": True, "doctor_status": setting.doctor_status}

@app.post("/api/doctor/session", tags=["Doctor"])
async def switch_session(session: str = Query(...), db: Session = Depends(get_db)):
    setting = crud.get_or_create_settings(db)
    session_upper = session.upper()
    if session_upper in ["MORNING", "EVENING"]:
        setting.active_session = session_upper
        db.commit()
        await broadcast_status_update(db, "SESSION_SWITCHED", {"active_session": session_upper})
    return {"success": True, "active_session": setting.active_session}

@app.post("/api/seed-demo", tags=["Demo"])
async def seed_demo_data(target_count: int = Query(48, description="Target morning booked count"), db: Session = Depends(get_db)):
    """
    Seed sample patients so user can test the exact 50 capacity constraint:
    e.g. seeds 48 or 50 patients in Morning, so the 51st patient triggers the Evening suggestion!
    """
    target_date = date.today()
    db.query(models.Appointment).filter(models.Appointment.appointment_date == target_date).delete()
    db.commit()

    sample_names = [
        ("Ramesh Patel", 45, "Male", "Rajkot", "Fever and Cold"),
        ("Bhavna Shah", 38, "Female", "Gondal", "Blood Pressure Checkup"),
        ("Haresh Doshi", 52, "Male", "Rajkot", "Headache & Migraine"),
        ("Geeta Joshi", 29, "Female", "Shapar", "Joint Pain"),
        ("Kirit Mehta", 60, "Male", "Kotda", "Diabetes Consultation"),
        ("Jayshree Trivedi", 34, "Female", "Rajkot", "Abdominal Pain"),
        ("Dinesh Vaghela", 41, "Male", "Padadhari", "Routine Health Checkup"),
        ("Meena Soni", 48, "Female", "Rajkot", "Acidity & Digestion"),
        ("Vijay Jadeja", 36, "Male", "Morbi", "Back Pain"),
        ("Pooja Rawal", 25, "Female", "Rajkot", "Skin Allergy")
    ]

    setting = crud.get_or_create_settings(db)
    setting.active_session = "MORNING"
    setting.doctor_status = "AVAILABLE"

    # Add morning appointments up to target_count
    for i in range(1, target_count + 1):
        name, age, gender, city, reason = sample_names[(i - 1) % len(sample_names)]
        seq = i
        token = f"M-{seq:02d}"
        est = crud.calculate_estimated_time("MORNING", seq, setting.avg_consultation_time_minutes)
        
        # Make first 2 completed, 3rd in progress, rest waiting
        if seq <= 2:
            status = "COMPLETED"
        elif seq == 3:
            status = "CALLED"
            setting.doctor_status = "IN_CONSULTATION"
        else:
            status = "WAITING"
            
        appt = models.Appointment(
            token_number=token,
            sequence_in_session=seq,
            session="MORNING",
            appointment_date=target_date,
            time_slot=est,
            patient_name=f"{name} #{seq}",
            phone_number=f"9824{seq:06d}",
            age=age,
            gender=gender,
            city=city,
            reason=reason,
            status=status,
            estimated_time=est
        )
        db.add(appt)

    # Also add 3 sample evening appointments
    for j in range(1, 4):
        seq = j
        token = f"E-{seq:02d}"
        evening_slots = crud.get_evening_slots()
        slot = evening_slots[(j - 1) % len(evening_slots)]
        appt_eve = models.Appointment(
            token_number=token,
            sequence_in_session=seq,
            session="EVENING",
            appointment_date=target_date,
            time_slot=slot,
            patient_name=f"Evening Patient #{seq}",
            phone_number=f"9978{seq:06d}",
            age=32 + j,
            gender="Male" if j % 2 == 1 else "Female",
            city="Rajkot",
            reason="Routine Checkup",
            status="WAITING",
            estimated_time=slot
        )
        db.add(appt_eve)

    db.commit()
    await broadcast_status_update(db, "DEMO_DATA_LOADED")
    return {
        "success": True, 
        "message": f"Demo data created: {target_count} Morning appointments and 3 Evening appointments created successfully!"
    }
