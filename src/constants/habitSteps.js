// Alışkanlık adımları - Atomic Habits metodolojisine dayalı
export const goodHabitsSteps = [
  {
    id: 1,
    title: "İŞARET - Görünür Kılın",
    icon: "👁️",
    color: "#667eea",
    description: "Alışkanlık ipuçlarını çevrenizde görünür hale getirin",
    details: [
      {
        title: "🏗️ Alışkanlık İstifleme",
        subtitle: "Mevcut Alışkanlık + Yeni Alışkanlık",
        explanation: "Zaten yaptığın bir alışkanlığın hemen ardına yeni alışkanlığı ekle",
        examples: [
          "Kahvemi aldıktan SONRA → 10 sayfa kitap okurum",
          "Dişlerimi fırçaladıktan SONRA → 2 dakika meditasyon yaparım", 
          "Telefonu kapatıp yatağa yattıktan SONRA → minnettarlık pratiği yaparım",
          "Bilgisayarı açtıktan SONRA → günlük hedeflerimi yazarım"
        ],
        howTo: "1. Günlük rutinindeki sabit bir alışkanlık seç\n2. Yeni alışkanlığı onun hemen ardına bağla\n3. 'X yaptıktan SONRA Y yapacağım' cümlesi kur"
      },
      {
        title: "🏠 Ortamını Yeniden Tasarla", 
        subtitle: "Çevresel İpuçları Yerleştirme",
        explanation: "Yapmak istediğin alışkanlığı tetikleyecek görsel ipuçlarını çevrene yerleştir",
        examples: [
          "Kitap okumak için → Kitabı yastığının üzerine koy",
          "Su içmek için → Her odaya su şişesi koy",
          "Egzersiz için → Spor kıyafetlerini görünür yere as",
          "Meditasyon için → Yastığını odanın ortasında bırak"
        ],
        howTo: "1. Alışkanlık için gerekli eşyaları görünür kıl\n2. Hatırlatıcı notlar yapıştır\n3. Çevresel engelleri kaldır\n4. Pozitif tetikleyiciler yerleştir"
      },
      {
        title: "👥 Çevrenizdeki İnsanlar",
        subtitle: "Sosyal Çevre Etkisi",
        explanation: "Yapmak istediğin alışkanlığı zaten yapan insanlarla vakit geçir",
        examples: [
          "Okuma alışkanlığı için → Kitap kulübüne katıl",
          "Spor için → Aktif arkadaşlarla vakit geçir",
          "Erken kalkma için → Sabahçı insanlarla buluş",
          "Sağlıklı beslenme için → Bilinçli beslenenlere odaklan"
        ],
        howTo: "1. Hedef alışkanlığı yapan topluluklar bul\n2. O alışkanlığı destekleyen çevre oluştur\n3. Negatif etkileyen insanlardan uzaklaş\n4. Hesap verebileceğin birini bul"
      }
    ]
  },
  {
    id: 2,
    title: "İSTEK - Cazip Kılın",
    icon: "✨",
    color: "#f093fb",
    description: "Alışkanlığı yapmak isteyeceğiniz şekilde tasarlayın",
    details: [
      {
        title: "🎁 Temptation Bundling",
        subtitle: "Sevdiğin Şey + Yapman Gereken Şey",
        explanation: "Çok sevdiğin bir aktiviteyi sadece yeni alışkanlığı yaparken yapabilirsin",
        examples: [
          "En sevdiğin diziyi → Sadece koşu bandında izle",
          "Sevdiğin müziği → Sadece spor yaparken dinle", 
          "Favori kafeni → Sadece kitap okurken iç",
          "Sosyal medyayı → Sadece 10 dakika meditasyondan sonra kullan"
        ],
        howTo: "1. Çok sevdiğin bir aktivite belirle\n2. Onu sadece yeni alışkanlığınla eşleştir\n3. Kuralı kesinlikle böylece uygula\n4. Beynin ödül sistemini kullan"
      },
      {
        title: "🤝 Benzer Düşünceli İnsanlarla Takıl",
        subtitle: "Motivasyon Çoğalır",
        explanation: "Aynı hedeflere sahip insanlarla vakit geçirerek motivasyonunu artır",
        examples: [
          "Fitness gruplarına katıl → Ortak antrenmanlar",
          "Okuma kulüplerinde buluş → Kitap tartışmaları",
          "Online topluluklar → Discord, Telegram grupları",
          "Çalışma grupları → Birlikte odaklanma seansları"
        ],
        howTo: "1. Aynı hedefleri olan insanları bul\n2. Düzenli buluşmalar planla\n3. İlerlemenizi paylaşın\n4. Birbirinizi motive edin"
      }
    ]
  },
  {
    id: 3,
    title: "TEPKİ - Kolaylaştırın",
    icon: "⚡",
    color: "#43e97b",
    description: "Alışkanlığı yapmak için gereken çabayı minimize edin",
    details: [
      {
        title: "🛤️ Sürtüşmeyi Azalt",
        subtitle: "Bahaneleri Ortadan Kaldır",
        explanation: "Alışkanlığı yapmak için gereken adımları olabildiğince azalt",
        examples: [
          "Egzersiz için → Spor kıyafetlerini gece hazırla",
          "Okuma için → Kitabı her zaman yanında taşı",
          "Meditasyon için → Uygulamayı telefonunun ana ekranına koy",
          "Sağlıklı beslenme için → Sebzeleri önceden hazırla"
        ],
        howTo: "1. Alışkanlık için gereken tüm adımları listele\n2. Her adımı nasıl kolaylaştırabileceğini düşün\n3. Hazırlık işlerini önceden yap\n4. Engelleri ve bahaneleri öngör ve çözümle"
      },
      {
        title: "⏱️ 2 Dakika Kuralı",
        subtitle: "Başlangıç Etkisi",
        explanation: "Yeni alışkanlığını 2 dakikadan az sürecek şekilde başlat",
        examples: [
          "Kitap okumak → 1 sayfa okumak",
          "Meditasyon yapmak → 1 dakika nefes almak", 
          "Egzersiz yapmak → 10 şınav çekmek",
          "Günlük yazmak → 1 cümle yazmak"
        ],
        howTo: "1. Alışkanlığın en küçük versiyonunu belirle\n2. 2 dakikadan az sürecek şekilde sınırla\n3. Sadece bu küçük versiyonu yap\n4. Zaman içinde doğal olarak büyüyecek"
      }
    ]
  },
  {
    id: 4,
    title: "ÖDÜL - Tatmin Edici Kılın",
    icon: "🏆", 
    color: "#feca57",
    description: "Alışkanlığın hemen bir ödülünü hissettirin",
    details: [
      {
        title: "📊 Başarılarını Hatırlat",
        subtitle: "Görsel Takip ve Zinciri Kırma",
        explanation: "İlerlemeyi gözle görülür şekilde takip et ve başarılarını görselleştir",
        examples: [
          "Takvimde ✓ işaretleme → Başarı zinciri görün",
          "Fotoğraf çekmek → Günlük ilerleme kaydı",
          "Sayaç uygulaması → Streak takibi",
          "Grafik çizmek → Gelişim çizgisi"
        ],
        howTo: "1. Günlük takip sistemi oluştur\n2. Görsel ödüller kullan (çek, işaret)\n3. İlerlemeyi düzenli gözden geçir\n4. Küçük zaferleri kutla"
      },
      {
        title: "💪 Tamamlayamadığın Günleri Kafaya Takma",
        subtitle: "Psikolojik Rahatlama",
        explanation: "Mükemmeliyetçilik tuzağına düşme, döngüye girmediğin sürece sorun yok",
        examples: [
          "1 gün kaçırdın → Ertesi gün devam et, drama yapma",
          "2 gün üst üste kaçırdın → Sistemi gözden geçir, ama bırakma",
          "Kötü bir hafta geçirdin → Yeniden başla, geçmişi unutma",
          "Hata yaptın → Öğrenme fırsatı olarak gör"
        ],
        howTo: "1. Hata yapmayı normal karşıla\n2. '2 gün kuralı' uygula (2 gün üst üste kaçırma)\n3. Mükemmeliyetçilikten kaçın\n4. Uzun vadeli perspektif tut"
      }
    ]
  }
];

export const badHabitsSteps = [
  {
    id: 1,
    title: "Görünmez Kılın",
    icon: "🫥",
    color: "#ff6b6b",
    description: "Kötü alışkanlık tetikleyicilerini ortamdan kaldırın",
    details: [
      {
        title: "Tetikleyicileri Kaldır",
        subtitle: "Çevreden İpuçlarını Sil",
        explanation: "Kötü alışkanlığı tetikleyen şeyleri görünmez kıl",
        examples: [
          "Sigara → Çakmakları ve küllükleri kaldır",
          "Abur cubur → Pantry'den uzaklaştır, gözden ırak yerlere koy",
          "Sosyal medya → Uygulamaları telefondan kaldır",
          "Alkol → Evdeki alkollü içecekleri başka yere taşı"
        ],
        howTo: "1. Alışkanlığı tetikleyen eşyaları belirle\n2. Onları görüş alanından uzaklaştır\n3. Erişimi zorlaştır\n4. Alternatif pozitif tetikleyiciler yerleştir"
      }
    ]
  },
  {
    id: 2,
    title: "İtici Kılın",
    icon: "🤢",
    color: "#ee5a6f",
    description: "Kötü alışkanlığın olumsuz sonuçlarını vurgulayın",
    details: [
      {
        title: "Olumsuz Sonuçları Görselleştir",
        subtitle: "Zararları Açık Et",
        explanation: "Kötü alışkanlığın uzun vadeli zararlarını sürekli hatırla",
        examples: [
          "Sigara → Akciğer fotoğraflarını gör, sağlık raporlarını oku",
          "Junk food → Kilo alma, enerji düşüklüğü fotoğrafları",
          "Sosyal medya → Zamanın nasıl boşa gittiğini hesapla",
          "Alkol → Sağlık zararları, para israfı hesabı"
        ],
        howTo: "1. Uzun vadeli zararları listele\n2. Bunları görsel hale getir\n3. Düzenli hatırlat\n4. Gerçek vakaları araştır"
      }
    ]
  },
  {
    id: 3,
    title: "Zorlaştırın",
    icon: "🚧",
    color: "#fd79a8",
    description: "Kötü alışkanlığa ulaşım için sürtüşme yaratın",
    details: [
      {
        title: "Erişimi Engellle",
        subtitle: "Sürtüşme Yaratmak",
        explanation: "Kötü alışkanlığı yapmak için gereken adımları artır",
        examples: [
          "Sosyal medya → Şifreyi karmaşık yap, başka cihazdan çıkış yap",
          "Abur cubur → Market alışverişini aç karnına yapma",
          "Geç yatma → Yatak odasından ekranları kaldır",
          "Sigara → Paket başka odada tut, çakmak uzakta"
        ],
        howTo: "1. Alışkanlık için gereken adımları artır\n2. Erişimi 2-3 adım zorlaştır\n3. Zaman gecikmeleri koy\n4. Fiziksel engeller oluştur"
      }
    ]
  },
  {
    id: 4,
    title: "Rahatsız Edici Kılın",
    icon: "😰",
    color: "#e84393",
    description: "Kötü alışkanlığın anında olumsuz bir sonucu olsun",
    details: [
      {
        title: "Anında Olumsuz Sonuç",
        subtitle: "Hesap Verebilirlik Sistemi",
        explanation: "Kötü alışkanlığı yaptığında hemen bir bedel öde",
        examples: [
          "Para yatırma → Her yaptığında 50 TL bağış yap",
          "Sosyal hesap verme → Arkadaşına her seferinde haber ver",
          "Fiziksel bedel → 50 şınav çek",
          "Zaman cezası → 1 saat sevdiğin şeyi yapma"
        ],
        howTo: "1. Anında uygulanacak bir ceza belirle\n2. Cezayı başka birine duyur\n3. Kesinlikle uygula\n4. Cezayı gerçekten rahatsız edici yap"
      }
    ]
  }
];

// Gün isimleri sabiti
export const DAY_NAMES = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

// Sık kullanılan değerler
export const HABIT_CONSTANTS = {
  MIN_SUCCESS_RATE_FOR_EXTENSION: 70,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  RECOVERY_MODE_THRESHOLD: 2
};