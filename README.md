# lidIA — Tu IA Premium en Español

Una aplicación de chat con IA premium que presenta tres personajes únicos: **lidIA**, **Vivian** y **Mia**.

## 🚀 Stack Tecnológico

- **Backend**: FastAPI + Groq (Llama 3 70B)
- **Frontend**: React 18 + **Vite** (build → `frontend/dist`)
- **Pagos**: Yape (986083251)
- **Deploy**: Render

## 📁 Estructura

```
lidia-app/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html          ← Punto de entrada Vite (raíz del proyecto)
│   ├── vite.config.js      ← Configuración Vite
│   ├── package.json
│   ├── public/
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
├── render.yaml             ← Configuración de deploy Render
└── README.md
```

## ⚙️ Variables de entorno

```env
GROQ_API_KEY=tu_api_key_de_groq
REACT_APP_API_URL=https://tu-api.onrender.com
ACCESS_SECRET=cadena_secreta_aleatoria
```

## 🛠️ Instalación local

```bash
# Backend
pip install -r requirements.txt
cd backend && uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev          # Servidor de desarrollo en http://localhost:3000
npm run build        # Genera la carpeta frontend/dist/
npm run preview      # Previsualiza el build en local
```

## 🌐 Deploy en Render — Static Site

### Configuración del Frontend (Static Site)

| Campo | Valor |
|-------|-------|
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

> ✅ La carpeta `dist` se genera automáticamente en la raíz del build con `npm run build`.
> El archivo `index.html` y todos los assets quedan en `frontend/dist/`.

### Configuración del Backend (Web Service)

| Campo | Valor |
|-------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Variables de entorno requeridas

**Backend:**
- `GROQ_API_KEY` — Tu API key de Groq
- `ACCESS_SECRET` — Render puede generarla automáticamente (`generateValue: true`)

**Frontend:**
- `REACT_APP_API_URL` — URL del backend, ej: `https://lidia-api.onrender.com`

### Deploy con render.yaml

El archivo `render.yaml` incluido configura ambos servicios automáticamente.
Al conectar el repositorio en Render, detectará el archivo y configurará todo.

## 💜 Personajes

| Personaje | Especialidad | Precio |
|-----------|-------------|--------|
| **lidIA** | Asistente general premium | S/ 2.00 |
| **Vivian** | Bienestar y lifestyle | S/ 2.00 |
| **Mia** | Creatividad y arte | S/ 2.00 |

## 💳 Pagos Yape

Número Yape: **986083251**
Acceso: **12 horas** por cada pago verificado

## 🔧 Notas técnicas

- El frontend usa **Vite** en lugar de Create React App. El build genera `dist/` (no `build/`).
- Los archivos `.js` con JSX son soportados gracias a la config de esbuild en `vite.config.js`.
- SPA routing configurado en `render.yaml`: cualquier ruta redirige a `/index.html`.
