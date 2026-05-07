# lidIA — Tu IA Premium en Español

Una aplicación de chat con IA premium que presenta tres personajes únicos: **lidIA**, **Vivian** y **Mia**.

## 🚀 Stack Tecnológico

- **Backend**: FastAPI + Groq (Llama 3 70B)
- **Frontend**: React 18 con diseño premium púrpura
- **Pagos**: Yape (986083251)
- **Deploy**: Render

## 📁 Estructura

```
lidia-app/
├── backend/
│   └── main.py
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── App.js
│       ├── pages/
│       │   ├── LandingPage.js
│       │   ├── CharacterSelect.js
│       │   ├── PaymentPage.js
│       │   └── ChatPage.js
│       └── index.css
├── requirements.txt
├── Procfile
└── render.yaml
```

## ⚙️ Variables de entorno

```env
GROQ_API_KEY=tu_api_key_de_groq
REACT_APP_API_URL=https://tu-api.onrender.com
```

## 🛠️ Instalación local

```bash
# Backend
pip install -r requirements.txt
cd backend && uvicorn main:app --reload

# Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

## 💜 Personajes

| Personaje | Especialidad | Precio |
|-----------|-------------|--------|
| **lidIA** | Asistente general premium | S/ 29.90/mes |
| **Vivian** | Bienestar y lifestyle | S/ 24.90/mes |
| **Mia** | Creatividad y arte | S/ 24.90/mes |

## 💳 Pagos Yape

Número Yape: **986083251**

## 🌐 Deploy en Render

1. Fork este repositorio
2. Conecta a Render
3. Configura las variables de entorno
4. Deploy automático con `render.yaml`
