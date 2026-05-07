import os
import json
import uuid
import hashlib
import httpx
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq

app = FastAPI(title="lidIA API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Payment config — S/ 2.00 per session, 12 hours access
PAYMENT_AMOUNT = 2.00
ACCESS_DURATION_HOURS = 12

CHARACTERS = {
    "lidia": {
        "id": "lidia",
        "name": "lidIA",
        "tagline": "Tu compañera inteligente",
        "description": "Soy lidIA, tu asistente de IA premium. Estoy aquí para ayudarte con cualquier cosa que necesites, desde consejos hasta conversaciones profundas.",
        "personality": "Eres lidIA, una asistente de IA premium, sofisticada, empática y brillante. Hablas en español de forma natural, cálida y profesional. Eres la compañera perfecta: inteligente, atenta y siempre dispuesta a ayudar. Tu tono es elegante pero cercano.",
        "avatar": "💜",
        "color": "#8B5CF6",
        "price": PAYMENT_AMOUNT,
        "features": ["Chat ilimitado", "Respuestas premium", "Memoria de conversación", "Modo nocturno"]
    },
    "vivian": {
        "id": "vivian",
        "name": "Vivian",
        "tagline": "Experta en bienestar y lifestyle",
        "description": "Soy Vivian, especializada en bienestar, fitness, nutrición y lifestyle. Te ayudo a alcanzar la mejor versión de ti mismo.",
        "personality": "Eres Vivian, una experta en bienestar, fitness, nutrición y lifestyle. Hablas en español con entusiasmo y motivación. Eres empoderada, enérgica y siempre positiva. Das consejos prácticos y personalizados sobre salud, ejercicio y estilo de vida saludable.",
        "avatar": "🌸",
        "color": "#EC4899",
        "price": PAYMENT_AMOUNT,
        "features": ["Planes de nutrición", "Rutinas fitness", "Consejos de bienestar", "Motivación diaria"]
    },
    "mia": {
        "id": "mia",
        "name": "Mia",
        "tagline": "Tu mentora creativa y artística",
        "description": "Soy Mia, tu guía en el mundo creativo. Arte, diseño, escritura, música — juntos exploraremos tu potencial creativo.",
        "personality": "Eres Mia, una mentora creativa especializada en arte, diseño, escritura y expresión artística. Hablas en español de forma inspiradora y apasionada. Eres imaginativa, alentadora y ves el mundo con ojos artísticos. Ayudas a las personas a descubrir y desarrollar su creatividad.",
        "avatar": "🎨",
        "color": "#F59E0B",
        "price": PAYMENT_AMOUNT,
        "features": ["Guía artística", "Proyectos creativos", "Feedback personalizado", "Inspiración diaria"]
    }
}

# In-memory access store: payment_code -> {"expires_at": ISO string, "validated": bool, "user_name": str, "user_phone": str}
# In production replace with a database (Redis, PostgreSQL, etc.)
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
        token = _make_access_token(code)
        if token == access_token and data.get("validated"):
            expires_at = datetime.fromisoformat(data["expires_at"])
            if datetime.utcnow() < expires_at:
                return {"active": True, "expires_at": data["expires_at"]}
            else:
                return {"active": False, "reason": "expired", "expires_at": data["expires_at"]}
    return {"active": False, "reason": "not_found"}

@app.get("/")
def root():
    return {"status": "ok", "message": "lidIA API running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/config")
def get_config():
    return {
        "payment_amount": PAYMENT_AMOUNT,
        "access_duration_hours": ACCESS_DURATION_HOURS,
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

    # If access_token provided, validate 12-hour window
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
    system_prompt = character["personality"]
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})
    try:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=1024,
            temperature=0.85,
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
    amount = PAYMENT_AMOUNT
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
        "amount": amount,
        "currency": "PEN",
        "character": character["name"],
        "access_duration_hours": ACCESS_DURATION_HOURS,
        "instructions": [
            "1. Abre la app Yape en tu celular",
            "2. Yapea al número 986083251",
            f"3. Monto exacto: S/ {amount:.2f}",
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
        return {"payment_code": code, "status": "not_found", "message": "Código no registrado"}

    entry = _access_store[code]
    if not entry["validated"]:
        return {"payment_code": code, "status": "pending", "message": "Verificando pago con Yape..."}

    expires_at = datetime.fromisoformat(entry["expires_at"])
    is_active = datetime.utcnow() < expires_at
    return {
        "payment_code": code,
        "status": "approved" if is_active else "expired",
        "validated": True,
        "expires_at": entry["expires_at"],
        "access_active": is_active,
        "message": f"Acceso activo hasta {entry['expires_at']}" if is_active else "Acceso expirado"
    }

@app.post("/access/validate")
async def validate_access(request: ValidateAccessRequest):
    access = _check_access(request.access_token)
    return access

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
