import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './Badges.css';

function Badges({ showNotification, soundEnabled }) {
  const [userBadges, setUserBadges] = useState([]);
  const [newBadge, setNewBadge] = useState(null);

  const badges = React.useMemo(() => [
    { id: 'streak_3', name: 'Başlangıç', description: '3 günlük streak', icon: '🌱', days: 3, color: '#43e97b' },
    { id: 'streak_7', name: 'Haftalık Güç', description: '1 haftalık streak', icon: '⭐', days: 7, color: '#feca57' },
    { id: 'streak_30', name: 'Ay Yıldızı', description: '1 aylık streak', icon: '🌙', days: 30, color: '#48dbfb' },
    { id: 'streak_90', name: 'Sezon Şampiyonu', description: '3 aylık streak', icon: '🏆', days: 90, color: '#ff9ff3' },
    { id: 'streak_180', name: 'Yarıyıl Kahramanı', description: '6 aylık streak', icon: '🎯', days: 180, color: '#667eea' },
    { id: 'streak_365', name: 'Yıl Efsanesi', description: '1 yıllık streak', icon: '👑', days: 365, color: '#f368e0' }
  ], []);

  useEffect(() => {
    loadUserBadges();
  }, []);

  const loadUserBadges = async () => {
    const badgesDoc = await getDoc(doc(db, 'badges', auth.currentUser.uid));
    if (badgesDoc.exists()) {
      setUserBadges(badgesDoc.data().earned || []);
    } else {
      await setDoc(doc(db, 'badges', auth.currentUser.uid), {
        earned: [],
        userId: auth.currentUser.uid
      });
    }
  };

  const checkAndAwardBadges = useCallback(async (totalStreak) => {
    const currentEarnedBadges = userBadges;
    
    // Kazanılabilecek en yüksek rozeti bul
    let highestEarnableBadge = null;
    for (const badge of badges.reverse()) { // Büyükten küçüğe sırala
      const alreadyEarned = currentEarnedBadges.find(b => b.id === badge.id);
      if (totalStreak >= badge.days && !alreadyEarned) {
        highestEarnableBadge = badge;
        break;
      }
    }
    
    // Eğer yeni kazanılacak rozet varsa
    if (highestEarnableBadge) {
      // Bu rozet daha önce notification olarak gösterilmiş mi?
      const notificationKey = `badge_notification_${auth.currentUser.uid}_${highestEarnableBadge.id}`;
      const alreadyShown = localStorage.getItem(notificationKey);
      
      if (!alreadyShown) {
        const earnedBadge = {
          ...highestEarnableBadge,
          earnedAt: new Date().toISOString()
        };
        
        const updatedBadges = [...currentEarnedBadges, earnedBadge];
        
        await updateDoc(doc(db, 'badges', auth.currentUser.uid), {
          earned: updatedBadges
        });
        
        setUserBadges(updatedBadges);
        
        // Notification'ı göster
        if (showNotification) {
          showNotification(`🎉 Tebrikler! "${earnedBadge.name}" rozetini kazandın!`);
        }
        
        // Notification'ı gösterildi olarak işaretle
        localStorage.setItem(notificationKey, 'true');
        
        // Visual notification'ı göster
        setNewBadge(earnedBadge);
        setTimeout(() => setNewBadge(null), 5000);
      }
    }
  }, [userBadges, badges, showNotification]);

  useEffect(() => {
    window.badgeComponent = { checkAndAwardBadges };
    return () => {
      window.badgeComponent = null;
    };
  }, [checkAndAwardBadges]);

  return (
    <div className="badges-container">
      <h3>🏅 Rozetlerim</h3>
      <div className="badges-grid">
        {badges.reverse().map(badge => { // Sıralamayı geri çevir
          const earned = userBadges.find(b => b.id === badge.id);
          return (
            <div
              key={badge.id}
              className={`badge-card ${earned ? 'earned' : 'locked'}`}
              style={{
                '--badge-color': badge.color
              }}
            >
              <div className="badge-icon">
                {earned ? badge.icon : '🔒'}
              </div>
              <div className="badge-info">
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
                {earned && (
                  <span className="earned-date">
                    {new Date(earned.earnedAt).toLocaleDateString('tr-TR')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {newBadge && (
        <div className="badge-notification">
          <div className="badge-notification-content">
            <span className="badge-notification-icon">{newBadge.icon}</span>
            <div className="badge-notification-text">
              <h4>Yeni Rozet Kazandın!</h4>
              <p>{newBadge.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Badges;
export { Badges };