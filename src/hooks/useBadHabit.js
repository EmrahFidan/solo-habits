import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc 
} from "firebase/firestore";
import { HABIT_CONSTANTS } from "../constants/habitSteps";

export const useBadHabit = () => {
  const [badHabits, setBadHabits] = useState([]);
  const [showExtendModal, setShowExtendModal] = useState(null);

  const getDaysSinceStart = useCallback((startDate) => {
    if (!startDate) return 0;

    const start = new Date(startDate + "T00:00:00");
    const today = new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, []);

  const getProgressBoxes = useCallback((badHabit) => {
    const duration = badHabit.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    const progress = badHabit.monthlyProgress || Array(duration).fill(null);

    const startDate = new Date(badHabit.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const dayNames = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

    return Array.from({ length: duration }, (_, index) => {
      const dayNumber = index + 1;
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      currentDate.setHours(0, 0, 0, 0);
      const currentTime = currentDate.getTime();

      const isClean = progress[index] === true;
      const isRelapse = progress[index] === false;
      const isCurrent = currentTime === todayTime;
      const isPast = currentTime < todayTime;
      const isFuture = currentTime > todayTime;

      return {
        dayNumber,
        date: currentDate.getDate(),
        dayName: dayNames[currentDate.getDay()],
        isClean,
        isRelapse,
        isCurrent,
        isPast,
        isFuture,
        canToggle: isCurrent,
      };
    });
  }, []);

  const addBadHabit = useCallback(async (habitData) => {
    if (!habitData.name.trim()) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const duration = habitData.duration;

    await addDoc(collection(db, "h-minus"), {
      ...habitData,
      startDate: startDate,
      duration: duration,
      userId: auth.currentUser.uid,
      monthlyProgress: Array(duration).fill(null),
      cleanDays: 0,
      relapseCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: new Date(),
    });
  }, []);

  const extendToMonth = useCallback(async (badHabit) => {
    if (badHabit.duration !== HABIT_CONSTANTS.DAYS_IN_WEEK) return;
    
    const newDuration = HABIT_CONSTANTS.DAYS_IN_MONTH;
    const currentProgress = badHabit.monthlyProgress || Array(HABIT_CONSTANTS.DAYS_IN_WEEK).fill(null);
    const extendedProgress = [...currentProgress, ...Array(23).fill(null)];
    
    await updateDoc(doc(db, "h-minus", badHabit.id), {
      duration: newDuration,
      monthlyProgress: extendedProgress,
      isExtended: true,
      extendedAt: new Date(),
    });
    
    setShowExtendModal(null);
  }, []);

  const toggleDay = useCallback(async (badHabit, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;

    if (dayNumber !== currentDay || daysSinceStart >= duration) return;

    const newProgress = [
      ...(badHabit.monthlyProgress || Array(duration).fill(null)),
    ];
    const currentState = newProgress[dayIndex];

    let newState;
    if (currentState === null) {
      newState = true; // Clean
    } else if (currentState === true) {
      newState = false; // Relapse
    } else {
      newState = null; // Back to neutral
    }

    newProgress[dayIndex] = newState;

    const cleanDays = newProgress.filter((day) => day === true).length;
    const relapseCount = newProgress.filter((day) => day === false).length;

    // Current streak calculation
    let currentStreak = 0;
    for (let i = daysSinceStart; i >= 0; i--) {
      if (newProgress[i] === true) {
        currentStreak++;
      } else if (newProgress[i] === false) {
        break;
      }
    }

    const longestStreak = Math.max(badHabit.longestStreak || 0, currentStreak);

    await updateDoc(doc(db, "h-minus", badHabit.id), {
      monthlyProgress: newProgress,
      cleanDays: cleanDays,
      relapseCount: relapseCount,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      lastUpdated: new Date(),
    });

    return { newState, cleanDays, relapseCount, currentStreak };
  }, [getDaysSinceStart]);

  const deleteBadHabit = useCallback(async (id) => {
    await deleteDoc(doc(db, "h-minus", id));
  }, []);

  const updateDescription = useCallback(async (badHabitId, description) => {
    await updateDoc(doc(db, "h-minus", badHabitId), {
      description: description,
    });
  }, []);

  const getProgressDisplay = useCallback((badHabit) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const totalDaysIncludingToday = daysSinceStart + 1;

    if (totalDaysIncludingToday <= 1)
      return { percentage: 0, text: "0/1", label: "0% temiz" };

    const progress = badHabit.monthlyProgress || [];
    const cleanDaysInAllDays = progress
      .slice(0, totalDaysIncludingToday)
      .filter((day) => day === true).length;
    const percentage = Math.round(
      (cleanDaysInAllDays / totalDaysIncludingToday) * 100
    );

    return {
      percentage: percentage,
      text: `${cleanDaysInAllDays}/${totalDaysIncludingToday}`,
      label: `${percentage}% temiz`,
    };
  }, [getDaysSinceStart]);

  const isExpired = useCallback((badHabit) => {
    const duration = badHabit.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    return getDaysSinceStart(badHabit.startDate) >= duration;
  }, [getDaysSinceStart]);

  // Firebase listener
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "h-minus"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBadHabits = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allBadHabits.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });

      const active = allBadHabits.filter(
        (h) => getDaysSinceStart(h.startDate) < (h.duration || HABIT_CONSTANTS.DAYS_IN_MONTH)
      );
      
      setBadHabits(active);
      
      // Auto-extend check
      active.forEach(badHabit => {
        const daysSinceStart = getDaysSinceStart(badHabit.startDate);
        if (badHabit.duration === HABIT_CONSTANTS.DAYS_IN_WEEK && 
            daysSinceStart >= 6 && 
            !badHabit.isExtended) {
          const cleanDays = badHabit.cleanDays || 0;
          const successRate = Math.round((cleanDays / HABIT_CONSTANTS.DAYS_IN_WEEK) * 100);
          if (successRate >= HABIT_CONSTANTS.MIN_SUCCESS_RATE_FOR_EXTENSION) {
            if (!showExtendModal || showExtendModal.id !== badHabit.id) {
              setShowExtendModal(badHabit);
            }
          }
        }
      });
    });
    
    return unsubscribe;
  }, [getDaysSinceStart, showExtendModal]);

  return {
    badHabits,
    showExtendModal,
    setShowExtendModal,
    getDaysSinceStart,
    getProgressBoxes,
    addBadHabit,
    extendToMonth,
    toggleDay,
    deleteBadHabit,
    updateDescription,
    getProgressDisplay,
    isExpired
  };
};