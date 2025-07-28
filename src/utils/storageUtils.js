// Local storage and data persistence utilities
export const StorageUtils = {

  /**
   * Safely get item from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Stored value or default
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} Success status
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all items from localStorage
   * @returns {boolean} Success status
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get storage usage information
   * @returns {object} Storage usage stats
   */
  getStorageInfo() {
    if (!this.isAvailable()) {
      return { available: false };
    }

    let totalSize = 0;
    let itemCount = 0;

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
          itemCount++;
        }
      }

      return {
        available: true,
        itemCount,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
        approximateLimit: 5000000, // ~5MB typical limit
        usagePercentage: Math.round((totalSize / 5000000) * 100)
      };
    } catch (error) {
      return { available: true, error: error.message };
    }
  },

  /**
   * Save user settings to localStorage
   * @param {object} settings - Settings object
   * @returns {boolean} Success status
   */
  saveUserSettings(settings) {
    return this.setItem('habitTrackerSettings', {
      ...settings,
      lastUpdated: new Date().toISOString()
    });
  },

  /**
   * Load user settings from localStorage
   * @param {object} defaultSettings - Default settings object
   * @returns {object} Settings object
   */
  loadUserSettings(defaultSettings = {}) {
    const settings = this.getItem('habitTrackerSettings', defaultSettings);
    
    // Merge with defaults to ensure all properties exist
    return {
      ...defaultSettings,
      ...settings
    };
  },

  /**
   * Save notification settings
   * @param {object} notificationSettings - Notification settings
   * @returns {boolean} Success status
   */
  saveNotificationSettings(notificationSettings) {
    return this.setItem('notification-settings', notificationSettings);
  },

  /**
   * Load notification settings
   * @returns {object} Notification settings
   */
  loadNotificationSettings() {
    return this.getItem('notification-settings', {
      dailyReminder: { enabled: true, hour: 23, minute: 0 },
      streakWarning: { enabled: true, hour: 23, minute: 30 },
      achievements: { enabled: true },
      challengeDeadline: { enabled: true },
      recoveryMode: { enabled: true },
      soundEnabled: true
    });
  },

  /**
   * Save error reports for later sending
   * @param {object} errorReport - Error report object
   * @returns {boolean} Success status
   */
  saveErrorReport(errorReport) {
    const existingErrors = this.getItem('errorReports', []);
    existingErrors.push({
      ...errorReport,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 errors to prevent storage bloat
    const recentErrors = existingErrors.slice(-10);
    return this.setItem('errorReports', recentErrors);
  },

  /**
   * Get all error reports
   * @returns {array} Array of error reports
   */
  getErrorReports() {
    return this.getItem('errorReports', []);
  },

  /**
   * Clear error reports
   * @returns {boolean} Success status
   */
  clearErrorReports() {
    return this.removeItem('errorReports');
  },

  /**
   * Save offline data queue
   * @param {array} offlineQueue - Array of offline operations
   * @returns {boolean} Success status
   */
  saveOfflineQueue(offlineQueue) {
    return this.setItem('offlineQueue', offlineQueue);
  },

  /**
   * Get offline data queue
   * @returns {array} Array of offline operations
   */
  getOfflineQueue() {
    return this.getItem('offlineQueue', []);
  },

  /**
   * Add operation to offline queue
   * @param {object} operation - Operation to queue
   * @returns {boolean} Success status
   */
  addToOfflineQueue(operation) {
    const queue = this.getOfflineQueue();
    queue.push({
      ...operation,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random().toString(36).substr(2, 9)
    });
    return this.saveOfflineQueue(queue);
  },

  /**
   * Remove operation from offline queue
   * @param {string} operationId - Operation ID to remove
   * @returns {boolean} Success status
   */
  removeFromOfflineQueue(operationId) {
    const queue = this.getOfflineQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    return this.saveOfflineQueue(filteredQueue);
  },

  /**
   * Clear offline queue
   * @returns {boolean} Success status
   */
  clearOfflineQueue() {
    return this.removeItem('offlineQueue');
  },

  /**
   * Save app cache version
   * @param {string} version - Cache version
   * @returns {boolean} Success status
   */
  saveCacheVersion(version) {
    return this.setItem('appCacheVersion', version);
  },

  /**
   * Get app cache version
   * @returns {string} Cache version
   */
  getCacheVersion() {
    return this.getItem('appCacheVersion', '1.0.0');
  },

  /**
   * Save last sync timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {boolean} Success status
   */
  saveLastSync(timestamp) {
    return this.setItem('lastSyncTimestamp', timestamp);
  },

  /**
   * Get last sync timestamp
   * @returns {string} ISO timestamp
   */
  getLastSync() {
    return this.getItem('lastSyncTimestamp', null);
  },

  /**
   * Backup all app data to a single object
   * @returns {object} Backup data object
   */
  createBackup() {
    const backup = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: {}
    };

    try {
      // Backup all habit tracker related data
      const keys = [
        'habitTrackerSettings',
        'notification-settings',
        'errorReports',
        'offlineQueue',
        'appCacheVersion',
        'lastSyncTimestamp'
      ];

      keys.forEach(key => {
        const value = this.getItem(key);
        if (value !== null) {
          backup.data[key] = value;
        }
      });

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  },

  /**
   * Restore app data from backup
   * @param {object} backup - Backup data object
   * @returns {boolean} Success status
   */
  restoreFromBackup(backup) {
    if (!backup || !backup.data) {
      console.error('Invalid backup data');
      return false;
    }

    try {
      Object.entries(backup.data).forEach(([key, value]) => {
        this.setItem(key, value);
      });

      console.log(`Restored backup from ${backup.timestamp}`);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  },

  /**
   * Clean up old data and optimize storage
   * @returns {object} Cleanup summary
   */
  cleanup() {
    const summary = {
      before: this.getStorageInfo(),
      itemsRemoved: 0,
      errorsRemoved: 0,
      queueItemsRemoved: 0
    };

    try {
      // Clean old error reports (keep only last 5)
      const errorReports = this.getItem('errorReports', []);
      if (errorReports.length > 5) {
        const recentErrors = errorReports.slice(-5);
        this.setItem('errorReports', recentErrors);
        summary.errorsRemoved = errorReports.length - 5;
      }

      // Clean old offline queue items (older than 7 days)
      const queue = this.getOfflineQueue();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentQueue = queue.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate > sevenDaysAgo;
      });
      
      if (recentQueue.length !== queue.length) {
        this.saveOfflineQueue(recentQueue);
        summary.queueItemsRemoved = queue.length - recentQueue.length;
      }

      summary.after = this.getStorageInfo();
      return summary;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { ...summary, error: error.message };
    }
  }
};