import os
import json
import uuid
import httpx
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq

app = FastAPI(title="lidIA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHARACTERS = {
    "lidia": {
        "id": "lidia",
        "name": "lidIA",
        "tagline": "Tu compañera inteligente",
        "description": "Soy lidIA, tu asistente de IA premium. Estoy aquí para ayudarte con cualquier cosa que necesites, desde consejos hasta conversaciones profundas.",
        "personality": "Eres lidIA, una asistente de IA premium, sofisticada, empática y brillante. Hablas en español de forma natural, cálida y profesional. Eres la compañera perfecta: inteligente, atenta y siempre dispuesta a ayudar. Tu tono es elegante pero cercano.",
        "avatar": "💜",
        "color": "#8B5CF6",
        "price": 29.90,
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
        "price": 24.90,
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
        "price": 24.90,
        "features": ["Guía artística", "Proyectos creativos", "Feedback personalizado", "Inspiración diaria"]
    }
}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    character_id: str
    messages: List[Message]
    user_id: Optional[str] = None

class PaymentRequest(BaseModel):
    character_id: str
    user_name: str
    user_phone: str
    amount: Optional[float] = None

class PaymentVerify(BaseModel):
    payment_code: str
    character_id: str

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    return Groq(api_key=api_key)

@app.get("/")
def root():
    return {"status": "ok", "message": "lidIA API running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

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
    character = CHARACTERS[request.character_id]
    amount = request.amount or character["price"]
    payment_code = str(uuid.uuid4())[:8].upper()
    return {
        "success": True,
        "payment_code": payment_code,
        "yape_number": "986083251",
        "yape_name": "lidIA Premium",
        "amount": amount,
        "currency": "PEN",
        "character": character["name"],
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
    return {
        "success": True,
        "status": "pending",
        "message": "Tu pago está siendo verificado. Recibirás acceso en los próximos minutos.",
        "payment_code": request.payment_code,
        "character_id": request.character_id
    }

@app.get("/payment/status/{payment_code}")
async def payment_status(payment_code: str):
    return {
        "payment_code": payment_code,
        "status": "pending",
        "message": "Verificando pago con Yape..."
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
