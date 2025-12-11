import tmdbAPI from './api/tmdb.js';
import storage from './storage/user-data.js';
import recommendationEngine from './recommendation/engine.js';
import geminiAPI from './api/gemini.js';
import AIFeatures from './components/ai-features.js';
// import aiChat from './components/ai-chat.js'; // Not used
import { GENRES, YEAR_RANGES, DURATION } from './utils/constants.js';
import { debounce, formatRating, getYear } from './utils/helpers.js';

/**
 * Main Application
 */

class App {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5; // 1: Media Type, 2: Genres, 3-5: AI Rounds
        this.preferences = storage.loadPreferences();
        this.searchResults = [];
        this.recommendations = [];
        this.contentPool = [];

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.checkExistingPreferences();

        // Initialize AI Features
        this.aiFeatures = new AIFeatures(this);
        this.aiFeatures.init();

        // AI Chat disabled
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Screens
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.preferencesScreen = document.getElementById('preferencesScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
        this.watchlistScreen = document.getElementById('watchlistScreen');
        this.favoritesScreen = document.getElementById('favoritesScreen');

        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.watchlistBtn = document.getElementById('watchlistBtn');
        this.favoritesBtn = document.getElementById('favoritesBtn');
        this.backFromWatchlist = document.getElementById('backFromWatchlist');
        this.backFromFavorites = document.getElementById('backFromFavorites');

        // Steps
        this.steps = {
            1: document.getElementById('step1'),
            2: document.getElementById('step2'),
            3: document.getElementById('step3'),
            4: document.getElementById('step4'),
            5: document.getElementById('step5')
        };

        // Other elements
        this.progressFill = document.getElementById('progressFill');
        this.genreGrid = document.getElementById('genreGrid');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.watchlistGrid = document.getElementById('watchlistGrid');
        this.favoritesGrid = document.getElementById('favoritesGrid');
        this.sortBy = document.getElementById('sortBy');
        this.headerNav = document.getElementById('headerNav');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        // Modal
        this.modal = document.getElementById('detailModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Start button
        this.startBtn.addEventListener('click', () => this.showPreferences());

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => {
            console.log('▶️ Next button clicked, currentStep:', this.currentStep);
            this.nextStep();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());

        // Media type selection
        document.querySelectorAll('#step1 .option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('#step1 .option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.preferences.mediaType = card.dataset.value;
            });
        });

        // Search input removed (Step 3 removed)

        // Sort change
        this.sortBy.addEventListener('change', () => this.sortResults());

        // Load more
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreResults());

        // Modal close
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());

        // Additional preferences removed

        // Watchlist and Favorites buttons
        this.watchlistBtn.addEventListener('click', () => this.showWatchlist());
        this.favoritesBtn.addEventListener('click', () => this.showFavorites());
        this.backFromWatchlist.addEventListener('click', () => this.backToResults());
        this.backFromFavorites.addEventListener('click', () => this.backToResults());
    }

    /**
     * Check if user has existing preferences
     */
    checkExistingPreferences() {
        const prefs = storage.loadPreferences();
        if (prefs.selectedGenres && prefs.selectedGenres.length > 0) {
            this.headerNav.classList.remove('hidden');
        }
    }

    /**
     * Show preferences screen
     */
    showPreferences() {
        this.welcomeScreen.classList.add('hidden');
        this.preferencesScreen.classList.remove('hidden');
        this.headerNav.classList.remove('hidden');
        this.renderGenres();
        this.updateProgress();
    }

    /**
     * Render genre selection
     */
    renderGenres() {
        this.genreGrid.innerHTML = '';

        Object.entries(GENRES).forEach(([id, name]) => {
            const chip = document.createElement('button');
            chip.className = 'genre-chip';
            chip.textContent = name;
            chip.dataset.genreId = id;

            if (this.preferences.selectedGenres.includes(parseInt(id))) {
                chip.classList.add('selected');
            }

            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
                const genreId = parseInt(id);

                if (chip.classList.contains('selected')) {
                    if (!this.preferences.selectedGenres.includes(genreId)) {
                        this.preferences.selectedGenres.push(genreId);
                    }
                } else {
                    this.preferences.selectedGenres = this.preferences.selectedGenres.filter(g => g !== genreId);
                }
            });

            this.genreGrid.appendChild(chip);
        });
    }

    /**
     * Handle search for watched content
     */
    async handleSearch(query) {
        if (!query || query.length < 2) {
            this.searchResults.innerHTML = '';
            return;
        }

        try {
            const mediaType = this.preferences.mediaType;
            let results = [];

            if (mediaType === 'movie' || mediaType === 'both') {
                const movieResults = await tmdbAPI.searchMovies(query);
                results = [...results, ...movieResults.results.map(r => ({ ...r, media_type: 'movie' }))];
            }

            if (mediaType === 'tv' || mediaType === 'both') {
                const tvResults = await tmdbAPI.searchTV(query);
                results = [...results, ...tvResults.results.map(r => ({ ...r, media_type: 'tv' }))];
            }

            this.renderSearchResults(results.slice(0, 10));
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    /**
     * Render search results
     */
    renderSearchResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted);">Sonuç bulunamadı</div>';
            return;
        }

        this.searchResults.innerHTML = results.map(item => {
            const title = item.title || item.name;
            const year = getYear(item.release_date || item.first_air_date);
            const posterUrl = item.poster_path ? tmdbAPI.getPosterUrl(item.poster_path) : '';

            return `
                <div class="search-result-item" data-id="${item.id}" data-type="${item.media_type}">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${title}" class="search-result-poster">` : '<div class="search-result-poster"></div>'}
                    <div class="search-result-info">
                        <div class="search-result-title">${title}</div>
                        <div class="search-result-meta">${year} • ${item.media_type === 'movie' ? 'Film' : 'Dizi'}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const type = item.dataset.type;
                const result = results.find(r => r.id === id && r.media_type === type);
                this.addWatchedContent(result);
                this.watchedSearch.value = '';
                this.searchResults.innerHTML = '';
            });
        });
    }

    /**
     * Add watched content
     */
    addWatchedContent(item) {
        if (!this.preferences.watchedContent) {
            this.preferences.watchedContent = [];
        }

        const exists = this.preferences.watchedContent.find(w => w.id === item.id && w.media_type === item.media_type);
        if (!exists) {
            this.preferences.watchedContent.push(item);
            this.renderSelectedWatched();
        }
    }

    /**
     * Render selected watched content
     */
    renderSelectedWatched() {
        if (!this.preferences.watchedContent || this.preferences.watchedContent.length === 0) {
            this.selectedWatched.innerHTML = '<div style="color: var(--color-text-muted); padding: 1rem;">Henüz içerik eklemediniz</div>';
            return;
        }

        this.selectedWatched.innerHTML = this.preferences.watchedContent.map(item => {
            const title = item.title || item.name;
            return `
                <div class="selected-item">
                    <span>${title}</span>
                    <button class="selected-item-remove" data-id="${item.id}" data-type="${item.media_type}">×</button>
                </div>
            `;
        }).join('');

        // Add remove listeners
        this.selectedWatched.querySelectorAll('.selected-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const type = btn.dataset.type;
                this.preferences.watchedContent = this.preferences.watchedContent.filter(w =>
                    !(w.id === id && w.media_type === type)
                );
                this.renderSelectedWatched();
            });
        });
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    /**
     * Go to next step
     */
    async nextStep() {
        // Validate current step
        if (!this.validateStep()) return;

        if (this.currentStep < this.totalSteps) {
            // Prepare AI rounds BEFORE switching steps (for steps 3, 4, 5)
            const nextStep = this.currentStep + 1;
            if (nextStep >= 3 && nextStep <= 5) {
                // Step 3 = Round 1, Step 4 = Round 2, Step 5 = Round 3
                const roundNumber = nextStep - 2;
                console.log(`🎬 Preparing round ${roundNumber} for step ${nextStep}...`);
                this.showLoading();
                await this.prepareRound(roundNumber);
                this.hideLoading();
            }

            // Now switch to the next step
            this.steps[this.currentStep].classList.add('hidden');
            this.currentStep++;
            this.steps[this.currentStep].classList.remove('hidden');
            this.updateProgress();
            this.updateNavigationButtons();
        } else {
            // Generate recommendations
            await this.generateRecommendations();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.steps[this.currentStep].classList.add('hidden');
            this.currentStep--;
            this.steps[this.currentStep].classList.remove('hidden');
            this.updateProgress();
            this.updateNavigationButtons();
        }
    }

    /**
     * Validate current step
     */
    validateStep() {
        console.log('🔍 Validating step', this.currentStep);
        if (this.currentStep === 1) {
            if (!this.preferences.mediaType) {
                alert('Lütfen bir seçenek seçin');
                return false;
            }
        }

        if (this.currentStep === 2) {
            if (this.preferences.selectedGenres.length === 0) {
                alert('Lütfen en az bir tür seçin');
                return false;
            }
        }

        return true;
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentStep === 1;
        this.nextBtn.textContent = this.currentStep === this.totalSteps ? '✨ Önerileri Göster' : 'İleri →';
    }

    /**
     * Generate recommendations
     */
    async generateRecommendations() {
        // Use AI features to get final recommendations
        this.recommendations = await this.aiFeatures.getFinalRecommendations();
        this.showResults();
        return;

        // OLD CODE BELOW (kept for reference)
        /*
        console.log('=== GENERATE RECOMMENDATIONS CALLED ===');
        this.showLoading();

        try {
            console.log('Selected genres:', this.preferences.selectedGenres);
            console.log('Media type:', this.preferences.mediaType);

            // Save preferences
            storage.savePreferences(this.preferences);

            // Fetch content based on preferences
            await this.fetchContentPool();
            console.log('Content pool size:', this.contentPool.length);

            // Generate recommendations
            this.recommendations = await recommendationEngine.generateRecommendations(
                this.contentPool,
                this.preferences,
                50
            );

            console.log('Recommendations generated:', this.recommendations.length);

            // Show results
            this.showResults();
        } catch (error) {
            console.error('Recommendation error:', error);
            alert('Öneriler oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            this.hideLoading();
        }
    }
    */
    }

    /**
     * Fetch content pool
     */
    async fetchContentPool() {
        const baseFilters = {
            yearMin: this.preferences.yearRange?.min,
            yearMax: this.preferences.yearRange?.max,
            runtimeMin: this.preferences.duration?.min,
            runtimeMax: this.preferences.duration?.max,
            ratingMin: this.preferences.minRating
        };

        let allContent = [];

        // TMDb API'nin with_genres parametresi AND mantığıyla çalışıyor.
        // Birden fazla tür seçildiğinde, her tür için ayrı ayrı istek göndererek OR mantığı sağlıyoruz.

        if (this.preferences.selectedGenres.length === 1) {
            // Tek tür seçiliyse, daha fazla sayfa çek
            const filters = {
                ...baseFilters,
                genres: this.preferences.selectedGenres
            };
            const pages = 5;

            if (this.preferences.mediaType === 'movie' || this.preferences.mediaType === 'both') {
                for (let page = 1; page <= pages; page++) {
                    try {
                        const result = await tmdbAPI.discoverMovies({ ...filters, page });
                        allContent = [...allContent, ...result.results.map(r => ({ ...r, media_type: 'movie' }))];
                    } catch (error) {
                        console.error(`Error fetching movies page ${page}:`, error);
                    }
                }
            }

            if (this.preferences.mediaType === 'tv' || this.preferences.mediaType === 'both') {
                for (let page = 1; page <= pages; page++) {
                    try {
                        const result = await tmdbAPI.discoverTV({ ...filters, page });
                        allContent = [...allContent, ...result.results.map(r => ({ ...r, media_type: 'tv' }))];
                    } catch (error) {
                        console.error(`Error fetching TV page ${page}:`, error);
                    }
                }
            }
        } else {
            // Birden fazla tür seçiliyse, her tür için ayrı ayrı istek gönder (OR mantığı)
            const pagesPerGenre = 3;

            for (const genreId of this.preferences.selectedGenres) {
                const filters = {
                    ...baseFilters,
                    genres: [genreId]
                };

                if (this.preferences.mediaType === 'movie' || this.preferences.mediaType === 'both') {
                    for (let page = 1; page <= pagesPerGenre; page++) {
                        try {
                            const result = await tmdbAPI.discoverMovies({ ...filters, page });
                            allContent = [...allContent, ...result.results.map(r => ({ ...r, media_type: 'movie' }))];
                        } catch (error) {
                            console.error(`Error fetching movies for genre ${genreId}, page ${page}:`, error);
                        }
                    }
                }

                if (this.preferences.mediaType === 'tv' || this.preferences.mediaType === 'both') {
                    for (let page = 1; page <= pagesPerGenre; page++) {
                        try {
                            const result = await tmdbAPI.discoverTV({ ...filters, page });
                            allContent = [...allContent, ...result.results.map(r => ({ ...r, media_type: 'tv' }))];
                        } catch (error) {
                            console.error(`Error fetching TV for genre ${genreId}, page ${page}:`, error);
                        }
                    }
                }
            }
        }

        // Remove duplicates
        const uniqueContent = [];
        const seen = new Set();

        for (const item of allContent) {
            const key = `${item.id}-${item.media_type}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueContent.push(item);
            }
        }

        this.contentPool = uniqueContent;
        console.log(`Fetched ${uniqueContent.length} unique items from ${this.preferences.selectedGenres.length} genre(s)`);
    }

    /**
     * Show results screen
     */
    showResults() {
        this.preferencesScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        this.renderResults();
    }

    /**
     * Render results
     */
    renderResults(limit = 20) {
        const items = this.recommendations.slice(0, limit);

        this.resultsGrid.innerHTML = items.map(item => {
            const title = item.title || item.name;
            const year = getYear(item.release_date || item.first_air_date);
            const rating = formatRating(item.vote_average);
            const posterUrl = item.poster_path ? tmdbAPI.getPosterUrl(item.poster_path) : '';

            return `
                <div class="movie-card" data-id="${item.id}" data-type="${item.media_type}">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${title}" class="movie-poster">` : '<div class="movie-poster"></div>'}
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-meta">
                            <span class="movie-year">${year}</span>
                            <span class="movie-rating">
                                ⭐ <span class="movie-rating-value">${rating}</span>
                            </span>
                        </div>
                        <div class="movie-reasons">
                            ${item.matchReasons.slice(0, 2).map(reason =>
                `<span class="reason-badge">${reason}</span>`
            ).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        this.resultsGrid.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showDetail(id, type);
            });
        });

        this.loadMoreBtn.style.display = limit < this.recommendations.length ? 'inline-flex' : 'none';
    }

    /**
     * Load more results
     */
    loadMoreResults() {
        const currentCount = this.resultsGrid.children.length;
        this.renderResults(currentCount + 20);
    }

    /**
     * Sort results
     */
    sortResults() {
        const sortBy = this.sortBy.value;

        switch (sortBy) {
            case 'score':
                this.recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
                break;
            case 'rating':
                this.recommendations.sort((a, b) => b.vote_average - a.vote_average);
                break;
            case 'popularity':
                this.recommendations.sort((a, b) => b.popularity - a.popularity);
                break;
            case 'year':
                this.recommendations.sort((a, b) => {
                    const yearA = getYear(a.release_date || a.first_air_date);
                    const yearB = getYear(b.release_date || b.first_air_date);
                    return yearB - yearA;
                });
                break;
        }

        this.renderResults();
    }

    /**
     * Show detail modal
     */
    async showDetail(id, type) {
        this.showLoading();

        try {
            const details = type === 'movie'
                ? await tmdbAPI.getMovieDetails(id)
                : await tmdbAPI.getTVDetails(id);

            await this.renderDetailModal(details, type);
            this.modal.classList.remove('hidden');
        } catch (error) {
            console.error('Detail error:', error);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Render detail modal
     */
    async renderDetailModal(item, type) {
        const title = item.title || item.name;
        const year = getYear(item.release_date || item.first_air_date);
        const rating = formatRating(item.vote_average);
        const backdropUrl = item.backdrop_path ? tmdbAPI.getBackdropUrl(item.backdrop_path) : '';
        const genres = item.genres.map(g => g.name).join(', ');
        const cast = item.credits?.cast.slice(0, 5).map(c => c.name).join(', ') || 'N/A';

        // Store current item for AI features
        this.currentModalItem = item;
        this.currentModalType = type;

        // Fetch reviews
        let reviewsHTML = '';
        let reviewsData = null;
        try {
            reviewsData = type === 'movie'
                ? await tmdbAPI.getMovieReviews(item.id)
                : await tmdbAPI.getTVReviews(item.id);

            if (reviewsData.results && reviewsData.results.length > 0) {
                const reviews = reviewsData.results.slice(0, 10);
                this.currentModalReviews = reviews; // Store for AI analysis
                reviewsHTML = `
                    <div class="reviews-section">
                        <h3 class="reviews-title">İzleyici Yorumları</h3>
                        ${reviews.map((review, index) => {
                    const reviewRating = review.author_details?.rating || 'N/A';
                    return `
                                <div class="review-item">
                                    <div class="review-header">
                                        <span class="review-author">${review.author}</span>
                                        ${reviewRating !== 'N/A' ? `<span class="review-rating">⭐ ${reviewRating}/10</span>` : ''}
                                    </div>
                                    <div class="review-content collapsed" id="review-${index}">
                                        ${review.content}
                                    </div>
                                    <span class="review-read-more" onclick="app.toggleReview(${index})">Devamını Oku</span>
                                </div>
                            `;
                }).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Reviews fetch error:', error);
        }

        this.modalBody.innerHTML = `
            ${backdropUrl ? `<img src="${backdropUrl}" alt="${title}" style="width: 100%; border-radius: var(--radius-lg) var(--radius-lg) 0 0;">` : ''}
            <div style="padding: var(--space-xl);">
                <h2 style="margin-bottom: var(--space-sm);">${title}</h2>
                <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md); color: var(--color-text-secondary);">
                    <span>${year}</span>
                    <span>⭐ ${rating}</span>
                    <span>${type === 'movie' ? 'Film' : 'Dizi'}</span>
                </div>
                <div style="margin-bottom: var(--space-md);">
                    <strong>Türler:</strong> ${genres}
                </div>
                <div style="margin-bottom: var(--space-md);">
                    <strong>Oyuncular:</strong> ${cast}
                </div>
                <p style="color: var(--color-text-secondary); line-height: 1.6;">
                    ${item.overview || 'Açıklama mevcut değil.'}
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-top: var(--space-lg);">
                    <button class="btn btn-primary" onclick="app.addToWatchlist(${item.id}, '${type}')">
                        ➕ İzleme Listesine Ekle
                    </button>
                    <button class="btn btn-secondary" onclick="app.addToFavorites(${item.id}, '${type}')">
                        ❤️ Favorilere Ekle
                    </button>
                    ${reviewsData && reviewsData.results.length > 0 ? `
                        <button class="btn btn-secondary" onclick="app.analyzeReviews()">
                            🤖 İncelemeleri Analiz Et
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="app.chatAboutContent()">
                        💬 AI ile Sohbet Et
                    </button>
                </div>
                <div id="aiAnalysisContainer" style="margin-top: var(--space-lg);"></div>
                ${reviewsHTML}
            </div>
        `;
    }

    /**
     * Close modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
    }

    /**
     * Add to watchlist
     */
    addToWatchlist(id, type) {
        const item = this.recommendations.find(r => r.id === id && r.media_type === type);
        if (item) {
            storage.addToWatchlist(item);
            alert('İzleme listesine eklendi!');
        }
    }

    /**
     * Add to favorites
     */
    addToFavorites(id, type) {
        const item = this.recommendations.find(r => r.id === id && r.media_type === type);
        if (item) {
            storage.addToFavorites(item);
            alert('Favorilere eklendi!');
        }
    }

    /**
     * Show watchlist screen
     */
    showWatchlist() {
        this.resultsScreen.classList.add('hidden');
        this.watchlistScreen.classList.remove('hidden');
        this.renderWatchlist();
    }

    /**
     * Show favorites screen
     */
    showFavorites() {
        this.resultsScreen.classList.add('hidden');
        this.favoritesScreen.classList.remove('hidden');
        this.renderFavorites();
    }

    /**
     * Back to results
     */
    backToResults() {
        this.watchlistScreen.classList.add('hidden');
        this.favoritesScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
    }

    /**
     * Render watchlist
     */
    renderWatchlist() {
        const watchlist = storage.loadWatchlist();

        if (watchlist.length === 0) {
            this.watchlistGrid.classList.add('hidden');
            document.getElementById('emptyWatchlist').classList.remove('hidden');
            return;
        }

        this.watchlistGrid.classList.remove('hidden');
        document.getElementById('emptyWatchlist').classList.add('hidden');

        this.watchlistGrid.innerHTML = watchlist.map(item => {
            const title = item.title || item.name;
            const year = getYear(item.release_date || item.first_air_date);
            const rating = formatRating(item.vote_average);
            const posterUrl = item.poster_path ? tmdbAPI.getPosterUrl(item.poster_path) : '';

            return `
                <div class="movie-card" data-id="${item.id}" data-type="${item.media_type}">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${title}" class="movie-poster">` : '<div class="movie-poster"></div>'}
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-meta">
                            <span class="movie-year">${year}</span>
                            <span class="movie-rating">
                                ⭐ <span class="movie-rating-value">${rating}</span>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.watchlistGrid.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showDetail(id, type);
            });
        });
    }

    /**
     * Render favorites
     */
    renderFavorites() {
        const favorites = storage.loadFavorites();

        if (favorites.length === 0) {
            this.favoritesGrid.classList.add('hidden');
            document.getElementById('emptyFavorites').classList.remove('hidden');
            return;
        }

        this.favoritesGrid.classList.remove('hidden');
        document.getElementById('emptyFavorites').classList.add('hidden');

        this.favoritesGrid.innerHTML = favorites.map(item => {
            const title = item.title || item.name;
            const year = getYear(item.release_date || item.first_air_date);
            const rating = formatRating(item.vote_average);
            const posterUrl = item.poster_path ? tmdbAPI.getPosterUrl(item.poster_path) : '';

            return `
                <div class="movie-card" data-id="${item.id}" data-type="${item.media_type}">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${title}" class="movie-poster">` : '<div class="movie-poster"></div>'}
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-meta">
                            <span class="movie-year">${year}</span>
                            <span class="movie-rating">
                                ⭐ <span class="movie-rating-value">${rating}</span>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.favoritesGrid.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showDetail(id, type);
            });
        });
    }

    /**
     * Toggle review expansion
     */
    toggleReview(index) {
        const reviewContent = document.getElementById(`review-${index}`);
        const readMoreBtn = reviewContent.nextElementSibling;

        if (reviewContent.classList.contains('collapsed')) {
            reviewContent.classList.remove('collapsed');
            readMoreBtn.textContent = 'Daha Az Göster';
        } else {
            reviewContent.classList.add('collapsed');
            readMoreBtn.textContent = 'Devamını Oku';
        }
    }

    /**
     * Reset application
     */
    reset() {
        if (confirm('Tüm tercihleriniz silinecek. Devam etmek istiyor musunuz?')) {
            storage.clearAll();
            location.reload();
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    /**
     * Prepare specific round
     */
    async prepareRound(roundNumber) {
        console.log(`🎬 App.prepareRound called for round ${roundNumber}`);
        console.log(`📊 Content pool size: ${this.contentPool?.length || 0}`);

        // Fetch content pool if not already fetched
        if (!this.contentPool || this.contentPool.length === 0) {
            console.log('⏳ Fetching content pool...');
            await this.fetchContentPool();
            console.log(`✅ Content pool fetched: ${this.contentPool.length} items`);
        }

        console.log(`🔄 Calling aiFeatures.prepareRound(${roundNumber})...`);
        // Prepare and render round
        const pair = await this.aiFeatures.prepareRound(roundNumber, this.contentPool);

        console.log(`📦 Pair returned:`, pair ? 'SUCCESS' : 'FAILED');
        if (pair) {
            console.log(`🎨 Rendering round ${roundNumber}...`);
            this.aiFeatures.renderRound(roundNumber, pair);
            console.log(`✅ Round ${roundNumber} rendered successfully`);
        } else {
            console.error(`❌ Failed to prepare round ${roundNumber}`);
        }
    }

    /**
     * Analyze reviews with AI
     */
    async analyzeReviews() {
        if (!geminiAPI.hasApiKey()) {
            alert('⚠️ Bu özelliği kullanmak için Google Gemini API key\'inizi girmelisiniz.\n\nAPI key almak için: https://makersuite.google.com/app/apikey');
            return;
        }

        const container = document.getElementById('aiAnalysisContainer');
        container.innerHTML = `
            <div class="glass-card" style="margin-top: var(--space-lg);">
                <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: var(--space-sm);">
                    <span>🤖</span>
                    <span>AI İnceleme Analizi</span>
                </h3>
                <div class="spinner" style="margin: var(--space-lg) auto;"></div>
                <p style="text-align: center; color: var(--color-text-muted);">İncelemeler analiz ediliyor...</p>
            </div>
        `;

        try {
            const title = this.currentModalItem.title || this.currentModalItem.name;
            const analysis = await geminiAPI.analyzeReviews(
                title,
                this.currentModalReviews,
                this.currentModalType
            );

            container.innerHTML = `
                <div class="glass-card" style="margin-top: var(--space-lg); animation: fadeIn 0.3s ease-in;">
                    <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: var(--space-sm);">
                        <span>🤖</span>
                        <span>AI İnceleme Analizi</span>
                    </h3>
                    <div style="color: var(--color-text-secondary); line-height: 1.8; white-space: pre-wrap;">
                        ${analysis}
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `
                <div class="glass-card" style="margin-top: var(--space-lg); border-color: var(--color-error);">
                    <p style="color: var(--color-error);">❌ Analiz sırasında bir hata oluştu: ${error.message}</p>
                    <p style="color: var(--color-text-muted); margin-top: var(--space-sm); font-size: var(--font-size-sm);">
                        API key'inizin doğru olduğundan ve internet bağlantınızın aktif olduğundan emin olun.
                    </p>
                </div>
            `;
        }
    }

    /**
     * Chat about current content
     */
    chatAboutContent() {
        const title = this.currentModalItem.title || this.currentModalItem.name;
        aiChat.setContext({
            currentContent: this.currentModalItem
        });
        aiChat.openChat();

        // Send initial message
        setTimeout(() => {
            aiChat.addAIMessage(`"${title}" hakkında konuşalım! Bu ${this.currentModalType === 'movie' ? 'film' : 'dizi'} hakkında ne öğrenmek istersin?`);
        }, 500);
    }

    /**
     * Get mood-based recommendations (can be called from anywhere)
     */
    async getMoodRecommendations(mood) {
        if (!geminiAPI.hasApiKey()) {
            alert('⚠️ Bu özelliği kullanmak için Google Gemini API key\'inizi girmelisiniz.');
            return;
        }

        this.showLoading();
        try {
            const recommendations = await geminiAPI.getMoodRecommendations(
                mood,
                this.preferences,
                this.recommendations.length > 0 ? this.recommendations : this.contentPool
            );

            this.hideLoading();

            // Show in AI chat
            aiChat.openChat();
            aiChat.addAIMessage(recommendations);
        } catch (error) {
            this.hideLoading();
            alert('❌ Hata: ' + error.message);
        }
    }
}

// Initialize app
const app = new App();

// Make app globally accessible
window.app = app;




