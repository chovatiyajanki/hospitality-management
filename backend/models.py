from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from database import Base

class ClinicSetting(Base):
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String(100), default="Gurukrupa Clinic")
    doctor_name = Column(String(100), default="Dr. Gitendra Patel")
    doctor_qualification = Column(String(100), default="M.B.B.S., M.D. (Medicine) - Consultant Physician")
    
    # Morning timing and capacity
    morning_start_time = Column(String(20), default="09:00 AM")
    morning_end_time = Column(String(20), default="01:00 PM")
    morning_patient_limit = Column(Integer, default=50)  # User constraint: 50 patients in morning
    
    # Evening timing and capacity
    evening_start_time = Column(String(20), default="04:30 PM")
    evening_end_time = Column(String(20), default="08:30 PM")
    evening_patient_limit = Column(Integer, default=50)  # Configurable limit for evening
    
    avg_consultation_time_minutes = Column(Integer, default=5)
    doctor_status = Column(String(30), default="AVAILABLE") # AVAILABLE, IN_CONSULTATION, ON_BREAK, OFF_DUTY
    active_session = Column(String(20), default="MORNING") # MORNING, EVENING
    
    phone = Column(String(30), default="+91 99135 67716")
    address = Column(String(200), default="7,8, Bhagirath Soc Vibhag 2, Lambe Hanuman Rd, Vasundhara Society, Shivnagar Society, Varachha, Surat, Gujarat 395006")
    notice_text = Column(String(300), default="Please arrive at the clinic 15 minutes before your estimated appointment time.")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(String(20), index=True, nullable=False) # e.g. M-01, M-50, E-05
    sequence_in_session = Column(Integer, nullable=False) # 1, 2, 3 ... 50
    session = Column(String(20), nullable=False, index=True) # MORNING or EVENING
    appointment_date = Column(Date, default=date.today, index=True, nullable=False)
    time_slot = Column(String(50), nullable=False) # e.g. "09:00 AM" or "05:30 PM"
    
    patient_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False) # Male, Female, Other
    city = Column(String(100), default="Rajkot")
    reason = Column(String(255), default="General Health Checkup")
    
    status = Column(String(30), default="WAITING", index=True) # WAITING, CALLED, IN_PROGRESS, COMPLETED, SKIPPED, CANCELLED
    estimated_time = Column(String(30), nullable=True) # e.g. "09:45 AM"
    
    prescription_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    called_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
