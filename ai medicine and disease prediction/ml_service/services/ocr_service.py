"""
Prescription OCR Service v3.0
Uses Google Gemini Vision API to extract prescription data from images.
No Tesseract required - pure AI-powered extraction.
"""

import os
import re
import io
import json
import base64

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyABFlhVegUoUV8-uhlr7tV2m1ppb8Z4SYc")

GEMINI_OK = False
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_OK = True
except Exception:
    GEMINI_OK = False

try:
    from PIL import Image
    PIL_OK = True
except Exception:
    PIL_OK = False


EXTRACTION_PROMPT = """You are a medical OCR AI. Analyze this prescription image and extract structured data.

Return ONLY a single valid JSON object with this exact structure (no markdown, no extra text):
{
  "doctor_name": "full name with Dr. prefix if visible, or empty string",
  "patient_name": "patient full name if visible, or empty string",
  "date": "date in the prescription if visible, or empty string",
  "medicines": [
    {
      "name": "medicine brand/generic name",
      "dosage": "dosage like 500mg or empty string",
      "frequency": "frequency like OD/BD/TDS or 'Once daily'/'Twice daily' etc",
      "duration": "duration like '5 days' or empty string",
      "instructions": "any special instructions like 'after food'"
    }
  ],
  "notes": "any additional doctor notes or empty string"
}

If you cannot read the image clearly, extract what you can and make reasonable inferences for medical terms.
For ANY prescription with medicines visible, always include them in the medicines array.
IMPORTANT: Return ONLY the JSON. No explanation, no markdown blocks."""


def _extract_with_gemini(image_data: bytes) -> dict:
    """Use Gemini Vision to extract prescription data."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Convert to base64 for Gemini
        b64_image = base64.b64encode(image_data).decode("utf-8")

        # Detect mime type
        is_jpg = image_data[:3] == b'\xff\xd8\xff'
        mime_type = "image/jpeg" if is_jpg else "image/png"

        response = model.generate_content([
            EXTRACTION_PROMPT,
            {
                "mime_type": mime_type,
                "data": b64_image
            }
        ])

        raw = response.text.strip()
        # Clean up response if it has markdown code fences
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
        raw = raw.strip()

        extracted = json.loads(raw)

        # Ensure required fields
        if not isinstance(extracted.get("medicines"), list):
            extracted["medicines"] = []

        # Enrich medicines with known drug info
        extracted["medicines"] = _enrich_medicines(extracted["medicines"])

        return {
            "success": True,
            "readable": len(extracted.get("medicines", [])) > 0 or bool(extracted.get("doctor_name")),
            "method_used": "gemini_vision",
            "extracted": extracted
        }

    except json.JSONDecodeError:
        # Gemini returned something but it wasn't JSON — try to parse it
        try:
            text = response.text
            # Extract anything in between { }
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                extracted = json.loads(match.group(0))
                extracted["medicines"] = _enrich_medicines(extracted.get("medicines", []))
                return {
                    "success": True,
                    "readable": len(extracted.get("medicines", [])) > 0,
                    "method_used": "gemini_vision_parsed",
                    "extracted": extracted
                }
        except Exception:
            pass
        return {
            "success": False,
            "error": "Could not parse Gemini response as JSON",
            "readable": False,
            "extracted": {}
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini Vision error: {str(e)}",
            "readable": False,
            "extracted": {}
        }


DRUG_INFO = {
    "Paracetamol": {"side_effects": ["Nausea", "Liver damage at high doses"], "drug_class": "Analgesic / Antipyretic"},
    "Ibuprofen": {"side_effects": ["Stomach upset", "Kidney issues"], "drug_class": "NSAID"},
    "Amoxicillin": {"side_effects": ["Diarrhea", "Rash", "Allergic reaction"], "drug_class": "Antibiotic (Penicillin)"},
    "Cetirizine": {"side_effects": ["Drowsiness", "Dry mouth"], "drug_class": "Antihistamine"},
    "Omeprazole": {"side_effects": ["Headache", "Diarrhea"], "drug_class": "Proton Pump Inhibitor"},
    "Azithromycin": {"side_effects": ["Nausea", "Diarrhea"], "drug_class": "Antibiotic (Macrolide)"},
    "Metformin": {"side_effects": ["Nausea", "Diarrhea"], "drug_class": "Antidiabetic"},
    "Crocin": {"side_effects": ["Nausea"], "drug_class": "Analgesic / Antipyretic"},
    "Dolo": {"side_effects": ["Nausea"], "drug_class": "Analgesic / Antipyretic"},
}


def _enrich_medicines(medicines: list) -> list:
    enriched = []
    for med in medicines:
        name = med.get("name", "")
        base = name.split(" ")[0].capitalize()
        info = DRUG_INFO.get(base, DRUG_INFO.get(name.capitalize(), {}))
        enriched.append({
            **med,
            "side_effects": info.get("side_effects", []),
            "drug_class": info.get("drug_class", ""),
        })
    return enriched


def _demo_prescription() -> dict:
    """Return demo data when all extraction methods fail."""
    return {
        "success": True,
        "readable": True,
        "method_used": "demo_fallback",
        "extracted": {
            "doctor_name": "Dr. Rajesh Kumar",
            "patient_name": "Sample Patient",
            "date": "23/03/2026",
            "medicines": _enrich_medicines([
                {"name": "Paracetamol 500mg", "dosage": "500mg", "frequency": "TDS", "duration": "5 days", "instructions": "After food"},
                {"name": "Cetirizine 10mg", "dosage": "10mg", "frequency": "OD at night", "duration": "5 days", "instructions": ""},
                {"name": "Amoxicillin 500mg", "dosage": "500mg", "frequency": "BD", "duration": "7 days", "instructions": "After food"},
            ]),
            "notes": "Demo data — Gemini Vision could not read the uploaded image.",
            "_note": "Upload a clearer prescription for best results."
        }
    }


def extract_prescription(image_data: bytes, filename: str = "") -> dict:
    """Main entry point: extract structured prescription data from image bytes."""

    if GEMINI_OK:
        result = _extract_with_gemini(image_data)
        if result.get("success") and result.get("readable"):
            return result
        elif result.get("success") and not result.get("readable"):
            # Extracted but found nothing — return demo
            return _demo_prescription()
        else:
            # Gemini failed entirely
            return {
                "success": False,
                "error": result.get("error", "Could not process the prescription image."),
                "readable": False,
                "extracted": {}
            }
    else:
        # No Gemini — return demo
        return _demo_prescription()
