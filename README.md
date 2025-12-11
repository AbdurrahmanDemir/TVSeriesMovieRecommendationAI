# 🎬 AI Destekli Film & Dizi Öneri Sistemi

Modern ve akıllı bir film/dizi öneri platformu. Google Gemini AI ile güçlendirilmiş!

## ✨ Özellikler

### 🎯 Temel Özellikler
- ✅ Kişiselleştirilmiş film ve dizi önerileri
- ✅ Tür, yıl, süre ve puan filtreleme
- ✅ İzleme listesi ve favoriler
- ✅ Detaylı içerik bilgileri
- ✅ Kullanıcı yorumları

### 🤖 AI Destekli Özellikler (YENİ!)
- 🧠 **AI Sohbet Asistanı**: Film ve diziler hakkında doğal dilde sohbet edin
- 📊 **İnceleme Analizi**: İzleyici yorumlarından otomatik duygu analizi
- 💭 **Ruh Haline Göre Öneri**: "Bugün nasıl hissediyorsun?" sorusuna göre özel öneriler
- 🎭 **Akıllı Karşılaştırma**: İki içeriği AI ile karşılaştırın
- ✨ **Kişiselleştirilmiş Açıklamalar**: Neden bu öneriyi aldığınızı AI açıklıyor

## 🚀 Kurulum

### 1. Projeyi İndirin
```bash
git clone https://github.com/AbdurrahmanDemir/TVSeriesMovieRecommendationAI.git
cd TVSeriesMovieRecommendationAI
```

### 2. API Key'leri Yapılandırın

#### TMDb API Key (Gerekli)
1. [TMDb](https://www.themoviedb.org/signup) hesabı oluşturun
2. [API Settings](https://www.themoviedb.org/settings/api) sayfasından API key alın
3. `utils/constants.js` dosyasında `TMDB_API_KEY` değerini güncelleyin

#### Gemini API Key (AI Özellikleri için)
1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Ücretsiz API key oluşturun
3. `api/gemini.js` dosyasında `GEMINI_API_KEY` değerini güncelleyin

### 3. Yerel Sunucu Başlatın
```bash
python -m http.server 8000
# veya
npx -y http-server -p 8000
```

### 4. Tarayıcıda Açın
```
http://localhost:8000
```

## 🔑 Google Gemini API Key Alma

AI özelliklerini kullanmak için **ücretsiz** Google Gemini API key'e ihtiyacınız var:

### Adım 1: Google AI Studio'ya Gidin
1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın

### Adım 2: API Key Oluşturun
1. "Create API Key" butonuna tıklayın
2. Bir proje seçin veya yeni proje oluşturun
3. API key'inizi kopyalayın

### Adım 3: Uygulamada API Key'i Girin
1. Uygulamayı açın
2. Sağ alttaki 💬 AI Chat butonuna tıklayın
3. İlk açılışta API key isteyecek
4. Kopyaladığınız API key'i yapıştırın
5. API key tarayıcınızda güvenli şekilde saklanır

## 📱 Kullanım

### Temel Kullanım
1. **Başla** butonuna tıklayın
2. Film mi dizi mi izlemek istediğinizi seçin
3. Sevdiğiniz türleri seçin
4. İzlediğiniz içerikleri ekleyin (opsiyonel)
5. Ek filtreleri ayarlayın
6. **Önerileri Göster** butonuna tıklayın

### AI Özellikleri

#### 💬 AI Sohbet
- Sağ alttaki yüzen 💬 butonuna tıklayın
- Film/dizi hakkında soru sorun
- Öneri isteyin
- Ruh halinize göre öneri alın

#### 🤖 İnceleme Analizi
1. Bir film/dizi detayına girin
2. "🤖 İncelemeleri Analiz Et" butonuna tıklayın
3. AI, tüm yorumları analiz edip özet sunar:
   - Genel duygu durumu
   - Güçlü ve zayıf yönler
   - Duygusal içerik analizi
   - Spoiler-free özet

#### 🎭 Ruh Haline Göre Öneri
1. AI Chat'i açın
2. "🎭 Ruh Halime Göre Öner" butonuna tıklayın
3. Ruh halinizi seçin (Mutlu, Üzgün, Heyecanlı, vb.)
4. AI, ruh halinize uygun öneriler sunar

#### 💬 İçerik Hakkında Sohbet
1. Bir film/dizi detayına girin
2. "💬 AI ile Sohbet Et" butonuna tıklayın
3. O içerik hakkında AI ile konuşun

## 🎨 Özellikler Detayı

### Filtreleme Seçenekleri
- **Türler**: 20+ farklı tür
- **Yıl Aralığı**: Klasiklerden yeni çıkanlara
- **Süre**: Kısa, orta, uzun
- **Minimum Puan**: 6.0 - 9.0 arası

### Sıralama
- Öneri skoru
- IMDb puanı
- Popülerlik
- Yıl

### Listeleme
- İzleme listesi
- Favoriler
- Geçmiş

## 🛠️ Teknolojiler

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: TMDb API (Film/Dizi verileri)
- **AI**: Google Gemini API
- **Tasarım**: Glassmorphism, Modern UI/UX
- **Animasyonlar**: CSS Animations, Smooth Transitions

## 📊 API Limitleri

### TMDb API
- Ücretsiz
- Günlük limit yok
- API key gerekli (kodda mevcut)

### Google Gemini API
- **Ücretsiz Tier**: 60 istek/dakika
- Yeterli kullanım için ideal
- Kredi kartı gerektirmez

## 🎯 Gelecek Özellikler

- [ ] İki içeriği karşılaştırma (AI)
- [ ] Arkadaşlarla liste paylaşma
- [ ] Sosyal özellikler
- [ ] Mobil uygulama
- [ ] Daha fazla AI özelliği

## 🐛 Sorun Giderme

### AI Özellikleri Çalışmıyor
1. API key'inizin doğru olduğundan emin olun
2. İnternet bağlantınızı kontrol edin
3. Tarayıcı konsolunu kontrol edin (F12)
4. API limitini aşmadığınızdan emin olun

### Öneriler Gelmiyor
1. En az bir tür seçtiğinizden emin olun
2. Filtreleri çok kısıtlayıcı yapmayın
3. Farklı türler deneyin

## 📝 Lisans

Bu proje eğitim amaçlıdır.

## 🙏 Teşekkürler

- TMDb API
- Google Gemini AI
- Tüm açık kaynak katkıda bulunanlar

---

**Geliştirici**: Ahmet EFE, Abdurrahman Demir, Uygar Gültekin
**Versiyon**: 2.0.0 
**Son Güncelleme**: Aralık 2025

🎬 İyi seyirler! 🍿
