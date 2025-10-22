import React, { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import "./components/Tabs.css";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import Tatakae from "./components/Tatakae";
import HMinus from "./components/HMinus";
import Itera from "./components/Itera";

function App() {
  const [expandedSection, setExpandedSection] = useState("tatakae");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);
  const [headerClickCount, setHeaderClickCount] = useState(0);

  useEffect(() => {
    console.log("🔥 Firebase Auth başlatılıyor...");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("👤 Auth state değişti:", user ? "Kullanıcı var" : "Kullanıcı yok");

      if (user) {
        console.log("✅ User ID:", user.uid);
        setUser(user);
        setLoading(false);
      } else {
        // Kullanıcı yoksa otomatik anonymous giriş yap
        console.log("🔐 Otomatik anonymous giriş yapılıyor...");
        try {
          await signInAnonymously(auth);
          console.log("✅ Anonymous giriş başarılı");
        } catch (error) {
          console.error("❌ Anonymous giriş hatası:", error);
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const toggleSection = (sectionName) => {
    setExpandedSection(
      expandedSection === sectionName ? null : sectionName
    );
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

  // Loading state - minimal spinner
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚔️</div>
          <div style={{ fontSize: '18px', color: '#667eea' }}>Solo Habits yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary userId={user?.uid}>
      <div className="app">
        {developerMode && (
          <div className="dev-badge-top-right" title="Developer Mode aktif">
            👨‍💻 DEV MODE
          </div>
        )}

        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${expandedSection === "itera" ? "active" : ""}`}
              onClick={() => toggleSection("itera")}
              style={{
                "--tab-color": "#ff9500"
              }}
            >
              ITERA
            </button>

            <button
              className={`tab-button ${expandedSection === "hminus" ? "active" : ""}`}
              onClick={() => toggleSection("hminus")}
              style={{
                "--tab-color": "#ff6b6b"
              }}
            >
              H-
            </button>

            <button
              className={`tab-button ${expandedSection === "tatakae" ? "active" : ""}`}
              onClick={() => toggleSection("tatakae")}
              style={{
                "--tab-color": "#00d084"
              }}
            >
              TATAKAE
            </button>
          </div>

          <div className="tab-content">
            {expandedSection === "itera" && (
              <ErrorBoundary userId={user?.uid}>
                <Itera developerMode={developerMode} onHeaderClick={handleHeaderClick} />
              </ErrorBoundary>
            )}

            {expandedSection === "hminus" && (
              <ErrorBoundary userId={user?.uid}>
                <HMinus developerMode={developerMode} onHeaderClick={handleHeaderClick} />
              </ErrorBoundary>
            )}

            {expandedSection === "tatakae" && (
              <ErrorBoundary userId={user?.uid}>
                <Tatakae developerMode={developerMode} onHeaderClick={handleHeaderClick} />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
