import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import CharacterSelect from './pages/CharacterSelect';
import PaymentPage from './pages/PaymentPage';
import ChatPage from './pages/ChatPage';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  const navigate = (page, data = {}) => {
    if (data.character) setSelectedCharacter(data.character);
    if (data.premium) setIsPremium(true);
    setCurrentPage(page);
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
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
