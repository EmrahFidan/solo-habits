import React, { useState, useEffect, useCallback } from "react";
import NotificationManager from "./NotificationManager";
import "./Settings.css";

function Settings({ onLogout }) {
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      dailyReminder: { 
        hour: 23, 
        minute: 0, 
        enabled: true 
      },
      streakWarning: { 
        hour: 23, 
        minute: 30, 
        enabled: true 
      },
      achievements: { 
        enabled: true 
      },
      challengeDeadline: { 
        enabled: true 
      },
      recoveryMode: { 
        enabled: true 
      },
      notificationsEnabled: true
    };
    
    try {
      const loadedSettings = NotificationManager.loadSettings();
      return { ...defaultSettings, ...loadedSettings };
    } catch (error) {
      console.error('Settings yüklenirken hata:', error);
      return defaultSettings;
    }
  });
  
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Settings'i kaydetme fonksiyonu
  const saveSettingsToStorage = useCallback((settingsToSave) => {
    try {
      localStorage.setItem('habitTrackerSettings', JSON.stringify(settingsToSave));
      NotificationManager.settings = settingsToSave;
      NotificationManager.saveSettings();
    } catch (error) {
      console.error('Settings kaydedilirken hata:', error);
    }
  }, []);

  // Settings güncelleyici fonksiyonu
  const updateSetting = useCallback((key, value) => {
    setSettings(prevSettings => {
      const newSettings = {
        ...prevSettings,
        [key]: value,
      };
      
      // Anında kaydet
      saveSettingsToStorage(newSettings);
      return newSettings;
    });
  }, [saveSettingsToStorage]);

  const updateNestedSetting = useCallback((section, key, value) => {
    setSettings(prevSettings => {
      const newSettings = {
        ...prevSettings,
        [section]: {
          ...prevSettings[section],
          [key]: value,
        },
      };
      
      // Anında kaydet
      saveSettingsToStorage(newSettings);
      return newSettings;
    });
  }, [saveSettingsToStorage]);

  // İlk yükleme useEffect'i - sadece permission kontrolü
  useEffect(() => {
    const checkPermission = () => {
      const savedPermission = localStorage.getItem('notification-permission');
      const currentPermission = Notification.permission;
      
      if (savedPermission !== currentPermission) {
        const isGranted = currentPermission === "granted";
        setPermissionGranted(isGranted);
        
        if (isGranted) {
          setNotificationsEnabled(true);
        }
        localStorage.setItem('notification-permission', currentPermission);
      } else {
        setPermissionGranted(savedPermission === 'granted');
      }
    };
    
    checkPermission();
  }, []); // Sadece mount'ta çalışır, dependency yok

  // Settings değiştiğinde otomatik kaydetme
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings, saveSettingsToStorage]);

  const handleNotificationToggle = async (e) => {
    const enabled = e.target.checked;
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      try {
        const granted = await NotificationManager.requestPermission();
        setPermissionGranted(granted);
        if (granted) {
          updateSetting("notificationsEnabled", true);
        } else {
          setNotificationsEnabled(false);
          updateSetting("notificationsEnabled", false);
        }
      } catch (error) {
        console.error('Bildirim izni alınırken hata:', error);
        setNotificationsEnabled(false);
        updateSetting("notificationsEnabled", false);
      }
    } else {
      updateSetting("notificationsEnabled", false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('habitTrackerSettings');
      localStorage.removeItem('notification-permission');
    } catch (error) {
      console.error('Çıkış sırasında hata:', error);
    }
    onLogout();
  };

  const testNotification = () => {
    if (permissionGranted) {
      NotificationManager.showNotification("Test Bildirimi", {
        body: "Bildirimleriniz düzgün çalışıyor! 🎉",
        tag: 'test-notification'
      });
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ AYARLAR</h1>
        <p>Bildirim ayarlarını yönet</p>
      </div>

      {/* Notification Permission Section */}
      <div className="settings-section">
        <div className="section-header">
          <h3>🔔 Bildirimler</h3>
          {permissionGranted && notificationsEnabled && (
            <button className="test-btn" onClick={testNotification}>
              Test Et
            </button>
          )}
        </div>
        
        <div className="setting-item">
          <label>
            <span>Bildirimleri Etkinleştir</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleNotificationToggle}
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>

        {notificationsEnabled && !permissionGranted && (
          <div className="permission-request">
            <p>📱 Bildirim izni gerekli</p>
            <p>Lütfen tarayıcı bildirim iznini verin</p>
          </div>
        )}

        {permissionGranted && notificationsEnabled && (
          <div className="permission-granted">
            <p>✅ Bildirimler aktif</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      {permissionGranted && notificationsEnabled && (
        <>
          {/* Daily Reminder Time */}
          <div className="settings-section">
            <h3>🌅 Günlük Hatırlatma Saati</h3>
            <div className="setting-item">
              <label>
                <span>Günlük Hatırlatmaları Aktif Et</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings?.dailyReminder?.enabled)}
                    onChange={(e) => {
                      updateNestedSetting("dailyReminder", "enabled", e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
            </div>
            
            {settings?.dailyReminder?.enabled && (
              <div className="time-picker">
                <label>Saat:</label>
                <select
                  value={settings?.dailyReminder?.hour ?? 23}
                  onChange={(e) => {
                    updateNestedSetting("dailyReminder", "hour", parseInt(e.target.value));
                  }}
                >
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                
                <label>Dakika:</label>
                <select
                  value={settings?.dailyReminder?.minute ?? 0}
                  onChange={(e) => {
                    updateNestedSetting("dailyReminder", "minute", parseInt(e.target.value));
                  }}
                >
                  {Array.from({length: 60}, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Streak Warning Time */}
          <div className="settings-section">
            <h3>🔥 Streak Uyarı Saati</h3>
            <div className="setting-item">
              <label>
                <span>Streak Uyarılarını Aktif Et</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings?.streakWarning?.enabled)}
                    onChange={(e) => {
                      updateNestedSetting("streakWarning", "enabled", e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
            </div>
            
            {settings?.streakWarning?.enabled && (
              <div className="time-picker">
                <label>Saat:</label>
                <select
                  value={settings?.streakWarning?.hour ?? 23}
                  onChange={(e) => {
                    updateNestedSetting("streakWarning", "hour", parseInt(e.target.value));
                  }}
                >
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                
                <label>Dakika:</label>
                <select
                  value={settings?.streakWarning?.minute ?? 30}
                  onChange={(e) => {
                    updateNestedSetting("streakWarning", "minute", parseInt(e.target.value));
                  }}
                >
                  {Array.from({length: 60}, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Other Notification Types */}
          <div className="settings-section">
            <h3>🏆 Diğer Bildirimler</h3>
            
            <div className="setting-item">
              <label>
                <span>🏆 Rozet Bildirimleri</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings?.achievements?.enabled)}
                    onChange={(e) => {
                      updateNestedSetting("achievements", "enabled", e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span>⏰ Challenge Bildirimleri</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings?.challengeDeadline?.enabled)}
                    onChange={(e) => {
                      updateNestedSetting("challengeDeadline", "enabled", e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span>🚨 Recovery Mode Bildirimleri</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings?.recoveryMode?.enabled)}
                    onChange={(e) => {
                      updateNestedSetting("recoveryMode", "enabled", e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Logout Button */}
      <div className="settings-section">
        <button className="logout-btn-settings" onClick={handleLogout}>
          🚪 Çıkış Yap
        </button>
      </div>
    </div>
  );
}

export default Settings;
