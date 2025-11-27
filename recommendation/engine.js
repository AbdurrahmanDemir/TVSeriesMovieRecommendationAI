import { SCORING_WEIGHTS, GENRES } from '../utils/constants.js';
import { cosineSimilarity, createGenreVector, normalizeScore } from '../utils/helpers.js';

/**
 * Recommendation Engine
 * Calculates scores and generates personalized recommendations
 */

class RecommendationEngine {
    constructor() {
        this.weights = SCORING_WEIGHTS;
        this.allGenreIds = Object.keys(GENRES).map(Number);
    }

    /**
     * Calculate recommendation score for a single item
     */
    calculateScore(item, preferences, watchedContent = []) {
        let totalScore = 0;

        // 1. Genre Matching (30%)
        const genreScore = this.calculateGenreScore(item, preferences.selectedGenres);
        totalScore += genreScore * this.weights.genre;

        // 2. Cast/Crew Matching (25%)
        const castScore = this.calculateCastScore(item, preferences.selectedActors, preferences.selectedDirectors);
        totalScore += castScore * this.weights.cast;

        // 3. Similarity to Watched Content (25%)
        const similarityScore = this.calculateSimilarityScore(item, watchedContent);
        totalScore += similarityScore * this.weights.similarity;

        // 4. Rating Score (10%)
        const ratingScore = this.calculateRatingScore(item);
        totalScore += ratingScore * this.weights.rating;

        // 5. Popularity Score (10%)
        const popularityScore = this.calculatePopularityScore(item);
        totalScore += popularityScore * this.weights.popularity;

        return totalScore;
    }

    /**
     * Calculate genre matching score
     */
    calculateGenreScore(item, selectedGenres) {
        if (!selectedGenres || selectedGenres.length === 0) return 0.5;
        if (!item.genre_ids || item.genre_ids.length === 0) return 0;

        const itemGenres = item.genre_ids;
        const matchCount = itemGenres.filter(g => selectedGenres.includes(g)).length;

        // If no match at all, return 0
        if (matchCount === 0) return 0;

        // Base score for having at least one matching genre
        // This ensures content with ANY matching genre gets a good score
        const baseScore = 0.6;

        // Bonus for additional matching genres (up to 0.4 more)
        const bonusPerMatch = 0.4 / Math.max(selectedGenres.length, 3);
        const bonus = Math.min(matchCount * bonusPerMatch, 0.4);

        return Math.min(baseScore + bonus, 1.0);
    }

    /**
     * Calculate cast/crew matching score
     */
    calculateCastScore(item, selectedActors = [], selectedDirectors = []) {
        if (selectedActors.length === 0 && selectedDirectors.length === 0) return 0.5;

        let matchCount = 0;
        let totalSelected = selectedActors.length + selectedDirectors.length;

        // Check cast
        if (item.credits && item.credits.cast) {
            const castIds = item.credits.cast.map(c => c.id);
            matchCount += selectedActors.filter(id => castIds.includes(id)).length;
        }

        // Check crew (directors)
        if (item.credits && item.credits.crew) {
            const directorIds = item.credits.crew
                .filter(c => c.job === 'Director')
                .map(c => c.id);
            matchCount += selectedDirectors.filter(id => directorIds.includes(id)).length;
        }

        if (totalSelected === 0) return 0.5;
        return Math.min(matchCount / totalSelected, 1);
    }

    /**
     * Calculate similarity to watched content
     */
    calculateSimilarityScore(item, watchedContent) {
        if (!watchedContent || watchedContent.length === 0) return 0.5;

        const itemGenreVector = createGenreVector(item.genre_ids || [], this.allGenreIds);

        let maxSimilarity = 0;
        watchedContent.forEach(watched => {
            const watchedGenreVector = createGenreVector(watched.genre_ids || [], this.allGenreIds);
            const similarity = cosineSimilarity(itemGenreVector, watchedGenreVector);
            maxSimilarity = Math.max(maxSimilarity, similarity);
        });

        return maxSimilarity;
    }

    /**
     * Calculate rating score (normalized)
     */
    calculateRatingScore(item) {
        const rating = item.vote_average || 0;
        // Normalize rating from 0-10 to 0-1
        return normalizeScore(rating, 0, 10);
    }

    /**
     * Calculate popularity score (normalized)
     */
    calculatePopularityScore(item) {
        const popularity = item.popularity || 0;
        // Normalize popularity (typically 0-1000+)
        return normalizeScore(Math.min(popularity, 1000), 0, 1000);
    }

    /**
     * Apply filters to content list
     */
    applyFilters(items, preferences) {
        return items.filter(item => {
            // Year filter
            if (preferences.yearRange) {
                const year = this.getYear(item);
                if (year < preferences.yearRange.min || year > preferences.yearRange.max) {
                    return false;
                }
            }

            // Duration filter (for movies)
            if (preferences.duration && item.runtime) {
                if (item.runtime < preferences.duration.min || item.runtime > preferences.duration.max) {
                    return false;
                }
            }

            // Rating filter
            if (preferences.minRating) {
                if ((item.vote_average || 0) < preferences.minRating) {
                    return false;
                }
            }

            // Exclude already watched
            if (preferences.watchedContent && preferences.watchedContent.length > 0) {
                const isWatched = preferences.watchedContent.some(w =>
                    w.id === item.id && w.media_type === item.media_type
                );
                if (isWatched) return false;
            }

            return true;
        });
    }

    /**
     * Get year from item
     */
    getYear(item) {
        const dateStr = item.release_date || item.first_air_date;
        if (!dateStr) return 0;
        return new Date(dateStr).getFullYear();
    }

    /**
     * Generate recommendations
     */
    async generateRecommendations(contentPool, preferences, limit = 20) {
        // Apply filters first
        const filtered = this.applyFilters(contentPool, preferences);

        // Calculate scores
        const scored = filtered.map(item => ({
            ...item,
            recommendationScore: this.calculateScore(item, preferences, preferences.watchedContent),
            matchReasons: this.getMatchReasons(item, preferences)
        }));

        // Sort by score
        scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

        // Return top results
        return scored.slice(0, limit);
    }

    /**
     * Get reasons why item was recommended
     */
    getMatchReasons(item, preferences) {
        const reasons = [];

        // Genre match
        if (preferences.selectedGenres && preferences.selectedGenres.length > 0) {
            const matchingGenres = (item.genre_ids || []).filter(g =>
                preferences.selectedGenres.includes(g)
            );
            if (matchingGenres.length > 0) {
                const genreNames = matchingGenres.map(id => GENRES[id]).filter(Boolean);
                if (genreNames.length > 0) {
                    reasons.push(`${genreNames.join(', ')} türünde`);
                }
            }
        }

        // High rating
        if (item.vote_average >= 7.5) {
            reasons.push(`Yüksek puan (${item.vote_average.toFixed(1)})`);
        }

        // Popular
        if (item.popularity > 100) {
            reasons.push('Popüler');
        }

        // Recent
        const year = this.getYear(item);
        const currentYear = new Date().getFullYear();
        if (year >= currentYear - 2) {
            reasons.push('Yeni yapım');
        }

        return reasons;
    }

    /**
     * Get diverse recommendations (mix of different genres)
     */
    getDiverseRecommendations(recommendations, count = 10) {
        const diverse = [];
        const usedGenres = new Set();

        // First pass: one from each genre
        for (const item of recommendations) {
            if (diverse.length >= count) break;

            const primaryGenre = item.genre_ids?.[0];
            if (primaryGenre && !usedGenres.has(primaryGenre)) {
                diverse.push(item);
                usedGenres.add(primaryGenre);
            }
        }

        // Second pass: fill remaining slots with highest scores
        for (const item of recommendations) {
            if (diverse.length >= count) break;
            if (!diverse.includes(item)) {
                diverse.push(item);
            }
        }

        return diverse;
    }
}

// Export singleton instance
export default new RecommendationEngine();
