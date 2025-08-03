import React, { useState, useEffect, useCallback } from "react";
import "./Main.css";
import { goodHabitsSteps, badHabitsSteps } from "../constants/habitSteps";
import { validateUser, validateUserData, validateFunction } from "../utils/propTypes";

function Main({ user, userData, setActiveTab, openGuide }) {
  const [randomTip, setRandomTip] = useState(null);
  const [showLocalGuide, setShowLocalGuide] = useState(false);

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
  }, []);


  // Component mount olduğunda rastgele tip seç
  useEffect(() => {
    setRandomTip(getRandomTip());
  }, [getRandomTip]);

  return (
    <div className="main-container">
      <div className="main-content">
        {/* Header */}
        <div className="main-header">
          <div className="settings-icon" onClick={() => setActiveTab(4)} title="Ayarlar">
            ⚙️
          </div>
          <h1>🌟 HOŞGELDİN, <span className="username">{getUserName().toUpperCase()}</span>!</h1>
          <div className="atomic-habits-badge">
            <span className="badge-icon">⚛️</span>
            <span className="badge-text">Hedef değil, sistem kuracağız!</span>
          </div>
        </div>


        {/* Random Tip Section veya Kılavuz */}
        {!showLocalGuide ? (
          randomTip && (
            <div className="random-tip-section">
              <div className="tip-header">
                <h2>💡 Günün Taktiği</h2>
                <div className="tip-buttons">
                  <div className="tip-refresh" onClick={() => {
                    setRandomTip(getRandomTip());
                    setShowLocalGuide(false);
                  }}>
                    🔄 Yeni Taktik
                  </div>
                  <div className="tip-guide" onClick={() => openGuide ? openGuide() : setShowLocalGuide(true)}>
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
                  setShowLocalGuide(false);
                }}>
                  🔄 Yeni Taktik
                </div>
                <div className="tip-guide" onClick={() => setShowLocalGuide(false)}>
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