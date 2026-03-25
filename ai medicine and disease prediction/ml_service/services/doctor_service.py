"""
Dynamic Doctor Discovery & Appointment Service v2.0
Loads from data/doctors.json — fully dynamic, editable without code changes.
"""

import json
import os
import uuid
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent.parent / "data"
BOOKINGS_FILE = DATA_DIR / "bookings.json"

# ── Load doctors from JSON ─────────────────────────────────────────────────────
def _load_doctors():
    path = DATA_DIR / "doctors.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    # Minimal fallback
    return [{"id": 1, "name": "Dr. General Physician", "specialization": "General Physician",
             "rating": 4.5, "experience_years": 5, "consultation_fee": 500,
             "distance_km": 1.0, "languages": ["English"], "video_consultation": True,
             "available_slots": {}, "phone": "104", "clinic": "Local Clinic", "address": ""}]


def _load_bookings():
    if BOOKINGS_FILE.exists():
        with open(BOOKINGS_FILE) as f:
            return json.load(f)
    return {}


def _save_bookings(bookings):
    BOOKINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BOOKINGS_FILE, 'w') as f:
        json.dump(bookings, f, indent=2)


# ── Disease → Specialist mapping ───────────────────────────────────────────────
DISEASE_SPECIALIST_MAP = {
    "cardiologist": ["heart attack", "angina", "hypertension", "variceal", "cardiac"],
    "pulmonologist": ["asthma", "tuberculosis", "pneumonia", "respiratory", "breathing"],
    "pediatrician": ["child", "infant", "pediatric"],
    "dermatologist": ["fungal", "acne", "psoriasis", "impetigo", "skin"],
    "gastroenterologist": ["gerd", "gastroenteritis", "peptic", "hepatitis", "jaundice", "alcoholic"],
    "endocrinologist": ["diabetes", "hypothyroid", "hyperthyroid", "hypoglycemia", "thyroid"],
    "neurologist": ["migraine", "paralysis", "vertigo", "epilepsy", "cervical spondylosis"],
    "orthopedist": ["arthritis", "osteoarthritis", "cervical", "bone", "joint pain"],
    "allergist": ["allergy", "drug reaction"],
    "general physician": ["cold", "flu", "dengue", "typhoid", "malaria", "chicken pox", "viral"],
    "urologist": ["urinary tract infection", "bladder"],
}

HOSPITALS_NEARBY = [
    {"name": "City General Hospital", "phone": "1800-123-456", "address": "100 Medical Drive", "distance_km": 1.5, "emergency": True},
    {"name": "Apollo Hospital", "phone": "1860-500-1066", "address": "200 Health Road", "distance_km": 2.8, "emergency": True},
    {"name": "Government District Hospital", "phone": "104", "address": "District HQ", "distance_km": 3.2, "emergency": True},
]


def recommend_specialist(disease_name: str) -> str:
    """Map disease name to recommended specialist type."""
    disease_lower = disease_name.lower()
    for specialist, keywords in DISEASE_SPECIALIST_MAP.items():
        if any(kw in disease_lower for kw in keywords):
            return specialist.title()
    return "General Physician"


def get_doctors(specialty: str = None, max_distance: float = None,
                min_rating: float = None, language: str = None,
                video_only: bool = False) -> list:
    """Get filtered list of doctors."""
    doctors = _load_doctors()

    if specialty:
        spec_lower = specialty.lower()
        doctors = [d for d in doctors if spec_lower in d.get("specialization", "").lower()]

    if max_distance is not None:
        doctors = [d for d in doctors if d.get("distance_km", 99) <= max_distance]

    if min_rating is not None:
        doctors = [d for d in doctors if d.get("rating", 0) >= min_rating]

    if language:
        doctors = [d for d in doctors if language in d.get("languages", [])]

    if video_only:
        doctors = [d for d in doctors if d.get("video_consultation", False)]

    doctors.sort(key=lambda x: x.get("distance_km", 99))
    return doctors


def get_doctor_by_id(doctor_id: int) -> dict:
    """Get specific doctor by ID."""
    doctors = _load_doctors()
    return next((d for d in doctors if d["id"] == doctor_id), None)


def get_available_slots(doctor_id: int, date: str = None) -> dict:
    """Get available slots for a doctor, filtered by booked slots."""
    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return {"error": "Doctor not found"}

    all_slots = doctor.get("available_slots", {})

    # Load bookings and filter out booked slots
    bookings = _load_bookings()
    booked = {}
    for bk in bookings.values():
        if bk.get("doctor_id") == doctor_id:
            d = bk.get("date", "")
            t = bk.get("time", "")
            if d not in booked:
                booked[d] = []
            booked[d].append(t)

    available = {}
    for d, slots in all_slots.items():
        if date and d != date:
            continue
        booked_times = booked.get(d, [])
        free = [s for s in slots if s not in booked_times]
        if free:
            available[d] = free

    return {"doctor_id": doctor_id, "doctor_name": doctor.get("name"), "available_slots": available}


def book_appointment(data: dict) -> dict:
    """Book an appointment slot."""
    doctor_id = data.get("doctor_id")
    user_name = data.get("user_name", "Patient")
    date = data.get("date", "")
    time = data.get("time", "")
    symptoms = data.get("symptoms", [])
    disease = data.get("disease", "")
    consultation_type = data.get("consultation_type", "in_person")

    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return {"success": False, "error": "Doctor not found"}

    # Check slot availability
    slots_info = get_available_slots(doctor_id, date)
    available = slots_info.get("available_slots", {}).get(date, [])
    if time and time not in available:
        return {"success": False, "error": f"Slot {time} on {date} is not available"}

    booking_id = str(uuid.uuid4())[:8].upper()
    bookings = _load_bookings()
    bookings[booking_id] = {
        "booking_id": booking_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor.get("name"),
        "specialization": doctor.get("specialization"),
        "clinic": doctor.get("clinic"),
        "user_name": user_name,
        "date": date,
        "time": time,
        "symptoms": symptoms,
        "disease": disease,
        "consultation_type": consultation_type,
        "consultation_fee": doctor.get("consultation_fee", 0),
        "status": "confirmed",
        "created_at": datetime.now().isoformat(),
        "video_link": f"https://meet.healthpredict.ai/{booking_id}" if consultation_type == "video" else None
    }
    _save_bookings(bookings)

    return {
        "success": True,
        "booking_id": booking_id,
        "appointment": bookings[booking_id],
        "message": f"Appointment confirmed with {doctor.get('name')} on {date} at {time}",
        "reminder": f"Please arrive 10 minutes early. Bring valid ID and previous prescriptions."
    }


def get_user_appointments(user_name: str) -> list:
    """Get all appointments for a user."""
    bookings = _load_bookings()
    return [b for b in bookings.values() if b.get("user_name") == user_name]


def get_nearby_hospitals(max_distance: float = 10) -> list:
    return [h for h in HOSPITALS_NEARBY if h.get("distance_km", 99) <= max_distance]
