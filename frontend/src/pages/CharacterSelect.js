import React, { useState, useRef } from 'react';
import './CharacterSelect.css';

const PHOTO_LIDIA = 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/aab9c1dcf46c4119b7ddb9cb3e2cb27c_lidia.png';
const PHOTO_VIVIAN = 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/87db63e37c6746298803b64e39d2905c_vivian.png';
const PHOTO_MIA = 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/d2a6fa15868b49efabfdd6e8675d8f18_mia.png';

const characters = [
  {
    id: 'lidia',
    name: 'lidIA',
    tagline: 'Tu compañera inteligente',
    description: 'Sofisticada, empática y brillante. Siempre lista para ayudarte con cualquier cosa que necesites.',
    avatar: '💜',
    photo: PHOTO_LIDIA,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    price: 2.00,
    badge: '⭐ POPULAR',
    features: ['Chat ilimitado', 'Respuestas premium', 'Memoria contextual', 'Modo nocturno'],
    personality: 'Inteligente · Culta',
  },
  {
    id: 'vivian',
    name: 'Vivian',
    tagline: 'Experta en bienestar',
    description: 'Tu coach personal de fitness, nutrición y lifestyle. Energética, motivadora y siempre positiva.',
    avatar: '🌸',
    photo: PHOTO_VIVIAN,
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #F97316)',
    price: 2.00,
    badge: null,
    features: ['Planes de nutrición', 'Rutinas fitness', 'Consejos de bienestar', 'Motivación diaria'],
    personality: 'Fitness · Enérgica',
  },
  {
    id: 'mia',
    name: 'Mia',
    tagline: 'Tu mentora creativa',
    description: 'Arte, diseño, escritura y música. Imaginativa y apasionada, descubre tu potencial creativo con ella.',
    avatar: '🎨',
    photo: PHOTO_MIA,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    price: 2.00,
    badge: '🆕 NUEVA',
    features: ['Guía artística', 'Proyectos creativos', 'Feedback personalizado', 'Inspiración diaria'],
    personality: 'Dulce · Romántica',
  },
];

export default function CharacterSelect({ onNavigate }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const carouselRef = useRef(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveIdx(i => Math.min(i + 1, characters.length - 1));
      else setActiveIdx(i => Math.max(i - 1, 0));
    }
    setTouchStart(null);
  };

  const active = characters[activeIdx];

  return (
    <div className="char-select">
      <div className="char-select-header">
        <button className="back-btn" onClick={() => onNavigate('landing')}>← Volver</button>
        <h1 className="char-select-title">Elige tu personaje</h1>
        <div style={{ width: 60 }} />
      </div>

      <div
        className="carousel"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="carousel-track"
          style={{ transform: `translateX(calc(-${activeIdx * 100}% - ${activeIdx * 20}px))` }}
        >
          {characters.map((char, idx) => (
            <div
              key={char.id}
              className={`char-card ${idx === activeIdx ? 'active' : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              {char.badge && (
                <div className="char-badge" style={{ background: char.color }}>{char.badge}</div>
              )}
              <div className="char-avatar-ring" style={{ background: char.gradient }}>
                <img
                  src={char.photo}
                  alt={char.name}
                  className="char-photo"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.parentNode.querySelector('.char-avatar-fallback').style.display = 'flex';
                  }}
                />
                <div className="char-avatar-fallback" style={{ display: 'none' }}>{char.avatar}</div>
              </div>
              <div className="char-personality-tag" style={{ color: char.color, borderColor: char.color + '40' }}>
                {char.personality}
              </div>
              <h2 className="char-name" style={{ color: char.color }}>{char.name}</h2>
              <p className="char-tagline">{char.tagline}</p>
              <p className="char-description">{char.description}</p>
              <div className="char-features">
                {char.features.map((f, i) => (
                  <div key={i} className="char-feature">
                    <span className="check" style={{ color: char.color }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="char-price">
                <span className="price-currency">S/</span>
                <span className="price-amount">{char.price.toFixed(2)}</span>
                <span className="price-period"> · 12h acceso</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-dots">
        {characters.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === activeIdx ? 'active' : ''}`}
            style={{ background: idx === activeIdx ? active.color : undefined }}
            onClick={() => setActiveIdx(idx)}
          />
        ))}
      </div>

      <div className="char-select-actions">
        <button
          className="btn-select"
          style={{ background: active.gradient }}
          onClick={() => onNavigate('chat', { character: active })}
        >
          Chatear gratis con {active.name} 💬
        </button>
        <button
          className="btn-premium"
          onClick={() => onNavigate('payment', { character: active })}
        >
          Obtener acceso premium — S/ {active.price.toFixed(2)} · 12h
        </button>
      </div>
    </div>
  );
}
