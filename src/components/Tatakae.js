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
    duration: 30,
    bundlePartner: "", // Temptation Bundling için
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [showStackModal, setShowStackModal] = useState(false);
  const [stackTriggers, setStackTriggers] = useState({});
  const [showExtendModal, setShowExtendModal] = useState(null); // 1 hafta → 1 ay uzatma modal'ı

  // 🎊 ANIMATED CELEBRATIONS STATE
  const [confetti, setConfetti] = useState([]);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [achievementModal, setAchievementModal] = useState(null);

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
        (c) => getDaysSinceStart(c.startDate) < (c.duration || 30)
      );

      setChallenges(active);
      
      // 7 günlük challenge'lar için otomatik uzatma kontrolü
      active.forEach(challenge => {
        const daysSinceStart = getDaysSinceStart(challenge.startDate);
        
        if (challenge.duration === 7 && daysSinceStart >= 6 && !challenge.isExtended) {
          const completedDays = challenge.completedDays || 0;
          const successRate = Math.round((completedDays / 7) * 100);
          
          if (successRate >= 70) {
            // Modal zaten açık değilse aç
            if (!showExtendModal || showExtendModal.id !== challenge.id) {
              setShowExtendModal(challenge);
            }
          }
        }
      });
    });
    return unsubscribe;
  }, [showExtendModal]);

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

  const applyPenalty = useCallback(
    async (challenge, missedDayIndex) => {
      const newMissedDays = (challenge.missedDays || 0) + 1;
      const consecutiveMissed = challenge.consecutiveMissed || 0;
      const newConsecutiveMissed = consecutiveMissed + 1;
      const recoveryMode = newConsecutiveMissed >= 2;

      await updateDoc(doc(db, "tatakae", challenge.id), {
        missedDays: newMissedDays,
        consecutiveMissed: newConsecutiveMissed,
        recoveryMode: recoveryMode,
        lastPenaltyApplied: new Date().toISOString(),
      });

      if (recoveryMode) {
        console.log(
          `🔄 Recovery Mode: ${challenge.name} için ertesi gün bonus şans!`
        );
      }
    },
    []
  );

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

    const duration = newChallenge.duration;

    await addDoc(collection(db, "tatakae"), {
      ...newChallenge,
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

    setNewChallenge({
      name: "",
      icon: "🎯",
      color: "#667eea",
      description: "",
      duration: 30,
      bundlePartner: "", // Bundle partner'ı da temizle
    });
    setShowForm(false);
  };

  const extendToMonth = async (challenge) => {
    if (challenge.duration !== 7) return;
    
    const newDuration = 30;
    const currentProgress = challenge.monthlyProgress || Array(7).fill(false);
    const extendedProgress = [...currentProgress, ...Array(23).fill(false)];
    
    await updateDoc(doc(db, "tatakae", challenge.id), {
      duration: newDuration,
      monthlyProgress: extendedProgress,
      isExtended: true,
      extendedAt: new Date(),
    });
    
    setShowExtendModal(null);
  };

  const checkForExtendOffer = (challenge) => {
    const daysSinceStart = getDaysSinceStart(challenge.startDate);
    const duration = challenge.duration || 30;
    
    // 7 günlük challenge tamamlandıysa ve henüz uzatılmadıysa
    if (duration === 7 && daysSinceStart >= 6 && !challenge.isExtended) {
      const completedDays = challenge.completedDays || 0;
      const successRate = Math.round((completedDays / 7) * 100);
      
      // En az %70 başarı oranı varsa uzatma öner
      if (successRate >= 70) {
        setShowExtendModal(challenge);
      }
    }
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
    const newPercentage = Math.round((completedDays / duration) * 100);
    const newConsecutiveMissed = newProgress[dayIndex]
      ? 0
      : challenge.consecutiveMissed || 0;
    const newRecoveryMode = newConsecutiveMissed >= 2;

    await updateDoc(doc(db, "tatakae", challenge.id), {
      monthlyProgress: newProgress,
      completedDays: completedDays,
      consecutiveMissed: newConsecutiveMissed,
      recoveryMode: newRecoveryMode,
      lastUpdated: new Date(),
    });

    // 7 günlük challenge tamamlandıysa uzatma öner
    if (duration === 7 && daysSinceStart >= 5 && newProgress[dayIndex]) {
      setTimeout(() => checkForExtendOffer(challenge), 1000);
    }
    
    // 30 günlük challenge tamamlandıysa aylık rozet ekle
    if (duration === 30 && daysSinceStart >= 29 && newPercentage === 100) {
      const newMonthsCompleted = (challenge.monthsCompleted || 0) + 1;
      await updateDoc(doc(db, "tatakae", challenge.id), {
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

  const updateStackTriggers = async () => {
    const updatePromises = Object.entries(stackTriggers).map(([challengeId, trigger]) => {
      if (trigger.trim()) {
        return updateDoc(doc(db, "tatakae", challengeId), {
          stackTrigger: trigger.trim(),
        });
      }
      return null;
    }).filter(Boolean);

    await Promise.all(updatePromises);
    setShowStackModal(false);
    setStackTriggers({});
  };

  const openStackModal = () => {
    const triggers = {};
    challenges.forEach(challenge => {
      triggers[challenge.id] = challenge.stackTrigger || "";
    });
    setStackTriggers(triggers);
    setShowStackModal(true);
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

  const getDiamondClass = (monthsCompleted) => {
    if (monthsCompleted >= 6) return 'diamond-legendary'; // 6+ Altın
    if (monthsCompleted >= 4) return 'diamond-master';    // 4-5 Kırmızı
    if (monthsCompleted >= 2) return 'diamond-advanced';  // 2-3 Mor
    return 'diamond-basic';                               // 1 Mavi
  };

  return (
    <div className={`tatakae-container ${screenShake ? "screen-shake" : ""}`}>
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
      </div>

      <div className="tatakae-buttons">
        <button className="add-challenge-btn" onClick={() => setShowForm(true)}>
          <span>+</span> Yeni Challenge Başlat
        </button>
        <button className="stack-chain-btn" onClick={openStackModal}>
          <span>⛓️</span> Alışkanlık Zinciri Kur
        </button>
      </div>

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
            <p style={{
              fontSize: '12px', 
              color: 'rgba(67, 233, 123, 0.8)', 
              marginTop: '8px',
              fontWeight: '500'
            }}>
              ⚡ İpucun: En basit 2 dakikalık versiyonla başla! (ör: "1 sayfa oku", "5 şınav çek", "1 dakika nefes al")
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
              <p>🎁 Temptation Bundling - Sevdiğin şeyi sadece bu challenge ile birleştir!</p>
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
              <p style={{ fontSize: '12px', color: 'rgba(204, 201, 220, 0.6)', marginTop: '8px' }}>
                Örnek: "Podcast dinlerken sadece koşuyorum" veya "Sevdiğim müziği sadece çalışırken dinliyorum"
              </p>
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
                    <span className="bundle-partner">
                      🎁 {challenge.name} + {challenge.bundlePartner}
                    </span>
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
                    <span className={`months-completed ${getDiamondClass(challenge.monthsCompleted)}`}>
                      💎{challenge.monthsCompleted}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {challenge.recoveryMode && (
              <div className="recovery-notification">
                🔄 <strong>Recovery Mode:</strong> Bugün tamamlarsan ekstra motivasyon kazanırsın!
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
                className="update-btn"
                onClick={() => updateDescription(showDescription.id)}
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {showStackModal && (
        <div className="modal-overlay" onClick={() => setShowStackModal(false)}>
          <div className="stack-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⛓️ Alışkanlık Zinciri Kur</h3>
            <p style={{
              textAlign: "center",
              color: "rgba(204, 201, 220, 0.7)",
              fontSize: "14px",
              marginBottom: "20px"
            }}>
              Mevcut alışkanlıklarınızı bir tetikleyiciye bağlayın!
            </p>

            <div className="stack-challenges-list">
              {challenges.filter(c => !isExpired(c)).map((challenge) => (
                <div key={challenge.id} className="stack-challenge-item">
                  <div className="stack-challenge-info">
                    <span className="challenge-icon">{challenge.icon}</span>
                    <span className="challenge-name">{challenge.name}</span>
                  </div>
                  <div className="stack-trigger-input">
                    <input
                      type="text"
                      placeholder="Tetikleyici... (ör: Kahve içtikten sonra, Dişlerimi fırçaladıktan sonra)"
                      value={stackTriggers[challenge.id] || ""}
                      onChange={(e) => setStackTriggers({
                        ...stackTriggers,
                        [challenge.id]: e.target.value
                      })}
                    />
                    {stackTriggers[challenge.id] && (
                      <div className="stack-preview">
                        "{stackTriggers[challenge.id]} → {challenge.name}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {challenges.filter(c => !isExpired(c)).length === 0 && (
              <div className="empty-stack-state">
                <p>Aktif challenge'ınız bulunmuyor.</p>
                <p>Önce bir challenge başlatın!</p>
              </div>
            )}

            <div className="stack-buttons">
              <button onClick={() => setShowStackModal(false)}>İptal</button>
              <button 
                onClick={updateStackTriggers} 
                className="save-stack-btn"
                disabled={Object.values(stackTriggers).every(trigger => !trigger?.trim())}
              >
                Zincirleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Extend Modal - 1 Hafta → 1 Ay Uzatma */}
      {showExtendModal && (
        <div className="modal-overlay" onClick={() => setShowExtendModal(null)}>
          <div className="extend-modal" onClick={(e) => e.stopPropagation()}>
            <div className="extend-header">
              <div className="extend-icon">🎉</div>
              <h3>Tebrikler! 1 Haftalık Challenge Tamamlandı!</h3>
              <p>{showExtendModal.icon} <strong>{showExtendModal.name}</strong> challenge'ını başarıyla tamamladın!</p>
            </div>
            
            <div className="extend-stats">
              <div className="stat-item">
                <span className="stat-value">{showExtendModal.completedDays || 0}/7</span>
                <span className="stat-label">Gün Tamamlandı</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{Math.round(((showExtendModal.completedDays || 0) / 7) * 100)}%</span>
                <span className="stat-label">Başarı Oranı</span>
              </div>
            </div>
            
            <div className="extend-question">
              <h4>📈 1 Aya Uzatmak İster misin?</h4>
              <p>Mevcut ilerleme korunacak ve 23 gün daha eklenecek!</p>
              <ul className="extend-benefits">
                <li>✅ İlk 7 günün korunur</li>
                <li>✅ 23 gün daha challenge yap</li>
                <li>✅ Toplam 1 aylık alışkanlık oluştur</li>
                <li>✅ Tamamlarsan 💎 elmas rozetin kazan!</li>
              </ul>
            </div>
            
            <div className="extend-buttons">
              <button 
                onClick={() => setShowExtendModal(null)}
                className="extend-decline"
              >
                Hayır, Şimdilik Bu Kadar Yeter
              </button>
              <button 
                onClick={() => extendToMonth(showExtendModal)}
                className="extend-accept"
              >
                📈 Evet, 1 Aya Uzat!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tatakae;