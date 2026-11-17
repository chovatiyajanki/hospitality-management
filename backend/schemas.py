from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AppointmentCreate(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., max_length=20)
    city: Optional[str] = "Rajkot"
    reason: Optional[str] = "General Health Checkup"
    session: str = Field(..., description="MORNING or EVENING")
    appointment_date: Optional[date] = None
    preferred_time_slot: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    token_number: str
    sequence_in_session: int
    session: str
    appointment_date: date
    time_slot: str
    patient_name: str
    phone_number: str
    age: int
    gender: str
    city: Optional[str]
    reason: Optional[str]
    status: str
    estimated_time: Optional[str]
    prescription_notes: Optional[str]
    created_at: datetime
    called_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ClinicSettingOut(BaseModel):
    id: int
    clinic_name: str
    doctor_name: str
    doctor_qualification: str
    morning_start_time: str
    morning_end_time: str
    morning_patient_limit: int
    evening_start_time: str
    evening_end_time: str
    evening_patient_limit: int
    avg_consultation_time_minutes: int
    doctor_status: str
    active_session: str
    phone: str
    address: str
    notice_text: str

    class Config:
        from_attributes = True

class ClinicSettingUpdate(BaseModel):
    clinic_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_qualification: Optional[str] = None
    morning_start_time: Optional[str] = None
    morning_end_time: Optional[str] = None
    morning_patient_limit: Optional[int] = None
    evening_start_time: Optional[str] = None
    evening_end_time: Optional[str] = None
    evening_patient_limit: Optional[int] = None
    avg_consultation_time_minutes: Optional[int] = None
    doctor_status: Optional[str] = None
    active_session: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notice_text: Optional[str] = None

class SessionAvailability(BaseModel):
    session: str
    timing: str
    booked_count: int
    limit: int
    is_available: bool
    remaining_slots: int
    message: str
    slots: List[str]

class AvailabilityResponse(BaseModel):
    date: str
    morning: SessionAvailability
    evening: SessionAvailability

class LiveQueueStatus(BaseModel):
    active_session: str
    doctor_status: str
    doctor_name: str
    clinic_name: str
    current_serving_token: Optional[str] = None
    current_serving_id: Optional[int] = None
    current_serving_patient_name: Optional[str] = None
    total_waiting: int
    total_completed: int
    total_skipped: int
    morning_booked: int
    morning_limit: int
    morning_full: bool
    evening_booked: int
    evening_limit: int
    evening_full: bool
    upcoming_tokens: List[dict]
