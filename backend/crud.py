from datetime import date, datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import models, schemas

def get_or_create_settings(db: Session) -> models.ClinicSetting:
    setting = db.query(models.ClinicSetting).first()
    if not setting:
        setting = models.ClinicSetting(
            clinic_name="Gurukrupa Clinic",
            doctor_name="Dr. Gitendra Patel",
            doctor_qualification="M.B.B.S., M.D. (Medicine) - Consultant Physician",
            morning_start_time="09:00 AM",
            morning_end_time="01:00 PM",
            morning_patient_limit=50,
            evening_start_time="04:30 PM",
            evening_end_time="08:30 PM",
            evening_patient_limit=50,
            avg_consultation_time_minutes=5,
            doctor_status="AVAILABLE",
            active_session="MORNING",
            phone="+91 99135 67716",
            address="7,8, Bhagirath Soc Vibhag 2, Lambe Hanuman Rd, Vasundhara Society, Shivnagar Society, Varachha, Surat, Gujarat 395006",
            notice_text="Please arrive at the clinic 15 minutes prior to your estimated appointment time."
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    else:
        # Update only the known scaffold defaults; preserve any clinic details
        # that staff have explicitly configured.
        changed = False
        if setting.phone == "+91 98765 43210":
            setting.phone = "+91 99135 67716"
            changed = True
        if setting.address == "Gurukrupa Clinic, Station Road, Rajkot - 360001":
            setting.address = "7,8, Bhagirath Soc Vibhag 2, Lambe Hanuman Rd, Vasundhara Society, Shivnagar Society, Varachha, Surat, Gujarat 395006"
            changed = True
        if changed:
            db.commit()
            db.refresh(setting)
    return setting

def calculate_estimated_time(session: str, sequence: int, avg_minutes: int, preferred_slot: Optional[str] = None) -> str:
    """Calculate estimated appointment time based on session start and queue sequence"""
    if preferred_slot and session == "EVENING":
        return preferred_slot

    if session == "MORNING":
        # Morning starts at 9:00 AM
        base_time = datetime.strptime("09:00 AM", "%I:%M %p")
        mins = (sequence - 1) * avg_minutes
        est = base_time + timedelta(minutes=mins)
        return est.strftime("%I:%M %p")
    else:
        # Evening starts at 04:30 PM
        base_time = datetime.strptime("04:30 PM", "%I:%M %p")
        mins = (sequence - 1) * avg_minutes
        est = base_time + timedelta(minutes=mins)
        return est.strftime("%I:%M %p")

def get_evening_slots() -> List[str]:
    return [
        "04:30 PM", "05:00 PM", "05:30 PM", 
        "06:00 PM", "06:30 PM", "07:00 PM", 
        "07:30 PM", "08:00 PM"
    ]

def get_availability(db: Session, target_date: date) -> schemas.AvailabilityResponse:
    setting = get_or_create_settings(db)
    
    # Morning count
    morning_booked = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == "MORNING",
        models.Appointment.status != "CANCELLED"
    ).scalar() or 0
    
    morning_limit = setting.morning_patient_limit
    morning_avail = morning_booked < morning_limit
    morning_rem = max(0, morning_limit - morning_booked)
    
    if morning_avail:
        m_msg = f"Morning session slots are available. {morning_rem} slots left (Total {morning_limit})."
    else:
        m_msg = f"Morning session is FULL (50/50 patients booked). Token 51 cannot be accommodated in the morning session. Please select Evening Session."

    # Evening count
    evening_booked = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == "EVENING",
        models.Appointment.status != "CANCELLED"
    ).scalar() or 0
    
    evening_limit = setting.evening_patient_limit
    evening_avail = evening_booked < evening_limit
    evening_rem = max(0, evening_limit - evening_booked)
    
    if evening_avail:
        e_msg = f"Evening session slots are available. {evening_rem} slots left (Total {evening_limit})."
    else:
        e_msg = f"Evening quota ({evening_limit} patients) is full. Please book for tomorrow or another date."

    morning_slots = ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM"]
    evening_slots = get_evening_slots()

    return schemas.AvailabilityResponse(
        date=str(target_date),
        morning=schemas.SessionAvailability(
            session="MORNING",
            timing=f"{setting.morning_start_time} - {setting.morning_end_time}",
            booked_count=morning_booked,
            limit=morning_limit,
            is_available=morning_avail,
            remaining_slots=morning_rem,
            message=m_msg,
            slots=morning_slots
        ),
        evening=schemas.SessionAvailability(
            session="EVENING",
            timing=f"{setting.evening_start_time} - {setting.evening_end_time}",
            booked_count=evening_booked,
            limit=evening_limit,
            is_available=evening_avail,
            remaining_slots=evening_rem,
            message=e_msg,
            slots=evening_slots
        )
    )

def create_appointment(db: Session, appt_in: schemas.AppointmentCreate) -> models.Appointment:
    setting = get_or_create_settings(db)
    target_date = appt_in.appointment_date or date.today()
    session_upper = appt_in.session.upper()
    
    if session_upper not in ["MORNING", "EVENING"]:
        raise HTTPException(status_code=400, detail="Invalid session. Must be MORNING or EVENING.")
    
    # Query current count for that session
    current_count = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == session_upper,
        models.Appointment.status != "CANCELLED"
    ).scalar() or 0

    if session_upper == "MORNING":
        limit = setting.morning_patient_limit
        if current_count >= limit:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "MORNING_FULL",
                    "booked": current_count,
                    "limit": limit,
                    "message": f"Morning session limit of {limit} patients has been reached! Your token would be #{limit + 1}, which cannot be accommodated in the morning. Please book your appointment in the Evening Session.",
                }
            )
        prefix = "M"
    else:
        limit = setting.evening_patient_limit
        if current_count >= limit:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "EVENING_FULL",
                    "booked": current_count,
                    "limit": limit,
                    "message": f"Evening session limit of {limit} patients has been reached. Please book for tomorrow or another date.",
                }
            )
        prefix = "E"

    sequence = current_count + 1
    token_str = f"{prefix}-{sequence:02d}"
    
    estimated = calculate_estimated_time(
        session_upper, 
        sequence, 
        setting.avg_consultation_time_minutes, 
        appt_in.preferred_time_slot
    )
    
    time_slot = appt_in.preferred_time_slot or estimated

    new_appt = models.Appointment(
        token_number=token_str,
        sequence_in_session=sequence,
        session=session_upper,
        appointment_date=target_date,
        time_slot=time_slot,
        patient_name=appt_in.patient_name.strip(),
        phone_number=appt_in.phone_number.strip(),
        age=appt_in.age,
        gender=appt_in.gender,
        city=appt_in.city.strip() if appt_in.city else "Rajkot",
        reason=appt_in.reason.strip() if appt_in.reason else "General Health Checkup",
        status="WAITING",
        estimated_time=estimated
    )
    
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

def get_live_queue_status(db: Session, target_date: Optional[date] = None) -> schemas.LiveQueueStatus:
    if not target_date:
        target_date = date.today()
        
    setting = get_or_create_settings(db)
    active_session = setting.active_session
    
    # Current serving appointment for active session
    current_appt = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == active_session,
        models.Appointment.status.in_(["CALLED", "IN_PROGRESS"])
    ).order_by(models.Appointment.called_at.desc()).first()

    # Total waiting
    total_waiting = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == active_session,
        models.Appointment.status == "WAITING"
    ).scalar() or 0

    # Total completed
    total_completed = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == active_session,
        models.Appointment.status == "COMPLETED"
    ).scalar() or 0

    # Total skipped
    total_skipped = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == active_session,
        models.Appointment.status == "SKIPPED"
    ).scalar() or 0

    # Morning & evening counts
    m_booked = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == "MORNING",
        models.Appointment.status != "CANCELLED"
    ).scalar() or 0

    e_booked = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == "EVENING",
        models.Appointment.status != "CANCELLED"
    ).scalar() or 0

    # Next upcoming tokens (top 6 waiting)
    upcoming_query = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == active_session,
        models.Appointment.status == "WAITING"
    ).order_by(models.Appointment.sequence_in_session.asc()).limit(6).all()

    upcoming_list = [
        {
            "id": u.id,
            "token_number": u.token_number,
            "patient_name": u.patient_name,
            "estimated_time": u.estimated_time,
            "sequence": u.sequence_in_session
        }
        for u in upcoming_query
    ]

    return schemas.LiveQueueStatus(
        active_session=active_session,
        doctor_status=setting.doctor_status,
        doctor_name=setting.doctor_name,
        clinic_name=setting.clinic_name,
        current_serving_token=current_appt.token_number if current_appt else None,
        current_serving_id=current_appt.id if current_appt else None,
        current_serving_patient_name=current_appt.patient_name if current_appt else None,
        total_waiting=total_waiting,
        total_completed=total_completed,
        total_skipped=total_skipped,
        morning_booked=m_booked,
        morning_limit=setting.morning_patient_limit,
        morning_full=m_booked >= setting.morning_patient_limit,
        evening_booked=e_booked,
        evening_limit=setting.evening_patient_limit,
        evening_full=e_booked >= setting.evening_patient_limit,
        upcoming_tokens=upcoming_list
    )

def search_patient_token(db: Session, query: str) -> List[dict]:
    clean_query = query.strip()
    target_date = date.today()
    
    appts = db.query(models.Appointment).filter(
        (models.Appointment.phone_number == clean_query) | 
        (models.Appointment.token_number.ilike(f"%{clean_query}%"))
    ).order_by(models.Appointment.appointment_date.desc(), models.Appointment.id.desc()).limit(10).all()

    results = []
    setting = get_or_create_settings(db)
    
    for a in appts:
        ahead_count = 0
        if a.status == "WAITING" and a.appointment_date == target_date and a.session == setting.active_session:
            ahead_count = db.query(func.count(models.Appointment.id)).filter(
                models.Appointment.appointment_date == target_date,
                models.Appointment.session == a.session,
                models.Appointment.status == "WAITING",
                models.Appointment.sequence_in_session < a.sequence_in_session
            ).scalar() or 0
        
        results.append({
            "appointment": schemas.AppointmentOut.from_orm(a).dict(),
            "patients_ahead": ahead_count,
            "estimated_wait_minutes": ahead_count * setting.avg_consultation_time_minutes,
            "is_current": a.status in ["CALLED", "IN_PROGRESS"]
        })
        
    return results

def doctor_call_next(db: Session) -> Optional[models.Appointment]:
    setting = get_or_create_settings(db)
    target_date = date.today()
    
    # Complete previous serving patient
    currently_serving = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == setting.active_session,
        models.Appointment.status.in_(["CALLED", "IN_PROGRESS"])
    ).all()
    
    for c in currently_serving:
        c.status = "COMPLETED"
        c.completed_at = datetime.now()
    
    # Pick next WAITING patient
    next_appt = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == setting.active_session,
        models.Appointment.status == "WAITING"
    ).order_by(models.Appointment.sequence_in_session.asc()).first()
    
    if next_appt:
        next_appt.status = "CALLED"
        next_appt.called_at = datetime.now()
        setting.doctor_status = "IN_CONSULTATION"
    else:
        setting.doctor_status = "AVAILABLE"
        
    db.commit()
    if next_appt:
        db.refresh(next_appt)
    return next_appt

def doctor_recall_current(db: Session) -> Optional[models.Appointment]:
    setting = get_or_create_settings(db)
    target_date = date.today()
    
    current_appt = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == target_date,
        models.Appointment.session == setting.active_session,
        models.Appointment.status.in_(["CALLED", "IN_PROGRESS"])
    ).order_by(models.Appointment.called_at.desc()).first()
    
    return current_appt

def doctor_complete_patient(db: Session, appt_id: int, notes: Optional[str] = None) -> models.Appointment:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appt.status = "COMPLETED"
    appt.completed_at = datetime.now()
    if notes:
        appt.prescription_notes = notes
        
    setting = get_or_create_settings(db)
    remaining_in_progress = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == date.today(),
        models.Appointment.session == setting.active_session,
        models.Appointment.status.in_(["CALLED", "IN_PROGRESS"]),
        models.Appointment.id != appt_id
    ).first()
    
    if not remaining_in_progress:
        setting.doctor_status = "AVAILABLE"
        
    db.commit()
    db.refresh(appt)
    return appt

def doctor_skip_patient(db: Session, appt_id: int) -> models.Appointment:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appt.status = "SKIPPED"
    setting = get_or_create_settings(db)
    setting.doctor_status = "AVAILABLE"
    db.commit()
    db.refresh(appt)
    return appt
