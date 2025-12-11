/**
 * Google Gemini AI API Service
 * Provides AI-powered features for content analysis and recommendations
 */

const GEMINI_API_KEY = 'AIzaSyBF2DtqqHN1duh4-Wysihfi9jfkgX3gBJc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

class GeminiAPI {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        this.apiUrl = GEMINI_API_URL;
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
    }

    /**
     * Get API key from localStorage
     */
    getApiKey() {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            this.apiKey = storedKey;
        }
        return this.apiKey;
    }

    /**
     * Check if API key is set
     */
    hasApiKey() {
        return this.getApiKey() !== 'YOUR_GEMINI_API_KEY_HERE' && this.getApiKey() !== '';
    }

    /**
     * Generate content using Gemini AI
     */
    async generateContent(prompt) {
        if (!this.hasApiKey()) {
            throw new Error('API key not set. Please set your Gemini API key first.');
        }

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Analyze movie/TV show reviews for sentiment and themes
     */
    async analyzeReviews(title, reviews, mediaType = 'movie') {
        const reviewTexts = reviews.slice(0, 5).map(r => r.content.substring(0, 500)).join('\n---\n');

        const prompt = `${mediaType === 'movie' ? 'Film' : 'Dizi'} hakkında izleyici yorumlarını analiz et: "${title}"

İncelemeler:
${reviewTexts}

Lütfen şunları yap:
1. Genel duygu durumunu belirle (Pozitif/Nötr/Negatif)
2. Ana temaları ve güçlü yönleri özetle
3. Zayıf yönleri belirt
4. Bu ${mediaType === 'movie' ? 'film' : 'dizi'} gerçekten duygusal mı? Açıkla.
5. Spoiler içermeyen 2-3 cümlelik bir özet yaz

Türkçe yanıt ver ve kısa tut.`;

        return await this.generateContent(prompt);
    }

    /**
     * Compare two movies/TV shows
     */
    async compareContent(content1, content2) {
        const title1 = content1.title || content1.name;
        const title2 = content2.title || content2.name;
        const type1 = content1.media_type === 'movie' ? 'Film' : 'Dizi';
        const type2 = content2.media_type === 'movie' ? 'Film' : 'Dizi';

        const prompt = `Bu iki içeriği karşılaştır ve hangisini izlemem gerektiğini öner:

${type1} 1: "${title1}"
- Tür: ${content1.genres?.map(g => g.name).join(', ') || 'Bilinmiyor'}
- Puan: ${content1.vote_average}/10
- Açıklama: ${content1.overview || 'Yok'}

${type2} 2: "${title2}"
- Tür: ${content2.genres?.map(g => g.name).join(', ') || 'Bilinmiyor'}
- Puan: ${content2.vote_average}/10
- Açıklama: ${content2.overview || 'Yok'}

Lütfen şunları yap:
1. Her ikisinin güçlü ve zayıf yönlerini karşılaştır
2. Hangi tür izleyiciye uygun olduğunu belirt
3. Hangisini önereceğini ve neden önereceğini açıkla
4. Tema ve karakter analizini kısaca yap

Türkçe yanıt ver ve net bir öneri sun.`;

        return await this.generateContent(prompt);
    }

    /**
     * Get mood-based recommendations
     */
    async getMoodRecommendations(mood, preferences, availableContent) {
        const moodDescriptions = {
            happy: 'mutlu, neşeli, enerjik',
            sad: 'üzgün, melankolik, duygusal',
            excited: 'heyecanlı, macera arayan',
            relaxed: 'rahat, sakin, dinlenmek isteyen',
            thoughtful: 'düşünceli, derin konular arayan',
            romantic: 'romantik, duygusal bağ arayan'
        };

        const moodDesc = moodDescriptions[mood] || mood;
        const genres = preferences.selectedGenres.map(id => {
            const genreMap = {
                28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi',
                80: 'Suç', 99: 'Belgesel', 18: 'Dram', 10751: 'Aile',
                14: 'Fantastik', 36: 'Tarih', 27: 'Korku', 10402: 'Müzik',
                9648: 'Gizem', 10749: 'Romantik', 878: 'Bilim Kurgu',
                10770: 'TV Film', 53: 'Gerilim', 10752: 'Savaş', 37: 'Vahşi Batı'
            };
            return genreMap[id] || id;
        }).join(', ');

        const contentSample = availableContent.slice(0, 10).map(c =>
            `- ${c.title || c.name} (${c.vote_average}/10)`
        ).join('\n');

        const prompt = `Kullanıcı şu anda ${moodDesc} hissediyor.

Tercih ettiği türler: ${genres}

Mevcut öneriler arasından en uygun olanları seç:
${contentSample}

Lütfen:
1. Bu ruh haline en uygun 3-5 öneri seç
2. Her öneri için neden bu ruh haline uygun olduğunu kısaca açıkla
3. İzleme sırasını öner

Türkçe yanıt ver ve kısa tut.`;

        return await this.generateContent(prompt);
    }

    /**
     * Chat with AI about movies/TV shows
     */
    async chat(userMessage, context = {}) {
        const contextInfo = context.currentContent ?
            `Şu anda "${context.currentContent.title || context.currentContent.name}" hakkında konuşuyoruz.` : '';

        const prompt = `Sen bir film ve dizi uzmanısın. Kullanıcıya yardımcı ol.

${contextInfo}

Kullanıcı: ${userMessage}

Türkçe yanıt ver, yardımcı ol ve kısa tut (maksimum 3-4 cümle).`;

        return await this.generateContent(prompt);
    }

    /**
     * Generate personalized recommendation explanation
     */
    async explainRecommendation(content, userPreferences) {
        const title = content.title || content.name;
        const genres = content.genres?.map(g => g.name).join(', ') || 'Bilinmiyor';

        const prompt = `Neden bu ${content.media_type === 'movie' ? 'filmi' : 'diziyi'} öneriyoruz?

İçerik: "${title}"
Türler: ${genres}
Puan: ${content.vote_average}/10
Açıklama: ${content.overview || 'Yok'}

Kullanıcı tercihleri göz önüne alınarak, bu öneriyi 2-3 cümleyle açıkla.
Türkçe yanıt ver.`;

        return await this.generateContent(prompt);
    }
}

// Export singleton instance
const geminiAPI = new GeminiAPI();
export default geminiAPI;
