import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import "./Tatakae.css";

function Tatakae({ soundEnabled }) {
  const [challenges, setChallenges] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    icon: "🎯",
    color: "#667eea",
    description: "",
    difficulty: "medium",
    duration: 30,
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");

  // 🎊 ANIMATED CELEBRATIONS STATE
  const [confetti, setConfetti] = useState([]);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [achievementModal, setAchievementModal] = useState(null);

  // 📊 HEATMAP STATE
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);

  // 📚 CHALLENGE HISTORY STATE
  const [showHistory, setShowHistory] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [historyStats, setHistoryStats] = useState({
    totalCompleted: 0,
    averageSuccess: 0,
    longestStreak: 0,
    totalDays: 0,
  });

  const difficultyLevels = React.useMemo(
    () => [
      {
        id: "easy",
        name: "Kolay",
        emoji: "🟢",
        pointsPerDay: 1,
        color: "#43e97b",
        description: "1 puan/gün - Hafif başlangıç",
        penalty: 1,
      },
      {
        id: "medium",
        name: "Orta",
        emoji: "🟡",
        pointsPerDay: 2,
        color: "#feca57",
        description: "2 puan/gün - Dengeli zorluk",
        penalty: 2,
      },
      {
        id: "hard",
        name: "Zor",
        emoji: "🔴",
        pointsPerDay: 3,
        color: "#ff6b6b",
        description: "3 puan/gün - Maksimum challenge!",
        penalty: 3,
      },
    ],
    []
  );

  // 🆕 Süre seçenekleri
  const durationOptions = [
    {
      value: 7,
      label: "1 Hafta",
      days: 7,
      description: "Kısa sürede hızlı sonuç",
    },
    {
      value: 30,
      label: "1 Ay",
      days: 30,
      description: "Kalıcı alışkanlık oluşturma",
    },
  ];

  const icons = [
    "🎯",
    "🧘",
    "💪",
    "📚",
    "🎸",
    "🏃",
    "🎨",
    "✍️",
    "🧠",
    "❤️",
    "🌱",
    "🌟",
    "⚡",
    "🔥",
    "💎",
    "🚀",
    "🎵",
    "📷",
    "🎬",
    "🍃",
    "☯️",
    "🌙",
    "⭐",
    "🎪",
    "🎭",
    "🎲",
    "🏆",
    "💫",
    "🎮",
    "📖",
  ];

  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#43e97b",
    "#fa709a",
    "#30cfd0",
    "#a8edea",
    "#ff9a9e",
    "#fecfef",
    "#ffecd2",
    "#fcb69f",
  ];

  // 📊 HEATMAP DATA GENERATOR
  const generateHeatmapData = useCallback((allChallenges) => {
    const data = [];
    const today = new Date();

    // Son 12 hafta (84 gün)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      let completedCount = 0;
      let totalChallenges = 0;

      allChallenges.forEach((challenge) => {
        const startDate = new Date(challenge.startDate + "T00:00:00");
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const duration = challenge.duration || 30;

        if (daysDiff >= 0 && daysDiff < duration) {
          totalChallenges++;
          const progress = challenge.monthlyProgress || [];
          if (progress[daysDiff]) {
            completedCount++;
          }
        }
      });

      data.push({
        date: date.toISOString().split("T")[0],
        completed: completedCount,
        total: totalChallenges,
        level:
          totalChallenges === 0
            ? 0
            : Math.min(Math.ceil((completedCount / totalChallenges) * 4), 4),
        dayName: date.toLocaleDateString("tr-TR", { weekday: "short" }),
        fullDate: date.toLocaleDateString("tr-TR"),
      });
    }

    setHeatmapData(data);
  }, []);

  // 📚 HISTORY STATS CALCULATOR
  const calculateHistoryStats = useCallback((completed) => {
    if (completed.length === 0) {
      setHistoryStats({
        totalCompleted: 0,
        averageSuccess: 0,
        longestStreak: 0,
        totalDays: 0,
      });
      return;
    }

    const totalCompleted = completed.length;
    const totalDays = completed.reduce(
      (sum, c) => sum + (c.completedDays || 0),
      0
    );
    const totalPossibleDays = completed.reduce(
      (sum, c) => sum + (c.duration || 30),
      0
    );
    const averageSuccess = Math.round((totalDays / totalPossibleDays) * 100);

    // En uzun streak hesaplama (basitleştirilmiş)
    let longestStreak = 0;
    completed.forEach((challenge) => {
      const progress = challenge.monthlyProgress || [];
      let currentStreak = 0;
      let maxStreak = 0;

      progress.forEach((day) => {
        if (day) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      longestStreak = Math.max(longestStreak, maxStreak);
    });

    setHistoryStats({
      totalCompleted,
      averageSuccess,
      longestStreak,
      totalDays,
    });
  }, []);

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

      // 🆕 Tarihe göre sıralama - en yeni üstte
      allChallenges.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA; // En yeni üstte
      });

      // Aktif ve tamamlanan challenge'ları ayır
      const active = allChallenges.filter(
        (c) => getDaysSinceStart(c.startDate) < (c.duration || 30)
      );
      const completed = allChallenges.filter(
        (c) => getDaysSinceStart(c.startDate) >= (c.duration || 30)
      );

      setChallenges(active);
      setCompletedChallenges(completed);

      // İstatistikleri hesapla
      calculateHistoryStats(completed);

      // Heatmap datasını güncelle
      generateHeatmapData(allChallenges);
    });
    return unsubscribe;
  }, [calculateHistoryStats, generateHeatmapData]);

  // 🎊 CONFETTI ANIMATION SYSTEM
  const createConfetti = useCallback(() => {
    const newConfetti = [];
    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        color: ["#ff6b6b", "#feca57", "#43e97b", "#667eea", "#ff9ff3"][
          Math.floor(Math.random() * 5)
        ],
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 4 + 3,
        gravity: 0.1,
      });
    }
    setConfetti(newConfetti);

    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev
          .map((piece) => ({
            ...piece,
            x: piece.x + piece.speedX,
            y: piece.y + piece.speedY,
            speedY: piece.speedY + piece.gravity,
            rotation: piece.rotation + 8,
          }))
          .filter((piece) => piece.y < window.innerHeight + 50)
      );
    }, 16);

    setTimeout(() => {
      clearInterval(interval);
      setConfetti([]);
    }, 4000);
  }, []);

  // 🌟 PARTICLE EFFECTS SYSTEM
  const createParticles = useCallback((x, y, type = "star") => {
    const newParticles = [];
    const particleCount = type === "heart" ? 15 : 25;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      newParticles.push({
        id: Math.random(),
        x: x,
        y: y,
        vx: Math.cos(angle) * (Math.random() * 4 + 2),
        vy: Math.sin(angle) * (Math.random() * 4 + 2),
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 6 + 3,
        type: type,
        color: type === "heart" ? "#ff6b6b" : "#ffd700",
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // gravity
            life: particle.life - particle.decay,
          }))
          .filter((particle) => particle.life > 0)
      );
    }, 16);

    setTimeout(() => {
      clearInterval(interval);
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 2000);
  }, []);

  // Penalty uygulama fonksiyonu
  const applyPenalty = useCallback(
    async (challenge, missedDayIndex) => {
      const difficulty = difficultyLevels.find(
        (d) => d.id === challenge.difficulty
      );
      const penaltyPoints = difficulty?.penalty || 1;

      const newCurrentPoints = Math.max(
        0,
        (challenge.currentPoints || 0) - penaltyPoints
      );
      const newMissedDays = (challenge.missedDays || 0) + 1;

      const consecutiveMissed = challenge.consecutiveMissed || 0;
      const newConsecutiveMissed = consecutiveMissed + 1;
      const recoveryMode = newConsecutiveMissed >= 2;

      await updateDoc(doc(db, "tatakae", challenge.id), {
        currentPoints: newCurrentPoints,
        missedDays: newMissedDays,
        consecutiveMissed: newConsecutiveMissed,
        recoveryMode: recoveryMode,
        lastPenaltyApplied: new Date().toISOString(),
      });

      console.log(
        `😢 ${challenge.name} için ${penaltyPoints} puan kesildi! (Kaçırılan gün)`
      );

      if (recoveryMode) {
        console.log(
          `🔄 Recovery Mode: ${challenge.name} için ertesi gün bonus puan şansı!`
        );
      }
    },
    [difficultyLevels]
  );

  // Penalty kontrolü fonksiyonu
  const checkDailyPenalties = useCallback(async () => {
    const today = new Date().toDateString();
    const lastPenaltyCheck = localStorage.getItem("lastPenaltyCheck");

    if (lastPenaltyCheck === today) return;

    for (const challenge of challenges) {
      const duration = challenge.duration || 30;
      if (getDaysSinceStart(challenge.startDate) >= duration) continue;

      const yesterdayIndex = getDaysSinceStart(challenge.startDate) - 1;
      if (yesterdayIndex < 0) continue;

      const progress = challenge.monthlyProgress || Array(duration).fill(false);
      const wasYesterdayCompleted = progress[yesterdayIndex];

      if (!wasYesterdayCompleted && yesterdayIndex >= 0) {
        await applyPenalty(challenge, yesterdayIndex);
      }
    }

    localStorage.setItem("lastPenaltyCheck", today);
  }, [challenges, applyPenalty]);

  // Penalty kontrolü için günlük check
  useEffect(() => {
    if (!auth.currentUser) return;
    checkDailyPenalties();
    const interval = setInterval(checkDailyPenalties, 60000 * 60);
    return () => clearInterval(interval);
  }, [checkDailyPenalties]);

  const getDaysSinceStart = (startDate) => {
    if (!startDate) return 0;

    const start = new Date(startDate + "T00:00:00");
    const today = new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const getProgressBoxes = (challenge) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;
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
  };

  const addChallenge = async () => {
    if (!newChallenge.name.trim()) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const selectedDifficulty = difficultyLevels.find(
      (d) => d.id === newChallenge.difficulty
    );
    const duration = newChallenge.duration;

    await addDoc(collection(db, "tatakae"), {
      ...newChallenge,
      startDate: startDate,
      difficulty: newChallenge.difficulty,
      duration: duration,
      pointsPerDay: selectedDifficulty.pointsPerDay,
      totalPossiblePoints: selectedDifficulty.pointsPerDay * duration,
      currentPoints: 0,
      userId: auth.currentUser.uid,
      monthlyProgress: Array(duration).fill(false),
      completedDays: 0,
      missedDays: 0,
      consecutiveMissed: 0,
      recoveryMode: false,
      createdAt: new Date(),
    });

    setNewChallenge({
      name: "",
      icon: "🎯",
      color: "#667eea",
      description: "",
      difficulty: "medium",
      duration: 30,
    });
    setShowForm(false);
  };

  // 🆕 CHALLENGE UZATMA FONKSİYONU
  const extendChallenge = async (challenge) => {
    if (challenge.duration !== 7) return; // Sadece 7 günlük challenge'lar uzatılabilir

    const selectedDifficulty = difficultyLevels.find(
      (d) => d.id === challenge.difficulty
    );
    const newDuration = 30;

    // Mevcut progress'i koru, sadece 23 gün daha ekle
    const currentProgress = challenge.monthlyProgress || Array(7).fill(false);
    const extendedProgress = [...currentProgress, ...Array(23).fill(false)];

    await updateDoc(doc(db, "tatakae", challenge.id), {
      duration: newDuration,
      totalPossiblePoints: selectedDifficulty.pointsPerDay * newDuration,
      monthlyProgress: extendedProgress,
      isExtended: true, // Uzatıldığını işaretle
      extendedAt: new Date(),
    });

    console.log(
      `🚀 ${challenge.name} 1 aya uzatıldı! Mevcut progress korundu.`
    );
  };

  // 📚 RE-CHALLENGE FUNCTION
  const rechallenge = async (completedChallenge) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const duration = completedChallenge.duration || 30;

    await addDoc(collection(db, "tatakae"), {
      name: completedChallenge.name + " (Tekrar)",
      icon: completedChallenge.icon,
      color: completedChallenge.color,
      description: completedChallenge.description,
      difficulty: completedChallenge.difficulty,
      duration: duration,
      startDate: startDate,
      pointsPerDay: completedChallenge.pointsPerDay,
      totalPossiblePoints: completedChallenge.totalPossiblePoints,
      currentPoints: 0,
      userId: auth.currentUser.uid,
      monthlyProgress: Array(duration).fill(false),
      completedDays: 0,
      missedDays: 0,
      consecutiveMissed: 0,
      recoveryMode: false,
      createdAt: new Date(),
      isRechallenge: true,
      originalChallengeId: completedChallenge.id,
    });

    console.log(`🔄 ${completedChallenge.name} yeniden başlatıldı!`);
  };

  const toggleDay = async (challenge, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;

    if (dayNumber !== currentDay || daysSinceStart >= duration) return;

    const newProgress = [
      ...(challenge.monthlyProgress || Array(duration).fill(false)),
    ];
    const wasCompleted = newProgress[dayIndex];
    newProgress[dayIndex] = !newProgress[dayIndex];

    const completedDays = newProgress.filter((day) => day).length;
    const difficulty = difficultyLevels.find(
      (d) => d.id === challenge.difficulty
    );
    const pointsPerDay = difficulty?.pointsPerDay || 1;

    const isRecoveryMode = challenge.recoveryMode;
    const bonusMultiplier =
      isRecoveryMode && !wasCompleted && newProgress[dayIndex] ? 2 : 1;
    const earnedPoints = newProgress[dayIndex]
      ? pointsPerDay * bonusMultiplier
      : 0;

    let currentPoints = challenge.currentPoints || 0;
    if (!wasCompleted && newProgress[dayIndex]) {
      currentPoints += earnedPoints;
    } else if (wasCompleted && !newProgress[dayIndex]) {
      currentPoints -= pointsPerDay * bonusMultiplier;
    }

    const newPercentage = Math.round((completedDays / duration) * 100);
    const newConsecutiveMissed = newProgress[dayIndex]
      ? 0
      : challenge.consecutiveMissed || 0;
    const newRecoveryMode = newConsecutiveMissed >= 2;

    await updateDoc(doc(db, "tatakae", challenge.id), {
      monthlyProgress: newProgress,
      completedDays: completedDays,
      currentPoints: Math.max(0, currentPoints),
      consecutiveMissed: newConsecutiveMissed,
      recoveryMode: newRecoveryMode,
      lastUpdated: new Date(),
    });

    // 🎊 CELEBRATION TRIGGERS
    if (!wasCompleted && newProgress[dayIndex] && soundEnabled) {
      // Particle effect ekle (tıklanan yerin koordinatlarında)
      const event = window.event;
      if (event) {
        createParticles(event.clientX, event.clientY, "star");
      }

      if (isRecoveryMode) {
        console.log(
          `🔥 RECOVERY BONUS! ${earnedPoints} puan kazandın! (${pointsPerDay}x2)`
        );
        window.playSound && window.playSound("milestone50");
      } else {
        window.playSound && window.playSound("complete");
      }

      // Milestone celebrations
      setTimeout(() => {
        if (newPercentage === 100) {
          // 🎊 FULL COMPLETION CELEBRATION!
          createConfetti();
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);

          setAchievementModal({
            title: "🏆 CHALLENGE TAMAMLANDI!",
            subtitle: `${challenge.name} başarıyla tamamlandı!`,
            icon: challenge.icon,
            color: challenge.color,
            stats: {
              completedDays: completedDays,
              totalPoints: currentPoints,
              successRate: Math.round((completedDays / duration) * 100),
            },
          });

          window.playSound && window.playSound("milestone100");
          console.log("🏆 CHALLENGE TAMAMLANDI! Müthiş iş!");
        } else if (newPercentage === 75) {
          createParticles(
            window.innerWidth / 2,
            window.innerHeight / 2,
            "heart"
          );
          window.playSound && window.playSound("milestone75");
          console.log("🔥 SON ÇEYREK! %75 tamamlandı!");
        } else if (newPercentage === 50) {
          window.playSound && window.playSound("milestone50");
          console.log("⭐ YARIM YOL! %50 tamamlandı!");
        } else if (newPercentage === 25) {
          window.playSound && window.playSound("milestone25");
          console.log("🌟 İLK MİLESTONE! %25 tamamlandı!");
        }
      }, 300);
    }

    if (!wasCompleted && newProgress[dayIndex]) {
      console.log(
        `🎉 +${earnedPoints} puan kazandın! Toplam: ${currentPoints} puan`
      );
    }
  };

  const deleteChallenge = async (id) => {
    await deleteDoc(doc(db, "tatakae", id));
    setShowConfirm(null);
  };

  const updateDescription = async (challengeId) => {
    await updateDoc(doc(db, "tatakae", challengeId), {
      description: updatedDescription,
    });
    setShowDescription(null);
    setUpdatedDescription("");
  };

  const getCompletionPercentage = (challenge) => {
    const completed = challenge.completedDays || 0;
    const duration = challenge.duration || 30;
    return Math.round((completed / duration) * 100);
  };

  const getProgressClass = (percentage) => {
    let classes = "visual-progress-bar";
    if (percentage >= 25 && percentage < 50) classes += " milestone-25";
    if (percentage >= 50 && percentage < 75) classes += " milestone-50";
    if (percentage >= 75 && percentage < 95) classes += " milestone-75 glow";
    if (percentage >= 95) classes += " milestone-100 glow pulse";
    return classes;
  };

  const getChallengeStatus = (challenge) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;

    if (daysSinceStart >= duration) return "Tamamlandı";
    if (daysSinceStart < 0) return "Başlamadı";

    if (challenge.recoveryMode) {
      return `${daysSinceStart + 1}. Gün - 🔄 Recovery`;
    }

    return `${daysSinceStart + 1}. Gün`;
  };

  const isExpired = (challenge) => {
    const duration = challenge.duration || 30;
    return getDaysSinceStart(challenge.startDate) >= duration;
  };

  // 🆕 EXTEND BUTONU GÖSTERİLECEK Mİ?
  const canExtend = (challenge) => {
    const completionRate = getCompletionPercentage(challenge);
    return (
      challenge.duration === 7 &&
      isExpired(challenge) &&
      !challenge.isExtended &&
      completionRate >= 85
    ); // 🆕 En az %85 tamamlamış olmalı
  };

  // 📊 EXPORT HEATMAP DATA
  const exportHeatmapData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Date,Completed,Total,Success Rate\n" +
      heatmapData
        .map(
          (day) =>
            `${day.date},${day.completed},${day.total},${
              day.total ? ((day.completed / day.total) * 100).toFixed(1) : 0
            }%`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tatakae_heatmap_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`tatakae-container ${screenShake ? "screen-shake" : ""}`}>
      {/* 🎊 CONFETTI OVERLAY */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: piece.x,
                top: piece.y,
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🌟 PARTICLES OVERLAY */}
      {particles.length > 0 && (
        <div className="particles-container">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`particle particle-${particle.type}`}
              style={{
                left: particle.x,
                top: particle.y,
                opacity: particle.life,
                transform: `scale(${particle.life})`,
                color: particle.color,
                fontSize: particle.size,
              }}
            >
              {particle.type === "star" ? "⭐" : "💖"}
            </div>
          ))}
        </div>
      )}

      {/* 🏆 ACHIEVEMENT MODAL */}
      {achievementModal && (
        <div
          className="achievement-modal-overlay"
          onClick={() => setAchievementModal(null)}
        >
          <div
            className="achievement-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="achievement-header">
              <div
                className="achievement-icon"
                style={{ color: achievementModal.color }}
              >
                {achievementModal.icon}
              </div>
              <h2>{achievementModal.title}</h2>
              <p>{achievementModal.subtitle}</p>
            </div>
            <div className="achievement-stats">
              <div className="stat-item">
                <span className="stat-value">
                  {achievementModal.stats.completedDays}
                </span>
                <span className="stat-label">Tamamlanan Gün</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {achievementModal.stats.totalPoints}
                </span>
                <span className="stat-label">Toplam Puan</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {achievementModal.stats.successRate}%
                </span>
                <span className="stat-label">Başarı Oranı</span>
              </div>
            </div>
            <button
              className="achievement-close-btn"
              onClick={() => setAchievementModal(null)}
            >
              Devam Et 🎉
            </button>
          </div>
        </div>
      )}

      <div className="tatakae-header">
        <h1>⚡ TATAKAE </h1>
        <p>Hayatında yeni bir şey dene ve deneyimle!</p>

        {/* 📊📚 HEADER BUTTONS */}
        <div className="header-buttons">
          <button
            className="header-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            📊 {showHeatmap ? "Gizle" : "Heatmap"}
          </button>
          <button
            className="header-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            📚 {showHistory ? "Gizle" : "Geçmiş"}
          </button>
        </div>
      </div>

      {/* 📊 HEATMAP SECTION */}
      {showHeatmap && (
        <div className="heatmap-section">
          <div className="heatmap-header">
            <h3>📊 Aktivite Haritası (Son 12 Hafta)</h3>
            <button className="export-btn" onClick={exportHeatmapData}>
              📤 Dışa Aktar
            </button>
          </div>
          <div className="heatmap-container">
            <div className="heatmap-grid">
              {heatmapData.map((day, index) => (
                <div
                  key={day.date}
                  className={`heatmap-day level-${day.level}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  data-date={day.date}
                >
                  {hoveredDay === day && (
                    <div className="heatmap-tooltip">
                      <strong>{day.fullDate}</strong>
                      <br />
                      {day.completed}/{day.total} challenge tamamlandı
                      {day.total > 0 && (
                        <span>
                          {" "}
                          ({Math.round((day.completed / day.total) * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Az</span>
              <div className="legend-squares">
                <div className="legend-square level-0"></div>
                <div className="legend-square level-1"></div>
                <div className="legend-square level-2"></div>
                <div className="legend-square level-3"></div>
                <div className="legend-square level-4"></div>
              </div>
              <span>Çok</span>
            </div>
          </div>
        </div>
      )}

      {/* 📚 CHALLENGE HISTORY SECTION */}
      {showHistory && (
        <div className="history-section">
          <div className="history-header">
            <h3>📚 Challenge Geçmişi</h3>
            <div className="history-stats">
              <div className="history-stat">
                <span className="stat-number">
                  {historyStats.totalCompleted}
                </span>
                <span className="stat-text">Tamamlanan</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">
                  {historyStats.averageSuccess}%
                </span>
                <span className="stat-text">Ortalama Başarı</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">
                  {historyStats.longestStreak}
                </span>
                <span className="stat-text">En Uzun Streak</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">{historyStats.totalDays}</span>
                <span className="stat-text">Toplam Gün</span>
              </div>
            </div>
          </div>

          <div className="completed-challenges-list">
            {completedChallenges.length === 0 ? (
              <div className="no-history">
                <p>🎯 Henüz tamamlanmış challenge yok</p>
                <p>İlk challenge'ını tamamla ve burada gör!</p>
              </div>
            ) : (
              completedChallenges.map((challenge) => (
                <div key={challenge.id} className="completed-challenge-item">
                  <div className="completed-challenge-header">
                    <span className="completed-challenge-icon">
                      {challenge.icon}
                    </span>
                    <div className="completed-challenge-info">
                      <h4>{challenge.name}</h4>
                      <p>
                        {challenge.completedDays || 0}/
                        {challenge.duration || 30} gün •{" "}
                        {Math.round(
                          ((challenge.completedDays || 0) /
                            (challenge.duration || 30)) *
                            100
                        )}
                        % başarı
                      </p>
                      <small>
                        Tamamlandı:{" "}
                        {new Date(challenge.startDate).toLocaleDateString(
                          "tr-TR"
                        )}
                      </small>
                    </div>
                    <button
                      className="rechallenge-btn"
                      onClick={() => rechallenge(challenge)}
                      title="Yeniden Başlat"
                    >
                      🔄
                    </button>
                  </div>
                  <div className="completed-challenge-progress">
                    {(
                      challenge.monthlyProgress ||
                      Array(challenge.duration || 30).fill(false)
                    ).map((day, index) => (
                      <div
                        key={index}
                        className={`mini-day ${day ? "completed" : "missed"}`}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button className="add-challenge-btn" onClick={() => setShowForm(true)}>
        <span>+</span> Yeni Challenge Başlat
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="challenge-form" onClick={(e) => e.stopPropagation()}>
            <h3>Challenge Oluştur</h3>
            <p
              style={{
                textAlign: "center",
                color: "rgba(204, 201, 220, 0.7)",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Challenge bugün başlayacak!
            </p>

            <input
              type="text"
              placeholder="Challenge adı... (ör: Meditasyon, Egzersiz, Okuma)"
              value={newChallenge.name}
              onChange={(e) =>
                setNewChallenge({ ...newChallenge, name: e.target.value })
              }
            />

            <div className="icon-selector">
              <p>İkon seç:</p>
              <div className="icon-grid">
                {icons.map((icon, index) => (
                  <div
                    key={`icon-${index}-${icon}`}
                    className={`icon-option ${
                      newChallenge.icon === icon ? "selected" : ""
                    }`}
                    onClick={() => setNewChallenge({ ...newChallenge, icon })}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div className="color-selector">
              <p>Renk seç:</p>
              <div className="color-grid">
                {colors.map((color, index) => (
                  <div
                    key={`color-${index}-${color}`}
                    className={`color-option ${
                      newChallenge.color === color ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewChallenge({ ...newChallenge, color })}
                  />
                ))}
              </div>
            </div>

            {/* 🆕 SÜRELİK SEÇİCİSİ */}
            <div className="duration-selector">
              <p>Challenge süresi seç:</p>
              <div className="duration-grid">
                {durationOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`duration-option ${
                      newChallenge.duration === option.value ? "selected" : ""
                    }`}
                    onClick={() =>
                      setNewChallenge({
                        ...newChallenge,
                        duration: option.value,
                      })
                    }
                  >
                    <div className="duration-emoji">
                      {option.value === 7 ? "⚡" : "🗓️"}
                    </div>
                    <div className="duration-info">
                      <span className="duration-name">{option.label}</span>
                      <span className="duration-desc">
                        {option.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="difficulty-selector">
              <p>Zorluk seviyesi seç:</p>
              <div className="difficulty-grid">
                {difficultyLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`difficulty-option ${
                      newChallenge.difficulty === level.id ? "selected" : ""
                    }`}
                    style={{
                      "--difficulty-color": level.color,
                    }}
                    onClick={() =>
                      setNewChallenge({ ...newChallenge, difficulty: level.id })
                    }
                  >
                    <div className="difficulty-emoji">{level.emoji}</div>
                    <div className="difficulty-info">
                      <span className="difficulty-name">{level.name}</span>
                      <span className="difficulty-desc">
                        {level.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="description-selector">
              <p>Bu challenge'ı neden yapmak istiyorsun?</p>
              <textarea
                placeholder="Bu deneyimi yapmak isteme sebebin..."
                value={newChallenge.description}
                onChange={(e) =>
                  setNewChallenge({
                    ...newChallenge,
                    description: e.target.value,
                  })
                }
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button onClick={() => setShowForm(false)}>İptal</button>
              <button onClick={addChallenge} className="save-btn">
                Challenge Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="challenges-list">
        {challenges.map((challenge) => (
          <div
            key={`challenge-${challenge.id}`}
            className={`challenge-item ${
              isExpired(challenge) ? "completed" : ""
            } ${challenge.recoveryMode ? "recovery-mode" : ""}`}
            style={{ borderLeft: `4px solid ${challenge.color}` }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowConfirm(challenge.id);
            }}
          >
            <div className="challenge-header">
              <div className="challenge-info">
                <span className="challenge-icon">{challenge.icon}</span>
                <div className="challenge-details">
                  <div className="challenge-title-row">
                    <span className="challenge-name">{challenge.name}</span>
                    <div
                      className="difficulty-badge"
                      style={{
                        "--difficulty-color":
                          difficultyLevels.find(
                            (d) => d.id === challenge.difficulty
                          )?.color || "#667eea",
                      }}
                    >
                      {difficultyLevels.find(
                        (d) => d.id === challenge.difficulty
                      )?.emoji || "🟡"}
                      {difficultyLevels.find(
                        (d) => d.id === challenge.difficulty
                      )?.name || "Orta"}
                    </div>
                  </div>
                  <span className="challenge-status">
                    {getChallengeStatus(challenge)}
                  </span>
                </div>
              </div>
              <div className="challenge-stats">
                <button
                  className="comment-btn"
                  onClick={() => {
                    setShowDescription(challenge);
                    setUpdatedDescription(challenge.description || "");
                  }}
                >
                  💬
                </button>
                <div className="points-display">
                  <span className="current-points">
                    {challenge.currentPoints || 0}
                  </span>
                  <span className="points-separator">/</span>
                  <span className="total-points">
                    {challenge.totalPossiblePoints ||
                      (challenge.duration || 30) * 2}
                  </span>
                  <span className="points-label">puan</span>
                </div>
                {challenge.missedDays > 0 && (
                  <div className="penalty-stats">
                    <span className="missed-days">
                      😢 {challenge.missedDays}
                    </span>
                  </div>
                )}
                <div className="progress-container">
                  <div
                    className={getProgressClass(
                      getCompletionPercentage(challenge)
                    )}
                    style={{
                      "--progress": `${getCompletionPercentage(challenge)}%`,
                      "--difficulty-color":
                        difficultyLevels.find(
                          (d) => d.id === challenge.difficulty
                        )?.color || "#667eea",
                    }}
                  >
                    <div className="progress-fill"></div>
                    <div className="progress-percentage">
                      {getCompletionPercentage(challenge)}%
                    </div>
                    {getCompletionPercentage(challenge) >= 25 && (
                      <div className="milestone-indicator">
                        {getCompletionPercentage(challenge) >= 95
                          ? "🏆"
                          : getCompletionPercentage(challenge) >= 75
                          ? "🔥"
                          : getCompletionPercentage(challenge) >= 50
                          ? "⭐"
                          : "🌟"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="completed-count">
                  {challenge.completedDays || 0}/{challenge.duration || 30}
                </div>
              </div>
            </div>

            {challenge.recoveryMode && (
              <div className="recovery-notification">
                🔄 <strong>Recovery Mode:</strong> Bugün tamamlarsan çift puan
                kazanırsın!
              </div>
            )}

            <div className="monthly-progress">
              {getProgressBoxes(challenge).map((box, index) => (
                <div
                  key={`${challenge.id}-day-${box.dayNumber}-${index}`}
                  className={`day-box ${box.isCompleted ? "completed" : ""} ${
                    box.isCurrent ? "current" : ""
                  } ${box.isFuture ? "future" : ""} ${
                    box.isPast ? "past" : ""
                  } ${box.isMissed ? "missed" : ""}`}
                  onDoubleClick={() =>
                    box.canToggle && toggleDay(challenge, index)
                  }
                  style={{ cursor: box.canToggle ? "pointer" : "default" }}
                >
                  <span className="day-date">{box.date}</span>
                  <span className="day-status">
                    {box.isCompleted ? "✓" : box.isMissed ? "✗" : "○"}
                  </span>
                </div>
              ))}
            </div>

            {/* 🆕 EXTEND BUTONU */}
            {canExtend(challenge) && (
              <div className="extend-notification">
                <p>
                  🎉 1 haftalık challenge'ı tamamladın! Daha da ilerlemek ister
                  misin?
                </p>
                <button
                  className="extend-btn"
                  onClick={() => extendChallenge(challenge)}
                >
                  📈 1 Aya Uzat (Progress korunur)
                </button>
              </div>
            )}

            {isExpired(challenge) && !canExtend(challenge) && (
              <div className="challenge-completed-badge">
                🎉 Challenge Tamamlandı!
                <span>
                  ({challenge.completedDays || 0}/{challenge.duration || 30} gün
                  tamamlandı)
                </span>
                {challenge.missedDays > 0 && (
                  <span className="penalty-summary">
                    {" "}
                    - {challenge.missedDays} gün kaçırıldı
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="empty-state">
          <h3>🎯 Henüz challenge'ın yok</h3>
          <p>İlk challenge'ını oluştur ve yeni bir deneyime başla!</p>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <p>Bu challenge'ı silmek istediğinize emin misiniz?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowConfirm(null)}>İptal</button>
              <button
                onClick={() => deleteChallenge(showConfirm)}
                className="delete-confirm"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {showDescription && (
        <div
          className="description-modal-overlay"
          onClick={() => setShowDescription(null)}
        >
          <div
            className="description-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {showDescription.icon} {showDescription.name}
            </h3>
            <div className="description-content">
              <textarea
                value={updatedDescription}
                onChange={(e) => setUpdatedDescription(e.target.value)}
                placeholder="Challenge açıklaması..."
                rows="5"
              />
            </div>
            <div className="description-actions">
              <button onClick={() => setShowDescription(null)}>İptal</button>
              <button
                className="update-btn"
                onClick={() => updateDescription(showDescription.id)}
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tatakae;
