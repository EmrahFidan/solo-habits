import React, { useState, useEffect, useCallback } from "react";
import { 
  getDaysSinceStart as getDaysSinceStartUtil,
  formatDateYmd as formatDateYmdUtil,
  getProgressClass as getProgressClassUtil,
  getDiamondClass as getDiamondClassUtil
} from "../utils/habits";
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
// import "./SettingsStyles.css"; // removed unused shared styles
import "./Itera.css";

function Itera({ soundEnabled, developerMode = false, onHeaderClick }) {
  const [challenges, setChallenges] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    icon: "🎯",
    color: "#ec911aff",
    description: "",
    duration: 7,
    bundlePartner: "", // Temptation Bundling için
    selectedDays: [], // Haftanın hangi günleri seçildiği
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  // Stack chain özelliği kaldırıldı

  // 🎊 ANIMATED CELEBRATIONS STATE
  const [confetti, setConfetti] = useState([]);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [achievementModal, setAchievementModal] = useState(null);


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

    useEffect(() => {
    if (!auth.currentUser) return;

    const getDaysSinceStartLocal = (startDate) => {
      if (!startDate) return 0;
      const start = new Date(startDate + "T00:00:00");
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today - start;
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDateYmdLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const getCycleInfoLocal = (challenge) => {
      const duration = challenge.duration || 30;
      const daysSinceStart = getDaysSinceStartLocal(challenge.startDate);
      const cycleIndex = daysSinceStart % duration;
      const cycleStartDate = new Date(challenge.startDate + "T00:00:00");
      cycleStartDate.setHours(0, 0, 0, 0);
      cycleStartDate.setDate(
        cycleStartDate.getDate() + (daysSinceStart - cycleIndex)
      );
      const cycleStartString = formatDateYmdLocal(cycleStartDate);
      return { cycleIndex, cycleStartDate, cycleStartString };
    };

    const q = query(
      collection(db, "itera"),
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

      // Keep weekly recurring challenges always visible; others only while active
      const filtered = allChallenges.filter((challenge) => {
        const duration = challenge.duration || 30;
        const isWeekly = challenge.repeat === "weekly" || duration === 7;
        if (isWeekly) return true;
        return getDaysSinceStartLocal(challenge.startDate) < duration;
      });

      // Auto-reset weekly challenges at the start of each new cycle
      filtered.forEach((challenge) => {
        const duration = challenge.duration || 30;
        const isWeekly = challenge.repeat === "weekly" || duration === 7;
        if (!isWeekly) return;

        const { cycleStartString } = getCycleInfoLocal(challenge);
        if (challenge.currentCycleStart !== cycleStartString) {
          // Reset progress for the new week
          updateDoc(doc(db, "itera", challenge.id), {
            monthlyProgress: Array(duration).fill(false),
            completedDays: 0,
            consecutiveMissed: 0,
            recoveryMode: false,
            currentCycleStart: cycleStartString,
            lastUpdated: new Date(),
          });
        }
      });

      setChallenges(filtered);
    });
    return unsubscribe;
  }, []);

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
            vy: particle.vy + 0.1,
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

  

  const getDaysSinceStart = useCallback((startDate) => getDaysSinceStartUtil(startDate), []);

  const isWeeklyRecurring = useCallback((challenge) => {
    const duration = challenge.duration || 30;
    return challenge.repeat === "weekly" || duration === 7;
  }, []);

  const formatDateYmd = (date) => formatDateYmdUtil(date);

  const getCycleInfo = useCallback((challenge) => {
    const duration = challenge.duration || 30;
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const cycleIndex = daysSinceStart % duration;
    const cycleStartDate = new Date(challenge.startDate + "T00:00:00");
    cycleStartDate.setHours(0, 0, 0, 0);
    cycleStartDate.setDate(cycleStartDate.getDate() + (daysSinceStart - cycleIndex));
    const cycleStartString = formatDateYmd(cycleStartDate);
    return { cycleIndex, cycleStartDate, cycleStartString };
  }, [getDaysSinceStart]);

  const getProgressBoxes = (challenge) => {
    const duration = challenge.duration || 30;
    const progress = challenge.monthlyProgress || Array(duration).fill(false);

    const weekly = isWeeklyRecurring(challenge);
    const { cycleIndex, cycleStartDate } = weekly
      ? getCycleInfo(challenge)
      : { cycleIndex: null, cycleStartDate: new Date(challenge.startDate + "T00:00:00") };

    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const currentDay = weekly
      ? cycleIndex + 1
      : Math.min(daysSinceStart + 1, duration);

    const startDate = cycleStartDate;
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const selectedDays = challenge.selectedDays || [0, 1, 2, 3, 4, 5, 6]; // Tüm günler default

    const boxes = [];
    for (let index = 0; index < duration; index++) {
      const dayNumber = index + 1;
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      const dayOfWeek = currentDate.getDay();
      
      // Sadece seçili günleri göster
      if (!selectedDays.includes(dayOfWeek)) {
        continue; // Bu günü atla
      }
      
      const isCompleted = progress[index];
      const isCurrent = dayNumber === currentDay;
      const isPast = dayNumber < currentDay;
      const isFuture = dayNumber > currentDay;
      const isMissed = isPast && !isCompleted;
      
      boxes.push({
        dayNumber,
        date: `${dayNames[dayOfWeek]} ${currentDate.getDate()}`, // Gün kısaltması + tarih
        dayName: dayNames[dayOfWeek],
        isCompleted,
        isCurrent,
        isPast,
        isFuture,
        isMissed,
        canToggle: developerMode || isCurrent,
      });
    }
    
    return boxes;
  };

  const addChallenge = async () => {
    if (!newChallenge.name.trim()) return;
    
    if (!auth.currentUser) {
      alert("Lütfen önce giriş yapın!");
      return;
    }

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const startDate = `${year}-${month}-${day}`;

      const duration = newChallenge.duration;
      const isWeekly = duration === 7;
      const cycleStartDate = new Date(startDate + "T00:00:00");
      const cycleStartString = formatDateYmd(cycleStartDate);

      await addDoc(collection(db, "itera"), {
        ...newChallenge,
        startDate: startDate,
        duration: duration,
        userId: auth.currentUser.uid,
        monthlyProgress: Array(duration).fill(false),
        completedDays: 0,
        missedDays: 0,
        consecutiveMissed: 0,
        recoveryMode: false,
        repeat: isWeekly ? "weekly" : undefined,
        currentCycleStart: isWeekly ? cycleStartString : undefined,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Challenge ekleme hatası:", error);
      alert("Challenge eklenirken bir hata oluştu: " + error.message);
      return;
    }

    setNewChallenge({
      name: "",
      icon: "🎯",
      color: "#667eea",
      description: "",
      duration: 7,
      bundlePartner: "", // Bundle partner'ı da temizle
      selectedDays: [], // Seçilen günleri de temizle
    });
    setShowForm(false);
  };



  const toggleDay = async (challenge, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;
    const isWeekly = isWeeklyRecurring(challenge);
    const currentDay = isWeekly
      ? getCycleInfo(challenge).cycleIndex + 1
      : Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;

    if (!developerMode) {
      if (isWeekly) {
        if (dayNumber !== currentDay) return;
      } else {
        if (dayNumber !== currentDay || daysSinceStart >= duration) return;
      }
    }

    const newProgress = [
      ...(challenge.monthlyProgress || Array(duration).fill(false)),
    ];
    const wasCompleted = newProgress[dayIndex];
    newProgress[dayIndex] = !newProgress[dayIndex];

    const completedDays = newProgress.filter((day) => day).length;
    const newPercentage = Math.round((completedDays / duration) * 100);
    const newConsecutiveMissed = newProgress[dayIndex]
      ? 0
      : challenge.consecutiveMissed || 0;
    const newRecoveryMode = newConsecutiveMissed >= 2;

    await updateDoc(doc(db, "itera", challenge.id), {
      monthlyProgress: newProgress,
      completedDays: completedDays,
      consecutiveMissed: newConsecutiveMissed,
      recoveryMode: newRecoveryMode,
      lastUpdated: new Date(),
    });


    // 30 günlük challenge tamamlandıysa aylık rozet ekle
    if (duration === 30 && daysSinceStart >= 29 && newPercentage === 100) {
      const newMonthsCompleted = (challenge.monthsCompleted || 0) + 1;
      await updateDoc(doc(db, "itera", challenge.id), {
        monthsCompleted: newMonthsCompleted,
      });
    }

    if (!wasCompleted && newProgress[dayIndex] && soundEnabled) {
      const event = window.event;
      if (event) {
        createParticles(event.clientX, event.clientY, "star");
      }

      if (challenge.recoveryMode) {
        window.playSound && window.playSound("milestone50");
      } else {
        window.playSound && window.playSound("complete");
      }

      setTimeout(() => {
        if (newPercentage === 100) {
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
              successRate: Math.round((completedDays / duration) * 100),
            },
          });

          window.playSound && window.playSound("milestone100");
        } else if (newPercentage === 75) {
          createParticles(
            window.innerWidth / 2,
            window.innerHeight / 2,
            "heart"
          );
          window.playSound && window.playSound("milestone75");
        } else if (newPercentage === 50) {
          window.playSound && window.playSound("milestone50");
        } else if (newPercentage === 25) {
          window.playSound && window.playSound("milestone25");
        }
      }, 300);
    }
  };

  const deleteChallenge = async (id) => {
    await deleteDoc(doc(db, "itera", id));
    setShowConfirm(null);
  };

  const updateDescription = async (challengeId) => {
    await updateDoc(doc(db, "itera", challengeId), {
      description: updatedDescription,
    });
    setShowDescription(null);
    setUpdatedDescription("");
  };

  // Stack chain fonksiyonları kaldırıldı

  const getCompletionPercentage = (challenge) => {
    const completed = challenge.completedDays || 0;
    const duration = challenge.duration || 30;
    return Math.round((completed / duration) * 100);
  };

  const getProgressClass = (percentage) => getProgressClassUtil(percentage);

  const getChallengeStatus = (challenge) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;
    if (isWeeklyRecurring(challenge)) {
      const { cycleIndex } = getCycleInfo(challenge);
      return `Haftalık - ${cycleIndex + 1}. Gün`;
    }
    if (daysSinceStart >= duration) return "Tamamlandı";
    if (daysSinceStart < 0) return "Başlamadı";

    if (challenge.recoveryMode) {
      return `${daysSinceStart + 1}. Gün - 🔄 Recovery`;
    }

    return `${daysSinceStart + 1}. Gün`;
  };

  const isExpired = (challenge) => {
    const duration = challenge.duration || 30;
    if (isWeeklyRecurring(challenge)) return false;
    return getDaysSinceStart(challenge.startDate) >= duration;
  };

  const getDiamondClass = (monthsCompleted) => getDiamondClassUtil(monthsCompleted);

  return (
    <div className={`itera-container ${screenShake ? "screen-shake" : ""}`}>
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
                  {achievementModal.stats.successRate}%
                </span>
                <span className="stat-label">Başarı Oranı</span>
              </div>
            </div>
            <button
              className="itera-achievement-close-btn"
              onClick={() => setAchievementModal(null)}
            >
              Devam Et 🎉
            </button>
          </div>
        </div>
      )}

      <div className="itera-buttons">
        <button
          className="itera-add-challenge-btn"
          onClick={() => setShowForm(true)}
        >
          <span>+</span> Yeni Challenge Başlat
        </button>
        {/* Stack chain butonu kaldırıldı */}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            console.log("Modal overlay boş alanına tıklandı");
            setShowForm(false);
          }
        }}>
          <div className="challenge-form">
            <h3>Challenge Oluştur</h3>
            <p className="modal-section-description">
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
            <p
              style={{
                fontSize: "12px",
                color: "rgba(67, 233, 123, 0.8)",
                marginTop: "8px",
                fontWeight: "500",
              }}
            >
              ⚡ İpucun: En basit 2 dakikalık versiyonla başla! (ör: "1 sayfa
              oku", "5 şınav çek", "1 dakika nefes al")
            </p>

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

            <div className="day-selector">
              <p>Haftanın hangi günleri?</p>
              <div className="day-grid">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, index) => {
                  const dayValue = [1, 2, 3, 4, 5, 6, 0][index];
                  return (
                    <button
                      key={day}
                      className={`day-option ${
                        newChallenge.selectedDays.includes(dayValue) ? "selected" : ""
                      }`}
                      onClick={() => {
                        const selectedDays = [...newChallenge.selectedDays];
                        if (selectedDays.includes(dayValue)) {
                          const dayIndex = selectedDays.indexOf(dayValue);
                          selectedDays.splice(dayIndex, 1);
                        } else {
                          selectedDays.push(dayValue);
                        }
                        setNewChallenge({ ...newChallenge, selectedDays });
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
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

            <div className="bundle-selector">
              <p>
                🎁 Temptation Bundling - Sevdiğin şeyi sadece bu challenge ile
                birleştir!
              </p>
              <input
                type="text"
                placeholder="Sevdiğin şeyi yaz... (ör: Netflix izlemek, Müzik dinlemek, Atlıstırmalık yemek)"
                value={newChallenge.bundlePartner}
                onChange={(e) =>
                  setNewChallenge({
                    ...newChallenge,
                    bundlePartner: e.target.value,
                  })
                }
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(204, 201, 220, 0.6)",
                  marginTop: "8px",
                }}
              >
                Örnek: "Podcast dinlerken sadece koşuyorum" veya "Sevdiğim
                müziği sadece çalışırken dinliyorum"
              </p>
            </div>

            <div className="form-buttons">
              <button onClick={() => setShowForm(false)}>İptal</button>
              <button onClick={addChallenge} className="itera-save-btn">
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
                  <span className="challenge-name">{challenge.name}</span>
                  <span className="challenge-status">
                    {getChallengeStatus(challenge)}
                  </span>
                  {challenge.stackTrigger && (
                    <span className="stack-trigger">
                      🔗 {challenge.stackTrigger} → {challenge.name}
                    </span>
                  )}
                  {challenge.bundlePartner && (
                    <span className="bundle-partner">🎁 {challenge.bundlePartner}</span>
                  )}
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
                <div className="progress-container">
                  <div
                    className={getProgressClass(
                      getCompletionPercentage(challenge)
                    )}
                    style={{
                      "--progress": `${getCompletionPercentage(challenge)}%`,
                      "--difficulty-color": challenge.color || "#667eea",
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
                  {challenge.monthsCompleted > 0 && (
                    <span
                      className={`months-completed ${getDiamondClass(challenge.monthsCompleted)}`}
                    >
                      💎{challenge.monthsCompleted}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="monthly-progress">
              {getProgressBoxes(challenge).filter(box => box !== null).map((box) => (
                <div
                  key={`${challenge.id}-day-${box.dayNumber}-${box.originalIndex}`}
                  className={`day-box ${box.isCompleted ? "completed" : ""} ${
                    box.isCurrent ? "current" : ""
                  } ${box.isFuture ? "future" : ""} ${
                    box.isPast ? "past" : ""
                  } ${box.isMissed ? "missed" : ""}`}
                  onClick={() => box.canToggle && toggleDay(challenge, box.dayNumber - 1)}
                  style={{ cursor: box.canToggle ? "pointer" : "default" }}
                >
                  <span className="day-date">{box.date}</span>
                  <span className="day-status">
                    {box.isCompleted ? "✓" : box.isMissed ? "✗" : "○"}
                  </span>
                </div>
              ))}
            </div>

            {isExpired(challenge) && (
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
                className="itera-update-btn"
                onClick={() => updateDescription(showDescription.id)}
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stack chain alanı kaldırıldı */}

    </div>
  );
}

export default Itera;
