import React, { useState, useEffect, useCallback } from "react";
import "./Main.css";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { goodHabitsSteps, badHabitsSteps, DAY_NAMES } from "../constants/habitSteps";
import { validateUser, validateUserData, validateFunction } from "../utils/propTypes";

function Main({ user, userData, setActiveTab }) {
  const [randomTip, setRandomTip] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [personalBest, setPersonalBest] = useState({
    longestStreak: { days: 0, challengeName: '', icon: '🎯' },
    bestMonthlyRate: { percentage: 0, month: '', year: '' },
    totalDiamonds: 0,
    totalChallenges: 0,
    longestCleanStreak: { days: 0, habitName: '', icon: '🚫' },
    bestCleanMonth: { percentage: 0, month: '', year: '' },
    totalCleanDiamonds: 0,
    totalHabitsQuitted: 0
  });

  // Kullanıcı adını al - Firestore'dan name ve surname, yoksa email'den al
  const getUserName = () => {
    console.log('🔍 userData:', userData);
    console.log('📝 Name:', userData?.name);
    console.log('📝 Surname:', userData?.surname);
    
    if (userData?.name && userData?.surname) {
      return `${userData.name} ${userData.surname}`;
    } else if (userData?.name) {
      return userData.name;
    } else if (user?.displayName) {
      return user.displayName;
    } else if (user?.email) {
      // Email'den @ öncesini al
      return user.email.split('@')[0];
    }
    return "Kullanıcı";
  };

  // Arrays artık constants'tan import ediliyor - optimizasyon tamamlandı

  // Rastgele taktik seçme fonksiyonu
  const getRandomTip = useCallback(() => {
    const allTips = [...goodHabitsSteps, ...badHabitsSteps];
    const randomStep = allTips[Math.floor(Math.random() * allTips.length)];
    const randomDetail = randomStep.details[Math.floor(Math.random() * randomStep.details.length)];
    
    return {
      ...randomStep,
      selectedDetail: randomDetail,
      type: goodHabitsSteps.includes(randomStep) ? 'positive' : 'negative'
    };
  }, [goodHabitsSteps, badHabitsSteps]);

  // Streak hesaplama fonksiyonu
  const calculateStreak = useCallback((challenge) => {
    if (!challenge.monthlyProgress) return { days: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    challenge.monthlyProgress.forEach(completed => {
      if (completed) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return { days: longestStreak };
  }, []);

  // Personal Best hesaplama fonksiyonu
  const calculatePersonalBest = useCallback((challenges, badHabits) => {
    // TATAKAE rekorları
    let longestStreak = { days: 0, challengeName: '', icon: '🎯' };
    let bestMonthlyRate = { percentage: 0, month: '', year: '' };
    let totalDiamonds = 0;
    let totalChallenges = challenges.length;
    
    // H- rekorları
    let longestCleanStreak = { days: 0, habitName: '', icon: '🚫' };
    let bestCleanMonth = { percentage: 0, month: '', year: '' };
    let totalCleanDiamonds = 0;
    let totalHabitsQuitted = badHabits.length;
    
    // TATAKAE verilerini hesapla
    challenges.forEach(challenge => {
      // En uzun streak hesapla
      const streak = calculateStreak(challenge);
      if (streak.days > longestStreak.days) {
        longestStreak = {
          days: streak.days,
          challengeName: challenge.name,
          icon: challenge.icon || '🎯'
        };
      }
      
      // Aylık completion rate hesapla
      const completionRate = ((challenge.completedDays || 0) / (challenge.duration || 30)) * 100;
      if (completionRate > bestMonthlyRate.percentage && challenge.startDate) {
        const startDate = new Date(challenge.startDate);
        bestMonthlyRate = {
          percentage: Math.round(completionRate),
          month: startDate.toLocaleDateString('tr-TR', { month: 'long' }),
          year: startDate.getFullYear().toString()
        };
      }
      
      // Haftalık elmas hesapla (her 7 günlük streak = 1 elmas)
      const weeklyDiamonds = Math.floor(streak.days / 7);
      totalDiamonds += weeklyDiamonds;
    });
    
    // H- verilerini hesapla
    badHabits.forEach(habit => {
      // En uzun temiz streak hesapla
      const longestCleanStreakDays = habit.longestStreak || 0;
      if (longestCleanStreakDays > longestCleanStreak.days) {
        longestCleanStreak = {
          days: longestCleanStreakDays,
          habitName: habit.name,
          icon: habit.icon || '🚫'
        };
      }
      
      // En temiz ay hesapla
      const cleanRate = habit.duration ? ((habit.cleanDays || 0) / habit.duration) * 100 : 0;
      if (cleanRate > bestCleanMonth.percentage && habit.startDate) {
        const startDate = new Date(habit.startDate);
        bestCleanMonth = {
          percentage: Math.round(cleanRate),
          month: startDate.toLocaleDateString('tr-TR', { month: 'long' }),
          year: startDate.getFullYear().toString()
        };
      }
      
      // Haftalık temiz elmas hesapla (her 7 günlük temiz streak = 1 elmas)
      const weeklyCleanDiamonds = Math.floor(longestCleanStreakDays / 7);
      totalCleanDiamonds += weeklyCleanDiamonds;
    });
    
    const newPersonalBest = {
      longestStreak,
      bestMonthlyRate,
      totalDiamonds,
      totalChallenges,
      longestCleanStreak,
      bestCleanMonth,
      totalCleanDiamonds,
      totalHabitsQuitted
    };
    
    // Yeni rekor kontrolü - TATAKAE
    setPersonalBest(prevBest => {
      return newPersonalBest;
    });
  }, [calculateStreak]);

  // TATAKAE ve H- verilerini çek ve Personal Best hesapla
  useEffect(() => {
    if (!auth.currentUser) return;
    
    let challenges = [];
    let badHabits = [];
    
    // TATAKAE verilerini çek
    const unsubscribeTatakae = onSnapshot(
      query(collection(db, "tatakae"), where("userId", "==", auth.currentUser.uid)),
      (snapshot) => {
        challenges = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        calculatePersonalBest(challenges, badHabits);
      }
    );
    
    // H- verilerini çek
    const unsubscribeHMinus = onSnapshot(
      query(collection(db, "h-minus"), where("userId", "==", auth.currentUser.uid)),
      (snapshot) => {
        badHabits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        calculatePersonalBest(challenges, badHabits);
      }
    );
    
    return () => {
      unsubscribeTatakae();
      unsubscribeHMinus();
    };
  }, [calculatePersonalBest]);

  // Component mount olduğunda rastgele tip seç
  useEffect(() => {
    setRandomTip(getRandomTip());
  }, [getRandomTip]);

  return (
    <div className="main-container">
      <div className="main-content">
        {/* Header */}
        <div className="main-header">
          <h1>🌟 HOŞGELDİN, <span className="username">{getUserName().toUpperCase()}</span>!</h1>
          <div className="atomic-habits-badge">
            <span className="badge-icon">⚛️</span>
            <span className="badge-text">Hedef değil, sistem kuracağız!</span>
          </div>
        </div>

        {/* TATAKAE Personal Best */}
        <div className="personal-best-section tatakae-best">
          <div className="personal-best-header">
            <h2>🎯 TATAKAE</h2>
          </div>
          
          <div className="personal-best-grid">
            <div className="best-card streak-card">
              <div className="card-icon">🔥</div>
              <div className="card-content">
                <div className="card-title">🎯 EN UZUN STREAK</div>
                <div className="card-value">
                  {personalBest.longestStreak.days > 0 ? (
                    <>
                      <span className="value-number">{personalBest.longestStreak.days}</span>
                      <span className="value-unit">gün</span>
                    </>
                  ) : (
                    <span className="no-data">Henüz streak yok</span>
                  )}
                </div>
                <div className="card-subtitle">
                  {personalBest.longestStreak.challengeName}
                </div>
              </div>
            </div>
            
            <div className="best-card monthly-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-title">🎯 EN BAŞARILI AY</div>
                <div className="card-value">
                  {personalBest.bestMonthlyRate.percentage > 0 ? (
                    <>
                      <span className="value-number">%{personalBest.bestMonthlyRate.percentage}</span>
                      <span className="value-unit">başarı</span>
                    </>
                  ) : (
                    <span className="no-data">Henüz challenge yok</span>
                  )}
                </div>
                <div className="card-subtitle">
                  {personalBest.bestMonthlyRate.month} {personalBest.bestMonthlyRate.year}
                </div>
              </div>
            </div>
            
            <div className="best-card diamonds-card">
              <div className="card-icon">💎</div>
              <div className="card-content">
                <div className="card-title">🎯 HAFTALIK ELMASLAR</div>
                <div className="card-value">
                  <span className="value-number">{personalBest.totalDiamonds}</span>
                  <span className="value-unit">elmas</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* H- Personal Best */}
        <div className="personal-best-section h-minus-best">
          <div className="personal-best-header">
            <h2>🛡️ H-</h2>
          </div>
          
          <div className="personal-best-grid">
            <div className="best-card clean-streak-card">
              <div className="card-icon">🛡️</div>
              <div className="card-content">
                <div className="card-title">🚫 EN UZUN TEMİZ STREAK</div>
                <div className="card-value">
                  {personalBest.longestCleanStreak.days > 0 ? (
                    <>
                      <span className="value-number">{personalBest.longestCleanStreak.days}</span>
                      <span className="value-unit">gün</span>
                    </>
                  ) : (
                    <span className="no-data">Henüz streak yok</span>
                  )}
                </div>
                <div className="card-subtitle">
                  {personalBest.longestCleanStreak.habitName}
                </div>
              </div>
            </div>
            
            <div className="best-card clean-month-card">
              <div className="card-icon">📋</div>
              <div className="card-content">
                <div className="card-title">🚫 EN TEMİZ AY</div>
                <div className="card-value">
                  {personalBest.bestCleanMonth.percentage > 0 ? (
                    <>
                      <span className="value-number">%{personalBest.bestCleanMonth.percentage}</span>
                      <span className="value-unit">temiz</span>
                    </>
                  ) : (
                    <span className="no-data">Henüz takip yok</span>
                  )}
                </div>
                <div className="card-subtitle">
                  {personalBest.bestCleanMonth.month} {personalBest.bestCleanMonth.year}
                </div>
              </div>
            </div>
            
            <div className="best-card clean-diamonds-card">
              <div className="card-icon">💎</div>
              <div className="card-content">
                <div className="card-title">🚫 TEMİZ HAFTALIK ELMASLAR</div>
                <div className="card-value">
                  <span className="value-number">{personalBest.totalCleanDiamonds}</span>
                  <span className="value-unit">elmas</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Random Tip Section veya Kılavuz */}
        {!showGuide ? (
          randomTip && (
            <div className="random-tip-section">
              <div className="tip-header">
                <h2>💡 Günün Taktiği</h2>
                <div className="tip-buttons">
                  <div className="tip-refresh" onClick={() => {
                    setRandomTip(getRandomTip());
                    setShowGuide(false);
                  }}>
                    🔄 Yeni Taktik
                  </div>
                  <div className="tip-guide" onClick={() => setShowGuide(true)}>
                    📚 Kılavuz
                  </div>
                </div>
              </div>
              
              <div className={`random-tip-card ${randomTip.type}`} style={{ '--tip-color': randomTip.color }}>
                <div className="tip-main-header">
                  <div className="tip-icon">{randomTip.icon}</div>
                  <div className="tip-main-info">
                    <h3>{randomTip.title}</h3>
                    <p>{randomTip.description}</p>
                  </div>
                  <div className="tip-type-badge">
                    {randomTip.type === 'positive' ? '✅ YENİ ALIŞKANLIK' : '🚫 KÖTÜ ALIŞKANLIK'}
                  </div>
                </div>

                <div className="tip-detail-section">
                  <div className="detail-header">
                    <h4>{randomTip.selectedDetail.title}</h4>
                    <p className="detail-subtitle">{randomTip.selectedDetail.subtitle}</p>
                  </div>
                  
                  <div className="detail-explanation">
                    <p>{randomTip.selectedDetail.explanation}</p>
                  </div>

                  {randomTip.selectedDetail.examples && (
                    <div className="detail-examples">
                      <h5>📝 Örnekler:</h5>
                      <div className="examples-grid">
                        {randomTip.selectedDetail.examples.map((example, index) => (
                          <div key={index} className="example-item">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {randomTip.selectedDetail.howTo && (
                    <div className="detail-howto">
                      <h5>🛠️ Nasıl Yaparım:</h5>
                      <div className="howto-steps">
                        {randomTip.selectedDetail.howTo.split('\n').map((step, index) => (
                          <div key={index} className="howto-step">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="random-tip-section">
            <div className="tip-header">
              <h2>📚 Alışkanlık Kılavuzu</h2>
              <div className="tip-buttons">
                <div className="tip-refresh" onClick={() => {
                  setRandomTip(getRandomTip());
                  setShowGuide(false);
                }}>
                  🔄 Yeni Taktik
                </div>
                <div className="tip-guide" onClick={() => setShowGuide(false)}>
                  ❌ Kapat
                </div>
              </div>
            </div>
            
            <div className="guide-content-inline">
              <div className="guide-section">
                <h3>✨ YENİ ALIŞKANLIK KAZANMA (4 Adım)</h3>
                
                <div className="guide-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>👁️ İŞARET - Görünür Kılın</h4>
                    <p>Alışkanlık ipuçlarını çevrenizde görünür hale getirin</p>
                    <ul>
                      <li><strong>Alışkanlık İstifleme:</strong> Mevcut alışkanlığın ardına yeni alışkanlık ekle</li>
                      <li><strong>Ortamı Tasarla:</strong> Gerekli eşyaları görünür yerlere koy</li>
                      <li><strong>Sosyal Çevre:</strong> Aynı alışkanlığı yapan insanlarla vakit geçir</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>✨ İSTEK - Cazip Kılın</h4>
                    <p>Alışkanlığı yapmak isteyeceğiniz şekilde tasarlayın</p>
                    <ul>
                      <li><strong>Temptation Bundling:</strong> Sevdiğin şeyi sadece yeni alışkanlıkla yaparken yap</li>
                      <li><strong>Sosyal Motivasyon:</strong> Aynı hedeflere sahip insanlarla takıl</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>⚡ TEPKİ - Kolaylaştırın</h4>
                    <p>Alışkanlığı yapmak için gereken çabayı minimize edin</p>
                    <ul>
                      <li><strong>Sürtüşmeyi Azalt:</strong> Hazırlık işlerini önceden yap</li>
                      <li><strong>2 Dakika Kuralı:</strong> Yeni alışkanlığı 2 dakikadan az sürecek şekilde başlat</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>🏆 ÖDÜL - Tatmin Edici Kılın</h4>
                    <p>Alışkanlığın hemen bir ödülünü hissettirin</p>
                    <ul>
                      <li><strong>Başarıları Takip Et:</strong> Görsel takip sistemi oluştur</li>
                      <li><strong>Mükemmeliyetlikten Kaç:</strong> Hata yapmayı normal karşıla</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>🚫 KÖTÜ ALIŞKANLIKTAN KURTULMA (4 Adım)</h3>
                
                <div className="guide-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>🫥 Görünmez Kılın</h4>
                    <p>Kötü alışkanlık tetikleyicilerini ortamdan kaldırın</p>
                    <ul>
                      <li>Tetikleyici eşyaları görüş alanından uzaklaştır</li>
                      <li>Erişimi zorlaştır</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>🤢 İtici Kılın</h4>
                    <p>Kötü alışkanlığın olumsuz sonuçlarını vurgulayın</p>
                    <ul>
                      <li>Uzun vadeli zararları görsel hale getir</li>
                      <li>Gerçek vakaları araştır</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>🚧 Zorlaştırın</h4>
                    <p>Kötü alışkanlığa ulaşım için sürtüşme yaratın</p>
                    <ul>
                      <li>Erişimi 2-3 adım zorlaştır</li>
                      <li>Zaman gecikmeleri koy</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>😰 Rahatsız Edici Kılın</h4>
                    <p>Kötü alışkanlığın anında olumsuz bir sonucu olsun</p>
                    <ul>
                      <li>Anında uygulanacak bir ceza belirle</li>
                      <li>Hesap verebilirlik sistemi oluştur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PropTypes validation
Main.propTypes = {
  user: validateUser,
  userData: validateUserData,
  setActiveTab: validateFunction
};

export default Main;