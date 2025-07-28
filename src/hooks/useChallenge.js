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

export const useChallenge = () => {
  const [challenges, setChallenges] = useState([]);
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

  const getProgressBoxes = useCallback((challenge) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const progress = challenge.monthlyProgress || Array(duration).fill(false);

    const startDate = new Date(challenge.startDate + "T00:00:00");
    const dayNames = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

    return Array.from({ length: duration }, (_, index) => {
      const dayNumber = index + 1;
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);

      const isCompleted = progress[index];
      const isCurrent = dayNumber === currentDay && daysSinceStart < duration;
      const isPast = dayNumber < currentDay;
      const isFuture = dayNumber > currentDay;
      const isMissed = isPast && !isCompleted;

      return {
        dayNumber,
        date: currentDate.getDate(),
        dayName: dayNames[currentDate.getDay()],
        isCompleted,
        isCurrent,
        isPast,
        isFuture,
        isMissed,
        canToggle: isCurrent && !isPast,
      };
    });
  }, [getDaysSinceStart]);

  const addChallenge = useCallback(async (challengeData) => {
    if (!challengeData.name.trim()) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const duration = challengeData.duration;

    await addDoc(collection(db, "tatakae"), {
      ...challengeData,
      startDate: startDate,
      duration: duration,
      userId: auth.currentUser.uid,
      monthlyProgress: Array(duration).fill(false),
      completedDays: 0,
      missedDays: 0,
      consecutiveMissed: 0,
      recoveryMode: false,
      createdAt: new Date(),
    });
  }, []);

  const extendToMonth = useCallback(async (challenge) => {
    if (challenge.duration !== HABIT_CONSTANTS.DAYS_IN_WEEK) return;
    
    const newDuration = HABIT_CONSTANTS.DAYS_IN_MONTH;
    const currentProgress = challenge.monthlyProgress || Array(HABIT_CONSTANTS.DAYS_IN_WEEK).fill(false);
    const extendedProgress = [...currentProgress, ...Array(23).fill(false)];
    
    await updateDoc(doc(db, "tatakae", challenge.id), {
      duration: newDuration,
      monthlyProgress: extendedProgress,
      isExtended: true,
      extendedAt: new Date(),
    });
    
    setShowExtendModal(null);
  }, []);

  const toggleDay = useCallback(async (challenge, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;

    if (dayNumber !== currentDay || daysSinceStart >= duration) return;

    const newProgress = [
      ...(challenge.monthlyProgress || Array(duration).fill(false)),
    ];
    const wasCompleted = newProgress[dayIndex];
    newProgress[dayIndex] = !newProgress[dayIndex];

    const completedDays = newProgress.filter((day) => day).length;
    const newConsecutiveMissed = newProgress[dayIndex]
      ? 0
      : challenge.consecutiveMissed || 0;
    const newRecoveryMode = newConsecutiveMissed >= HABIT_CONSTANTS.RECOVERY_MODE_THRESHOLD;

    await updateDoc(doc(db, "tatakae", challenge.id), {
      monthlyProgress: newProgress,
      completedDays: completedDays,
      consecutiveMissed: newConsecutiveMissed,
      recoveryMode: newRecoveryMode,
      lastUpdated: new Date(),
    });

    return { wasCompleted, newProgress, completedDays, duration };
  }, [getDaysSinceStart]);

  const deleteChallenge = useCallback(async (id) => {
    await deleteDoc(doc(db, "tatakae", id));
  }, []);

  const updateDescription = useCallback(async (challengeId, description) => {
    await updateDoc(doc(db, "tatakae", challengeId), {
      description: description,
    });
  }, []);

  const getCompletionPercentage = useCallback((challenge) => {
    const completed = challenge.completedDays || 0;
    const duration = challenge.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    return Math.round((completed / duration) * 100);
  }, []);

  const isExpired = useCallback((challenge) => {
    const duration = challenge.duration || HABIT_CONSTANTS.DAYS_IN_MONTH;
    return getDaysSinceStart(challenge.startDate) >= duration;
  }, [getDaysSinceStart]);

  // Firebase listener
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "tatakae"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allChallenges = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allChallenges.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });

      const active = allChallenges.filter(
        (c) => getDaysSinceStart(c.startDate) < (c.duration || HABIT_CONSTANTS.DAYS_IN_MONTH)
      );

      setChallenges(active);
      
      // Auto-extend check
      active.forEach(challenge => {
        const daysSinceStart = getDaysSinceStart(challenge.startDate);
        
        if (challenge.duration === HABIT_CONSTANTS.DAYS_IN_WEEK && 
            daysSinceStart >= 6 && 
            !challenge.isExtended) {
          const completedDays = challenge.completedDays || 0;
          const successRate = Math.round((completedDays / HABIT_CONSTANTS.DAYS_IN_WEEK) * 100);
          
          if (successRate >= HABIT_CONSTANTS.MIN_SUCCESS_RATE_FOR_EXTENSION) {
            if (!showExtendModal || showExtendModal.id !== challenge.id) {
              setShowExtendModal(challenge);
            }
          }
        }
      });
    });
    
    return unsubscribe;
  }, [getDaysSinceStart, showExtendModal]);

  return {
    challenges,
    showExtendModal,
    setShowExtendModal,
    getDaysSinceStart,
    getProgressBoxes,
    addChallenge,
    extendToMonth,
    toggleDay,
    deleteChallenge,
    updateDescription,
    getCompletionPercentage,
    isExpired
  };
};