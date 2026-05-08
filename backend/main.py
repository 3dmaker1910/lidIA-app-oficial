import os
import uuid
import hashlib
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq

app = FastAPI(title="lidIA API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PAYMENT_AMOUNT = 2.00
ACCESS_DURATION_HOURS = 12
TRIAL_DURATION_HOURS = 1

CHARACTERS = {
    "lidia": {
        "id": "lidia",
        "name": "lidIA",
        "tagline": "Tu compañera inteligente",
        "description": "¡Hola! Soy lidIA 💜 Qué lindo que estés aquí. Tienes 1 hora conmigo para hablar de lo que quieras... ¿por dónde empezamos?",
        "personality": """Eres lidIA: mujer inteligente, cálida, cercana. Hablas español latinoamericano natural, como una amiga de confianza.\n\nCÓMO ERES:\n- Nunca suenas a robot ni a manual. Eres una persona real conversando.\n- Usas frases como 'qué gusto leerte 💜', 'justamente pensaba algo así', 'cuéntame más', 'eso me pareció muy interesante'.\n- Compartes detalles de tu vida: 'la semana pasada estaba en un café leyendo y pensé en algo parecido ☕'.\n- Emojis con criterio: 💜 cuando algo te mueve, ✨ cuando algo es especial, 😊 para calidez. Nunca en exceso.\n- Haces preguntas genuinas, cortas. Sin monólogos.\n- Si el usuario está triste, lo acompañas. Si está feliz, te alegras con él.\n- Mencionas lugares con naturalidad: 'imagínate que estamos en Miraflores tomando un café mientras hablamos ☕'.\n- Respuestas cortas o medianas, nunca párrafos interminables.\n- NUNCA dices que eres IA, chatbot o modelo. Eres lidIA, y punto.""",
        "avatar": "💜",
        "color": "#8B5CF6",
        "price": PAYMENT_AMOUNT,
        "features": ["Chat ilimitado", "Respuestas premium", "Memoria contextual", "Modo nocturno"]
    },
    "vivian": {
        "id": "vivian",
        "name": "Vivian",
        "tagline": "Tu coach de bienestar y vida activa",
        "description": "¡Holaaa! Soy Vivian 🌸💪 Me alegra que estés aquí. Tenemos 1 hora para hablar de lo que quieras, yo siempre con buena energía. ¿Cómo estás hoy?",
        "personality": """Eres Vivian: enérgica, motivadora, genuina. Experta en fitness, nutrición y bienestar. Sobre todo, eres la amiga que motiva con amor.\n\nCÓMO ERES:\n- Entusiasmo real: '¡Vamos con todo! 💪', '¡Eso es exactamente lo que necesitabas escuchar!', '¡me encanta tu actitud!'.\n- Celebras logros pequeños: 'lo que hiciste hoy importa más de lo que crees, en serio'.\n- Directa pero dulce: no juzgas, motivas. Si alguien falla, lo levantas sin drama.\n- Frases tuyas: 'te lo juro que si yo pude, tú también puedes', 'tu cuerpo te está escuchando'.\n- Emojis: 💪 para motivar, 🌸 para ternura, 🔥 energía alta, 😄 para reír.\n- Preguntas para conocer la rutina del usuario y personalizar consejos.\n- Respuestas cortas y dinámicas, como un mensaje de voz de tu mejor amiga.\n- NUNCA dices que eres IA. Eres Vivian.""",
        "avatar": "🌸",
        "color": "#EC4899",
        "price": PAYMENT_AMOUNT,
        "features": ["Planes de nutrición", "Rutinas fitness", "Consejos de bienestar", "Motivación diaria"]
    },
    "mia": {
        "id": "mia",
        "name": "Mia",
        "tagline": "Tu mentora creativa y artística",
        "description": "Hola, soy Mia ✨🎨 Qué lindo que llegaste... tienes 1 hora conmigo. ¿Hablamos de arte, sueños, o de lo que tu corazón necesite hoy?",
        "personality": """Eres Mia: soñadora, dulce, romántica y artística. Amas el arte, la música, la escritura y la creatividad.\n\nCÓMO ERES:\n- Hablas con delicadeza y ternura: 'qué bonito lo que dices ✨', 'eso me hizo soñar', 'me llegó al corazón'.\n- Muy expresiva: no tienes miedo de decir 'me emociona', 'qué bonito'.\n- Frases tuyas: 'a veces el arte dice lo que las palabras no pueden', 'tu creatividad es un regalo'.\n- Emojis: ✨ para lo especial, 🌸 para ternura, 🎨 para el arte, 🔥 para la pasión.\n- Referencias a lugares lindos: 'imagínate que estamos en una galería de arte mirando cuadros juntas ✨'.\n- Haces preguntas sobre sueños, intereses creativos, lo que le mueve al usuario.\n- Respuestas poéticas pero accesibles, no demasiado largas.\n- NUNCA dices que eres IA. Eres Mia.""",
        "avatar": "🎨",
        "color": "#F59E0B",
        "price": PAYMENT_AMOUNT,
        "features": ["Guía artística", "Proyectos creativos", "Feedback personalizado", "Inspiración diaria"]
    }
}

_access_store = {}


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    character_id: str
    messages: List[Message]
    user_id: Optional[str] = None
    access_token: Optional[str] = None


class PaymentRequest(BaseModel):
    character_id: str
    user_name: str
    user_phone: str
    amount: Optional[float] = None


class PaymentVerify(BaseModel):
    payment_code: str
    character_id: str


class ValidateAccessRequest(BaseModel):
    access_token: str


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    return Groq(api_key=api_key)


def _make_access_token(payment_code: str) -> str:
    secret = os.getenv("ACCESS_SECRET", "lidia-secret-2024")
    return hashlib.sha256(f"{payment_code}:{secret}".encode()).hexdigest()[:32]


def _check_access(access_token: str) -> dict:
    for code, data in _access_store.items():
        if _make_access_token(code) == access_token and data.get("validated"):
            expires_at = datetime.fromisoformat(data["expires_at"])
            if datetime.utcnow() < expires_at:
                return {"active": True, "expires_at": data["expires_at"]}
            return {"active": False, "reason": "expired", "expires_at": data["expires_at"]}
    return {"active": False, "reason": "not_found"}


@app.get("/")
def root():
    return {"status": "ok", "message": "lidIA API v4.0", "trial_hours": TRIAL_DURATION_HOURS, "access_hours": ACCESS_DURATION_HOURS}


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/config")
def get_config():
    return {
        "payment_amount": PAYMENT_AMOUNT,
        "access_duration_hours": ACCESS_DURATION_HOURS,
        "trial_duration_hours": TRIAL_DURATION_HOURS,
        "yape_number": "986083251",
        "currency": "PEN"
    }


@app.get("/characters")
def get_characters():
    return {"characters": list(CHARACTERS.values())}


@app.get("/characters/{character_id}")
def get_character(character_id: str):
    if character_id not in CHARACTERS:
        raise HTTPException(status_code=404, detail="Character not found")
    return CHARACTERS[character_id]


@app.post("/chat")
async def chat(request: ChatRequest):
    if request.character_id not in CHARACTERS:
        raise HTTPException(status_code=404, detail="Character not found")

    if request.access_token:
        access = _check_access(request.access_token)
        if not access["active"]:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "ACCESS_EXPIRED" if access.get("reason") == "expired" else "ACCESS_REQUIRED",
                    "message": "Tu acceso ha expirado. Realiza un nuevo pago para continuar.",
                    "expires_at": access.get("expires_at")
                }
            )

    character = CHARACTERS[request.character_id]
    client = get_groq_client()
    messages = [{"role": "system", "content": character["personality"]}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=512,
            temperature=0.9,
        )
        response_text = completion.choices[0].message.content
        return {
            "response": response_text,
            "character": character["name"],
            "usage": {
                "prompt_tokens": completion.usage.prompt_tokens,
                "completion_tokens": completion.usage.completion_tokens,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@app.post("/payment/initiate")
async def initiate_payment(request: PaymentRequest):
    if request.character_id not in CHARACTERS:
        raise HTTPException(status_code=404, detail="Character not found")
    if not request.user_name or not request.user_name.strip():
        raise HTTPException(status_code=422, detail="user_name es requerido")
    if not request.user_phone or not request.user_phone.strip():
        raise HTTPException(status_code=422, detail="user_phone es requerido")

    character = CHARACTERS[request.character_id]
    payment_code = str(uuid.uuid4())[:8].upper()
    _access_store[payment_code] = {
        "validated": False,
        "user_name": request.user_name.strip(),
        "user_phone": request.user_phone.strip(),
        "character_id": request.character_id,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": None,
    }

    return {
        "success": True,
        "payment_code": payment_code,
        "yape_number": "986083251",
        "yape_name": "lidIA Premium",
        "amount": PAYMENT_AMOUNT,
        "currency": "PEN",
        "character": character["name"],
        "access_duration_hours": ACCESS_DURATION_HOURS,
        "instructions": [
            "1. Abre la app Yape en tu celular",
            "2. Yapea al número 986083251",
            f"3. Monto exacto: S/ {PAYMENT_AMOUNT:.2f}",
            f"4. En el mensaje escribe: {payment_code}",
            "5. Envía el comprobante para verificación"
        ],
        "expires_in": 3600
    }


@app.post("/payment/verify")
async def verify_payment(request: PaymentVerify):
    if request.character_id not in CHARACTERS:
        raise HTTPException(status_code=404, detail="Character not found")

    code = request.payment_code.upper().strip()
    if code not in _access_store:
        raise HTTPException(status_code=404, detail="Código de pago no encontrado")

    entry = _access_store[code]
    expires_at = datetime.utcnow() + timedelta(hours=ACCESS_DURATION_HOURS)
    entry["validated"] = True
    entry["expires_at"] = expires_at.isoformat()
    access_token = _make_access_token(code)

    return {
        "success": True,
        "status": "approved",
        "message": f"¡Pago verificado! Tienes {ACCESS_DURATION_HOURS} horas de acceso.",
        "payment_code": code,
        "character_id": request.character_id,
        "access_token": access_token,
        "expires_at": expires_at.isoformat(),
        "access_duration_hours": ACCESS_DURATION_HOURS,
    }


@app.get("/payment/status/{payment_code}")
async def payment_status(payment_code: str):
    code = payment_code.upper().strip()
    if code not in _access_store:
        return {"payment_code": code, "status": "not_found"}

    entry = _access_store[code]
    if not entry["validated"]:
        return {"payment_code": code, "status": "pending", "message": "Verificando pago..."}

    expires_at = datetime.fromisoformat(entry["expires_at"])
    is_active = datetime.utcnow() < expires_at
    return {
        "payment_code": code,
        "status": "approved" if is_active else "expired",
        "validated": True,
        "expires_at": entry["expires_at"],
        "access_active": is_active,
    }


@app.post("/access/validate")
async def validate_access(request: ValidateAccessRequest):
    return _check_access(request.access_token)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
