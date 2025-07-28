// Utility functions for habit calculations and operations
import { HABIT_CONSTANTS } from '../constants/habitSteps';

export const HabitUtils = {

  /**
   * Calculate current streak from progress array
   * @param {boolean[]} progress - Array of daily progress (true/false)
   * @param {number} currentDayIndex - Current day index
   * @returns {number} Current streak count
   */
  calculateCurrentStreak(progress, currentDayIndex) {
    if (!progress || progress.length === 0) return 0;

    let streak = 0;
    for (let i = currentDayIndex; i >= 0; i--) {
      if (progress[i] === true) {
        streak++;
      } else if (progress[i] === false) {
        break; // Streak broken
      }
      // null values don't break streak, continue counting
    }
    return streak;
  },

  /**
   * Calculate longest streak from progress array
   * @param {boolean[]} progress - Array of daily progress
   * @returns {number} Longest streak count
   */
  calculateLongestStreak(progress) {
    if (!progress || progress.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 0;

    progress.forEach(completed => {
      if (completed === true) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (completed === false) {
        currentStreak = 0;
      }
      // null values don't affect streak calculation
    });

    return longestStreak;
  },

  /**
   * Calculate completion percentage
   * @param {number} completedDays - Number of completed days
   * @param {number} totalDays - Total days in challenge/tracking
   * @returns {number} Completion percentage (0-100)
   */
  calculateCompletionPercentage(completedDays, totalDays) {
    if (!totalDays || totalDays === 0) return 0;
    return Math.round((completedDays / totalDays) * 100);
  },

  /**
   * Calculate clean percentage for bad habits
   * @param {(boolean|null)[]} progress - Progress array (true=clean, false=relapse, null=neutral)
   * @param {number} daysSinceStart - Days since tracking started
   * @returns {object} Clean percentage data
   */
  calculateCleanPercentage(progress, daysSinceStart) {
    const totalDaysIncludingToday = daysSinceStart + 1;

    if (totalDaysIncludingToday <= 1) {
      return { percentage: 0, text: "0/1", label: "0% temiz" };
    }

    const cleanDaysInAllDays = progress
      .slice(0, totalDaysIncludingToday)
      .filter((day) => day === true).length;
    
    const percentage = Math.round((cleanDaysInAllDays / totalDaysIncludingToday) * 100);

    return {
      percentage: percentage,
      text: `${cleanDaysInAllDays}/${totalDaysIncludingToday}`,
      label: `${percentage}% temiz`,
    };
  },

  /**
   * Check if habit/challenge is eligible for extension
   * @param {number} completedDays - Completed days count
   * @param {number} duration - Original duration
   * @param {number} daysSinceStart - Days since start
   * @returns {boolean} True if eligible for extension
   */
  isEligibleForExtension(completedDays, duration, daysSinceStart) {
    if (duration !== HABIT_CONSTANTS.DAYS_IN_WEEK) return false;
    if (daysSinceStart < 6) return false; // Need at least 6 days completed
    
    const successRate = Math.round((completedDays / HABIT_CONSTANTS.DAYS_IN_WEEK) * 100);
    return successRate >= HABIT_CONSTANTS.MIN_SUCCESS_RATE_FOR_EXTENSION;
  },

  /**
   * Calculate diamonds earned from streaks
   * @param {number} longestStreak - Longest streak achieved
   * @returns {number} Number of diamonds earned
   */
  calculateDiamonds(longestStreak) {
    return Math.floor(longestStreak / HABIT_CONSTANTS.DAYS_IN_WEEK);
  },

  /**
   * Get diamond class based on months completed
   * @param {number} monthsCompleted - Number of months completed
   * @returns {string} CSS class name for diamond color
   */
  getDiamondClass(monthsCompleted) {
    if (monthsCompleted >= 6) return 'diamond-legendary'; // Gold
    if (monthsCompleted >= 4) return 'diamond-master';    // Red
    if (monthsCompleted >= 2) return 'diamond-advanced';  // Purple
    return 'diamond-basic';                               // Blue
  },

  /**
   * Get progress class for visual indicators
   * @param {number} percentage - Completion percentage
   * @returns {string} CSS class name
   */
  getProgressClass(percentage) {
    let classes = "visual-progress-bar";
    if (percentage >= 25 && percentage < 50) classes += " milestone-25";
    if (percentage >= 50 && percentage < 75) classes += " milestone-50";
    if (percentage >= 75 && percentage < 95) classes += " milestone-75 glow";
    if (percentage >= 95) classes += " milestone-100 glow pulse";
    return classes;
  },

  /**
   * Generate progress status text
   * @param {object} habit - Habit/challenge object
   * @param {number} daysSinceStart - Days since start
   * @returns {string} Status text
   */
  getProgressStatus(habit, daysSinceStart) {
    const duration = habit.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;

    if (daysSinceStart >= duration) return "Tamamlandı";
    if (daysSinceStart < 0) return "Başlamadı";

    if (habit.recoveryMode) {
      return `${daysSinceStart + 1}. Gün - 🔄 Recovery`;
    }

    return `${daysSinceStart + 1}. Gün`;
  },

  /**
   * Check if habit/challenge is expired
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {number} duration - Duration in days
   * @returns {boolean} True if expired
   */
  isExpired(startDate, duration) {
    if (!startDate) return false;
    
    const start = new Date(startDate + "T00:00:00");
    const today = new Date();
    
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= duration;
  },

  /**
   * Calculate recovery mode status
   * @param {number} consecutiveMissed - Consecutive missed days
   * @returns {boolean} True if in recovery mode
   */
  isInRecoveryMode(consecutiveMissed) {
    return consecutiveMissed >= HABIT_CONSTANTS.RECOVERY_MODE_THRESHOLD;
  },

  /**
   * Get milestone emoji based on completion percentage
   * @param {number} percentage - Completion percentage
   * @returns {string} Milestone emoji
   */
  getMilestoneEmoji(percentage) {
    if (percentage >= 95) return "🏆";
    if (percentage >= 75) return "🔥";
    if (percentage >= 50) return "⭐";
    if (percentage >= 25) return "🌟";
    return "";
  },

  /**
   * Validate habit/challenge data
   * @param {object} habitData - Habit data object
   * @returns {object} Validation result with isValid and errors
   */
  validateHabitData(habitData) {
    const errors = [];

    if (!habitData.name || habitData.name.trim().length === 0) {
      errors.push("Habit name is required");
    }

    if (habitData.name && habitData.name.length > 100) {
      errors.push("Habit name must be less than 100 characters");
    }

    if (!habitData.duration || ![7, 30].includes(habitData.duration)) {
      errors.push("Duration must be 7 or 30 days");
    }

    if (!habitData.icon || habitData.icon.length === 0) {
      errors.push("Icon is required");
    }

    if (!habitData.color || !/^#[0-9A-F]{6}$/i.test(habitData.color)) {
      errors.push("Valid color is required");
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Generate habit statistics summary
   * @param {object} habit - Habit object
   * @param {number} daysSinceStart - Days since start
   * @returns {object} Statistics summary
   */
  generateStatsSummary(habit, daysSinceStart) {
    const completedDays = habit.completedDays || 0;
    const duration = habit.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    const completionPercentage = this.calculateCompletionPercentage(completedDays, duration);
    const longestStreak = this.calculateLongestStreak(habit.monthlyProgress || []);
    const diamonds = this.calculateDiamonds(longestStreak);

    return {
      completedDays,
      duration,
      completionPercentage,
      longestStreak,
      diamonds,
      status: this.getProgressStatus(habit, daysSinceStart),
      isExpired: this.isExpired(habit.startDate, duration),
      milestoneEmoji: this.getMilestoneEmoji(completionPercentage)
    };
  }
};