import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CharacterSelect from './pages/CharacterSelect';
import PaymentPage from './pages/PaymentPage';
import ChatPage from './pages/ChatPage';
import './App.css';

const ACCESS_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours in ms

function loadSession() {
  try {
    const raw = localStorage.getItem('lidia_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(data) {
  localStorage.setItem('lidia_session', JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem('lidia_session');
}

function isAccessActive(paidAt) {
  if (!paidAt) return false;
  return Date.now() - paidAt < ACCESS_DURATION_MS;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [paidAt, setPaidAt] = useState(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const session = loadSession();
    if (session && isAccessActive(session.paidAt)) {
      setIsPremium(true);
      setAccessToken(session.accessToken || null);
      setPaidAt(session.paidAt);
      setAccessExpiresAt(session.expiresAt || null);
    } else if (session) {
      // Expired — clear it
      clearSession();
    }
  }, []);

  // Periodically re-check if access is still valid (every minute)
  useEffect(() => {
    if (!isPremium || !paidAt) return;
    const timer = setInterval(() => {
      if (!isAccessActive(paidAt)) {
        setIsPremium(false);
        setAccessToken(null);
        setPaidAt(null);
        setAccessExpiresAt(null);
        clearSession();
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [isPremium, paidAt]);

  const navigate = (page, data = {}) => {
    if (data.character) setSelectedCharacter(data.character);
    if (data.premium && data.accessToken) {
      const now = Date.now();
      setIsPremium(true);
      setAccessToken(data.accessToken);
      setPaidAt(now);
      setAccessExpiresAt(data.expiresAt || null);
      saveSession({
        paidAt: now,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt || null,
        characterId: data.character?.id || selectedCharacter?.id,
      });
    }
    setCurrentPage(page);
  };

  const handleAccessExpired = () => {
    setIsPremium(false);
    setAccessToken(null);
    setPaidAt(null);
    setAccessExpiresAt(null);
    clearSession();
    setCurrentPage('payment');
  };

  return (
    <div className="App">
      {currentPage === 'landing' && (
        <LandingPage onNavigate={navigate} />
      )}
      {currentPage === 'select' && (
        <CharacterSelect onNavigate={navigate} />
      )}
      {currentPage === 'payment' && (
        <PaymentPage
          character={selectedCharacter}
          onNavigate={navigate}
        />
      )}
      {currentPage === 'chat' && (
        <ChatPage
          character={selectedCharacter}
          isPremium={isPremium}
          accessToken={accessToken}
          paidAt={paidAt}
          accessExpiresAt={accessExpiresAt}
          onNavigate={navigate}
          onAccessExpired={handleAccessExpired}
        />
      )}
    </div>
  );
}
