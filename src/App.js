import React, { useState, useEffect, Suspense, lazy } from "react";
import SkeletonLoader from "./components/SkeletonLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Lazy load components for better performance
const Auth = lazy(() => import("./components/Auth"));
const Main = lazy(() => import("./components/Main"));
const Tatakae = lazy(() => import("./components/Tatakae"));
const HMinus = lazy(() => import("./components/HMinus"));
const Settings = lazy(() => import("./components/Settings"));
const Itera = lazy(() => import("./components/Itera"));
const Guide = lazy(() => import("./components/Guide"));

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showInitialGuide, setShowInitialGuide] = useState(false);

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
          const userData = userDoc.data();
          setUserData(userData);
          
          // İlk giriş kontrolü - kılavuz göster
          if (userData.isFirstLogin) {
            console.log("🎯 İlk giriş tespit edildi, kılavuz gösteriliyor");
            setShowInitialGuide(true);
          }
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
    { id: 0, name: "MAIN", icon: "🛖" },
    { id: 1, name: "ITERA", icon: "🔄" },
    { id: 2, name: "TATAKAE", icon: "⚔️" },
    { id: 3, name: "H-", icon: "🚫" },
  ];

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
  };

  const handleGuideComplete = async () => {
    console.log("🎉 Kılavuz tamamlandı!");
    setShowInitialGuide(false);
    
    // İlk giriş bayrağını kaldır
    if (user && userData?.isFirstLogin) {
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          isFirstLogin: false
        }, { merge: true });
        setUserData({
          ...userData,
          isFirstLogin: false
        });
        console.log("✅ İlk giriş bayrağı kaldırıldı");
      } catch (error) {
        console.error("🚨 Firestore güncellemesi başarısız:", error);
      }
    }
  };

  const handleGuideSkip = async () => {
    console.log("⏭️ Kılavuz atlandı");
    await handleGuideComplete(); // Aynı işlemi yapar
  };

  const openGuide = () => {
    console.log("📚 Kılavuz manuel olarak açıldı");
    setShowGuide(true);
  };

  const closeGuide = () => {
    console.log("❌ Kılavuz kapatıldı");
    setShowGuide(false);
  };

  if (loading) return <SkeletonLoader />;

  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<SkeletonLoader />}>
          <Auth />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary userId={user?.uid}>
      {/* İlk giriş kılavuzu */}
      {showInitialGuide && (
        <Suspense fallback={<SkeletonLoader />}>
          <Guide 
            onComplete={handleGuideComplete}
            onSkip={handleGuideSkip}
          />
        </Suspense>
      )}

      {/* Manuel kılavuz */}
      {showGuide && (
        <Suspense fallback={<SkeletonLoader />}>
          <Guide 
            onComplete={closeGuide}
            onSkip={closeGuide}
          />
        </Suspense>
      )}

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
          <ErrorBoundary userId={user?.uid}>
            <Suspense fallback={<SkeletonLoader />}>
              {activeTab === 0 && (
                <Main 
                  user={user} 
                  userData={userData} 
                  setActiveTab={setActiveTab}
                  openGuide={openGuide}
                />
              )}
              {activeTab === 1 && <Itera />}
              {activeTab === 2 && <Tatakae />}
              {activeTab === 3 && <HMinus />}
              {activeTab === 4 && (
                <Settings 
                  onLogout={handleLogout}
                  setActiveTab={setActiveTab}
                  openGuide={openGuide}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
