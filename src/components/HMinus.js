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
import "./HMinus.css";

function HMinus({ soundEnabled }) {
  const [badHabits, setBadHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newBadHabit, setNewBadHabit] = useState({
    name: "",
    icon: "🚫",
    color: "#ff6b6b",
    description: "",
    difficulty: "medium",
    duration: 30,
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  
  // 🆕 YENİ STATE'LER
  const [showHistory, setShowHistory] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [completedBadHabits, setCompletedBadHabits] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [historyStats, setHistoryStats] = useState({
    totalCompleted: 0,
    totalCleanDays: 0,
    averageSuccess: 0,
    longestStreak: 0,
    totalRelapses: 0
  });
  
  // 🎊 CELEBRATIONS STATE
  const [confetti, setConfetti] = useState([]);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [achievementModal, setAchievementModal] = useState(null);

  const difficultyLevels = React.useMemo(() => [
    { 
      id: 'easy', 
      name: 'Kolay Bırakılır', 
      emoji: '🟢', 
      pointsPerDay: 1, 
      color: '#43e97b',
      description: '1 puan/gün - Hafif bağımlılık',
      penalty: 3
    },
    { 
      id: 'medium', 
      name: 'Orta Zorluk', 
      emoji: '🟡', 
      pointsPerDay: 2, 
      color: '#feca57',
      description: '2 puan/gün - Orta bağımlılık',
      penalty: 5
    },
    { 
      id: 'hard', 
      name: 'Çok Zor Bırakılır', 
      emoji: '🔴', 
      pointsPerDay: 3, 
      color: '#ff6b6b',
      description: '3 puan/gün - Ağır bağımlılık',
      penalty: 10
    }
  ], []);

  const durationOptions = [
    { value: 7, label: "1 Hafta", days: 7, description: "Kısa süreli deneme" },
    { value: 30, label: "1 Ay", days: 30, description: "Kalıcı değişim" }
  ];

  const icons = [
    "🚫", "🚬", "🍺", "🍔", "📱", "🎮", "💸", "😴", "🍿", "☕",
    "🍰", "🛒", "📺", "💻", "🍕", "🥤", "🍷", "🎲", "💊", "🔥",
    "⚡", "💀", "🌪️", "🗯️", "💥", "❌", "⛔", "🆘", "⚠️", "🔞"
  ];

  const colors = [
    "#ff6b6b", "#ee5a6f", "#ff7675", "#fd79a8", "#e84393", "#a29bfe", 
    "#6c5ce7", "#74b9ff", "#0984e3", "#00b894", "#00cec9", "#fdcb6e"
  ];

  // 🆕 HEATMAP DATA GENERATOR
  const generateHeatmapData = useCallback((allBadHabits) => {
    const data = [];
    const today = new Date();

    // Son 12 hafta (84 gün)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      let cleanCount = 0;
      let relapseCount = 0;
      let totalHabits = 0;

      allBadHabits.forEach((habit) => {
        const startDate = new Date(habit.startDate + "T00:00:00");
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const duration = habit.duration || 30;

        if (daysDiff >= 0 && daysDiff < duration) {
          totalHabits++;
          const progress = habit.monthlyProgress || [];
          if (progress[daysDiff] === true) {
            cleanCount++;
          } else if (progress[daysDiff] === false) {
            relapseCount++;
          }
        }
      });

      data.push({
        date: date.toISOString().split("T")[0],
        clean: cleanCount,
        relapse: relapseCount,
        total: totalHabits,
        level: totalHabits === 0 ? 0 : Math.min(Math.ceil((cleanCount / totalHabits) * 4), 4),
        dayName: date.toLocaleDateString("tr-TR", { weekday: "short" }),
        fullDate: date.toLocaleDateString("tr-TR"),
      });
    }

    setHeatmapData(data);
  }, []);

  // 🆕 HISTORY STATS CALCULATOR
  const calculateHistoryStats = useCallback((completed) => {
    if (completed.length === 0) {
      setHistoryStats({
        totalCompleted: 0,
        totalCleanDays: 0,
        averageSuccess: 0,
        longestStreak: 0,
        totalRelapses: 0
      });
      return;
    }

    const totalCompleted = completed.length;
    const totalCleanDays = completed.reduce((sum, h) => sum + (h.cleanDays || 0), 0);
    const totalRelapses = completed.reduce((sum, h) => sum + (h.relapseCount || 0), 0);
    const totalPossibleDays = completed.reduce((sum, h) => sum + (h.duration || 30), 0);
    const averageSuccess = Math.round((totalCleanDays / totalPossibleDays) * 100);

    let longestStreak = 0;
    completed.forEach((habit) => {
      longestStreak = Math.max(longestStreak, habit.longestStreak || 0);
    });

    setHistoryStats({
      totalCompleted,
      totalCleanDays,
      averageSuccess,
      longestStreak,
      totalRelapses
    });
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "h-minus"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBadHabits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      allBadHabits.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });
      
      const active = allBadHabits.filter(h => getDaysSinceStart(h.startDate) < (h.duration || 30));
      const completed = allBadHabits.filter(h => getDaysSinceStart(h.startDate) >= (h.duration || 30));
      
      setBadHabits(active);
      setCompletedBadHabits(completed);
      calculateHistoryStats(completed);
      generateHeatmapData(allBadHabits);
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
        color: ['#43e97b', '#00b894', '#00cec9', '#74b9ff', '#0984e3'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 4 + 3,
        gravity: 0.1,
      });
    }
    setConfetti(newConfetti);

    const interval = setInterval(() => {
      setConfetti(prev => 
        prev.map(piece => ({
          ...piece,
          x: piece.x + piece.speedX,
          y: piece.y + piece.speedY,
          speedY: piece.speedY + piece.gravity,
          rotation: piece.rotation + 8,
        })).filter(piece => piece.y < window.innerHeight + 50)
      );
    }, 16);

    setTimeout(() => {
      clearInterval(interval);
      setConfetti([]);
    }, 4000);
  }, []);

  // 🌟 PARTICLE EFFECTS SYSTEM
  const createParticles = useCallback((x, y, type = 'star') => {
    const newParticles = [];
    const particleCount = type === 'heart' ? 15 : 25;
    
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
        color: type === 'clean' ? '#43e97b' : '#ff6b6b',
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1,
          life: particle.life - particle.decay,
        })).filter(particle => particle.life > 0)
      );
    }, 16);

    setTimeout(() => {
      clearInterval(interval);
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 2000);
  }, []);

  const getDaysSinceStart = (startDate) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getProgressBoxes = (badHabit) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || 30;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const progress = badHabit.monthlyProgress || Array(duration).fill(false);
    
    const startDate = new Date(badHabit.startDate + 'T00:00:00');
    const dayNames = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
    
    return Array.from({ length: duration }, (_, index) => {
      const dayNumber = index + 1;
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      
      const isClean = progress[index];
      const isRelapse = progress[index] === false && index < daysSinceStart;
      const isCurrent = dayNumber === currentDay && daysSinceStart < duration;
      const isPast = dayNumber < currentDay;
      const isFuture = dayNumber > currentDay;
      
      return {
        dayNumber,
        date: currentDate.getDate(),
        dayName: dayNames[currentDate.getDay()],
        isClean,
        isRelapse,
        isCurrent,
        isPast,
        isFuture,
        canToggle: isCurrent && !isPast
      };
    });
  };

  const addBadHabit = async () => {
    if (!newBadHabit.name.trim()) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const startDate = `${year}-${month}-${day}`;

    const selectedDifficulty = difficultyLevels.find(d => d.id === newBadHabit.difficulty);
    const duration = newBadHabit.duration;

    await addDoc(collection(db, "h-minus"), {
      ...newBadHabit,
      startDate: startDate,
      difficulty: newBadHabit.difficulty,
      duration: duration,
      pointsPerDay: selectedDifficulty.pointsPerDay,
      totalPossiblePoints: selectedDifficulty.pointsPerDay * duration,
      currentPoints: 0,
      userId: auth.currentUser.uid,
      monthlyProgress: Array(duration).fill(null),
      cleanDays: 0,
      relapseCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: new Date(),
    });

    setNewBadHabit({
      name: "",
      icon: "🚫",
      color: "#ff6b6b",
      description: "",
      difficulty: "medium",
      duration: 30,
    });
    setShowForm(false);
  };

  const toggleDay = async (badHabit, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || 30;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;
    
    if (dayNumber !== currentDay || daysSinceStart >= duration) return;

    const newProgress = [...(badHabit.monthlyProgress || Array(duration).fill(null))];
    const currentState = newProgress[dayIndex];
    
    let newState;
    if (currentState === null) {
      newState = true;
    } else if (currentState === true) {
      newState = false;
    } else {
      newState = true;
    }
    
    newProgress[dayIndex] = newState;
    
    const cleanDays = newProgress.filter(day => day === true).length;
    const relapseCount = newProgress.filter(day => day === false).length;
    
    let currentStreak = 0;
    for (let i = dayIndex; i >= 0; i--) {
      if (newProgress[i] === true) {
        currentStreak++;
      } else if (newProgress[i] === false) {
        break;
      }
    }
    
    const longestStreak = Math.max(badHabit.longestStreak || 0, currentStreak);
    
    const difficulty = difficultyLevels.find(d => d.id === badHabit.difficulty);
    const pointsPerDay = difficulty?.pointsPerDay || 1;
    const penaltyPoints = difficulty?.penalty || 3;
    
    let currentPoints = badHabit.currentPoints || 0;
    
    if (currentState === null && newState === true) {
      currentPoints += pointsPerDay;
    } else if (currentState === true && newState === false) {
      currentPoints = Math.max(0, currentPoints - penaltyPoints);
    } else if (currentState === false && newState === true) {
      currentPoints += pointsPerDay;
    }

    await updateDoc(doc(db, "h-minus", badHabit.id), {
      monthlyProgress: newProgress,
      cleanDays: cleanDays,
      relapseCount: relapseCount,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      currentPoints: Math.max(0, currentPoints),
      lastUpdated: new Date(),
    });

    if (newState === true && soundEnabled) {
      const event = window.event;
      if (event) {
        createParticles(event.clientX, event.clientY, 'clean');
      }
      
      window.playSound && window.playSound('complete');
      
      if (currentStreak === 7) {
        window.playSound && window.playSound('milestone25');
      } else if (currentStreak === 30) {
        createConfetti();
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
        
        setAchievementModal({
          title: "🏆 1 AY TEMİZ!",
          subtitle: `${badHabit.name} yapmayarak müthiş bir başarı!`,
          icon: badHabit.icon,
          color: '#43e97b',
          stats: {
            cleanDays: cleanDays,
            currentStreak: currentStreak,
            successRate: Math.round((cleanDays / (cleanDays + relapseCount || 1)) * 100)
          }
        });
        
        window.playSound && window.playSound('milestone100');
      }
    } else if (newState === false) {
      if (window.event) {
        createParticles(window.event.clientX, window.event.clientY, 'relapse');
      }
    }
  };

  const deleteBadHabit = async (id) => {
    await deleteDoc(doc(db, "h-minus", id));
    setShowConfirm(null);
  };

  const updateDescription = async (badHabitId) => {
    await updateDoc(doc(db, "h-minus", badHabitId), {
      description: updatedDescription,
    });
    setShowDescription(null);
    setUpdatedDescription("");
  };

  const getSuccessPercentage = (badHabit) => {
    const cleanDays = badHabit.cleanDays || 0;
    const relapseCount = badHabit.relapseCount || 0;
    const totalDays = cleanDays + relapseCount;
    return totalDays ? Math.round((cleanDays / totalDays) * 100) : 0;
  };

  // 🆕 DUZENLENMIŞ STATUS FUNCTION
  const getBadHabitStatus = (badHabit) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || 30;
    const currentStreak = badHabit.currentStreak || 0;
    const relapseCount = badHabit.relapseCount || 0;
    
    if (daysSinceStart >= duration) return "Program Tamamlandı";
    if (daysSinceStart < 0) return "Başlamadı";
    
    if (currentStreak === 0 && relapseCount > 0) {
      return `${daysSinceStart + 1}. Gün - 💪 Tekrar Temiz Kalma Zamanı`;
    } else if (currentStreak === 0) {
      return `${daysSinceStart + 1}. Gün - 🌱 Temiz Kalma Başlasın`;
    }
    
    return `${daysSinceStart + 1}. Gün - 🧹 ${currentStreak} gün temiz`;
  };

  const isExpired = (badHabit) => {
    const duration = badHabit.duration || 30;
    return getDaysSinceStart(badHabit.startDate) >= duration;
  };

  // 🆕 EXPORT HEATMAP DATA
  const exportHeatmapData = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Clean Days,Relapse Days,Total,Success Rate\n" +
      heatmapData.map(day => 
        `${day.date},${day.clean},${day.relapse},${day.total},${day.total ? ((day.clean / day.total) * 100).toFixed(1) : 0}%`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "h_minus_heatmap_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`h-minus-container ${screenShake ? 'screen-shake' : ''}`}>
      {/* CONFETTI & PARTICLES OVERLAYS */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map(piece => (
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

      {particles.length > 0 && (
        <div className="particles-container">
          {particles.map(particle => (
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
              {particle.type === 'clean' ? '🧹' : '💥'}
            </div>
          ))}
        </div>
      )}

      {/* ACHIEVEMENT MODAL */}
      {achievementModal && (
        <div className="achievement-modal-overlay" onClick={() => setAchievementModal(null)}>
          <div className="achievement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="achievement-header">
              <div className="achievement-icon" style={{ color: achievementModal.color }}>
                {achievementModal.icon}
              </div>
              <h2>{achievementModal.title}</h2>
              <p>{achievementModal.subtitle}</p>
            </div>
            <div className="achievement-stats">
              <div className="stat-item">
                <span className="stat-value">{achievementModal.stats.cleanDays}</span>
                <span className="stat-label">Temiz Gün</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{achievementModal.stats.currentStreak}</span>
                <span className="stat-label">Şu Anki Streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{achievementModal.stats.successRate}%</span>
                <span className="stat-label">Başarı Oranı</span>
              </div>
            </div>
            <button className="achievement-close-btn" onClick={() => setAchievementModal(null)}>
              Devam Et 🎉
            </button>
          </div>
        </div>
      )}

      <div className="h-minus-header">
        <h1>🚫 H- (HABIT MINUS)</h1>
        <p>Bırakmak istediğin kötü alışkanlıkları takip et!</p>

        {/* 🆕 HEADER BUTTONS */}
        <div className="header-buttons">
          <button
            className="header-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            📊 {showHeatmap ? 'Gizle' : 'Aktivite Haritası'}
          </button>
          <button
            className="header-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            📚 {showHistory ? 'Gizle' : 'Geçmiş'}
          </button>
        </div>
      </div>

      {/* 🆕 HEATMAP SECTION */}
      {showHeatmap && (
        <div className="heatmap-section">
          <div className="heatmap-header">
            <h3>📊 Temiz Kalma Haritası (Son 12 Hafta)</h3>
            <button className="export-btn" onClick={exportHeatmapData}>
              📤 Dışa Aktar
            </button>
          </div>
          <div className="heatmap-container">
            <div className="heatmap-grid">
              {heatmapData.map((day, index) => (
                <div
                  key={day.date}
                  className={`heatmap-day ${day.relapse > 0 ? 'relapse-day' : `clean-level-${day.level}`}`}
                  title={`${day.fullDate} - ${day.clean} temiz, ${day.relapse} relapse`}
                >
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Relapse</span>
              <div className="legend-squares">
                <div className="legend-square relapse-day"></div>
                <div className="legend-square clean-level-0"></div>
                <div className="legend-square clean-level-1"></div>
                <div className="legend-square clean-level-2"></div>
                <div className="legend-square clean-level-3"></div>
                <div className="legend-square clean-level-4"></div>
              </div>
              <span>Çok Temiz</span>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 HISTORY SECTION */}
      {showHistory && (
        <div className="history-section">
          <div className="history-header">
            <h3>📚 H- Geçmişi</h3>
            <div className="history-stats">
              <div className="history-stat">
                <span className="stat-number">{historyStats.totalCompleted}</span>
                <span className="stat-text">Tamamlanan</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">{historyStats.totalCleanDays}</span>
                <span className="stat-text">Toplam Temiz Gün</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">{historyStats.averageSuccess}%</span>
                <span className="stat-text">Ortalama Başarı</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">{historyStats.longestStreak}</span>
                <span className="stat-text">En Uzun Streak</span>
              </div>
              <div className="history-stat">
                <span className="stat-number">{historyStats.totalRelapses}</span>
                <span className="stat-text">Toplam Relapse</span>
              </div>
            </div>
          </div>

          <div className="completed-bad-habits-list">
            {completedBadHabits.length === 0 ? (
              <div className="no-history">
                <p>🚫 Henüz tamamlanmış H- takibi yok</p>
                <p>İlk kötü alışkanlığını bırakma programını tamamla!</p>
              </div>
            ) : (
              completedBadHabits.map((habit) => (
                <div key={habit.id} className="completed-habit-item">
                  <div className="completed-habit-header">
                    <span className="completed-habit-icon">{habit.icon}</span>
                    <div className="completed-habit-info">
                      <h4>{habit.name}</h4>
                      <p>
                        {habit.cleanDays || 0} temiz gün, {habit.relapseCount || 0} relapse •{" "}
                        {Math.round(((habit.cleanDays || 0) / ((habit.cleanDays || 0) + (habit.relapseCount || 0) || 1)) * 100)}% başarı
                      </p>
                      <small>
                        Tamamlandı: {new Date(habit.startDate).toLocaleDateString("tr-TR")}
                      </small>
                    </div>
                  </div>
                  <div className="completed-habit-progress">
                    {(habit.monthlyProgress || Array(habit.duration || 30).fill(false)).map((day, index) => (
                      <div
                        key={index}
                        className={`mini-day ${day === true ? "clean" : day === false ? "relapse" : "skipped"}`}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button className="add-bad-habit-btn" onClick={() => setShowForm(true)}>
        <span>+</span> Yeni Kötü Alışkanlık Ekle
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bad-habit-form" onClick={(e) => e.stopPropagation()}>
            <h3>Bırakmak İstediğin Alışkanlık</h3>
            <p style={{textAlign: 'center', color: 'rgba(204, 201, 220, 0.7)', fontSize: '14px', marginBottom: '20px'}}>
              Bu alışkanlığı bırakma yolculuğun bugün başlıyor!
            </p>

            <input
              type="text"
              placeholder="Kötü alışkanlık adı... (ör: Sigara, Sosyal Medya, Abur Cubur)"
              value={newBadHabit.name}
              onChange={(e) =>
                setNewBadHabit({ ...newBadHabit, name: e.target.value })
              }
            />

            <div className="icon-selector">
              <p>İkon seç:</p>
              <div className="icon-grid">
                {icons.map((icon, index) => (
                  <div
                    key={`icon-${index}-${icon}`}
                    className={`icon-option ${
                      newBadHabit.icon === icon ? "selected" : ""
                    }`}
                    onClick={() => setNewBadHabit({ ...newBadHabit, icon })}
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
                      newBadHabit.color === color ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewBadHabit({ ...newBadHabit, color })}
                  />
                ))}
              </div>
            </div>

            <div className="duration-selector">
              <p>Takip süresi seç:</p>
              <div className="duration-grid">
                {durationOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`duration-option ${
                      newBadHabit.duration === option.value ? "selected" : ""
                    }`}
                    onClick={() => setNewBadHabit({ ...newBadHabit, duration: option.value })}
                  >
                    <div className="duration-emoji">
                      {option.value === 7 ? "⚡" : "🗓️"}
                    </div>
                    <div className="duration-info">
                      <span className="duration-name">{option.label}</span>
                      <span className="duration-desc">{option.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="difficulty-selector">
              <p>Bırakma zorluğu:</p>
              <div className="difficulty-grid">
                {difficultyLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`difficulty-option ${
                      newBadHabit.difficulty === level.id ? "selected" : ""
                    }`}
                    style={{
                      '--difficulty-color': level.color
                    }}
                    onClick={() => setNewBadHabit({ ...newBadHabit, difficulty: level.id })}
                  >
                    <div className="difficulty-emoji">{level.emoji}</div>
                    <div className="difficulty-info">
                      <span className="difficulty-name">{level.name}</span>
                      <span className="difficulty-desc">{level.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="description-selector">
              <p>Neden bu alışkanlığı bırakmak istiyorsun?</p>
              <textarea
                placeholder="Bu alışkanlığı bırakma sebebin..."
                value={newBadHabit.description}
                onChange={(e) =>
                  setNewBadHabit({ ...newBadHabit, description: e.target.value })
                }
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button onClick={() => setShowForm(false)}>İptal</button>
              <button onClick={addBadHabit} className="save-btn">
                Takibe Başla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bad Habits List */}
      <div className="bad-habits-list">
        {badHabits.map((badHabit) => (
          <div
            key={`bad-habit-${badHabit.id}`}
            className={`bad-habit-item ${isExpired(badHabit) ? 'completed' : ''}`}
            style={{ borderLeft: `4px solid ${badHabit.color}` }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowConfirm(badHabit.id);
            }}
          >
            <div className="bad-habit-header">
              <div className="bad-habit-info">
                <span className="bad-habit-icon">{badHabit.icon}</span>
                <div className="bad-habit-details">
                  <div className="bad-habit-title-row">
                    <span className="bad-habit-name">{badHabit.name}</span>
                    <div className="difficulty-badge" style={{
                      '--difficulty-color': difficultyLevels.find(d => d.id === badHabit.difficulty)?.color || '#ff6b6b'
                    }}>
                      {difficultyLevels.find(d => d.id === badHabit.difficulty)?.emoji || '🔴'}
                      {difficultyLevels.find(d => d.id === badHabit.difficulty)?.name || 'Orta'}
                    </div>
                  </div>
                  <span className="bad-habit-status">
                    {getBadHabitStatus(badHabit)}
                  </span>
                </div>
              </div>
              <div className="bad-habit-stats">
                <button
                  className="comment-btn"
                  onClick={() => {
                    setShowDescription(badHabit);
                    setUpdatedDescription(badHabit.description || "");
                  }}
                >
                  💬
                </button>
                <div className="points-display">
                  <span className="current-points">{badHabit.currentPoints || 0}</span>
                  <span className="points-label">puan</span>
                </div>
                <div className="streak-display">
                  <span className="current-streak">🧹 {badHabit.currentStreak || 0}</span>
                  <span className="longest-streak">📈 {badHabit.longestStreak || 0}</span>
                </div>
                <div className="success-rate">
                  {getSuccessPercentage(badHabit)}% temiz
                </div>
              </div>
            </div>

            <div className="monthly-progress">
              {getProgressBoxes(badHabit).map((box, index) => (
                <div
                  key={`${badHabit.id}-day-${box.dayNumber}-${index}`}
                  className={`day-box ${box.isClean ? "clean" : ""} ${
                    box.isRelapse ? "relapse" : ""
                  } ${box.isCurrent ? "current" : ""} ${
                    box.isFuture ? "future" : ""
                  } ${box.isPast ? "past" : ""}`}
                  onDoubleClick={() => box.canToggle && toggleDay(badHabit, index)}
                  style={{ cursor: box.canToggle ? 'pointer' : 'default' }}
                >
                  <span className="day-date">{box.date}</span>
                  <span className="day-status">
                    {box.isClean ? "✓" : box.isRelapse ? "✗" : "○"}
                  </span>
                </div>
              ))}
            </div>

            {isExpired(badHabit) && (
              <div className="bad-habit-completed-badge">
                🎉 Takip Programı Tamamlandı! 
                <span>({badHabit.cleanDays || 0} temiz gün, {badHabit.relapseCount || 0} relapse)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {badHabits.length === 0 && (
        <div className="empty-state">
          <h3>🚫 Henüz takip ettiğin kötü alışkanlık yok</h3>
          <p>Bırakmak istediğin ilk alışkanlığı ekle ve temiz yaşama başla!</p>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <p>Bu kötü alışkanlık takibini silmek istediğinize emin misiniz?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowConfirm(null)}>İptal</button>
              <button
                onClick={() => deleteBadHabit(showConfirm)}
                className="delete-confirm"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
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
                placeholder="Bırakma sebebi..."
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

export default HMinus;