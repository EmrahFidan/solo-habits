import React, { useState, useEffect } from "react";
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
  getDocs,
} from "firebase/firestore";
import "./Solo.css";

function Solo({ soundEnabled }) {
  const [habits, setHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    icon: "📌",
    color: "#667eea",
    frequency: "daily",
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    description: "",
    difficulty: "medium",
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");

  // PUAN SİSTEMİ
  const difficultyPoints = {
    easy: { complete: 1, penalty: -1, label: "Kolay", color: "#43e97b" },
    medium: { complete: 2, penalty: -2, label: "Orta", color: "#feca57" },
    hard: { complete: 3, penalty: -3, label: "Zor", color: "#ff6b6b" }
  };

  const icons = [
    "💪", "🧘", "🥊", "📝", "💻", "📌", "😴", "🧠", "❤️", "🦷",
    "🎤", "📸", "✏️", "🌱", "💎", "🎓", "🧩", "🚀", "🧹", "🛁",
    "🔧", "🗑️", "💸", "☯️", "🕯️", "🌙", "🎮", "🎯", "🍿", "🍃",
    "🔴", "🟢", "🔵", "🟡", "🟣", "🔶", "🔷",
  ];

  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#30cfd0", "#a8edea",
  ];

  // Hafta Pazartesi'den başlayacak şekilde güncellendi.
  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const dayShortNames = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

  // Frekans ön ayarları yeni gün sıralamasına göre güncellendi (Pzt=0, ..., Pzr=6)
  const frequencies = [
    { value: "daily", label: "Her gün", preset: [0, 1, 2, 3, 4, 5, 6] },
    { value: "weekdays", label: "Hafta içi", preset: [0, 1, 2, 3, 4] },
    { value: "mwf", label: "Pzt-Çrş-Cum", preset: [0, 2, 4] },
    { value: "tts", label: "Sal-Per-Cmt", preset: [1, 3, 5] },
    { value: "weekend", label: "Hafta sonu", preset: [5, 6] },
    { value: "custom", label: "Özel seç", preset: null },
  ];

  // JS'in Date.getDay() (Pazar=0) metodunu bizim (Pazartesi=0) sıralamamıza çeviren yardımcı fonksiyon.
  const getAppDayIndex = (date = new Date()) => {
    const jsDay = date.getDay(); // Pazar: 0, Pazartesi: 1, ...
    return jsDay === 0 ? 6 : jsDay - 1; // Pzt: 1-1=0, ..., Pzr: 0 -> 6
  };

  // 🆕 Günlük streak kontrolü fonksiyonu
  const checkStreaks = async () => {
    if (!auth.currentUser) return;
    
    const today = new Date();
    const todayDateString = today.toDateString();
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayDateString = yesterdayDate.toDateString();
    
    const q = query(
      collection(db, "solo"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const habit = docSnap.data();
      
      const lastActivityDate = habit.lastActivityDate || habit.createdAt?.toDate?.()?.toDateString() || new Date(0).toDateString();
      const selectedDays = habit.selectedDays || [0, 1, 2, 3, 4, 5, 6];
      
      // Dün bu alışkanlık için aktif gün müydü?
      const yesterdayIndex = getAppDayIndex(yesterdayDate);
      const wasYesterdayActive = selectedDays.includes(yesterdayIndex);
      
      // Eğer son aktivite dünden eskiyse ve dün aktif gün idiyse streak'i sıfırla
      if (wasYesterdayActive && lastActivityDate !== todayDateString && lastActivityDate !== yesterdayDateString) {
        await updateDoc(doc(db, "solo", docSnap.id), {
          streak: 0,
          lastActivityDate: todayDateString
        });
        console.log(`🔥 ${habit.name} streak'i sıfırlandı (son aktivite: ${lastActivityDate})`);
      }
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "solo"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHabits(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return unsubscribe;
  }, []);

  // 🆕 Günlük kontroller
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const runDailyChecks = async () => {
      await checkAndResetDailyProgress();
      await checkStreaks();
      await checkDailyPenalties();
    };
    
    runDailyChecks();
    
    // Her 5 dakikada bir kontrol et
    const interval = setInterval(runDailyChecks, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // YENİ: Günlük ceza kontrolü
  const checkDailyPenalties = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    const lastPenaltyCheck = localStorage.getItem('lastSoloPenaltyCheck');
    if (lastPenaltyCheck === todayString) return;

    const q = query(
      collection(db, "solo"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIndex = getAppDayIndex(yesterday);

    for (const docSnap of snapshot.docs) {
      const habit = docSnap.data();
      const selectedDays = habit.selectedDays || [0, 1, 2, 3, 4, 5, 6];
      
      // Dün bu alışkanlık için gün var mıydı?
      if (selectedDays.includes(yesterdayIndex)) {
        const progress = habit.weeklyProgress || Array(7).fill(false);
        
        // Dün tamamlanmadıysa ceza uygula
        if (!progress[yesterdayIndex]) {
          const penalty = difficultyPoints[habit.difficulty || 'medium'].penalty;
          const currentPoints = habit.currentPoints || 0;
          const newPoints = Math.max(0, currentPoints + penalty);
          
          await updateDoc(doc(db, "solo", docSnap.id), {
            currentPoints: newPoints,
            lastPenaltyDate: yesterday.toISOString()
          });
          
          console.log(`📉 ${habit.name} için ${Math.abs(penalty)} puan ceza uygulandı`);
        }
      }
    }

    localStorage.setItem('lastSoloPenaltyCheck', todayString);
  };

  // 🆕 Geliştirilmiş haftalık reset fonksiyonu
  const checkAndResetDailyProgress = async () => {
    const today = new Date();
    const todayString = today.toDateString();
    const lastReset = localStorage.getItem("lastSoloResetDate");

    if (lastReset !== todayString) {
      const q = query(
        collection(db, "solo"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const isMonday = today.getDay() === 1; // Pazartesi kontrolü

      for (const docSnap of snapshot.docs) {
        const habit = docSnap.data();
        let newProgress = [...(habit.weeklyProgress || Array(7).fill(false))];
        let needsUpdate = false;

        // Pazartesi günleri haftalık reset
        if (isMonday) {
          newProgress.fill(false);
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, "solo", docSnap.id), {
            weeklyProgress: newProgress,
            lastUpdated: new Date(),
          });
        }
      }

      localStorage.setItem("lastSoloResetDate", todayString);
      console.log(`📅 Solo progress güncellemesi tamamlandı (${todayString})`);
    }
  };

  const handleFrequencyChange = (frequency) => {
    const selectedFreq = frequencies.find((f) => f.value === frequency);
    setNewHabit({
      ...newHabit,
      frequency,
      selectedDays: selectedFreq.preset || [],
    });
  };

  const toggleDay = (dayIndex) => {
    const currentDays = [...newHabit.selectedDays];
    const dayExists = currentDays.includes(dayIndex);

    if (dayExists) {
      setNewHabit({
        ...newHabit,
        selectedDays: currentDays.filter((d) => d !== dayIndex),
      });
    } else {
      setNewHabit({
        ...newHabit,
        selectedDays: [...currentDays, dayIndex].sort((a, b) => a - b),
      });
    }
  };

  const getProgressBoxes = (habit) => {
    const selectedDays =
      habit.selectedDays && habit.selectedDays.length > 0
        ? habit.selectedDays
        : [0, 1, 2, 3, 4, 5, 6];

    const todayIndex = getAppDayIndex();
    const sortedSelectedDays = [...selectedDays].sort((a, b) => a - b);

    return sortedSelectedDays.map((dayIndex) => ({
      dayIndex,
      completed: habit.weeklyProgress?.[dayIndex] || false,
      isToday: todayIndex === dayIndex,
      label: dayShortNames[dayIndex],
    }));
  };

  const addHabit = async () => {
    if (!newHabit.name.trim()) return;
    if (newHabit.selectedDays.length === 0) {
      alert("En az bir gün seçmelisiniz!");
      return;
    }

    // Buton tıklama sesi
    if (soundEnabled && window.playSound) {
      window.playSound('button-click');
    }

    const today = new Date();

    await addDoc(collection(db, "solo"), {
      ...newHabit,
      userId: auth.currentUser.uid,
      streak: 0,
      currentPoints: 0,
      totalPoints: 0,
      weeklyProgress: Array(7).fill(false),
      lastUpdated: new Date(),
      createdAt: new Date(),
      lastActivityDate: today.toDateString(), // 🆕 Son aktivite tarihi
    });

    setNewHabit({
      name: "",
      icon: "📌",
      color: "#667eea",
      frequency: "daily",
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      description: "",
      difficulty: "medium",
    });
    setShowForm(false);
  };

  // 🆕 Geliştirilmiş toggle fonksiyonu
  const toggleHabit = async (habit, boxData) => {
    const todayIndex = getAppDayIndex();
    const selectedDays = habit.selectedDays || [0, 1, 2, 3, 4, 5, 6];

    if (!selectedDays.includes(todayIndex) || !boxData.isToday) return;

    const newProgress = [...(habit.weeklyProgress || Array(7).fill(false))];
    const wasCompleted = newProgress[boxData.dayIndex];
    newProgress[boxData.dayIndex] = !newProgress[boxData.dayIndex];

    // PUAN HESAPLAMA
    const difficulty = habit.difficulty || 'medium';
    const points = difficultyPoints[difficulty];
    let currentPoints = habit.currentPoints || 0;
    let totalPoints = habit.totalPoints || 0;
    let newStreak = habit.streak || 0;

    const today = new Date();

    if (!wasCompleted && newProgress[boxData.dayIndex]) {
      // Tamamlandı - puan ekle ve streak artır
      currentPoints += points.complete;
      totalPoints += points.complete;
      newStreak += 1;
      
      // Streak bonusu (her 7 günde ekstra puan)
      if (newStreak % 7 === 0) {
        const bonusPoints = points.complete * 2;
        currentPoints += bonusPoints;
        totalPoints += bonusPoints;
        console.log(`🎊 Streak Bonus! +${bonusPoints} puan`);
      }
      
      console.log(`✅ ${habit.name} tamamlandı! +${points.complete} puan`);
    } else if (wasCompleted && !newProgress[boxData.dayIndex]) {
      // Geri alındı - puan düş ve streak azalt
      currentPoints -= points.complete;
      newStreak = Math.max(0, newStreak - 1);
      console.log(`❌ ${habit.name} geri alındı! -${points.complete} puan`);
    }

    // Ses efekti
    if (soundEnabled && window.playSound) {
      if (!wasCompleted && newProgress[boxData.dayIndex]) {
        window.playSound('complete');
      } else if (wasCompleted && !newProgress[boxData.dayIndex]) {
        window.playSound('button-click');
      }
    }

    await updateDoc(doc(db, "solo", habit.id), {
      weeklyProgress: newProgress,
      streak: newStreak,
      currentPoints: Math.max(0, currentPoints),
      totalPoints: Math.max(0, totalPoints),
      lastUpdated: new Date(),
      lastActivityDate: today.toDateString(), // 🆕 Son aktivite tarihini güncelle
    });
  };

  const deleteHabit = async (id) => {
    await deleteDoc(doc(db, "solo", id));
    setShowConfirm(null);
  };

  const updateDescription = async (habitId) => {
    await updateDoc(doc(db, "solo", habitId), {
      description: updatedDescription,
    });
    setShowDescription(null);
    setUpdatedDescription("");
  };

  const getFrequencyLabel = (habit) => {
    const selectedDays = habit.selectedDays || [0, 1, 2, 3, 4, 5, 6];
    const freq = frequencies.find(
      (f) =>
        f.preset &&
        f.preset.length === selectedDays.length &&
        f.preset.every((day) => selectedDays.includes(day))
    );

    if (freq) {
      return freq.label;
    }

    return `${selectedDays.length} gün/hafta`;
  };


  return (
    <div className="solo-container">

      <button className="add-habit-btn" onClick={() => setShowForm(true)}>
        <span>+</span> Yeni Alışkanlık
      </button>

      {/* Form ve diğer JSX kodları aynı kalıyor... */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="habit-form" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Alışkanlık</h3>

            <input
              type="text"
              placeholder="Alışkanlık adı..."
              value={newHabit.name}
              onChange={(e) =>
                setNewHabit({ ...newHabit, name: e.target.value })
              }
            />

            <div className="icon-selector">
              <p>İkon seç:</p>
              <div className="icon-grid">
                {icons.map((icon) => (
                  <div
                    key={icon}
                    className={`icon-option ${
                      newHabit.icon === icon ? "selected" : ""
                    }`}
                    onClick={() => setNewHabit({ ...newHabit, icon })}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div className="color-selector">
              <p>Renk seç:</p>
              <div className="color-grid">
                {colors.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${
                      newHabit.color === color ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewHabit({ ...newHabit, color })}
                  />
                ))}
              </div>
            </div>

            {/* YENİ: ZORLUK SEVİYESİ */}
            <div className="difficulty-selector">
              <p>Zorluk seviyesi:</p>
              <div className="difficulty-options">
                {Object.entries(difficultyPoints).map(([key, value]) => (
                  <div
                    key={key}
                    className={`difficulty-option ${
                      newHabit.difficulty === key ? "selected" : ""
                    }`}
                    onClick={() => setNewHabit({ ...newHabit, difficulty: key })}
                    style={{
                      '--difficulty-color': value.color
                    }}
                  >
                    <span className="difficulty-label">{value.label}</span>
                    <span className="difficulty-points">+{value.complete} puan</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="frequency-selector">
              <p>Sıklık seç:</p>
              <select
                value={newHabit.frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="day-picker">
              <p>Hangi günlerde yapmak istiyorsun?</p>
              <div className="day-picker-grid">
                {dayNames.map((dayName, index) => (
                  <div
                    key={index}
                    className={`day-picker-option ${
                      newHabit.selectedDays.includes(index) ? "selected" : ""
                    }`}
                    onClick={() => toggleDay(index)}
                  >
                    <span className="day-full-name">{dayName}</span>
                    <span className="day-short-name">
                      {dayShortNames[index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="selected-days-info">
                <span>Seçilen günler: {newHabit.selectedDays.length}</span>
                {newHabit.selectedDays.length > 0 && (
                  <span className="selected-days-preview">
                    {newHabit.selectedDays
                      .map((day) => dayShortNames[day])
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="description-selector">
              <p>Neden bu alışkanlığı yapmak istiyorsun?</p>
              <textarea
                placeholder="Bu alışkanlığı yapma sebebin..."
                value={newHabit.description}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, description: e.target.value })
                }
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button onClick={() => setShowForm(false)}>İptal</button>
              <button onClick={addHabit} className="save-btn">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="habits-list">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="habit-item"
            style={{ borderLeft: `4px solid ${habit.color}` }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowConfirm(habit.id);
            }}
          >
            <div className="habit-header">
              <div className="habit-info">
                <span className="habit-icon">{habit.icon}</span>
                <div className="habit-details">
                  <span className="habit-name">{habit.name}</span>
                  <span className="habit-frequency">
                    {getFrequencyLabel(habit)}
                  </span>
                </div>
              </div>
              <div className="habit-stats-row">
                {/* YENİ: ZORLUK BADGE */}
                <div 
                  className="difficulty-badge"
                  style={{
                    backgroundColor: difficultyPoints[habit.difficulty || 'medium'].color + '20',
                    color: difficultyPoints[habit.difficulty || 'medium'].color
                  }}
                >
                  {difficultyPoints[habit.difficulty || 'medium'].label}
                </div>
                
                {/* YENİ: PUAN GÖSTERGESİ */}
                <div className="habit-points">
                  <span className="points-icon">💎</span>
                  <span className="points-value">{habit.currentPoints || 0}</span>
                </div>
                
                <button
                  className="comment-btn"
                  onClick={() => {
                    setShowDescription(habit);
                    setUpdatedDescription(habit.description || "");
                  }}
                >
                  💬
                </button>
                <span className="habit-streak">🔥 {habit.streak}</span>
              </div>
            </div>

            <div className="weekly-progress">
              {getProgressBoxes(habit).map((box, index) => (
                <div
                  key={index}
                  className={`day-box ${box.completed ? "completed" : ""} ${
                    box.isToday ? "today" : ""
                  }`}
                  onDoubleClick={() => toggleHabit(habit, box)}
                >
                  <span className="day-name">{box.label}</span>
                  {box.completed ? "✓" : "○"}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Diğer modal'lar aynı kalıyor... */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <p>Bu alışkanlığı silmek istediğinize emin misiniz?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowConfirm(null)}>İptal</button>
              <button
                onClick={() => deleteHabit(showConfirm)}
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
                placeholder="Açıklama ekle..."
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

export default Solo;