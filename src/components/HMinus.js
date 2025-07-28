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
    duration: 30,
    aversionPartner: "", // Aversion Bundling için
    consequenceReminder: "", // Olumsuz sonuç hatırlatması
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerTriggers, setBlockerTriggers] = useState({});
  const [showExtendModal, setShowExtendModal] = useState(null); // 1 hafta → 1 ay uzatma modal'ı

  const durationOptions = [
    { value: 7, label: "1 Hafta", days: 7, description: "Kısa süreli deneme" },
    { value: 30, label: "1 Ay", days: 30, description: "Kalıcı değişim" },
  ];



  const icons = [
    "🚫",
    "🚬",
    "🍺",
    "🍔",
    "📱",
    "🎮",
    "💸",
    "😴",
    "🍿",
    "☕",
    "🍰",
    "🛒",
    "📺",
    "💻",
    "🍕",
    "🥤",
    "🍷",
    "🎲",
    "💊",
    "🔥",
    "⚡",
    "💀",
    "🌪️",
    "🗯️",
    "💥",
    "❌",
    "⛔",
    "🆘",
    "⚠️",
    "🔞",
  ];

  const colors = [
    "#ff6b6b",
    "#ee5a6f",
    "#ff7675",
    "#fd79a8",
    "#e84393",
    "#a29bfe",
    "#6c5ce7",
    "#74b9ff",
    "#0984e3",
    "#00b894",
    "#00cec9",
    "#fdcb6e",
  ];

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
        (h) => getDaysSinceStart(h.startDate) < (h.duration || 30)
      );
      setBadHabits(active);
      
      // 7 günlük takip için otomatik uzatma kontrolü
      active.forEach(badHabit => {
        const daysSinceStart = getDaysSinceStart(badHabit.startDate);
        if (badHabit.duration === 7 && daysSinceStart >= 6 && !badHabit.isExtended) {
          const cleanDays = badHabit.cleanDays || 0;
          const successRate = Math.round((cleanDays / 7) * 100);
          if (successRate >= 70) {
            // Modal zaten açık değilse aç
            if (!showExtendModal || showExtendModal.id !== badHabit.id) {
              setShowExtendModal(badHabit);
            }
          }
        }
      });
    });
    return unsubscribe;
  }, [showExtendModal]);

  useEffect(() => {
    // Otomatik sistem kapatıldı - kullanıcı manual kontrol
  }, []);

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

  const getProgressBoxes = useCallback((badHabit) => {
    const duration = badHabit.duration || 30;
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

  const addBadHabit = async () => {
    if (!newBadHabit.name.trim()) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const duration = newBadHabit.duration;

    await addDoc(collection(db, "h-minus"), {
      ...newBadHabit,
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

    setNewBadHabit({
      name: "",
      icon: "🚫",
      color: "#ff6b6b",
      description: "",
      duration: 30,
      aversionPartner: "", // Aversion partner'ı da temizle
      consequenceReminder: "", // Consequence reminder'ı da temizle
    });
    setShowForm(false);
  };

  const extendToMonth = async (badHabit) => {
    if (badHabit.duration !== 7) return;
    
    const newDuration = 30;
    const currentProgress = badHabit.monthlyProgress || Array(7).fill(null);
    const extendedProgress = [...currentProgress, ...Array(23).fill(null)];
    
    await updateDoc(doc(db, "h-minus", badHabit.id), {
      duration: newDuration,
      monthlyProgress: extendedProgress,
      isExtended: true,
      extendedAt: new Date(),
    });
    
    setShowExtendModal(null);
  };

  const checkForExtendOffer = (badHabit) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || 30;
    
    // 7 günlük takip tamamlandıysa ve henüz uzatılmadıysa
    if (duration === 7 && daysSinceStart >= 6 && !badHabit.isExtended) {
      const cleanDays = badHabit.cleanDays || 0;
      const successRate = Math.round((cleanDays / 7) * 100);
      
      // En az %70 başarı oranı varsa uzatma öner
      if (successRate >= 70) {
        setShowExtendModal(badHabit);
      }
    }
  };

  const toggleDay = async (badHabit, dayIndex) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const duration = badHabit.duration || 30;
    const currentDay = Math.min(daysSinceStart + 1, duration);
    const dayNumber = dayIndex + 1;

    // Sadece bugünkü gün değiştirilebilir
    if (dayNumber !== currentDay || daysSinceStart >= duration) return;

    const newProgress = [
      ...(badHabit.monthlyProgress || Array(duration).fill(null)),
    ];
    const currentState = newProgress[dayIndex];

    let newState;
    if (currentState === null) {
      newState = true;
    } else if (currentState === true) {
      newState = false;
    } else {
      newState = null; // X'ten boşa geç
    }

    newProgress[dayIndex] = newState;

    const cleanDays = newProgress.filter((day) => day === true).length;
    const relapseCount = newProgress.filter((day) => day === false).length;

    // Current streak hesaplama
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
    
    // 7 günlük takip tamamlandıysa uzatma öner
    if (duration === 7 && daysSinceStart >= 5 && newState === true) {
      setTimeout(() => checkForExtendOffer(badHabit), 1000);
    }
    
    // 30 günlük takip tamamlandıysa aylık rozet ekle
    if (duration === 30 && daysSinceStart >= 29) {
      const progressDisplay = getProgressDisplay(badHabit);
      if (progressDisplay.percentage === 100) {
        const newMonthsCompleted = (badHabit.monthsCompleted || 0) + 1;
        await updateDoc(doc(db, "h-minus", badHabit.id), {
          monthsCompleted: newMonthsCompleted,
        });
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

  const updateBlockerTriggers = async () => {
    const updatePromises = Object.entries(blockerTriggers)
      .map(([badHabitId, blocker]) => {
        if (blocker.trim()) {
          return updateDoc(doc(db, "h-minus", badHabitId), {
            blockerTrigger: blocker.trim(),
          });
        }
        return null;
      })
      .filter(Boolean);

    await Promise.all(updatePromises);
    setShowBlockerModal(false);
    setBlockerTriggers({});
  };

  const openBlockerModal = () => {
    const triggers = {};
    badHabits.forEach((badHabit) => {
      triggers[badHabit.id] = badHabit.blockerTrigger || "";
    });
    setBlockerTriggers(triggers);
    setShowBlockerModal(true);
  };

  const getProgressDisplay = (badHabit) => {
    const daysSinceStart = getDaysSinceStart(badHabit.startDate);
    const totalDaysIncludingToday = daysSinceStart + 1; // Bugün dahil

    if (totalDaysIncludingToday <= 1)
      return { percentage: 0, text: "0/1", label: "0% temiz" };

    const progress = badHabit.monthlyProgress || [];
    // Bugün dahil tüm günleri kontrol et
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
  };

  const isExpired = (badHabit) => {
    const duration = badHabit.duration || 30;
    return getDaysSinceStart(badHabit.startDate) >= duration;
  };

  const getDiamondClass = (monthsCompleted) => {
    if (monthsCompleted >= 6) return 'diamond-legendary'; // 6+ Altın
    if (monthsCompleted >= 4) return 'diamond-master';    // 4-5 Kırmızı
    if (monthsCompleted >= 2) return 'diamond-advanced';  // 2-3 Mor
    return 'diamond-basic';                               // 1 Mavi
  };

  return (
    <div className="h-minus-container">
      <div className="h-minus-header">
        <h1>🚫 H- (HABIT MINUS)</h1>
        <p>Bırakmak istediğin kötü alışkanlıkları takip et!</p>
      </div>



      <div className="h-minus-buttons">
        <button className="add-bad-habit-btn" onClick={() => setShowForm(true)}>
          <span>+</span> Bırakmak istediğin bir alışkanlık ekle
        </button>
        <button className="blocker-chain-btn" onClick={openBlockerModal}>
          <span>🛡️</span> Engelleyici Zincir Kur
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bad-habit-form" onClick={(e) => e.stopPropagation()}>
            <h3>Bırakmak İstediğin Alışkanlık</h3>
            <p
              style={{
                textAlign: "center",
                color: "rgba(204, 201, 220, 0.7)",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
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
                    onClick={() =>
                      setNewBadHabit({ ...newBadHabit, duration: option.value })
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

            <div className="aversion-selector">
              <p>💥 Aversion Bundling - Bu alışkanlık aklına geldiğinde ne yapacaksın?</p>
              <input
                type="text"
                placeholder="Zorlayıcı/İğrenç aktivite... (ör: 50 şınav çek, Soğuk duş al, 10 dk temizlik yap)"
                value={newBadHabit.aversionPartner}
                onChange={(e) =>
                  setNewBadHabit({
                    ...newBadHabit,
                    aversionPartner: e.target.value,
                  })
                }
              />
              <p style={{ fontSize: '12px', color: 'rgba(204, 201, 220, 0.6)', marginTop: '8px' }}>
                Örnek: "Sigara içmek istediğimde 50 şınav çekerim" veya "Abur cubur yemek istediğimde soğuk duş alırım"
              </p>
            </div>

            <div className="consequence-selector">
              <p>📜 Olumsuz Sonuç Hatırlatması - Bu alışkanlığın uzun vadeli zararı nedir?</p>
              <input
                type="text"
                placeholder="Uzun vadeli olumsuz sonuç... (ör: Akciğer kanseri riski, Obezite ve diyabet, Zaman kaybı)"
                value={newBadHabit.consequenceReminder}
                onChange={(e) =>
                  setNewBadHabit({
                    ...newBadHabit,
                    consequenceReminder: e.target.value,
                  })
                }
              />
              <p style={{ fontSize: '12px', color: 'rgba(204, 201, 220, 0.6)', marginTop: '8px' }}>
                Örnek: "Sağlığımı bozuyor ve ailemden uzaklaştırıyor" - Her seferinde bunu hatırla!
              </p>
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
            className={`bad-habit-item ${
              isExpired(badHabit) ? "completed" : ""
            }`}
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
                  <span className="bad-habit-name">{badHabit.name}</span>
                  {badHabit.blockerTrigger && (
                    <span className="blocker-trigger">
                      🛡️ {badHabit.blockerTrigger} → Pozitif alternatif
                    </span>
                  )}
                  {badHabit.aversionPartner && (
                    <span className="aversion-partner">
                      💥 {badHabit.name} → {badHabit.aversionPartner}
                    </span>
                  )}
                  {badHabit.consequenceReminder && (
                    <span className="consequence-reminder">
                      📜 Hatırla: {badHabit.consequenceReminder}
                    </span>
                  )}
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
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{
                      "--progress": `${
                        getProgressDisplay(badHabit).percentage
                      }%`,
                      "--bar-color": badHabit.color || "#ff6b6b",
                    }}
                  >
                    <div className="progress-fill"></div>
                    <div className="progress-text">
                      {getProgressDisplay(badHabit).text}
                    </div>
                  </div>
                  <div className="progress-label">
                    {getProgressDisplay(badHabit).label}
                  </div>
                </div>
                <div className="streak-info">
                  🔥 {badHabit.currentStreak || 0}
                  {badHabit.monthsCompleted > 0 && (
                    <span className={`months-completed ${getDiamondClass(badHabit.monthsCompleted)}`}>
                      💎{badHabit.monthsCompleted}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="monthly-progress">
              {getProgressBoxes(badHabit).map((box, index) => (
                <div
                  key={`${badHabit.id}-day-${box.dayNumber}-${index}`}
                  className={`day-box ${
                    box.isCurrent ? "current" : ""
                  } ${
                    box.isClean ? "clean" : box.isRelapse ? "relapse" : ""
                  }`}
                  onDoubleClick={() =>
                    box.canToggle && toggleDay(badHabit, index)
                  }
                  style={{ cursor: box.canToggle ? "pointer" : "default" }}
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
                <span>
                  ({badHabit.cleanDays || 0} temiz gün,{" "}
                  {badHabit.relapseCount || 0} relapse)
                </span>
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

      {/* Blocker Chain Modal */}
      {showBlockerModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBlockerModal(false)}
        >
          <div className="blocker-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🛡️ Engelleyici Zincir Kur</h3>
            <p
              style={{
                textAlign: "center",
                color: "rgba(204, 201, 220, 0.7)",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Kötü alışkanlıklarınız akılınıza geldiğinde ne yapacağınızı
              belirleyin!
            </p>

            <div className="blocker-bad-habits-list">
              {badHabits
                .filter((h) => !isExpired(h))
                .map((badHabit) => (
                  <div key={badHabit.id} className="blocker-bad-habit-item">
                    <div className="blocker-bad-habit-info">
                      <span className="bad-habit-icon">{badHabit.icon}</span>
                      <span className="bad-habit-name">{badHabit.name}</span>
                    </div>
                    <div className="blocker-trigger-input">
                      <input
                        type="text"
                        placeholder="Engelleyici aksiyon... (ör: 10 derin nefes alırım, 1 bardak su içerim)"
                        value={blockerTriggers[badHabit.id] || ""}
                        onChange={(e) =>
                          setBlockerTriggers({
                            ...blockerTriggers,
                            [badHabit.id]: e.target.value,
                          })
                        }
                      />
                      {blockerTriggers[badHabit.id] && (
                        <div className="blocker-preview">
                          "{badHabit.name} aklıma geldiğinde →{" "}
                          {blockerTriggers[badHabit.id]}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {badHabits.filter((h) => !isExpired(h)).length === 0 && (
              <div className="empty-blocker-state">
                <p>Aktif kötü alışkanlık takibiniz bulunmuyor.</p>
                <p>Önce bir kötü alışkanlık eklemelisiniz!</p>
              </div>
            )}

            <div className="blocker-buttons">
              <button onClick={() => setShowBlockerModal(false)}>İptal</button>
              <button
                onClick={updateBlockerTriggers}
                className="save-blocker-btn"
                disabled={Object.values(blockerTriggers).every(
                  (trigger) => !trigger?.trim()
                )}
              >
                Engelleyicileri Kaydet
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
              <h3>Tebrikler! 1 Haftalık Takip Tamamlandı!</h3>
              <p>{showExtendModal.icon} <strong>{showExtendModal.name}</strong> alışkanlığını başarıyla bırakıyorsun!</p>
            </div>
            
            <div className="extend-stats">
              <div className="stat-item">
                <span className="stat-value">{showExtendModal.cleanDays || 0}/7</span>
                <span className="stat-label">Temiz Gün</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{Math.round(((showExtendModal.cleanDays || 0) / 7) * 100)}%</span>
                <span className="stat-label">Başarı Oranı</span>
              </div>
            </div>
            
            <div className="extend-question">
              <h4>📈 1 Aya Uzatmak İster misin?</h4>
              <p>Mevcut ilerleme korunacak ve 23 gün daha eklenecek!</p>
              <ul className="extend-benefits">
                <li>✅ İlk 7 günün korunur</li>
                <li>✅ 23 gün daha takip et</li>
                <li>✅ Toplam 1 aylık temiz yaşam</li>
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

export default HMinus;
