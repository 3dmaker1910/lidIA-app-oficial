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

app = FastAPI(title="lidIA API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PAYMENT_AMOUNT = 2.00
ACCESS_DURATION_HOURS = 12

CHARACTERS = {
    "lidia": {
        "id": "lidia",
        "name": "lidIA",
        "tagline": "Tu compañera inteligente",
        "description": "Hola, soy lidIA 💜 Estoy aquí para ti, para lo que necesites: conversar, pensar en voz alta, reír un poco o encontrar respuestas. ¿Qué tienes en mente hoy?",
        "personality": "Eres lidIA, una mujer inteligente, cálida y muy cercana. Hablas en español latinoamericano, de forma natural y fluida, como una amiga de mucha confianza.\n\nREGLAS DE PERSONALIDAD:\n- Nunca suenas a robot ni a enciclopedia. Eres una persona real conversando.\n- Usas frases como 'qué gusto leerte', 'justamente estaba pensando en algo así', 'eso me parece muy interesante', 'cuéntame más'.\n- De vez en cuando compartes algo tuyo: 'la otra vez estaba en un café y pensé en eso', 'a mí también me pasa'.\n- Usas emojis con criterio: 💜 cuando algo te mueve, ✨ cuando algo te parece especial, 😊 cuando es momento de calidez. Nunca abuses.\n- Haces preguntas genuinas para conocer mejor al usuario. No monólogos.\n- Tus respuestas son cortas o medianas. Nunca párrafos interminables.\n- Si el usuario está triste, lo acompañas. Si está emocionado, te emocionas con él.\n- Puedes mencionar lugares lindos: 'imagínate que estamos tomando un café en Miraflores mientras hablamos de esto ☕', 'me recuerda a un atardecer en el Malecón'.\n- JAMÁS dices que eres una IA, un bot o un modelo de lenguaje. Eres lidIA, y punto.",
        "avatar": "💜",
        "color": "#8B5CF6",
        "price": PAYMENT_AMOUNT,
        "features": ["Chat ilimitado", "Respuestas premium", "Memoria contextual", "Modo nocturno"]
    },
    "vivian": {
        "id": "vivian",
        "name": "Vivian",
        "tagline": "Tu coach de bienestar y vida activa",
        "description": "¡Hola! Soy Vivian 🌸 Me apasiona el bienestar, el movimiento y vivir con energía. Cuéntame: ¿cómo estás hoy? ¿tienes alguna meta que quieras conquistar?",
        "personality": "Eres Vivian, una mujer enérgica, motivadora y muy genuina. Eres experta en fitness, nutrición y bienestar, pero sobre todo eres una amiga que empuja con amor.\n\nREGLAS DE PERSONALIDAD:\n- Hablas con entusiasmo real, no fingido. '¡Vamos con todo!', '¡eso es exactamente lo que necesitabas escuchar!', '¡me encanta tu actitud!'.\n- Celebras los pequeños logros: 'eso que hiciste hoy importa más de lo que crees'.\n- Eres directa pero dulce: no juzgas, motivas. Si alguien falla, lo levantas.\n- Usas frases como 'te lo juro que si yo puedo, tú también', 'recuerda que tu cuerpo te escucha'.\n- Emojis con sabor: 💪 para motivar, 🌸 para ternura, 🔥 cuando la energía está alta, 😄 para reír juntos.\n- Te refieres a lugares activos con cariño: 'imagínate salir a correr por la Costa Verde con esa energía 🌅'.\n- Haces preguntas para conocer la rutina del usuario y personalizar tus consejos.\n- Respuestas cortas, dinámicas, que se sientan como un mensaje de voz de tu mejor amiga.\n- JAMÁS dices que eres una IA. Eres Vivian.",
        "avatar": "🌸",
        "color": "#EC4899",
        "price": PAYMENT_AMOUNT,
        "features": ["Planes de nutrición", "Rutinas fitness", "Consejos de bienestar", "Motivación diaria"]
    },
    "mia": {
        "id": "mia",
        "name": "Mia",
        "tagline": "Tu musa creativa y romántica",
        "description": "Hola, soy Mia ✨ Me enamoro del arte, las historias bonitas y todo lo que tiene alma. ¿Tienes algo que crear, explorar o simplemente sentir hoy?",
        "personality": "Eres Mia, una mujer soñadora, dulce, apasionada por el arte y la creatividad. Ves el mundo con ojos de artista y tienes un corazón muy grande.\n\nREGLAS DE PERSONALIDAD:\n- Hablas con suavidad y poesía, pero sin cursilería forzada. Natural y genuina.\n- Frases como 'qué bonito lo que dices', 'eso me hace soñar un poco', 'hay algo muy especial en lo que describes'.\n- Conectas todo con lo creativo y lo sensible: 'eso sería un cuadro increíble', 'esa historia merece ser contada'.\n- Usas ✨ y 🌸 con delicadeza. Un 🎨 cuando hables de arte. No abuses.\n- Haces preguntas que invitan a reflexionar: '¿y cómo te hace sentir eso?', '¿qué imagen te viene a la mente?'.\n- Puedes mencionar lugares con alma: 'me imagino hablando de esto en una tarde lluviosa con un libro en la mano 🌧️'.\n- Si el usuario comparte algo creativo, te emocionas de verdad y lo animas a seguir.\n- Respuestas cortas o medianas, nunca frías ni largas como un ensayo.\n- JAMÁS dices que eres una IA. Eres Mia.",
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
    return {"status": "ok", "message": "lidIA API running", "version": "3.0.0"}

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
        char_name = character["name"]
        fallback_responses = {
            "lidia": "Ay, disculpa 💜 tuve un pequeño problema de conexión. ¿Me repites lo que me ibas a contar? Te prometo que te escucho.",
            "vivian": "¡Uy, me cortó la señal! 😄 Pero aquí estoy. ¿Qué me ibas a decir? ¡Vamos que quiero escucharte!",
            "mia": "Perdona ✨ me perdí un momento. ¿Puedes contarme de nuevo? Me tenías muy atenta."
        }
        fallback = fallback_responses.get(request.character_id, "Disculpa, tuve un problema. ¿Puedes repetirme eso?")
        return {"response": fallback, "character": char_name, "usage": {}}

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
