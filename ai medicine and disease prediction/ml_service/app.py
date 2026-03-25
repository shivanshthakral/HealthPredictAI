"""
HealthPredict AI Microservice v2.0
Flask backend serving ML prediction, OCR, multilingual chatbot, doctor booking,
health scoring, diet planning, and AI health report generation.
Port: 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import subprocess
import sys

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
except Exception:
    pass

# ── Import services ────────────────────────────────────────────────────────────
from services import prediction_service, ocr_service, chatbot_service, doctor_service
from services import health_service, report_service

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ═══════════════════════════════════════════════════════════════════════════════
# ROOT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "HealthPredict AI Microservice v2.0",
        "status": "running",
        "version": "2.0.0",
        "endpoints": [
            "/predict", "/symptoms", "/retrain",
            "/ocr", "/chat", "/languages",
            "/doctors", "/doctors/slots", "/book-appointment", "/appointments",
            "/hospitals", "/health-score", "/diet-plan", "/fitness-plan",
            "/generate-report", "/vaccination-schedule"
        ]
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/predict", methods=["POST"])
def predict():
    """Predict diseases from symptoms using ML ensemble."""
    try:
        data = request.get_json(force=True)
        symptoms = data.get("symptoms", [])
        user_profile = data.get("user_profile", {})
        free_text = data.get("free_text", "")

        # Parse free text into symptoms if provided
        if free_text and not symptoms:
            symptoms = prediction_service.parse_free_text_symptoms(free_text)

        if not symptoms:
            return jsonify({"error": "Provide 'symptoms' list or 'free_text'"}), 400

        result = prediction_service.predict_disease(symptoms, user_profile)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/symptoms", methods=["GET"])
def get_symptoms():
    """Return full list of recognizable symptoms from dataset."""
    try:
        symptoms = prediction_service.get_all_symptoms()
        return jsonify({"symptoms": symptoms, "count": len(symptoms)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/retrain", methods=["POST"])
def retrain_model():
    """Trigger model retraining from dataset."""
    try:
        train_script = os.path.join(os.path.dirname(__file__), "train_model.py")
        result = subprocess.run(
            [sys.executable, train_script],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode == 0:
            # Reload models
            prediction_service._load_models()
            return jsonify({
                "success": True,
                "message": "Model retrained successfully",
                "output": result.stdout[-2000:]
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Training failed",
                "stderr": result.stderr[-1000:]
            }), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Training timed out (>5 min)"}), 408
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# OCR ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/ocr", methods=["POST"])
def ocr():
    """Extract structured data from prescription image."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        img_data = file.read()
        result = ocr_service.extract_prescription(img_data, file.filename)

        if not result.get("success"):
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# CHATBOT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/chat", methods=["POST"])
def chat():
    """Multilingual AI health chatbot."""
    try:
        data = request.get_json(force=True)
        message = data.get("message", "")
        history = data.get("history", [])
        language = data.get("language", "auto")

        if not message:
            return jsonify({"error": "Message required"}), 400

        result = chatbot_service.chat_with_ai(message, history, language)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/languages", methods=["GET"])
def get_languages():
    """Return supported languages."""
    return jsonify({
        "languages": list(chatbot_service.LANGUAGE_CONFIG.values()),
        "count": len(chatbot_service.LANGUAGE_CONFIG)
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTOR & APPOINTMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/doctors", methods=["GET"])
def get_doctors():
    """Get filtered list of doctors."""
    specialty = request.args.get("specialty")
    max_distance = request.args.get("max_distance", type=float)
    min_rating = request.args.get("min_rating", type=float)
    language = request.args.get("language")
    video_only = request.args.get("video_only", "false").lower() == "true"

    doctors = doctor_service.get_doctors(specialty, max_distance, min_rating, language, video_only)
    return jsonify({"doctors": doctors, "count": len(doctors)}), 200


@app.route("/doctors/<int:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    """Get specific doctor details."""
    doctor = doctor_service.get_doctor_by_id(doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify(doctor), 200


@app.route("/doctors/slots", methods=["GET"])
def get_slots():
    """Get available appointment slots for a doctor."""
    doctor_id = request.args.get("doctor_id", type=int)
    date = request.args.get("date")
    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400
    result = doctor_service.get_available_slots(doctor_id, date)
    return jsonify(result), 200


@app.route("/book-appointment", methods=["POST"])
def book_appointment():
    """Book an appointment slot."""
    try:
        data = request.get_json(force=True)
        result = doctor_service.book_appointment(data)
        status = 200 if result.get("success") else 400
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/appointments", methods=["GET"])
def get_appointments():
    """Get appointments for a user."""
    user_name = request.args.get("user_name", "")
    appointments = doctor_service.get_user_appointments(user_name)
    return jsonify({"appointments": appointments, "count": len(appointments)}), 200


@app.route("/hospitals", methods=["GET"])
def get_hospitals():
    """Get nearby hospitals for emergency."""
    max_km = request.args.get("max_km", 10, type=float)
    hospitals = doctor_service.get_nearby_hospitals(max_km)
    return jsonify({
        "hospitals": hospitals,
        "emergency_number": "108",
        "general_emergency": "112"
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH INTELLIGENCE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/health-score", methods=["POST"])
def health_score():
    """Calculate personalized health score (0-100)."""
    try:
        data = request.get_json(force=True)
        result = health_service.calculate_health_score(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/diet-plan", methods=["POST"])
def diet_plan():
    """Generate personalized 7-day diet plan."""
    try:
        data = request.get_json(force=True)
        result = health_service.generate_diet_plan(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/fitness-plan", methods=["POST"])
def fitness_plan():
    """Generate personalized weekly fitness plan."""
    try:
        data = request.get_json(force=True)
        result = health_service.generate_fitness_plan(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/bmi", methods=["POST"])
def bmi_calc():
    """Calculate BMI."""
    try:
        data = request.get_json(force=True)
        result = health_service.calculate_bmi(data.get("weight_kg", 0), data.get("height_cm", 0))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH REPORT ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/generate-report", methods=["POST"])
def generate_report():
    """Generate comprehensive AI health report and PDF."""
    try:
        data = request.get_json(force=True)
        result = report_service.generate_health_report(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# PREVENTIVE HEALTHCARE ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

VACCINATION_SCHEDULE = {
    "infant_0_12m": [
        {"name": "BCG", "age": "At birth", "disease": "Tuberculosis"},
        {"name": "Hepatitis B (1st)", "age": "At birth", "disease": "Hepatitis B"},
        {"name": "OPV 0", "age": "At birth", "disease": "Polio"},
        {"name": "DTP (1st)", "age": "6 weeks", "disease": "Diphtheria, Tetanus, Pertussis"},
        {"name": "Hepatitis B (2nd)", "age": "6 weeks", "disease": "Hepatitis B"},
        {"name": "Rotavirus (1st)", "age": "6 weeks", "disease": "Rotavirus Diarrhea"},
        {"name": "MMR (1st)", "age": "9-12 months", "disease": "Measles, Mumps, Rubella"},
    ],
    "child_1_5y": [
        {"name": "MMR (2nd)", "age": "15 months", "disease": "Measles, Mumps, Rubella"},
        {"name": "DTP Booster", "age": "18 months", "disease": "Diphtheria, Tetanus, Pertussis"},
        {"name": "Typhoid", "age": "2 years", "disease": "Typhoid Fever"},
        {"name": "Varicella", "age": "2-3 years", "disease": "Chicken Pox"},
    ],
    "adult_18_plus": [
        {"name": "Tetanus Booster", "age": "Every 10 years", "disease": "Tetanus"},
        {"name": "Influenza", "age": "Annually", "disease": "Seasonal Flu"},
        {"name": "Hepatitis B (if not vaccinated)", "age": "3-dose series", "disease": "Hepatitis B"},
        {"name": "COVID-19", "age": "As recommended", "disease": "COVID-19"},
        {"name": "Pneumococcal (60+)", "age": "60 years+", "disease": "Pneumonia"},
    ]
}


@app.route("/vaccination-schedule", methods=["GET"])
def vaccination_schedule():
    """Get age-appropriate vaccination schedule."""
    age = request.args.get("age", type=int, default=30)
    if age < 1:
        category = "infant_0_12m"
    elif age <= 5:
        category = "child_1_5y"
    else:
        category = "adult_18_plus"

    return jsonify({
        "age": age,
        "category": category.replace("_", " ").title(),
        "vaccines": VACCINATION_SCHEDULE.get(category, []),
        "source": "National Immunization Schedule (India), WHO recommendations"
    }), 200


if __name__ == "__main__":
    print("=" * 50)
    print("🏥 HealthPredict AI Microservice v2.0")
    print("   Port: http://127.0.0.1:5001")
    print("=" * 50)
    app.run(host="127.0.0.1", port=5001, debug=True)
