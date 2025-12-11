/**
 * AI Features Module - 3 Round Comparison System
 */

import geminiAPI from '../api/gemini.js';
import tmdbAPI from '../api/tmdb.js';

class AIFeatures {
    constructor(app) {
        this.app = app;
        this.selectedMood = null;
        this.naturalLanguageInput = '';
        this.watchedContent = []; // Store user's watched content from 3 rounds
        this.currentRound = 0;
        this.roundPairs = []; // Store all 6 suggested contents
    }

    /**
     * Initialize AI features
     */
    init() {
        this.attachMoodListeners();
        this.attachSkipButtons();
    }

    /**
     * Attach mood button listeners
     */
    attachMoodListeners() {
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                moodButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedMood = btn.dataset.mood;
                await this.suggestGenresForMood(this.selectedMood);
            });
        });
    }

    /**
     * Attach skip button listeners
     */
    attachSkipButtons() {
        ['skipRound1Btn', 'skipRound2Btn', 'skipRound3Btn'].forEach((btnId, index) => {
            setTimeout(() => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.addEventListener('click', () => this.skipRound(index + 1));
                }
            }, 500);
        });
    }

    /**
     * Skip current round
     */
    skipRound(round) {
        console.log(`Round ${round} skipped`);
        // Just move to next step
        this.app.nextStep();
    }

    /**
     * Suggest genres based on mood
     */
    async suggestGenresForMood(mood) {
        if (!geminiAPI.hasApiKey()) {
            alert('⚠️ AI özelliklerini kullanmak için Google Gemini API key gerekli.\n\nAPI key almak için: https://makersuite.google.com/app/apikey');
            return;
        }

        this.app.showLoading();

        try {
            const moodToGenres = {
                happy: [35, 10751, 16, 10402],
                sad: [18, 10749, 10402],
                excited: [28, 12, 878, 53],
                relaxed: [10751, 16, 35, 99],
                thoughtful: [18, 878, 9648, 36]
            };

            const suggestedGenres = moodToGenres[mood] || [];
            this.app.preferences.selectedGenres = suggestedGenres;

            document.querySelectorAll('.genre-chip').forEach(chip => {
                const genreId = parseInt(chip.dataset.genreId);
                if (suggestedGenres.includes(genreId)) {
                    chip.classList.add('selected');
                } else {
                    chip.classList.remove('selected');
                }
            });

            this.app.hideLoading();
            this.showAIMessage(`✨ ${this.getMoodDescription(mood)} için türler seçildi!`);
        } catch (error) {
            this.app.hideLoading();
            console.error('AI mood suggestion error:', error);
        }
    }

    /**
     * Prepare content for specific round
     */
    async prepareRound(roundNumber, contentPool) {
        console.log(`🎯 AIFeatures.prepareRound called for round ${roundNumber}`);
        console.log(`📊 Content pool received: ${contentPool?.length || 0} items`);

        this.currentRound = roundNumber;

        if (!contentPool || contentPool.length < 2) {
            console.error('❌ Not enough content in pool:', contentPool?.length);
            return null;
        }

        this.app.showLoading();

        try {
            // Get 2 random contents
            const shuffled = [...contentPool].sort(() => 0.5 - Math.random());
            let content1 = shuffled[0];
            let content2 = shuffled[1];
            console.log(`🎲 Selected content: ${content1.title || content1.name} & ${content2.title || content2.name}`);

            // Ensure media_type is set
            if (!content1.media_type) {
                content1.media_type = this.app.preferences.mediaType === 'both' ? 'movie' : this.app.preferences.mediaType;
            }
            if (!content2.media_type) {
                content2.media_type = this.app.preferences.mediaType === 'both' ? 'tv' : this.app.preferences.mediaType;
            }
            console.log(`📺 Media types: ${content1.media_type} & ${content2.media_type}`);

            // Fetch full details
            console.log(`⏳ Fetching full details...`);
            const [details1, details2] = await Promise.all([
                content1.media_type === 'movie'
                    ? tmdbAPI.getMovieDetails(content1.id)
                    : tmdbAPI.getTVDetails(content1.id),
                content2.media_type === 'movie'
                    ? tmdbAPI.getMovieDetails(content2.id)
                    : tmdbAPI.getTVDetails(content2.id)
            ]);
            console.log(`✅ Details fetched successfully`);

            // Add media_type to details
            details1.media_type = content1.media_type;
            details2.media_type = content2.media_type;

            // Generate AI descriptions (without API key check for now)
            console.log(`🤖 Generating AI descriptions...`);
            const desc1 = geminiAPI.hasApiKey()
                ? await this.generateShortDescription(details1)
                : details1.overview || 'Harika bir içerik!';

            const desc2 = geminiAPI.hasApiKey()
                ? await this.generateShortDescription(details2)
                : details2.overview || 'Harika bir içerik!';
            console.log(`✅ AI descriptions generated`);

            this.app.hideLoading();

            const pair = {
                content1: { ...details1, aiDescription: desc1 },
                content2: { ...details2, aiDescription: desc2 }
            };

            // Store pair
            this.roundPairs[roundNumber - 1] = pair;
            console.log(`💾 Pair stored at index ${roundNumber - 1}`);

            return pair;
        } catch (error) {
            this.app.hideLoading();
            console.error('❌ Round preparation error:', error);
            return null;
        }
    }

    /**
     * Generate short AI description
     */
    async generateShortDescription(content) {
        try {
            const title = content.title || content.name;
            const genres = content.genres?.map(g => g.name).join(', ') || 'Bilinmiyor';
            const overview = (content.overview || '').substring(0, 200);

            const prompt = `Bu ${content.media_type === 'movie' ? 'film' : 'dizi'} hakkında 2-3 cümleyle çekici bir açıklama yaz:

Başlık: "${title}"
Türler: ${genres}
Kısa özet: ${overview}

Neden izlenmeli? Türkçe, kısa ve öz yaz.`;

            const description = await geminiAPI.generateContent(prompt);
            return description.substring(0, 300); // Limit length
        } catch (error) {
            console.error('Description generation error:', error);
            return content.overview?.substring(0, 200) || 'Harika bir içerik!';
        }
    }

    /**
     * Render comparison for specific round
     */
    renderRound(roundNumber, pair) {
        console.log(`🎨 AIFeatures.renderRound called for round ${roundNumber}`);
        const containerId = `aiRound${roundNumber}Container`;
        console.log(`🔍 Looking for container: ${containerId}`);
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`❌ Container ${containerId} NOT FOUND in DOM!`);
            return;
        }

        if (!pair) {
            console.error(`❌ Pair is null for round ${roundNumber}`);
            return;
        }

        console.log(`✅ Container found, rendering content...`);
        const { content1, content2 } = pair;
        console.log(`📝 Content 1: ${content1.title || content1.name}`);
        console.log(`📝 Content 2: ${content2.title || content2.name}`);

        container.innerHTML = `
            <div class="comparison-card" data-content-id="${content1.id}" data-media-type="${content1.media_type}">
                <div class="comparison-poster">
                    <img src="${tmdbAPI.getPosterUrl(content1.poster_path)}" 
                         alt="${content1.title || content1.name}"
                         onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                </div>
                <div class="comparison-info">
                    <h4>${content1.title || content1.name}</h4>
                    <div class="comparison-meta">
                        <span>⭐ ${content1.vote_average?.toFixed(1) || 'N/A'}/10</span>
                        <span>${(content1.release_date || content1.first_air_date || '').substring(0, 4)}</span>
                    </div>
                    <p class="ai-description">${content1.aiDescription}</p>
                    <button class="btn btn-primary comparison-select-btn">✓ İzledim</button>
                </div>
            </div>

            <div class="comparison-card" data-content-id="${content2.id}" data-media-type="${content2.media_type}">
                <div class="comparison-poster">
                    <img src="${tmdbAPI.getPosterUrl(content2.poster_path)}" 
                         alt="${content2.title || content2.name}"
                         onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                </div>
                <div class="comparison-info">
                    <h4>${content2.title || content2.name}</h4>
                    <div class="comparison-meta">
                        <span>⭐ ${content2.vote_average?.toFixed(1) || 'N/A'}/10</span>
                        <span>${(content2.release_date || content2.first_air_date || '').substring(0, 4)}</span>
                    </div>
                    <p class="ai-description">${content2.aiDescription}</p>
                    <button class="btn btn-primary comparison-select-btn">✓ İzledim</button>
                </div>
            </div>
        `;

        console.log(`✅ HTML rendered to container`);

        // Attach click listeners
        const selectButtons = container.querySelectorAll('.comparison-select-btn');
        console.log(`🔘 Attaching ${selectButtons.length} button listeners`);
        selectButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.comparison-card');
                const contentId = card.dataset.contentId;
                const mediaType = card.dataset.mediaType;

                this.handleSelection(roundNumber, contentId, mediaType);
            });
        });
        console.log(`✅ Round ${roundNumber} rendering complete!`);
    }

    /**
     * Handle user selection
     */
    handleSelection(roundNumber, contentId, mediaType) {
        // Store watched content
        this.watchedContent.push({ id: contentId, media_type: mediaType });

        console.log(`Round ${roundNumber}: Selected ${mediaType} ${contentId}`);

        // Move to next step
        this.app.nextStep();
    }

    /**
     * Get final recommendations based on watched content
     */
    async getFinalRecommendations() {
        console.log('🎯 Getting final recommendations...');
        console.log('Watched content:', this.watchedContent);

        if (this.watchedContent.length === 0) {
            // No watched content, use general recommendations from content pool
            console.log('No watched content, using content pool');
            const formatted = this.app.contentPool.slice(0, 20).map(item => ({
                ...item,
                matchReasons: ['Seçtiğiniz türlere uygun'],
                recommendationScore: item.vote_average * 10
            }));
            console.log('Returning', formatted.length, 'recommendations');
            return formatted;
        }

        this.app.showLoading();

        try {
            let allSimilar = [];

            // Get similar content for each watched item
            for (const watched of this.watchedContent) {
                console.log(`Fetching similar content for ${watched.media_type} ${watched.id}`);
                const similar = watched.media_type === 'movie'
                    ? await tmdbAPI.getSimilarMovies(watched.id)
                    : await tmdbAPI.getSimilarTV(watched.id);

                allSimilar = [...allSimilar, ...similar.results.map(item => ({
                    ...item,
                    media_type: watched.media_type,
                    recommendationScore: item.vote_average * 10,
                    matchReasons: ['İzlediğiniz içeriklere benzer', `⭐ ${item.vote_average?.toFixed(1)}/10`]
                }))];
            }

            // Remove duplicates
            const unique = allSimilar.filter((item, index, self) =>
                index === self.findIndex(t => t.id === item.id && t.media_type === item.media_type)
            );

            // Sort by score
            unique.sort((a, b) => b.recommendationScore - a.recommendationScore);

            console.log('Final recommendations:', unique.length);
            this.app.hideLoading();
            return unique.slice(0, 50); // Return top 50
        } catch (error) {
            this.app.hideLoading();
            console.error('Final recommendations error:', error);
            // Fallback to content pool
            const formatted = this.app.contentPool.slice(0, 20).map(item => ({
                ...item,
                matchReasons: ['Seçtiğiniz türlere uygun'],
                recommendationScore: item.vote_average * 10
            }));
            return formatted;
        }
    }

    /**
     * Get mood description
     */
    getMoodDescription(mood) {
        const descriptions = {
            happy: 'Mutlu ruh haliniz',
            sad: 'Duygusal ruh haliniz',
            excited: 'Heyecanlı ruh haliniz',
            relaxed: 'Rahat ruh haliniz',
            thoughtful: 'Düşünceli ruh haliniz'
        };
        return descriptions[mood] || 'Ruh haliniz';
    }

    /**
     * Show AI message
     */
    showAIMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message-toast';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}

export default AIFeatures;
