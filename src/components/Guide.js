import React, { useState, useEffect } from 'react';
import './Guide.css';

const steps = [
  {
    id: 1,
    title: "Hoş Geldiniz",
    subtitle: "Solo Habits'e Hoş Geldiniz!"
  },
  {
    id: 2,
    title: "Nasıl Çalışır",
    subtitle: "Alışkanlık Takibi Nasıl Yapılır?"
  },
  {
    id: 3,
    title: "Özellikler",
    subtitle: "Neler Yapabilirsiniz?"
  },
  {
    id: 4,
    title: "Hazır!",
    subtitle: "Başlamaya Hazırsınız!"
  }
];

function Guide({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Progress bar güncellemesi
    const progressWidth = (currentStep / steps.length) * 100;
    document.documentElement.style.setProperty('--progress-width', `${progressWidth}%`);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1000);
  };

  return (
    <div className="guide-container">
      {/* Header */}
      <header className="guide-header">
        <div className="guide-logo-section">
          <div className="guide-logo">
            🌟
          </div>
          <div className="guide-title-section">
            <h1>Solo Habits</h1>
            <p className="guide-subtitle">Kişisel Alışkanlık Takip Sistemi</p>
          </div>
        </div>
        <div className="guide-header-right">
          <div className="guide-version">
            <span className="version">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="guide-progress-container">
        <div className="guide-progress-steps">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`guide-step ${
                currentStep === step.id ? 'active' : ''
              } ${
                currentStep > step.id ? 'completed' : ''
              }`}
              onClick={() => goToStep(step.id)}
            >
              <div className="guide-step-number">{step.id}</div>
              <span>{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <main className="guide-content">
        
        {/* Step 1: Hoş Geldiniz */}
        {currentStep === 1 && (
          <section className="guide-section active">
            <div className="guide-welcome-hero">
              <h2>🌟 Solo Habits'e Hoş Geldiniz!</h2>
              <p className="guide-hero-text">
                Bilimsel temelli alışkanlık sistemi ile hayallerinize ulaşın. 
                Bu kılavuz size gerçek değişim için ihtiyaç duyduğunuz her şeyi öğretecek.
              </p>

              <div className="guide-features-grid">
                <div className="guide-feature-card">
                  <div className="guide-feature-icon">⚛️</div>
                  <h3>Atomik Alışkanlıklar</h3>
                  <p>
                    Küçük değişiklikler, büyük sonuçlar. Hedef değil, sistem kuruyoruz!
                  </p>
                </div>
                <div className="guide-feature-card">
                  <div className="guide-feature-icon">🔄</div>
                  <h3>4 Adım Sistemi</h3>
                  <p>İşaret, İstek, Tepki ve Ödül döngüsü ile kalıcı değişim</p>
                </div>
                <div className="guide-feature-card">
                  <div className="guide-feature-icon">📊</div>
                  <h3>Günlük Takip</h3>
                  <p>İlerlemenizi görselleştirin ve motivasyonunuzu yüksek tutun</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Yeni Alışkanlık Kazanma */}
        {currentStep === 2 && (
          <section className="guide-section active">
            <h2>✨ Yeni Alışkanlık Kazanma (4 Adım)</h2>

            <div className="guide-habits-system">
              <div className="guide-habit-step">
                <div className="habit-step-number">1</div>
                <div className="habit-step-content">
                  <h3>👁️ İŞARET - Görünür Kılın</h3>
                  <p>Alışkanlık ipuçlarını çevrenizde görünür hale getirin</p>
                  <ul className="habit-step-list">
                    <li><strong>Alışkanlık İstifleme:</strong> Mevcut alışkanlığın ardına yeni alışkanlık ekle</li>
                    <li><strong>Ortamı Tasarla:</strong> Gerekli eşyaları görünür yerlere koy</li>
                    <li><strong>Sosyal Çevre:</strong> Aynı alışkanlığı yapan insanlarla vakit geçir</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step">
                <div className="habit-step-number">2</div>
                <div className="habit-step-content">
                  <h3>✨ İSTEK - Cazip Kılın</h3>
                  <p>Alışkanlığı yapmak isteyeceğiniz şekilde tasarlayın</p>
                  <ul className="habit-step-list">
                    <li><strong>Temptation Bundling:</strong> Sevdiğin şeyi sadece yeni alışkanlıkla yaparken yap</li>
                    <li><strong>Sosyal Motivasyon:</strong> Aynı hedeflere sahip insanlarla takıl</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step">
                <div className="habit-step-number">3</div>
                <div className="habit-step-content">
                  <h3>⚡ TEPKİ - Kolaylaştırın</h3>
                  <p>Alışkanlığı yapmak için gereken çabayı minimize edin</p>
                  <ul className="habit-step-list">
                    <li><strong>Sürtüşmeyi Azalt:</strong> Hazırlık işlerini önceden yap</li>
                    <li><strong>2 Dakika Kuralı:</strong> Yeni alışkanlığı 2 dakikadan az sürecek şekilde başlat</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step">
                <div className="habit-step-number">4</div>
                <div className="habit-step-content">
                  <h3>🏆 ÖDÜL - Tatmin Edici Kılın</h3>
                  <p>Alışkanlığın hemen bir ödülünü hissettirin</p>
                  <ul className="habit-step-list">
                    <li><strong>Başarıları Takip Et:</strong> Görsel takip sistemi oluştur</li>
                    <li><strong>Mükemmeliyetlikten Kaç:</strong> Hata yapmayı normal karşıla</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Kötü Alışkanlıktan Kurtulma */}
        {currentStep === 3 && (
          <section className="guide-section active">
            <h2>🚫 Kötü Alışkanlıktan Kurtulma (4 Adım)</h2>
            <p className="guide-section-description">
              Kötü alışkanlıklarınızı yenmek için sistematik yaklaşım kullanın.
            </p>

            <div className="guide-habits-system">
              <div className="guide-habit-step bad-habit">
                <div className="habit-step-number">1</div>
                <div className="habit-step-content">
                  <h3>🫥 Görünmez Kılın</h3>
                  <p>Kötü alışkanlık tetikleyicilerini ortamdan kaldırın</p>
                  <ul className="habit-step-list">
                    <li>Tetikleyici eşyaları görüş alanından uzaklaştır</li>
                    <li>Erişimi zorlaştır</li>
                    <li>Alternatif rotalar belirle</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step bad-habit">
                <div className="habit-step-number">2</div>
                <div className="habit-step-content">
                  <h3>🤢 İtici Kılın</h3>
                  <p>Kötü alışkanlığın olumsuz sonuçlarını vurgulayın</p>
                  <ul className="habit-step-list">
                    <li>Uzun vadeli zararları görsel hale getir</li>
                    <li>Gerçek vakaları araştır</li>
                    <li>Sağlık sonuçlarını öğren</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step bad-habit">
                <div className="habit-step-number">3</div>
                <div className="habit-step-content">
                  <h3>🚧 Zorlaştırın</h3>
                  <p>Kötü alışkanlığa ulaşım için sürtüşme yaratın</p>
                  <ul className="habit-step-list">
                    <li>Erişimi 2-3 adım zorlaştır</li>
                    <li>Zaman gecikmeleri koy</li>
                    <li>Fiziksel engeller oluştur</li>
                  </ul>
                </div>
              </div>

              <div className="guide-habit-step bad-habit">
                <div className="habit-step-number">4</div>
                <div className="habit-step-content">
                  <h3>😰 Rahatsız Edici Kılın</h3>
                  <p>Kötü alışkanlığın anında olumsuz bir sonucu olsun</p>
                  <ul className="habit-step-list">
                    <li>Anında uygulanacak bir ceza belirle</li>
                    <li>Hesap verebilirlik sistemi oluştur</li>
                    <li>Sosyal baskı kullan</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Başlamaya Hazır */}
        {currentStep === 4 && (
          <section className="guide-section active">
            <div className="guide-ready-section">
              <h2>🚀 Sistemle Büyük Başarılar Kazanmaya Hazır!</h2>
              
              <div className="guide-atomic-principle">
                <div className="atomic-badge">
                  <span className="atomic-icon">⚛️</span>
                  <div className="atomic-text">
                    <strong>"Hedef değil, sistem kuracağız!"</strong>
                    <p>Küçük iyileştirmeler, büyük sonuçlar getirir</p>
                  </div>
                </div>
              </div>

              <div className="guide-action-buttons">
                <button 
                  className="guide-btn-primary" 
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <span className="guide-loading-spinner"></span>
                      Başlatılıyor...
                    </>
                  ) : (
                    'Solo Habits\'e Başla! 🌟'
                  )}
                </button>
              </div>

              <div className="guide-quick-tips">
                <h3>💡 Başarı İçin Son İpuçları</h3>
                <div className="guide-tips-grid">
                  <div className="guide-tip">
                    <span className="guide-tip-icon">📏</span>
                    <p>
                      <strong>2 Dakika Kuralı:</strong> Yeni alışkanlığı 2 dakikadan az sürecek şekilde başlatın
                    </p>
                  </div>
                  <div className="guide-tip">
                    <span className="guide-tip-icon">🔗</span>
                    <p>
                      <strong>Alışkanlık İstifleme:</strong> Mevcut alışkanlığınızın ardına yeni alışkanlık ekleyin
                    </p>
                  </div>
                  <div className="guide-tip">
                    <span className="guide-tip-icon">📊</span>
                    <p>
                      <strong>Görsel Takip:</strong> İlerlemenizi günlük işaretleyerek motivasyonunuzu koruyun
                    </p>
                  </div>
                </div>
              </div>

              <div className="guide-success-mindset">
                <h3>🧠 Başarı Zihniyeti</h3>
                <div className="mindset-points">
                  <div className="mindset-point">
                    <span className="mindset-icon">🎯</span>
                    <p>Mükemmeliyetçi olmayın - tutarlı olun</p>
                  </div>
                  <div className="mindset-point">
                    <span className="mindset-icon">📈</span>
                    <p>%1 günlük iyileşme = Yılda %37 büyüme</p>
                  </div>
                  <div className="mindset-point">
                    <span className="mindset-icon">💪</span>
                    <p>Kimlik değişimi: "Sporcu biri olarak ne yaparım?"</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Navigation */}
      <nav className="guide-navigation">
        <button 
          className="guide-nav-btn" 
          id="guidePrevBtn" 
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          ← Önceki
        </button>
        <button 
          className="guide-nav-btn guide-primary" 
          id="guideNextBtn" 
          onClick={nextStep}
          disabled={currentStep === steps.length}
        >
          {currentStep === steps.length ? 'Tamamla' : 'Sonraki →'}
        </button>
      </nav>

      {/* Footer */}
      <footer className="guide-footer">
        <p>
          © 2025 Solo Habits - Kişisel Alışkanlık Takip Sistemi. Hayallerinize giden yolda yanınızdayız! ❤️
        </p>
      </footer>
    </div>
  );
}

export default Guide;