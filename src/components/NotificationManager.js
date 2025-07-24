class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.settings = this.loadSettings();
  }

  // Settings'i localStorage'dan yükle
  loadSettings() {
    const saved = localStorage.getItem('notification-settings');
    const defaultSettings = {
      dailyReminder: {
        enabled: true,
        hour: 23,
        minute: 0
      },
      streakWarning: {
        enabled: true,
        hour: 23,
        minute: 30
      },
      achievements: { enabled: true },
      challengeDeadline: { enabled: true },
      recoveryMode: { enabled: true },
      soundEnabled: true
    };

    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return {
          ...defaultSettings,
          ...parsedSettings,
          dailyReminder: {
            ...defaultSettings.dailyReminder,
            ...parsedSettings.dailyReminder
          },
          streakWarning: {
            ...defaultSettings.streakWarning,
            ...parsedSettings.streakWarning
          },
          achievements: {
            ...defaultSettings.achievements,
            ...parsedSettings.achievements
          },
          challengeDeadline: {
            ...defaultSettings.challengeDeadline,
            ...parsedSettings.challengeDeadline
          },
          recoveryMode: {
            ...defaultSettings.recoveryMode,
            ...parsedSettings.recoveryMode
          }
        };
      } catch (error) {
        console.error('Settings parse error:', error);
        return defaultSettings;
      }
    }
    
    return defaultSettings;
  }

  // Settings'i kaydet
  saveSettings() {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    console.log('💾 Settings saved:', this.settings);
  }

  // Permission iste - Android optimizasyonu ile
  async requestPermission() {
    if ('Notification' in window) {
      // Android Chrome'da özel durum kontrolü
      if (navigator.userAgent.includes('Android')) {
        console.log('🤖 Android device detected');
      }
      
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      // Permission durumunu localStorage'a kaydet
      localStorage.setItem('notification-permission', permission);
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  }

  // Service Worker notification - Android için optimize edilmiş
  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') return;

    // Android için optimize edilmiş ayarlar
    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: 'solo-leveling',
      // Android için ek ayarlar
      silent: false,
      renotify: false,
      timestamp: Date.now(),
      ...options
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.showNotification(title, defaultOptions);
      } catch (error) {
        console.error('Service Worker notification error:', error);
        // Fallback: Browser notification
        return new Notification(title, defaultOptions);
      }
    } else {
      // Fallback: Direct browser notification
      return new Notification(title, defaultOptions);
    }
  }

  // 🌅 Günlük hatırlatma
  async scheduleDailyReminder() {
    if (!this.settings.dailyReminder.enabled) return;
    
    return await this.showNotification('🌅 Solo Leveling', {
      body: 'Bugünkü alışkanlıklarını kontrol et 💪',
      tag: 'daily-reminder'
    });
  }

  // 🔥 Streak uyarısı
  async scheduleStreakWarning() {
    if (!this.settings.streakWarning.enabled) return;
    
    return await this.showNotification('🔥 Streak Uyarısı!', {
      body: 'Streak\'ini kaybetmeden önce alışkanlıklarını tamamla!',
      tag: 'streak-warning'
    });
  }

  // 🏆 Achievement notification
  async showAchievement(badgeName) {
    if (!this.settings.achievements.enabled) return;
    
    return await this.showNotification('🏆 Yeni Rozet!', {
      body: `"${badgeName}" rozetini kazandın! 🎉`,
      tag: 'achievement'
    });
  }

  // ⏰ Challenge deadline
  async showChallengeDeadline(challengeName, daysLeft) {
    if (!this.settings.challengeDeadline.enabled) return;
    
    return await this.showNotification('⏰ Challenge Sona Eriyor!', {
      body: `"${challengeName}" challenge'ı ${daysLeft} gün sonra bitiyor!`,
      tag: 'challenge-deadline'
    });
  }

  // 🚨 Recovery mode alert
  async showRecoveryAlert(habitName) {
    if (!this.settings.recoveryMode.enabled) return;
    
    return await this.showNotification('🚨 Recovery Mode!', {
      body: `"${habitName}" için recovery mode aktif! Bugün çift puan kazanma şansın var!`,
      tag: 'recovery-mode'
    });
  }

  // Debug bilgileri - Android için
  debugInfo() {
    console.log('🔍 Notification Debug Info:');
    console.log('Permission:', this.permission);
    console.log('Settings:', this.settings);
    console.log('User Agent:', navigator.userAgent);
    console.log('Service Worker Support:', 'serviceWorker' in navigator);
    console.log('Notification Support:', 'Notification' in window);
    console.log('Protocol:', window.location.protocol);
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
