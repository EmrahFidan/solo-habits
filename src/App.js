import React, { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./components/Auth";
import Tatakae from "./components/Tatakae";
import HMinus from "./components/HMinus";
import Itera from "./components/Itera";

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [headerClickCount, setHeaderClickCount] = useState(0);

  useEffect(() => {
    console.log("🔥 Firebase Auth başlatılıyor...");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("👤 Auth state değişti:", user ? "Kullanıcı var" : "Kullanıcı yok");
      
      if (user) {
        console.log("✅ User ID:", user.uid);
        setUser(user);
      } else {
      setUser(null);
      }
      
    });
    
    return unsubscribe;
  }, []);

  const tabs = [
    { id: 0, name: "ITERA", icon: "🔄" },
    { id: 1, name: "TATAKAE", icon: "⚔️" },
    { id: 2, name: "H-", icon: "🚫" },
  ];

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
  };

  const handleHeaderClick = () => {
    const next = headerClickCount + 1;
    if (next >= 5) {
      setDeveloperMode((prev) => !prev);
      setHeaderClickCount(0);
      console.log(`👨‍💻 Developer Mode ${!developerMode ? "AKTIF" : "KAPALI"}`);
    } else {
      setHeaderClickCount(next);
    }
  };

  // No loading animation; render immediately

  if (!user) {
    return (
      <ErrorBoundary>
        <Auth />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary userId={user?.uid}>
      <div className="app">
        {developerMode && (
          <div className="dev-badge" title="Developer Mode aktif">
            👨‍💻 DEV MODE
          </div>
        )}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabSwitch(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="content">
          <ErrorBoundary userId={user?.uid}>
            {activeTab === 0 && (
              <Itera developerMode={developerMode} onHeaderClick={handleHeaderClick} />
            )}
            {activeTab === 1 && (
              <Tatakae developerMode={developerMode} onHeaderClick={handleHeaderClick} />
            )}
            {activeTab === 2 && (
              <HMinus developerMode={developerMode} onHeaderClick={handleHeaderClick} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
