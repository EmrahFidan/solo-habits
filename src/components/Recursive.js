// Recursive.js - Puan sistemi eklenmiş versiyon

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
} from "firebase/firestore";
import "./Recursive.css";

function Recursive({ soundEnabled }) {
  const [routines, setRoutines] = useState([]);
  const [soloHabits, setSoloHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: "",
    icon: "🔄",
    color: "#667eea",
    description: "",
    timeOfDay: "morning",
    pipeline: []
  });
  const [showConfirm, setShowConfirm] = useState(null);
  const [showDescription, setShowDescription] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");

  // 🆕 PUAN SİSTEMİ SABITLERI
  const ROUTINE_BASE_POINTS = 3;
  const HABIT_BONUS_POINTS = 0.5;
  const STREAK_MULTIPLIERS = {
    7: 1.5,   // 1 hafta: %50 bonus
    30: 2.0,  // 1 ay: %100 bonus
    90: 3.0   // 3 ay: %200 bonus
  };

  const icons = [
    "🔄", "🌅", "🌙", "💪", "📚", "☯️", "🎯", "⚡", "🌟", "🔥",
    "🧘", "📝", "🎵", "🍃", "☀️", "🌸", "⭐", "🎨", "🚀", "💎",
    "🎪", "🎭", "🎬", "🎮", "📖", "✨", "🌊", "🌈", "🦋", "🌺"
  ];

  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b", "#fa709a", 
    "#30cfd0", "#a8edea", "#ff9a9e", "#fecfef", "#ffecd2", "#fcb69f"
  ];

  const timeOfDayOptions = [
    { value: "morning", label: "Sabah", icon: "🌅", color: "#feca57" },
    { value: "afternoon", label: "Öğleden Sonra", icon: "☀️", color: "#48dbfb" },
    { value: "evening", label: "Akşam", icon: "🌙", color: "#ff9ff3" },
    { value: "night", label: "Gece", icon: "🌌", color: "#667eea" },
    { value: "anytime", label: "Herhangi Bir Zaman", icon: "⏰", color: "#54a0ff" }
  ];

  // SOLO alışkanlıklarını fetch et
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "solo"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSoloHabits(habits);
    });
    return unsubscribe;
  }, []);

  // Rutinleri fetch et
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "routines"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRoutines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedRoutines.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });
      setRoutines(fetchedRoutines);
    });
    return unsubscribe;
  }, []);

  // 🆕 Günlük reset kontrol
  useEffect(() => {
    const checkDailyReset = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastCheck = localStorage.getItem('lastRoutineCheck');
      
      if (lastCheck !== today) {
        console.log('🔄 Routines günlük reset yapılıyor...');
        localStorage.setItem('lastRoutineCheck', today);
      }
    };
    
    checkDailyReset();
  }, []);

  // 🆕 PUAN HESAPLAMA FONKSİYONLARI
  const calculateRoutinePoints = (routine) => {
    const habitCount = routine.pipeline?.filter(item => item.type === 'habit').length || 0;
    return ROUTINE_BASE_POINTS + (habitCount * HABIT_BONUS_POINTS);
  };

  const calculateStreakBonus = (routine) => {
    const completionCount = routine.completionCount || 0;
    const createdDate = new Date(routine.createdAt?.toDate?.() || routine.createdAt || Date.now());
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Streak hesaplama (basitleştirilmiş - art arda tamamlama)
    const consistencyRate = daysSinceCreated > 0 ? completionCount / daysSinceCreated : 0;
    
    // Milestone streak bonusları
    let streakMultiplier = 1;
    if (completionCount >= 90) streakMultiplier = STREAK_MULTIPLIERS[90];
    else if (completionCount >= 30) streakMultiplier = STREAK_MULTIPLIERS[30];
    else if (completionCount >= 7) streakMultiplier = STREAK_MULTIPLIERS[7];
    
    return { consistencyRate, streakMultiplier, completionCount };
  };

  const addRoutine = async () => {
    if (!newRoutine.name.trim() || newRoutine.pipeline.length === 0) {
      alert("Rutin adı ve en az bir pipeline öğesi gerekli!");
      return;
    }

    if (soundEnabled && window.playSound) {
      window.playSound('button-click');
    }

    const habitIds = newRoutine.pipeline
      .filter(item => item.type === 'habit')
      .map(item => item.habitId);

    // 🆕 Puan sistemi field'ları eklendi
    await addDoc(collection(db, "routines"), {
      ...newRoutine,
      userId: auth.currentUser.uid,
      habitCompletions: {},
      completionCount: 0,
      lastCompletedDate: null,
      habitIds: habitIds,
      // 🆕 PUAN SİSTEMİ FIELD'LARI
      currentPoints: 0,
      totalPoints: 0,
      routineStreakCount: 0,
      lastPointsUpdated: new Date(),
      createdAt: new Date(),
    });

    setNewRoutine({
      name: "",
      icon: "🔄",
      color: "#667eea",
      description: "",
      timeOfDay: "morning",
      pipeline: []
    });
    setShowForm(false);
  };

  const deleteRoutine = async (id) => {
    await deleteDoc(doc(db, "routines", id));
    setShowConfirm(null);
  };

  const updateDescription = async (routineId) => {
    await updateDoc(doc(db, "routines", routineId), {
      description: updatedDescription,
    });
    setShowDescription(null);
    setUpdatedDescription("");
  };

  // Pipeline'a habit ekle
  const addHabitToPipeline = (habitId) => {
    if (!habitId) return;
    const newPipeline = [...newRoutine.pipeline];
    newPipeline.push({ type: 'habit', habitId: habitId });
    setNewRoutine({ ...newRoutine, pipeline: newPipeline });
  };

  // Pipeline'a not ekle
  const addNoteToPipeline = () => {
    const noteText = prompt("Not ekle:");
    if (!noteText?.trim()) return;
    const newPipeline = [...newRoutine.pipeline];
    newPipeline.push({ type: 'note', text: noteText.trim() });
    setNewRoutine({ ...newRoutine, pipeline: newPipeline });
  };

  // Pipeline öğesini kaldır
  const removePipelineItem = (index) => {
    const newPipeline = newRoutine.pipeline.filter((_, i) => i !== index);
    setNewRoutine({ ...newRoutine, pipeline: newPipeline });
  };

  // Pipeline öğesini yukarı taşı
  const movePipelineItemUp = (index) => {
    if (index === 0) return;
    const newPipeline = [...newRoutine.pipeline];
    [newPipeline[index], newPipeline[index - 1]] = [newPipeline[index - 1], newPipeline[index]];
    setNewRoutine({ ...newRoutine, pipeline: newPipeline });
  };

  // Pipeline öğesini aşağı taşı
  const movePipelineItemDown = (index) => {
    if (index === newRoutine.pipeline.length - 1) return;
    const newPipeline = [...newRoutine.pipeline];
    [newPipeline[index], newPipeline[index + 1]] = [newPipeline[index + 1], newPipeline[index]];
    setNewRoutine({ ...newRoutine, pipeline: newPipeline });
  };

  // Habit bilgisini al
  const getHabitById = (habitId) => {
    return soloHabits.find(h => h.id === habitId);
  };

  // 🆕 GÜNCELLEN MİŞ HABIT TAMAMLAMA FONKSİYONU - PUAN SİSTEMİ DAHIL
  const toggleHabitCompletion = async (routine, habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const currentCompletions = routine.habitCompletions || {};
    
    const todayKey = `${today}_${habitId}`;
    const isCurrentlyCompleted = currentCompletions[todayKey] || false;
    
    const newCompletions = {
      ...currentCompletions,
      [todayKey]: !isCurrentlyCompleted
    };

    const todayHabits = routine.pipeline.filter(item => item.type === 'habit');
    const completedToday = todayHabits.filter(item => 
      newCompletions[`${today}_${item.habitId}`]
    ).length;
    
    const allHabitsCompleted = completedToday === todayHabits.length;
    const wasRoutineCompleted = routine.lastCompletedDate === today;
    
    let updateData = {
      habitCompletions: newCompletions,
      lastUpdated: new Date(),
    };

    // 🆕 PUAN HESAPLAMA
    if (allHabitsCompleted && !wasRoutineCompleted) {
      // Routine tamamlandı - puan ver!
      const basePoints = calculateRoutinePoints(routine);
      const { streakMultiplier } = calculateStreakBonus(routine);
      
      const earnedPoints = Math.round(basePoints * streakMultiplier);
      const newCompletionCount = (routine.completionCount || 0) + 1;
      const newTotalPoints = (routine.totalPoints || 0) + earnedPoints;
      
      updateData.completionCount = newCompletionCount;
      updateData.lastCompletedDate = today;
      updateData.currentPoints = earnedPoints;
      updateData.totalPoints = newTotalPoints;
      updateData.lastPointsUpdated = new Date();
      
      // Streak bonus bildirim
      if (streakMultiplier > 1) {
        console.log(`🔥 STREAK BONUS! ${basePoints} × ${streakMultiplier} = ${earnedPoints} puan!`);
        if (soundEnabled && window.playSound) {
          window.playSound('milestone75');
        }
      } else {
        console.log(`🎉 Routine tamamlandı! +${earnedPoints} puan kazandın!`);
        if (soundEnabled && window.playSound) {
          window.playSound('milestone25');
        }
      }
    } else if (wasRoutineCompleted && !allHabitsCompleted) {
      // Routine tamamlanması geri alındı - puanı sıfırla
      updateData.currentPoints = 0;
      if (completedToday === todayHabits.length - 1) {
        updateData.lastCompletedDate = null;
        updateData.completionCount = Math.max(0, (routine.completionCount || 0) - 1);
      }
    }

    await updateDoc(doc(db, "routines", routine.id), updateData);

    if (soundEnabled && window.playSound && !isCurrentlyCompleted) {
      window.playSound('complete');
    }
  };

  // 🆕 Bugün tamamlanan habit sayısını al
  const getTodayProgress = (routine) => {
    const today = new Date().toISOString().split('T')[0];
    const currentCompletions = routine.habitCompletions || {};
    
    const habits = routine.pipeline.filter(item => item.type === 'habit');
    const completedHabits = habits.filter(item => 
      currentCompletions[`${today}_${item.habitId}`]
    );
    
    return {
      completed: completedHabits.length,
      total: habits.length,
      isFullyCompleted: completedHabits.length === habits.length && habits.length > 0
    };
  };

  // 🆕 Habit'in bugün tamamlanıp tamamlanmadığını kontrol et
  const isHabitCompletedToday = (routine, habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const currentCompletions = routine.habitCompletions || {};
    return currentCompletions[`${today}_${habitId}`] || false;
  };

  // Rutinin bugün tamamlanıp tamamlanmadığını kontrol et
  const isRoutineCompletedToday = (routine) => {
    const today = new Date().toISOString().split('T')[0];
    return routine.lastCompletedDate === today;
  };

  return (
    <div className="recursive-container">
      <div className="recursive-header">
        <h1>🔄 RECURSIVE</h1>
        <p>SOLO alışkanlıklarından güçlü rutinler oluştur!</p>
      </div>

      <button className="add-routine-btn" onClick={() => setShowForm(true)}>
        <span>+</span> Yeni Rutin Oluştur
      </button>

      {/* Form Modal - aynı kalıyor */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="routine-form" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Rutin Pipeline'ı</h3>
            <p style={{textAlign: 'center', color: 'rgba(204, 201, 220, 0.7)', fontSize: '14px', marginBottom: '20px'}}>
              SOLO alışkanlıklarını zincirleme birbirine bağla!
            </p>

            <input
              type="text"
              placeholder="Rutin adı... (ör: Sabah Enerjim, Akşam Rahatlama)"
              value={newRoutine.name}
              onChange={(e) =>
                setNewRoutine({ ...newRoutine, name: e.target.value })
              }
            />

            <div className="icon-selector">
              <p>İkon seç:</p>
              <div className="icon-grid">
                {icons.map((icon, index) => (
                  <div
                    key={`icon-${index}-${icon}`}
                    className={`icon-option ${
                      newRoutine.icon === icon ? "selected" : ""
                    }`}
                    onClick={() => setNewRoutine({ ...newRoutine, icon })}
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
                      newRoutine.color === color ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewRoutine({ ...newRoutine, color })}
                  />
                ))}
              </div>
            </div>

            <div className="time-of-day-selector">
              <p>Ne zaman yapılacak:</p>
              <div className="time-grid">
                {timeOfDayOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`time-option ${
                      newRoutine.timeOfDay === option.value ? "selected" : ""
                    }`}
                    onClick={() => setNewRoutine({ ...newRoutine, timeOfDay: option.value })}
                  >
                    <span className="time-icon">{option.icon}</span>
                    <span className="time-label">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pipeline-builder">
              <p>Pipeline Oluştur:</p>
              
              <div className="pipeline-actions">
                <select 
                  onChange={(e) => addHabitToPipeline(e.target.value)}
                  value=""
                >
                  <option value="">SOLO Alışkanlık Ekle</option>
                  {soloHabits.map(habit => (
                    <option key={habit.id} value={habit.id}>
                      {habit.icon} {habit.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addNoteToPipeline} className="add-note-btn">
                  📝 Not Ekle
                </button>
              </div>

              <div className="pipeline-preview">
                {newRoutine.pipeline.length === 0 ? (
                  <div className="empty-pipeline">
                    <p>Pipeline boş. Yukarıdan alışkanlık veya not ekle!</p>
                  </div>
                ) : (
                  <div className="pipeline-items">
                    {newRoutine.pipeline.map((item, index) => (
                      <div key={index} className="pipeline-item">
                        <div className="pipeline-content">
                          {item.type === 'habit' ? (
                            <div className="habit-item">
                              <span className="habit-icon">{getHabitById(item.habitId)?.icon || '❓'}</span>
                              <span className="habit-name">{getHabitById(item.habitId)?.name || 'Silinmiş Alışkanlık'}</span>
                            </div>
                          ) : (
                            <div className="note-item">
                              <span className="note-icon">📝</span>
                              <span className="note-text">{item.text}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pipeline-controls">
                          <button onClick={() => movePipelineItemUp(index)} disabled={index === 0}>⬆️</button>
                          <button onClick={() => movePipelineItemDown(index)} disabled={index === newRoutine.pipeline.length - 1}>⬇️</button>
                          <button onClick={() => removePipelineItem(index)}>❌</button>
                        </div>
                        
                        {index < newRoutine.pipeline.length - 1 && (
                          <div className="pipeline-arrow">⬇️</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="description-selector">
              <p>Rutin açıklaması (isteğe bağlı):</p>
              <textarea
                placeholder="Bu rutini neden oluşturuyorsun?"
                value={newRoutine.description}
                onChange={(e) =>
                  setNewRoutine({ ...newRoutine, description: e.target.value })
                }
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button onClick={() => setShowForm(false)}>İptal</button>
              <button onClick={addRoutine} className="save-btn">
                Rutin Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 GÜNCELLEN MİŞ Routines List - PUAN SİSTEMİ DAHIL */}
      <div className="routines-list">
        {routines.map((routine) => {
          const progress = getTodayProgress(routine);
          const isCompleted = isRoutineCompletedToday(routine);
          const routinePoints = calculateRoutinePoints(routine);
          const { streakMultiplier } = calculateStreakBonus(routine);
          
          return (
            <div
              key={`routine-${routine.id}`}
              className={`routine-item ${isCompleted ? 'completed-today' : ''}`}
              style={{ borderLeft: `4px solid ${routine.color}` }}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowConfirm(routine.id);
              }}
            >
              <div className="routine-header">
                <div className="routine-info">
                  <span className="routine-icon">{routine.icon}</span>
                  <div className="routine-details">
                    <div className="routine-title-row">
                      <span className="routine-name">{routine.name}</span>
                      <div className="time-badge" style={{
                        backgroundColor: timeOfDayOptions.find(t => t.value === routine.timeOfDay)?.color + '20',
                        color: timeOfDayOptions.find(t => t.value === routine.timeOfDay)?.color
                      }}>
                        {timeOfDayOptions.find(t => t.value === routine.timeOfDay)?.icon}
                        {timeOfDayOptions.find(t => t.value === routine.timeOfDay)?.label}
                      </div>
                    </div>
                    <span className="routine-stats">
                      {routine.completionCount || 0} kez tamamlandı • Bugün: {progress.completed}/{progress.total}
                      {routine.lastCompletedDate && ` • Son: ${new Date(routine.lastCompletedDate).toLocaleDateString('tr-TR')}`}
                      {/* 🆕 PUAN BİLGİSİ */}
                      {routine.totalPoints > 0 && ` • 💎 ${routine.totalPoints} toplam puan`}
                    </span>
                  </div>
                </div>
                <div className="routine-actions">
                  <button
                    className="comment-btn"
                    onClick={() => {
                      setShowDescription(routine);
                      setUpdatedDescription(routine.description || "");
                    }}
                  >
                    💬
                  </button>
                  
                  {/* 🆕 PUAN GÖSTERGESİ */}
                  <div className="routine-points-display" style={{
                    background: 'rgba(102, 126, 234, 0.15)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#667eea'
                  }}>
                    💎 {routinePoints.toFixed(1)} puan/gün
                    {streakMultiplier > 1 && (
                      <span style={{ color: '#feca57', marginLeft: '4px' }}>
                        (🔥 ×{streakMultiplier})
                      </span>
                    )}
                  </div>

                  <div className="progress-badge" style={{
                    backgroundColor: progress.isFullyCompleted ? '#43e97b20' : '#667eea20',
                    color: progress.isFullyCompleted ? '#43e97b' : '#667eea'
                  }}>
                    {progress.isFullyCompleted ? '✅ Tamamlandı!' : `${progress.completed}/${progress.total} tamamlandı`}
                  </div>
                </div>
              </div>

              {/* 🆕 Interactive Pipeline */}
              <div className="routine-pipeline">
                {routine.pipeline?.map((item, index) => (
                  <div key={index} className="pipeline-step">
                    <div className={`step-content ${item.type === 'habit' ? 'habit-step' : 'note-step'}`}>
                      {item.type === 'habit' ? (
                        <div className="interactive-habit">
                          <button
                            className={`habit-checkbox ${isHabitCompletedToday(routine, item.habitId) ? 'completed' : ''}`}
                            onClick={() => toggleHabitCompletion(routine, item.habitId)}
                          >
                            {isHabitCompletedToday(routine, item.habitId) ? '✅' : '⏳'}
                          </button>
                          <span className="step-icon">{getHabitById(item.habitId)?.icon || '❓'}</span>
                          <span className={`step-text ${isHabitCompletedToday(routine, item.habitId) ? 'completed-text' : ''}`}>
                            {getHabitById(item.habitId)?.name || 'Silinmiş Alışkanlık'}
                          </span>
                        </div>
                      ) : (
                        <div className="note-display">
                          <span className="step-icon">📝</span>
                          <span className="step-text note-text">{item.text}</span>
                        </div>
                      )}
                    </div>
                    {index < routine.pipeline.length - 1 && (
                      <div className="step-arrow">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {routines.length === 0 && (
        <div className="empty-state">
          <h3>🔄 Henüz rutinin yok</h3>
          <p>SOLO alışkanlıklarından ilk rutinini oluştur!</p>
          {soloHabits.length === 0 && (
            <p style={{color: '#ff6b6b', marginTop: '10px'}}>
              ⚠️ Önce SOLO sekmesinden alışkanlık eklemelisin
            </p>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <p>Bu rutini silmek istediğinize emin misiniz?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowConfirm(null)}>İptal</button>
              <button
                onClick={() => deleteRoutine(showConfirm)}
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
                placeholder="Rutin açıklaması..."
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

export default Recursive;