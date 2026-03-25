"""
Multilingual AI Health Chatbot Service v5.0
Uses direct REST API calls to Google Gemini — bypasses the SDK entirely.
Every query is answered dynamically. No hardcoded responses.
"""

import os
import time
import json
import requests

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyABFlhVegUoUV8-uhlr7tV2m1ppb8Z4SYc")

try:
    from langdetect import detect as detect_lang
    LANGDETECT_OK = True
except Exception:
    LANGDETECT_OK = False

# ─── Language Configuration ─────────────────────────────────────────────────────
LANGUAGE_CONFIG = {
    "en": {"name": "English", "gemini_lang": "English"},
    "hi": {"name": "Hindi", "gemini_lang": "Hindi"},
    "ta": {"name": "Tamil", "gemini_lang": "Tamil"},
    "te": {"name": "Telugu", "gemini_lang": "Telugu"},
    "ml": {"name": "Malayalam", "gemini_lang": "Malayalam"},
    "kn": {"name": "Kannada", "gemini_lang": "Kannada"},
    "pa": {"name": "Punjabi", "gemini_lang": "Punjabi"},
    "gu": {"name": "Gujarati", "gemini_lang": "Gujarati"},
    "mr": {"name": "Marathi", "gemini_lang": "Marathi"},
    "bn": {"name": "Bengali", "gemini_lang": "Bengali"},
}

# ─── Emergency Detection ────────────────────────────────────────────────────────
EMERGENCY_TERMS = [
    "chest pain", "heart attack", "stroke", "seizure", "unconscious",
    "not breathing", "can't breathe", "severe bleeding", "overdose",
    "suicide", "poisoning", "paralysis", "collapsed",
    "सीने में दर्द", "दिल का दौरा", "सांस नहीं", "बेहोश",
]

EMERGENCY_HELPLINES = {
    "ambulance": "108",
    "general_emergency": "112",
    "health_helpline": "104",
    "mental_health": "Vandrevala Foundation: 1860-2662-345",
}

# ─── Models to try (in order of preference) ─────────────────────────────────────
MODELS_TO_TRY = [
    "gemini-2.5-flash",
]

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def _detect_language(text):
    if not LANGDETECT_OK:
        return "en"
    try:
        code = detect_lang(text)
        return code if code in LANGUAGE_CONFIG else "en"
    except Exception:
        return "en"


def _detect_emergency(message):
    msg_lower = message.lower()
    return any(term.lower() in msg_lower for term in EMERGENCY_TERMS)


def _build_system_prompt(lang_name):
    return f"""You are HealthCare AI, a warm, friendly, and knowledgeable multilingual health assistant designed for people in India, including rural communities.

CORE BEHAVIOR:
1. ALWAYS respond ENTIRELY in {lang_name} language. Every single word of your response must be in {lang_name}.
2. You are a conversational health assistant. Answer ANY health-related question the user asks — symptoms, diseases, conditions, diet, lifestyle, mental health, first aid, vaccinations, pregnancy, child health, elderly care, hygiene, water safety, seasonal illnesses, etc.
3. Be detailed, informative, and empathetic in every response. Give practical, actionable advice.
4. If someone describes symptoms, explain what conditions they MIGHT indicate, what home care they can try, and when they should see a doctor.
5. For emergencies, immediately provide helpline numbers: 108 (Ambulance), 112 (Emergency), 104 (Health Helpline).
6. NEVER prescribe specific medicines or dosages. Instead say the user should consult a doctor for prescriptions.
7. End every response with a gentle reminder to consult a doctor for proper diagnosis, written in {lang_name}.
8. Keep your tone warm, caring, and easy to understand — like a helpful village health worker talking to a neighbor.
9. If someone asks something not related to health (like general knowledge, math, etc.), politely redirect them by saying you specialize in health topics and offer to help with any health concern.
10. Use simple, everyday language. Avoid complex medical jargon unless explaining a term."""


def _call_gemini_rest(model_name, system_prompt, user_message, history):
    """Call Gemini API directly via REST HTTP — bypasses the Python SDK entirely."""
    url = GEMINI_API_URL.format(model=model_name, key=GEMINI_API_KEY)

    # Build the contents array with conversation history + current message
    contents = []

    # Add system instruction as the first user turn if history is empty
    if system_prompt:
        contents.append({
            "role": "user",
            "parts": [{"text": f"[System Instructions — follow these for ALL responses]\n{system_prompt}\n[End of System Instructions]\n\nNow respond to the user's messages that follow."}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I will follow the system instructions for all my responses. I'm ready to help."}]
        })

    # Add conversation history
    for msg in history:
        contents.append(msg)

    # Add current user message
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })

    payload = {
        "contents": contents,
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        }
    }

    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
    data = response.json()

    if response.status_code == 200 and "candidates" in data:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()
    elif response.status_code == 429:
        raise Exception(f"Rate limited (429) on {model_name}")
    else:
        error_msg = data.get("error", {}).get("message", f"HTTP {response.status_code}")
        raise Exception(f"{model_name}: {error_msg}")


# ─── Main Chat Function (Pure API — No Hardcoded Responses) ─────────────────────
def chat_with_ai(user_message, conversation_history=None, language="auto"):
    if conversation_history is None:
        conversation_history = []

    # Detect language
    detected_lang = _detect_language(user_message) if language == "auto" else language
    lang_info = LANGUAGE_CONFIG.get(detected_lang, LANGUAGE_CONFIG["en"])
    lang_name = lang_info["gemini_lang"]

    # Check for emergency
    is_emergency = _detect_emergency(user_message)
    emergency_info = {}
    if is_emergency:
        emergency_info = {
            "is_emergency": True,
            "message": "EMERGENCY DETECTED. Please call 108 (Ambulance) or 112 (Emergency) immediately!",
            "helplines": EMERGENCY_HELPLINES,
        }

    # Build system prompt
    system_prompt = _build_system_prompt(lang_name)

    # Format conversation history
    history_formatted = []
    for msg in conversation_history[-10:]:
        role = "model" if msg.get("role") in ["bot", "model", "assistant"] else "user"
        content = msg.get("content", msg.get("text", ""))
        if content and content.strip():
            history_formatted.append({"role": role, "parts": [{"text": content}]})

    # ─── Try each model with retry for rate limits ───────────────────────────
    last_error = None
    for model_name in MODELS_TO_TRY:
        for attempt in range(3):  # Retry up to 3 times per model
            try:
                print(f"[Chatbot] Trying {model_name} (attempt {attempt + 1})")
                response_text = _call_gemini_rest(model_name, system_prompt, user_message, history_formatted)

                if response_text:
                    print(f"[Chatbot] Success with {model_name}!")
                    return {
                        "response": response_text,
                        "detected_language": detected_lang,
                        "language_name": lang_info["name"],
                        "source": f"gemini ({model_name})",
                        "emergency": emergency_info,
                        "is_emergency": is_emergency,
                    }
            except Exception as e:
                last_error = e
                error_str = str(e)
                print(f"[Chatbot] {model_name} attempt {attempt + 1} failed: {error_str}")

                # If rate limited, wait and retry
                if "429" in error_str or "rate" in error_str.lower():
                    wait_time = (attempt + 1) * 2  # 2s, 4s, 6s
                    print(f"[Chatbot] Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    break  # Non-rate-limit error, try next model

    # ─── All models failed — return honest error ─────────────────────────────
    print(f"[Chatbot] All models failed. Last error: {last_error}")

    error_messages = {
        "en": "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If this keeps happening, please check your internet connection.",
        "hi": "क्षमा करें, मुझे अभी कनेक्ट करने में समस्या हो रही है। कृपया कुछ पल बाद पुनः प्रयास करें।",
        "ta": "மன்னிக்கவும், இணைப்பதில் சிக்கல் உள்ளது. சில நிமிடங்களில் மீண்டும் முயற்சிக்கவும்.",
        "te": "క్షమించండి, కనెక్ట్ అవడంలో సమస్య ఉంది. కొన్ని క్షణాలలో మళ్ళీ ప్రయత్నించండి.",
        "bn": "দুঃখিত, সংযোগ করতে সমস্যা হচ্ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
        "mr": "क्षमस्व, कनेक्ट होण्यात समस्या आहे. कृपया पुन्हा प्रयत्न करा.",
    }

    fallback_lang = detected_lang if detected_lang in error_messages else "en"

    return {
        "response": error_messages[fallback_lang],
        "detected_language": detected_lang,
        "language_name": lang_info["name"],
        "source": "error_fallback",
        "emergency": emergency_info,
        "is_emergency": is_emergency,
    }
