import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import "./Settings.css";

function Settings({ onLogout }) {
  const [userSettings, setUserSettings] = useState({
    dayStartTime: "00:00",
    notifications: {
      enabled: true,
      times: ["07:00", "16:00", "23:00"],
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [notificationPermission, setNotificationPermission] =
    useState("default");

  // 24 saatlik format garantisi ve otomatik düzeltme
  const ensureTimeFormat = (timeStr) => {
    if (!timeStr) return "00:00";

    // Sadece rakamları al
    const numbers = timeStr.replace(/[^0-9]/g, "");

    // Eğer zaten HH:MM formatındaysa kontrol et
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return timeStr;
      }
    }

    // Sadece rakamlar varsa formatla
    if (numbers.length === 4) {
      const hours = parseInt(numbers.substring(0, 2));
      const minutes = parseInt(numbers.substring(2, 4));
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      }
    }

    // Sadece saat girilmişse
    if (numbers.length === 1 || numbers.length === 2) {
      const hours = parseInt(numbers);
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, "0")}:00`;
      }
    }

    // H:MM formatındaysa sıfır ekle
    if (/^\d{1}:\d{2}$/.test(timeStr)) {
      return "0" + timeStr;
    }

    return "00:00";
  };

  // Kullanıcı ayarlarını yükle
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().settings) {
          const savedSettings = userDoc.data().settings;
          setUserSettings({
            dayStartTime:
              ensureTimeFormat(savedSettings.dayStartTime) || "00:00",
            notifications: {
              enabled: savedSettings.notifications?.enabled !== false,
              times: savedSettings.notifications?.times?.map((time) =>
                ensureTimeFormat(time)
              ) || ["07:00", "16:00", "23:00"],
            },
          });
        } else {
          // Eğer ayarlar yoksa default değerler
          setUserSettings({
            dayStartTime: "00:00",
            notifications: {
              enabled: true,
              times: ["07:00", "16:00", "23:00"],
            },
          });
        }
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, []);

  // Service Worker mesaj listener
  useEffect(() => {
    // Service Worker'dan gelen mesajları dinle
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === "GET_NOTIFICATION_SETTINGS") {
        // Service Worker ayarları istiyor - gönder
        const currentTime = event.data.currentTime;

        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: "SET_NOTIFICATION_SETTINGS",
            settings: userSettings,
            currentTime: currentTime,
          });
        }
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );

      // Service Worker scheduler'ı başlat
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: "START_SCHEDULER" });
        }
      });
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
      }
    };
  }, [userSettings]); // Auth state App.js'te yönetiliyor, bu yüzden dependency gerekmiyor

  // Notification permission kontrolü
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Ayarları Firebase'e kaydet
  const saveSettings = async (newSettings) => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        settings: newSettings,
      });

      // Service Worker'a yeni ayarları bildir
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SETTINGS_UPDATED",
          settings: newSettings,
        });
      }
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata:", error);
      // Hata durumunda user document oluştur
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            settings: newSettings,
          },
          { merge: true }
        );
      } catch (createError) {
        console.error("User document oluşturulurken hata:", createError);
      }
    } finally {
      setSaving(false);
    }
  };

  // Günün başlangıç saatini değiştir
  const handleDayStartTimeChange = (time) => {
    const formattedTime = ensureTimeFormat(time);
    const newSettings = {
      ...userSettings,
      dayStartTime: formattedTime,
    };
    setUserSettings(newSettings);
    saveSettings(newSettings);
  };

  // Bildirim durumunu değiştir
  const handleNotificationToggle = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (saving) return;

    const newSettings = {
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        enabled: !userSettings.notifications.enabled,
      },
    };

    setUserSettings(newSettings);
    saveSettings(newSettings);
  };

  // Saat seçenekleri oluştur (00:00 - 23:59, 30 dakika aralıklarla)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({ value: timeStr, label: timeStr });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Hatırlatma saatini değiştir
  const handleNotificationTimeChange = (index, time) => {
    const newTimes = [...userSettings.notifications.times];
    newTimes[index] = time; // Dropdown'dan gelen değer zaten formatlanmış

    const newSettings = {
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        times: newTimes,
      },
    };
    setUserSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("habitTrackerSettings");
      localStorage.removeItem("notification-permission");
    } catch (error) {
      console.error("Çıkış sırasında hata:", error);
    }
    onLogout();
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">
          <h1>⚙️ AYARLAR YÜKLENİYOR...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ AYARLAR</h1>
        <p>Uygulama ve zaman ayarları</p>
      </div>

      {/* Zaman Ayarları */}
      <div className="settings-section">
        <h3>🕐 Zaman Ayarları</h3>

        {/* Günün Başlangıç Saati */}
        <div className="setting-item">
          <div className="time-picker">
            <span>Gün saat</span>
            <select
              value={userSettings.dayStartTime}
              onChange={(e) => handleDayStartTimeChange(e.target.value)}
              disabled={saving}
              className="time-select-dropdown"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span>itibariyle başlar</span>
          </div>
        </div>

        <div className="data-info">
          <p>
            💡 <strong>İpucu:</strong> Günün başlangıç saati, streak
            hesaplamalarını ve günlük takibi etkiler. Örneğin 06:00 seçerseniz,
            gece 02:00'de yaptığınız alışkanlık bir önceki güne sayılır.
          </p>
        </div>
      </div>

      {/* Bildirim Ayarları */}
      <div className="settings-section">
        <div className="section-header">
          <h3>🔔 Hatırlatma Bildirimleri</h3>
          <div className="toggle-switch" onClick={handleNotificationToggle}>
            <input
              type="checkbox"
              id="notifications"
              checked={userSettings.notifications.enabled}
              onChange={(e) => e.preventDefault()}
              disabled={saving}
            />
            <span className="slider"></span>
          </div>
        </div>

        {userSettings.notifications.enabled && (
          <>
            <div className="notification-times-compact">
              {userSettings.notifications.times.map((time, index) => (
                <div
                  key={`notification-${index}-${time}`}
                  className="notification-item-compact"
                >
                  <span className="notification-label">
                    {index === 0 && "🟢 İlk Hatırlatma"}
                    {index === 1 && "🟡 İkinci Hatırlatma"}
                    {index === 2 && "🔴 Son Hatırlatma"}
                  </span>
                  <select
                    value={time}
                    onChange={(e) =>
                      handleNotificationTimeChange(index, e.target.value)
                    }
                    disabled={saving}
                    className="time-select-dropdown"
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="data-info">
              <p>
                🔔 <strong>Bildirimler:</strong> Günde 3 kez hatırlatma
                alacaksınız. Bu saatlerde alışkanlıklarınızı kontrol etmeniz ve
                gerekli işlemleri yapmanız hatırlatılacak.
              </p>
            </div>
          </>
        )}

        {!userSettings.notifications.enabled && (
          <div className="data-info">
            <p>
              🔕 <strong>Bildirimler Kapalı:</strong> Hatırlatma bildirimleri
              devre dışı. Yukarıdaki anahtarı açarak bildirimleri
              etkinleştirebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Kaydetme Durumu */}
      {saving && (
        <div className="settings-section">
          <div className="permission-request">
            <p>💾 Ayarlar kaydediliyor...</p>
          </div>
        </div>
      )}

      {/* Hakkında */}
      <div className="settings-section">
        <h3>ℹ️ Hakkında</h3>

        <div className="about-info">
          <div className="about-item">
            <span className="about-label">📱 Uygulama:</span>
            <span className="about-value">Solo Leveling - Habit Tracker</span>
          </div>

          <div className="about-item">
            <span className="about-label">🔢 Versiyon:</span>
            <span className="about-value">v3.0.0</span>
          </div>

          <div className="about-item">
            <span className="about-label">👨‍💻 Geliştirici:</span>
            <span className="about-value">Emrah Fidan</span>
          </div>

          <div className="about-item">
            <span className="about-label">🎯 Tema:</span>
            <span className="about-value">
              Atomik Alışkanlıklar - James Clear
            </span>
          </div>

          <div className="about-item">
            <span className="about-label">🕐 Zaman Dilimi:</span>
            <span className="about-value">Türkiye Saati (UTC+3)</span>
          </div>
        </div>
      </div>

      {/* Çıkış Yap */}
      <div className="settings-section logout-section">
        <p>Hesabınızdan çıkış yapmak istediğinizden emin misiniz?</p>
        <button className="logout-btn-settings" onClick={handleLogout}>
          🚪 Çıkış Yap
        </button>
      </div>
    </div>
  );
}

export default Settings;
