import React, { useState } from 'react';
import axios from 'axios';
import './PaymentPage.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function PaymentPage({ character, onNavigate }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [paymentData, setPaymentData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/payment/initiate`, {
        character_id: character.id,
        user_name: form.name,
        user_phone: form.phone,
      });
      setPaymentData(res.data);
      setStep('instructions');
    } catch (err) {
      setError('Error al procesar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setError('Ingresa el código de pago.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/payment/verify`, {
        payment_code: verifyCode,
        character_id: character.id,
      });
      setStep('success');
    } catch (err) {
      setError('No pudimos verificar tu pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
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
            <div className="char-price-sm">S/ {character.price?.toFixed(2) || '29.90'}/mes</div>
          </div>
        </div>

        {step === 'form' && (
          <form className="payment-form" onSubmit={handleInitiate}>
            <div className="form-group">
              <label>Tu nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Ana García"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Tu número de celular</label>
              <input
                type="tel"
                placeholder="Ej: 987654321"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="form-input"
                maxLength={9}
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="submit"
              className="btn-pay"
              style={{ background: character.gradient || '#7C3AED' }}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Continuar con Yape →'}
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
              <span className="amount-value">S/ {paymentData.amount?.toFixed(2)}</span>
            </div>
            <div className="yape-number-card">
              <div className="yape-number-label">Yapea a este número:</div>
              <div className="yape-number">{paymentData.yape_number}</div>
              <button className="btn-copy" onClick={() => copyToClipboard(paymentData.yape_number)}>
                {copied ? '✅ Copiado' : '📋 Copiar número'}
              </button>
            </div>
            <div className="payment-code-card">
              <div className="code-label">Escribe este código en el mensaje:</div>
              <div className="payment-code">{paymentData.payment_code}</div>
              <button className="btn-copy" onClick={() => copyToClipboard(paymentData.payment_code)}>
                {copied ? '✅ Copiado' : '📋 Copiar código'}
              </button>
            </div>
            <div className="instructions-list">
              {paymentData.instructions?.map((inst, i) => (
                <div key={i} className="instruction-item">
                  <span className="instruction-num">{i + 1}</span>
                  <span>{inst.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-done"
              onClick={() => setStep('verify')}
              style={{ background: character.gradient || '#7C3AED' }}
            >
              Ya realicé el pago ✓
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form className="payment-verify" onSubmit={handleVerify}>
            <div className="verify-icon">🔍</div>
            <h3 className="verify-title">Verificar pago</h3>
            <p className="verify-desc">Ingresa el código que recibiste para confirmar tu pago</p>
            <div className="form-group">
              <label>Código de pago</label>
              <input
                type="text"
                placeholder="Ej: AB123456"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                className="form-input"
                maxLength={8}
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="submit"
              className="btn-pay"
              style={{ background: character.gradient || '#7C3AED' }}
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
            <h3 className="success-title">¡Pago recibido!</h3>
            <p className="success-desc">
              Tu pago está siendo verificado. En unos minutos tendrás acceso completo a {character.name}.
            </p>
            <button
              className="btn-pay"
              style={{ background: character.gradient || '#7C3AED' }}
              onClick={() => onNavigate('chat', { character, premium: true })}
            >
              Ir a chatear con {character.name} 💬
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
