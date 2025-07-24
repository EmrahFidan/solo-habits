import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Badges from './Badges';
import './Dashboard.css';

function Dashboard({ userData, setUserData, soundEnabled }) {
  // State'ler
  const [soloHabits, setSoloHabits] = useState([]);
  const [tatakaeData, setTatakaeData] = useState({
    active: [],
    completed: [],
    stats: {
      totalChallenges: 0,
      activeChallenges: 0,
      completedChallenges: 0,
      totalDays: 0,
      successRate: 0,
      currentPoints: 0,
      totalPoints: 0,
      longestStreak: 0,
      recoveryModeCount: 0
    }
  });
  
  const [hMinusData, setHMinusData] = useState({
    active: [],
    completed: [],
    stats: {
      totalPrograms: 0,
      activePrograms: 0,
      completedPrograms: 0,
      totalCleanDays: 0,
      totalRelapses: 0,
      averageSuccess: 0,
      currentPoints: 0,
      totalPoints: 0,
      longestStreak: 0,
      currentCleanStreaks: 0
    }
  });

  const [recursiveData, setRecursiveData] = useState({
    routines: [],
    stats: {
      totalRoutines: 0,
      todayCompletedRoutines: 0,
      totalCompletions: 0,
      averageCompletionRate: 0,
      activeHabitsInRoutines: 0,
      todayProgress: { completed: 0, total: 0 },
      currentPoints: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyCompletions: 0
    }
  });

  const [stats, setStats] = useState({
    todayCompleted: 0,
    todayTotal: 0,
    weeklyData: [],
    totalStreak: 0,
    completionRate: 0,
    totalSoloPoints: 0,
    todaySoloPoints: 0,
    soloPointsByDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  });

  // Toggle states - Default hepsi kapalı
  const [sectionVisibility, setSectionVisibility] = useState({
    tatakae: false,
    hMinus: false,
    recursive: false,
    solo: false
  });

  // Toggle fonksiyonu
  const toggleSection = (sectionName) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // 🆕 RECURSIVE PUAN SİSTEMİ CALCULATOR
  const calculateRecursivePoints = useCallback((routines) => {
    let totalPoints = 0;
    let currentPoints = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let weeklyCompletions = 0;

    routines.forEach(routine => {
      totalPoints += (routine.totalPoints || 0);
      currentPoints += (routine.currentPoints || 0);
      currentStreak += (routine.currentStreak || 0);
      longestStreak = Math.max(longestStreak, routine.longestStreak || 0);
      weeklyCompletions += (routine.weeklyCompletions || 0);
    });

    return {
      totalPoints,
      currentPoints,
      currentStreak,
      longestStreak,
      weeklyCompletions
    };
  }, []);

  // 🆕 EKSIK FONKSİYONLARI EKLE
  const updateUserRank = useCallback(async (totalPoints) => {
    const ranks = [
      { name: 'E', minPoints: 0 },
      { name: 'D', minPoints: 50 },
      { name: 'C', minPoints: 200 },
      { name: 'B', minPoints: 500 },
      { name: 'A', minPoints: 1000 },
      { name: 'S', minPoints: 2000 }
    ];

    const newRank = ranks.reverse().find(r => totalPoints >= r.minPoints).name;
    
    if (userData?.rank !== newRank) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        rank: newRank,
        totalPoints: totalPoints
      });
      setUserData({ ...userData, rank: newRank, totalPoints });
    }
  }, [userData, setUserData]);

  // RECURSIVE STATS CALCULATOR
  const calculateRecursiveStats = useCallback((routines) => {
    const today = new Date().toISOString().split('T')[0];
    
    const totalRoutines = routines.length;
    const todayCompletedRoutines = routines.filter(r => r.lastCompletedDate === today).length;
    const totalCompletions = routines.reduce((sum, r) => sum + (r.completionCount || 0), 0);
    
    let totalPossibleCompletions = 0;
    let actualCompletions = 0;
    
    routines.forEach(routine => {
      const createdDate = new Date(routine.createdAt?.toDate?.() || routine.createdAt || Date.now());
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalPossibleCompletions += daysSinceCreated;
      actualCompletions += (routine.completionCount || 0);
    });
    
    const averageCompletionRate = totalPossibleCompletions > 0 ? 
      Math.round((actualCompletions / totalPossibleCompletions) * 100) : 0;

    let todayHabitsCompleted = 0;
    let todayHabitsTotal = 0;
    
    routines.forEach(routine => {
      const habitCompletions = routine.habitCompletions || {};
      const habits = routine.pipeline?.filter(item => item.type === 'habit') || [];
      
      habits.forEach(habit => {
        todayHabitsTotal++;
        if (habitCompletions[`${today}_${habit.habitId}`]) {
          todayHabitsCompleted++;
        }
      });
    });

    const activeHabitsInRoutines = routines.reduce((sum, routine) => {
      return sum + (routine.pipeline?.filter(item => item.type === 'habit').length || 0);
    }, 0);

    // 🆕 RECURSIVE PUAN HESAPLAMALARI
    const pointsData = calculateRecursivePoints(routines);

    setRecursiveData(prev => ({
      ...prev,
      stats: {
        totalRoutines,
        todayCompletedRoutines,
        totalCompletions,
        averageCompletionRate,
        activeHabitsInRoutines,
        todayProgress: { completed: todayHabitsCompleted, total: todayHabitsTotal },
        ...pointsData
      }
    }));
  }, [calculateRecursivePoints]);

  // H-MINUS STATS CALCULATOR
  const calculateHMinusStats = useCallback((activeHabits, completedHabits) => {
    const allHabits = [...activeHabits, ...completedHabits];
    
    const totalPrograms = allHabits.length;
    const totalCleanDays = allHabits.reduce((sum, h) => sum + (h.cleanDays || 0), 0);
    const totalRelapses = allHabits.reduce((sum, h) => sum + (h.relapseCount || 0), 0);
    const totalAttemptedDays = totalCleanDays + totalRelapses;
    const averageSuccess = totalAttemptedDays > 0 ? Math.round((totalCleanDays / totalAttemptedDays) * 100) : 0;
    
    const currentPoints = activeHabits.reduce((sum, h) => sum + (h.currentPoints || 0), 0);
    const totalPoints = allHabits.reduce((sum, h) => sum + (h.currentPoints || 0), 0);
    
    let longestStreak = 0;
    let currentCleanStreaks = 0;
    
    allHabits.forEach(habit => {
      longestStreak = Math.max(longestStreak, habit.longestStreak || 0);
    });
    
    activeHabits.forEach(habit => {
      currentCleanStreaks += (habit.currentStreak || 0);
    });

    setHMinusData(prev => ({
      ...prev,
      stats: {
        totalPrograms,
        activePrograms: activeHabits.length,
        completedPrograms: completedHabits.length,
        totalCleanDays,
        totalRelapses,
        averageSuccess,
        currentPoints,
        totalPoints,
        longestStreak,
        currentCleanStreaks
      }
    }));
  }, []);

  // TATAKAE STATS CALCULATOR
  const calculateTatakaeStats = useCallback((activeChallenges, completedChallenges) => {
    const allChallenges = [...activeChallenges, ...completedChallenges];
    
    const totalChallenges = allChallenges.length;
    const totalDays = allChallenges.reduce((sum, c) => sum + (c.completedDays || 0), 0);
    const totalPossibleDays = allChallenges.reduce((sum, c) => sum + (c.duration || 30), 0);
    const successRate = totalPossibleDays > 0 ? Math.round((totalDays / totalPossibleDays) * 100) : 0;
    
    const currentPoints = activeChallenges.reduce((sum, c) => sum + (c.currentPoints || 0), 0);
    const totalPoints = allChallenges.reduce((sum, c) => sum + (c.currentPoints || 0), 0);
    
    let longestStreak = 0;
    allChallenges.forEach(challenge => {
      const progress = challenge.monthlyProgress || [];
      let currentStreak = 0;
      let maxStreak = 0;
      
      progress.forEach(day => {
        if (day) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      
      longestStreak = Math.max(longestStreak, maxStreak);
    });

    const recoveryModeCount = activeChallenges.filter(c => c.recoveryMode).length;

    setTatakaeData(prev => ({
      ...prev,
      stats: {
        totalChallenges,
        activeChallenges: activeChallenges.length,
        completedChallenges: completedChallenges.length,
        totalDays,
        successRate,
        currentPoints,
        totalPoints,
        longestStreak,
        recoveryModeCount
      }
    }));
  }, []);

  // getDaysSinceStart fonksiyonu
  const getDaysSinceStart = useCallback((startDate) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, []);

  // getDayName helper
  const getDayName = (index) => {
    const days = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
    return days[index];
  };

  // SOLO STATS CALCULATOR - 🆕 RECURSIVE PUANLARINI DA DAHIL ET
  const calculateStats = useCallback((habits) => {
    const today = new Date().getDay();
    const todayCompleted = habits.filter(h => h.weeklyProgress?.[today]).length;
    const todayTotal = habits.length;
    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    
    const totalSoloPoints = habits.reduce((sum, h) => sum + (h.currentPoints || 0), 0);
    
    const todaySoloPoints = habits
      .filter(h => h.weeklyProgress?.[today])
      .reduce((sum, h) => {
        const difficulty = h.difficulty || 'medium';
        const points = {
          easy: 1,
          medium: 2,
          hard: 3
        };
        return sum + points[difficulty];
      }, 0);
    
    const soloPointsByDifficulty = habits.reduce((acc, h) => {
      const difficulty = h.difficulty || 'medium';
      acc[difficulty] = (acc[difficulty] || 0) + (h.currentPoints || 0);
      return acc;
    }, { easy: 0, medium: 0, hard: 0 });
    
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const dayCompleted = habits.filter(h => h.weeklyProgress?.[i]).length;
      weeklyData.push({
        day: getDayName(i),
        completed: dayCompleted,
        total: habits.length
      });
    }

    const completionRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    setStats({
      todayCompleted,
      todayTotal,
      weeklyData,
      totalStreak,
      completionRate,
      totalSoloPoints,
      todaySoloPoints,
      soloPointsByDifficulty
    });

    // 🆕 RECURSIVE PUANLARINI DA DAHIL ET
    const combinedPoints = totalSoloPoints + tatakaeData.stats.totalPoints + hMinusData.stats.totalPoints + recursiveData.stats.totalPoints;
    updateUserRank(combinedPoints);
    
    if (window.checkBadges) {
      window.checkBadges(totalStreak);
    }
  }, [updateUserRank, tatakaeData.stats.totalPoints, hMinusData.stats.totalPoints, recursiveData.stats.totalPoints]);

  // getRankProgress fonksiyonu - 🆕 RECURSIVE PUANLARINI DA DAHIL ET
  const getRankProgress = useCallback(() => {
    const points = stats.totalSoloPoints + tatakaeData.stats.totalPoints + hMinusData.stats.totalPoints + recursiveData.stats.totalPoints;
    const ranks = [
      { name: 'E', minPoints: 0, maxPoints: 50 },
      { name: 'D', minPoints: 50, maxPoints: 200 },
      { name: 'C', minPoints: 200, maxPoints: 500 },
      { name: 'B', minPoints: 500, maxPoints: 1000 },
      { name: 'A', minPoints: 1000, maxPoints: 2000 },
      { name: 'S', minPoints: 2000, maxPoints: 9999 }
    ];

    const currentRankData = ranks.find(r => r.name === userData?.rank) || ranks[0];
    const progress = ((points - currentRankData.minPoints) / (currentRankData.maxPoints - currentRankData.minPoints)) * 100;
    
    return {
      progress: Math.min(progress, 100),
      current: points,
      next: currentRankData.maxPoints
    };
  }, [stats.totalSoloPoints, tatakaeData.stats.totalPoints, hMinusData.stats.totalPoints, recursiveData.stats.totalPoints, userData?.rank]);

  // getTodayRoutineProgress fonksiyonu
  const getTodayRoutineProgress = useCallback((routine) => {
    const today = new Date().toISOString().split('T')[0];
    const currentCompletions = routine.habitCompletions || {};
    
    const habits = routine.pipeline?.filter(item => item.type === 'habit') || [];
    const completedHabits = habits.filter(item => 
      currentCompletions[`${today}_${item.habitId}`]
    );
    
    return {
      completed: completedHabits.length,
      total: habits.length,
      isFullyCompleted: completedHabits.length === habits.length && habits.length > 0
    };
  }, []);

  // 🆕 useEffect'leri ekle
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "solo"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSoloHabits(habits);
      calculateStats(habits);
    });

    return unsubscribe;
  }, [calculateStats]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "tatakae"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const active = allChallenges.filter(c => getDaysSinceStart(c.startDate) < (c.duration || 30));
      const completed = allChallenges.filter(c => getDaysSinceStart(c.startDate) >= (c.duration || 30));
      
      setTatakaeData(prev => ({
        ...prev,
        active,
        completed
      }));
      
      calculateTatakaeStats(active, completed);
    });

    return unsubscribe;
  }, [calculateTatakaeStats, getDaysSinceStart]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "h-minus"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allHabits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const active = allHabits.filter(h => getDaysSinceStart(h.startDate) < (h.duration || 30));
      const completed = allHabits.filter(h => getDaysSinceStart(h.startDate) >= (h.duration || 30));
      
      setHMinusData(prev => ({
        ...prev,
        active,
        completed
      }));
      
      calculateHMinusStats(active, completed);
    });

    return unsubscribe;
  }, [calculateHMinusStats, getDaysSinceStart]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "routines"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setRecursiveData(prev => ({
        ...prev,
        routines
      }));
      
      calculateRecursiveStats(routines);
    });

    return unsubscribe;
  }, [calculateRecursiveStats]);

  // SectionHeader Component
  const SectionHeader = ({ title, icon, sectionKey, isVisible, children, toggleable = true }) => (
    <div className={`dashboard-section ${!isVisible ? 'collapsed' : ''} ${!toggleable ? 'non-toggleable' : ''}`}>
      <div 
        className="section-header" 
        onClick={toggleable ? () => toggleSection(sectionKey) : undefined}
        style={{ cursor: toggleable ? 'pointer' : 'default' }}
      >
        <h3>
          <span className="section-icon">{icon}</span>
          {title}
        </h3>
        {toggleable && (
          <span className={`toggle-icon ${isVisible ? 'expanded' : 'collapsed'}`}>
            {isVisible ? '▼' : '▶'}
          </span>
        )}
      </div>
      {(isVisible || !toggleable) && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );

  const rankProgress = getRankProgress();

  return (
    <div className="dashboard-container">
      {/* User Profile */}
      <div className="user-section">
        <div className="user-profile">
          <div className="rank-circle">{userData?.rank || 'E'}</div>
          <div className="user-info">
            <div className="user-name">{userData?.name} {userData?.surname}</div>
            <div className="rank-progress-container">
              <div className="rank-progress-bar">
                <div 
                  className="rank-progress-fill" 
                  style={{ width: `${rankProgress.progress}%` }}
                />
              </div>
              <span className="rank-progress-text">
                {rankProgress.current} / {rankProgress.next} puan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1️⃣ HAFTALIK PERFORMANS - TOGGLE YOK, HEP AÇIK */}
      <SectionHeader 
        title="Haftalık Performans" 
        icon="📈" 
        sectionKey="lineGraph" 
        isVisible={true}
        toggleable={false}
      >
        <div className="weekly-chart">
          <div className="chart-container">
            {stats.weeklyData.map((day, index) => (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar"
                    style={{ 
                      height: `${day.total ? (day.completed / day.total) * 100 : 0}%`,
                      background: index === new Date().getDay() ? 
                        'linear-gradient(135deg, #667eea, #764ba2)' : 
                        'linear-gradient(135deg, #4facfe, #00f2fe)'
                    }}
                  />
                </div>
                <span className="chart-label">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionHeader>

      {/* 2️⃣ TATAKAE - TOGGLE VAR, DEFAULT KAPALI */}
      <SectionHeader 
        title="Tatakae Challenge Özeti" 
        icon="⚡" 
        sectionKey="tatakae" 
        isVisible={sectionVisibility.tatakae}
        toggleable={true}
      >
        <div className="tatakae-stats-grid">
          <div className="tatakae-stat-card active">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h4>Aktif Challenge</h4>
              <div className="stat-value">{tatakaeData.stats.activeChallenges}</div>
              {tatakaeData.stats.recoveryModeCount > 0 && (
                <div className="stat-label recovery">🔄 {tatakaeData.stats.recoveryModeCount} Recovery Mode</div>
              )}
            </div>
          </div>
          
          <div className="tatakae-stat-card completed">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h4>Tamamlanan</h4>
              <div className="stat-value">{tatakaeData.stats.completedChallenges}</div>
              <div className="stat-label">%{tatakaeData.stats.successRate} başarı oranı</div>
            </div>
          </div>
          
          <div className="tatakae-stat-card points">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h4>Toplam Puan</h4>
              <div className="stat-value">{tatakaeData.stats.totalPoints}</div>
              <div className="stat-label">{tatakaeData.stats.currentPoints} aktif puan</div>
            </div>
          </div>
          
          <div className="tatakae-stat-card streak">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>En Uzun Streak</h4>
              <div className="stat-value">{tatakaeData.stats.longestStreak}</div>
              <div className="stat-label">gün art arda</div>
            </div>
          </div>
        </div>

        {/* Active Challenges Preview */}
        {tatakaeData.active.length > 0 && (
          <div className="active-challenges-list">
            {tatakaeData.active.slice(0, 3).map(challenge => {
              const completionRate = Math.round(((challenge.completedDays || 0) / (challenge.duration || 30)) * 100);
              const daysSinceStart = getDaysSinceStart(challenge.startDate);
              
              return (
                <div key={challenge.id} className="mini-challenge-card" style={{ borderLeft: `4px solid ${challenge.color}` }}>
                  <div className="mini-challenge-header">
                    <span className="mini-challenge-icon">{challenge.icon}</span>
                    <div className="mini-challenge-info">
                      <h5>{challenge.name}</h5>
                      <p>{daysSinceStart + 1}. Gün • {completionRate}% tamamlandı</p>
                    </div>
                    {challenge.recoveryMode && (
                      <div className="recovery-indicator">🔄</div>
                    )}
                  </div>
                  <div className="mini-progress-bar">
                    <div 
                      className="mini-progress-fill" 
                      style={{ 
                        width: `${completionRate}%`,
                        backgroundColor: challenge.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {tatakaeData.active.length > 3 && (
              <p className="more-challenges">+{tatakaeData.active.length - 3} challenge daha...</p>
            )}
          </div>
        )}
      </SectionHeader>

      {/* 3️⃣ H-MINUS - TOGGLE VAR, DEFAULT KAPALI */}
      <SectionHeader 
        title="H- (Habit Minus) Özeti" 
        icon="🚫" 
        sectionKey="hMinus" 
        isVisible={sectionVisibility.hMinus}
        toggleable={true}
      >
        <div className="h-minus-stats-grid">
          <div className="h-minus-stat-card active">
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
              <h4>Aktif Program</h4>
              <div className="stat-value">{hMinusData.stats.activePrograms}</div>
              <div className="stat-label">kötü alışkanlık takibi</div>
            </div>
          </div>
          
          <div className="h-minus-stat-card completed">
            <div className="stat-icon">🧹</div>
            <div className="stat-content">
              <h4>Temiz Günler</h4>
              <div className="stat-value">{hMinusData.stats.totalCleanDays}</div>
              <div className="stat-label">toplam temiz kalınan gün</div>
            </div>
          </div>
          
          <div className="h-minus-stat-card success">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Başarı Oranı</h4>
              <div className="stat-value">{hMinusData.stats.averageSuccess}%</div>
              <div className="stat-label">ortalama temizlik oranı</div>
            </div>
          </div>
          
          <div className="h-minus-stat-card streak">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h4>En Uzun Streak</h4>
              <div className="stat-value">{hMinusData.stats.longestStreak}</div>
              <div className="stat-label">gün art arda temiz</div>
            </div>
          </div>
        </div>

        {/* Active H- Preview */}
        {hMinusData.active.length > 0 && (
          <div className="active-h-minus-list">
            {hMinusData.active.slice(0, 3).map(habit => {
              const cleanDays = habit.cleanDays || 0;
              const relapseCount = habit.relapseCount || 0;
              const totalDays = cleanDays + relapseCount;
              const successRate = totalDays ? Math.round((cleanDays / totalDays) * 100) : 0;
              const daysSinceStart = getDaysSinceStart(habit.startDate);
              
              return (
                <div key={habit.id} className="mini-h-minus-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
                  <div className="mini-h-minus-header">
                    <span className="mini-h-minus-icon">{habit.icon}</span>
                    <div className="mini-h-minus-info">
                      <h5>{habit.name}</h5>
                      <p>{daysSinceStart + 1}. Gün • {successRate}% temiz • 🧹 {habit.currentStreak || 0} streak</p>
                    </div>
                    {relapseCount > 0 && (
                      <div className="relapse-indicator">😞 {relapseCount}</div>
                    )}
                  </div>
                  <div className="mini-progress-bar">
                    <div 
                      className="mini-progress-fill" 
                      style={{ 
                        width: `${successRate}%`,
                        backgroundColor: successRate > 80 ? '#43e97b' : successRate > 60 ? '#feca57' : '#ff6b6b'
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {hMinusData.active.length > 3 && (
              <p className="more-h-minus">+{hMinusData.active.length - 3} H- takibi daha...</p>
            )}
          </div>
        )}
      </SectionHeader>

      {/* 4️⃣ RECURSIVE - TOGGLE VAR, DEFAULT KAPALI - 🆕 PUANLAR EKLENDİ */}
      <SectionHeader 
        title="Recursive Rutin Özeti" 
        icon="🔄" 
        sectionKey="recursive" 
        isVisible={sectionVisibility.recursive}
        toggleable={true}
      >
        <div className="recursive-stats-grid">
          <div className="recursive-stat-card active">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h4>Aktif Rutinler</h4>
              <div className="stat-value">{recursiveData.stats.totalRoutines}</div>
              <div className="stat-label">toplam rutin</div>
            </div>
          </div>
          
          <div className="recursive-stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Bugün Tamamlanan</h4>
              <div className="stat-value">{recursiveData.stats.todayCompletedRoutines}</div>
              <div className="stat-label">rutin tamamlandı</div>
            </div>
          </div>
          
          <div className="recursive-stat-card habits">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <h4>Toplam Puan</h4>
              <div className="stat-value">{recursiveData.stats.totalPoints}</div>
              <div className="stat-label">{recursiveData.stats.currentPoints} aktif puan</div>
            </div>
          </div>
          
          <div className="recursive-stat-card rate">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h4>En Uzun Streak</h4>
              <div className="stat-value">{recursiveData.stats.longestStreak}</div>
              <div className="stat-label">gün art arda</div>
            </div>
          </div>
        </div>

        {/* Active Routines Preview */}
        {recursiveData.routines.length > 0 && (
          <div className="active-routines-list">
            {recursiveData.routines.slice(0, 3).map(routine => {
              const progress = getTodayRoutineProgress(routine);
              const isCompleted = routine.lastCompletedDate === new Date().toISOString().split('T')[0];
              
              return (
                <div key={routine.id} className="mini-routine-card" style={{ borderLeft: `4px solid ${routine.color}` }}>
                  <div className="mini-routine-header">
                    <span className="mini-routine-icon">{routine.icon}</span>
                    <div className="mini-routine-info">
                      <h5>{routine.name}</h5>
                      <p>
                        {progress.completed}/{progress.total} habit • 
                        {isCompleted ? ' ✅ Bugün tamamlandı' : ' ⏳ Devam ediyor'} •
                        💎 {routine.currentPoints || 0} puan • 
                        🔥 {routine.currentStreak || 0} streak
                      </p>
                    </div>
                  </div>
                  <div className="mini-progress-bar">
                    <div 
                      className="mini-progress-fill" 
                      style={{ 
                        width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
                        backgroundColor: isCompleted ? '#43e97b' : routine.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {recursiveData.routines.length > 3 && (
              <p className="more-routines">+{recursiveData.routines.length - 3} rutin daha...</p>
            )}
          </div>
        )}
      </SectionHeader>

      {/* 5️⃣ SOLO - TOGGLE VAR, DEFAULT KAPALI */}
      <SectionHeader 
        title="Solo Alışkanlık Özeti" 
        icon="🌟" 
        sectionKey="solo" 
        isVisible={sectionVisibility.solo}
        toggleable={true}
      >
        {/* COMBINED STATS GRID - 🆕 RECURSIVE PUANLARINI DA DAHIL ET */}
        <div className="stats-grid">
          <div className="stat-card today-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Bugün (Solo)</h3>
              <div className="stat-value">{stats.todayCompleted}/{stats.todayTotal}</div>
              <div className="stat-label">Tamamlandı</div>
            </div>
            <div className="completion-circle">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#444"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="3"
                  strokeDasharray={`${stats.completionRate}, 100`}
                />
              </svg>
              <div className="percentage">{stats.completionRate}%</div>
            </div>
          </div>

          <div className="stat-card streak-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>Solo Streak</h3>
              <div className="stat-value">{stats.totalStreak}</div>
              <div className="stat-label">Gün</div>
            </div>
          </div>

          <div className="stat-card habits-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Toplam Aktivite</h3>
              <div className="stat-value">{soloHabits.length + tatakaeData.stats.activeChallenges + hMinusData.stats.activePrograms + recursiveData.stats.totalRoutines}</div>
              <div className="stat-label">{soloHabits.length} Solo + {tatakaeData.stats.activeChallenges} Challenge + {hMinusData.stats.activePrograms} H- + {recursiveData.stats.totalRoutines} Rutin</div>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITIES */}
        <div className="recent-activities">
          <h3>📱 Bugünkü Aktiviteler</h3>
          <div className="activities-list">
            {soloHabits.map(habit => {
              const today = new Date().getDay();
              const completed = habit.weeklyProgress?.[today];
              const difficulty = habit.difficulty || 'medium';
              const difficultyColors = {
                easy: '#43e97b',
                medium: '#feca57',
                hard: '#ff6b6b'
              };
              
              return (
                <div key={habit.id} className={`activity-item ${completed ? 'completed' : ''}`}>
                  <span className="activity-icon">{habit.icon}</span>
                  <span className="activity-name">{habit.name}</span>
                  <span className="activity-type solo">Solo</span>
                  <span 
                    className="activity-difficulty"
                    style={{ color: difficultyColors[difficulty] }}
                  >
                    {difficulty === 'easy' ? 'Kolay' : difficulty === 'medium' ? 'Orta' : 'Zor'}
                  </span>
                  <span className="activity-points">
                    💎 {habit.currentPoints || 0}
                  </span>
                  <span className="activity-status">
                    {completed ? '✅' : '⏳'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </SectionHeader>

      {/* 6️⃣ ROZETLER - TOGGLE YOK, HEP AÇIK */}
      <SectionHeader 
        title="Rozetlerim" 
        icon="🏅" 
        sectionKey="badges" 
        isVisible={true}
        toggleable={false}
      >
        <Badges 
          soundEnabled={soundEnabled}
          showNotification={(message) => {
            console.log(message);
            if (soundEnabled && window.playSound) {
              window.playSound('milestone25');
            }
          }} 
        />
      </SectionHeader>
    </div>
  );
}

export default Dashboard;