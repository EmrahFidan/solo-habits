class NotificationManager {
  constructor() {
    this.settings = this.loadSettings();
    // Permission kontrolü kaldırıldı - otomatik çalışacak
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

  // Permission iste - Kaldırıldı, otomatik çalışacak
  async requestPermission() {
    console.log('🔔 Bildirimlerde izin gerekmiyor - otomatik aktif');
    return true; // Her zaman true döner
  }

  // Custom notification göster - Browser izni gerektirmez
  async showNotification(title, options = {}) {
    console.log(`🔔 ${title}`);
    console.log(`📝 ${options.body}`);
    
    // Custom toast notification oluştur
    this.createToastNotification(title, options.body);
    
    return true;
  }

  // Custom toast notification oluştur - XSS güvenli
  createToastNotification(title, body) {
    // Mevcut toast'ları temizle
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    // XSS koruması için text content kullan
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return '';
      return text.replace(/[<>&"']/g, (char) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char] || char;
      });
    };
    
    // Yeni toast oluştur
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    // Header oluştur
    const headerDiv = document.createElement('div');
    headerDiv.className = 'toast-header';
    headerDiv.textContent = sanitizeText(title);
    
    // Body oluştur  
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'toast-body';
    bodyDiv.textContent = sanitizeText(body);
    
    // Toast'a ekle
    toast.appendChild(headerDiv);
    toast.appendChild(bodyDiv);
    
    // CSS stilleri ekle
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    // CSS animasyon ekle
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-header {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .toast-body {
          font-size: 14px;
          opacity: 0.9;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 4 saniye sonra otomatik kaldır
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
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

  // Debug bilgileri - güncellenmiş
  debugInfo() {
    console.log('🔍 Notification Debug Info:');
    console.log('Custom Notifications: Aktif');
    console.log('Settings:', this.settings);
    console.log('User Agent:', navigator.userAgent);
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
