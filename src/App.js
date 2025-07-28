import React, { useState, useEffect } from "react"; // useEffect import edildi
import SkeletonLoader from "./components/SkeletonLoader";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Auth from "./components/Auth";
import Main from "./components/Main";
import Tatakae from "./components/Tatakae";
import HMinus from "./components/HMinus";
import Settings from "./components/Settings";

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Ses efektleri kaldırıldı

  useEffect(() => {
    console.log("🔥 Firebase Auth başlatılıyor...");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("👤 Auth state değişti:", user ? "Kullanıcı var" : "Kullanıcı yok");
      
      if (user) {
        console.log("✅ User ID:", user.uid);
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
          console.log("📄 User data yüklendi");
          setUserData(userDoc.data());
          } else {
            console.log("❌ User document bulunamadı");
          }
        } catch (error) {
          console.error("🚨 Firestore hatası:", error);
        }
      } else {
      setUser(null);
      setUserData(null);
      }
      
      console.log("⏰ Loading false yapılıyor...");
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // ...existing code...

  const handleLogout = () => signOut(auth);

  const tabs = [
    { id: 0, name: "MAIN", icon: "🌟" },
    { id: 1, name: "TATAKAE", icon: "⚡" },
    { id: 2, name: "H-", icon: "🚫" },
    { id: 3, name: "SETTINGS", icon: "⚙️" },
  ];

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    // ...ses efektleri kaldırıldı...
  };

  if (loading) return <SkeletonLoader />;

  if (!user) return <Auth />;

  return (
    <div className="app">
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
        {activeTab === 0 && (
          <Main user={user} userData={userData} setActiveTab={setActiveTab} />
        )}
        {activeTab === 1 && <Tatakae />}
        {activeTab === 2 && <HMinus />}
        {activeTab === 3 && (
          <Settings 
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

export default App;
