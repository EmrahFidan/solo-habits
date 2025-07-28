// Date utility functions for habit tracking
export const DateUtils = {
  
  /**
   * Get current date in YYYY-MM-DD format
   * @returns {string} Date string
   */
  getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * Calculate days between two dates
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format (optional, defaults to today)
   * @returns {number} Number of days
   */
  getDaysBetween(startDate, endDate = null) {
    if (!startDate) return 0;

    const start = new Date(startDate + "T00:00:00");
    const end = endDate ? new Date(endDate + "T00:00:00") : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  },

  /**
   * Check if a date is today
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {boolean} True if date is today
   */
  isToday(dateString) {
    return dateString === this.getCurrentDate();
  },

  /**
   * Get day name from date
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @param {string} locale - Locale for day names (default: 'tr-TR')
   * @returns {string} Day name
   */
  getDayName(dateString, locale = 'tr-TR') {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(locale, { weekday: 'short' });
  },

  /**
   * Get month name from date
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @param {string} locale - Locale for month names (default: 'tr-TR')
   * @returns {string} Month name
   */
  getMonthName(dateString, locale = 'tr-TR') {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(locale, { month: 'long' });
  },

  /**
   * Add days to a date
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @param {number} days - Days to add
   * @returns {string} New date in YYYY-MM-DD format
   */
  addDays(dateString, days) {
    const date = new Date(dateString + "T00:00:00");
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  },

  /**
   * Format time string to HH:MM
   * @param {string} timeStr - Time string
   * @returns {string} Formatted time
   */
  formatTime(timeStr) {
    if (!timeStr) return "00:00";
    
    // Remove non-numeric characters
    const numbers = timeStr.replace(/[^0-9]/g, '');
    
    // If already in HH:MM format, validate
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return timeStr;
      }
    }
    
    // Format from numbers
    if (numbers.length === 4) {
      const hours = parseInt(numbers.substring(0, 2));
      const minutes = parseInt(numbers.substring(2, 4));
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // Single/double digit hours
    if (numbers.length === 1 || numbers.length === 2) {
      const hours = parseInt(numbers);
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, '0')}:00`;
      }
    }
    
    // Fix H:MM format
    if (/^\d{1}:\d{2}$/.test(timeStr)) {
      return "0" + timeStr;
    }
    
    return "00:00";
  },

  /**
   * Get date range for a duration
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {number} duration - Duration in days
   * @returns {string[]} Array of dates in YYYY-MM-DD format
   */
  getDateRange(startDate, duration) {
    const dates = [];
    for (let i = 0; i < duration; i++) {
      dates.push(this.addDays(startDate, i));
    }
    return dates;
  },

  /**
   * Check if date is in the past
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {boolean} True if date is in the past
   */
  isPast(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const today = new Date();
    
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  },

  /**
   * Check if date is in the future
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {boolean} True if date is in the future
   */
  isFuture(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const today = new Date();
    
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return date > today;
  }
};