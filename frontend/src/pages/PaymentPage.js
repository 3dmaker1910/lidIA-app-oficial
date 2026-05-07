import React, { useState } from 'react';
import axios from 'axios';
import './PaymentPage.css';

const API_BASE = process.env.REACT_APP_API_URL || '';
const PAYMENT_AMOUNT = 2.00;
const ACCESS_DURATION_HOURS = 12;
const YAPE_QR_URL =
  'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/79843c85932d47c69d4a1668707b1b44_yape%20986083251%20%281%29.jpg';

export default function PaymentPage({ character, onNavigate }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [paymentData, setPaymentData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [accessInfo, setAccessInfo] = useState(null);

  if (!character) {
    return (
      <div className="payment-page">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>No se seleccionó ningún personaje.</p>
          <button className="btn-back" onClick={() => onNavigate('select')}>← Volver</button>
        </div>
      </div>
    );
  }

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!form.phone.trim()) {
      setError('Por favor ingresa tu número de celular.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/payment/initiate`, {
        character_id: character.id,
        user_name: form.name,
        user_phone: form.phone,
        amount: PAYMENT_AMOUNT,
      });
      setPaymentData(res.data);
      setStep('instructions');
    } catch (err) {
      setError('Error al procesar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verifyCode.trim() || (paymentData && paymentData.payment_code);
    if (!code) {
      setError('Ingresa el código de pago.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/payment/verify`, {
        payment_code: code,
        character_id: character.id,
      });
      setAccessInfo(res.data);
      setStep('success');
    } catch (err) {
      setError('No pudimos verificar tu pago. Asegúrate de haber enviado el monto correcto.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToChat = () => {
    onNavigate('chat', {
      character,
      premium: true,
      accessToken: accessInfo?.access_token,
      expiresAt: accessInfo?.expires_at,
    });
  };

  return (
    <div className="payment-page">
      <div className="payment-header">
        <button className="btn-back" onClick={() => onNavigate('select')}>← Volver</button>
        <h1 className="payment-title">Pago Yape</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="payment-content">
        <div className="payment-char" style={{ borderColor: character.color + '60' }}>
          <div className="char-avatar-sm">{character.avatar}</div>
          <div>
            <div className="char-name-sm" style={{ color: character.color }}>{character.name}</div>
            <div className="char-price-sm">S/ {PAYMENT_AMOUNT.toFixed(2)} · {ACCESS_DURATION_HOURS}h acceso</div>
          </div>
        </div>

        {step === 'form' && (
          <form className="payment-form" onSubmit={handleInitiate}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Ana García"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input"
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label>Número de celular</label>
              <input
                type="tel"
                placeholder="Ej: 987654321"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                className="form-input"
                maxLength={9}
                autoComplete="tel"
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="submit"
              className="btn-pay"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              disabled={loading}
            >
              {loading ? 'Procesando...' : `Pagar S/ ${PAYMENT_AMOUNT.toFixed(2)} con Yape →`}
            </button>
          </form>
        )}

        {step === 'instructions' && paymentData && (
          <div className="payment-instructions">
            <div className="yape-logo">
              <span className="yape-icon">📱</span>
              <span className="yape-text">Yape</span>
            </div>

            <div className="payment-amount">
              <span className="amount-label">Monto a pagar</span>
              <span className="amount-value">S/ {PAYMENT_AMOUNT.toFixed(2)}</span>
            </div>

            <div className="yape-qr-container">
              <p className="yape-qr-label">Escanea el QR con tu app Yape</p>
              <img
                src={YAPE_QR_URL}
                alt="QR Yape 986083251"
                className="yape-qr-image"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <p className="yape-qr-hint">O yapea directamente al número:</p>
            </div>

            <div className="yape-number-card">
              <div className="yape-number-label">Número Yape:</div>
              <div className="yape-number">{paymentData.yape_number}</div>
              <button className="btn-copy" onClick={() => copyToClipboard(paymentData.yape_number, 'phone')}>
                {copied === 'phone' ? '✅ Copiado' : '📋 Copiar número'}
              </button>
            </div>

            <div className="payment-code-card">
              <div className="code-label">Escribe este código en el mensaje Yape:</div>
              <div className="payment-code">{paymentData.payment_code}</div>
              <button className="btn-copy" onClick={() => copyToClipboard(paymentData.payment_code, 'code')}>
                {copied === 'code' ? '✅ Copiado' : '📋 Copiar código'}
              </button>
            </div>

            <div className="access-info-banner">
              <span>⏱</span>
              <span>Tu acceso durará <strong>{ACCESS_DURATION_HOURS} horas</strong> desde la verificación</span>
            </div>

            <button
              className="btn-done"
              onClick={() => setStep('verify')}
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
            >
              Ya realicé el pago ✓
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form className="payment-verify" onSubmit={handleVerify}>
            <div className="verify-icon">🔍</div>
            <h3 className="verify-title">Confirmar pago</h3>
            <p className="verify-desc">
              Haz clic en "Verificar pago" para confirmar. El código ya está prellenado.
            </p>
            <div className="form-group">
              <label>Código de pago</label>
              <input
                type="text"
                placeholder={paymentData?.payment_code || 'AB123456'}
                value={verifyCode || paymentData?.payment_code || ''}
                onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                className="form-input"
                maxLength={8}
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="submit"
              className="btn-pay"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Verificar pago'}
            </button>
            <button type="button" className="btn-back-link" onClick={() => setStep('instructions')}>
              ← Volver a instrucciones
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="payment-success">
            <div className="success-icon animate-glow">✅</div>
            <h3 className="success-title">¡Pago verificado!</h3>
            <p className="success-desc">
              Tienes <strong>{ACCESS_DURATION_HOURS} horas</strong> de acceso completo a {character.name}.
              {accessInfo?.expires_at && (
                <span className="expires-note">
                  <br />Expira: {new Date(accessInfo.expires_at).toLocaleString('es-PE')}
                </span>
              )}
            </p>
            <button
              className="btn-pay"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              onClick={handleGoToChat}
            >
              ¡Chatear con {character.name}! 💬
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
