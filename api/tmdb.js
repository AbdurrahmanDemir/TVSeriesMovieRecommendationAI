import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL, IMAGE_SIZES } from '../utils/constants.js';
import { buildUrl, retry } from '../utils/helpers.js';

/**
 * TMDb API Service
 * Handles all API calls to The Movie Database
 */

class TMDbAPI {
    constructor() {
        this.apiKey = TMDB_API_KEY;
        this.baseUrl = TMDB_BASE_URL;
        this.imageBaseUrl = TMDB_IMAGE_BASE_URL;
        this.language = 'tr-TR';
    }

    /**
     * Make API request with error handling
     */
    async request(endpoint, params = {}) {
        const url = buildUrl(`${this.baseUrl}${endpoint}`, {
            api_key: this.apiKey,
            language: this.language,
            ...params
        });

        try {
            const response = await retry(async () => {
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`API Error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });

            return response;
        } catch (error) {
            console.error('TMDb API Error:', error);
            throw error;
        }
    }

    /**
     * Get image URL
     */
    getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${this.imageBaseUrl}/${size}${path}`;
    }

    /**
     * Get poster URL
     */
    getPosterUrl(path) {
        return this.getImageUrl(path, IMAGE_SIZES.poster);
    }

    /**
     * Get backdrop URL
     */
    getBackdropUrl(path) {
        return this.getImageUrl(path, IMAGE_SIZES.backdrop);
    }

    /**
     * Search for movies
     */
    async searchMovies(query, page = 1) {
        return this.request('/search/movie', { query, page });
    }

    /**
     * Search for TV shows
     */
    async searchTV(query, page = 1) {
        return this.request('/search/tv', { query, page });
    }

    /**
     * Search for people (actors, directors)
     */
    async searchPerson(query, page = 1) {
        return this.request('/search/person', { query, page });
    }

    /**
     * Get movie details
     */
    async getMovieDetails(movieId) {
        return this.request(`/movie/${movieId}`, {
            append_to_response: 'credits,videos,similar,keywords'
        });
    }

    /**
     * Get TV show details
     */
    async getTVDetails(tvId) {
        return this.request(`/tv/${tvId}`, {
            append_to_response: 'credits,videos,similar,keywords'
        });
    }

    /**
     * Get person details
     */
    async getPersonDetails(personId) {
        return this.request(`/person/${personId}`, {
            append_to_response: 'movie_credits,tv_credits'
        });
    }

    /**
     * Discover movies with filters
     */
    async discoverMovies(filters = {}) {
        const params = {
            page: filters.page || 1,
            sort_by: filters.sortBy || 'popularity.desc',
            'vote_count.gte': 100, // Minimum vote count for quality
        };

        // Genre filter
        if (filters.genres && filters.genres.length > 0) {
            params.with_genres = filters.genres.join(',');
        }

        // Year filter
        if (filters.yearMin) params['primary_release_date.gte'] = `${filters.yearMin}-01-01`;
        if (filters.yearMax) params['primary_release_date.lte'] = `${filters.yearMax}-12-31`;

        // Rating filter
        if (filters.ratingMin) params['vote_average.gte'] = filters.ratingMin;

        // Runtime filter (in minutes)
        if (filters.runtimeMin) params['with_runtime.gte'] = filters.runtimeMin;
        if (filters.runtimeMax) params['with_runtime.lte'] = filters.runtimeMax;

        // Cast/Crew filter
        if (filters.withCast) params.with_cast = filters.withCast;
        if (filters.withCrew) params.with_crew = filters.withCrew;

        return this.request('/discover/movie', params);
    }

    /**
     * Discover TV shows with filters
     */
    async discoverTV(filters = {}) {
        const params = {
            page: filters.page || 1,
            sort_by: filters.sortBy || 'popularity.desc',
            'vote_count.gte': 50,
        };

        // Genre filter
        if (filters.genres && filters.genres.length > 0) {
            params.with_genres = filters.genres.join(',');
        }

        // Year filter
        if (filters.yearMin) params['first_air_date.gte'] = `${filters.yearMin}-01-01`;
        if (filters.yearMax) params['first_air_date.lte'] = `${filters.yearMax}-12-31`;

        // Rating filter
        if (filters.ratingMin) params['vote_average.gte'] = filters.ratingMin;

        // Runtime filter (episode runtime in minutes)
        if (filters.runtimeMin) params['with_runtime.gte'] = filters.runtimeMin;
        if (filters.runtimeMax) params['with_runtime.lte'] = filters.runtimeMax;

        return this.request('/discover/tv', params);
    }

    /**
     * Get trending content
     */
    async getTrending(mediaType = 'all', timeWindow = 'week') {
        return this.request(`/trending/${mediaType}/${timeWindow}`);
    }

    /**
     * Get popular movies
     */
    async getPopularMovies(page = 1) {
        return this.request('/movie/popular', { page });
    }

    /**
     * Get popular TV shows
     */
    async getPopularTV(page = 1) {
        return this.request('/tv/popular', { page });
    }

    /**
     * Get top rated movies
     */
    async getTopRatedMovies(page = 1) {
        return this.request('/movie/top_rated', { page });
    }

    /**
     * Get top rated TV shows
     */
    async getTopRatedTV(page = 1) {
        return this.request('/tv/top_rated', { page });
    }

    /**
     * Get movie genres
     */
    async getMovieGenres() {
        const response = await this.request('/genre/movie/list');
        return response.genres;
    }

    /**
     * Get TV genres
     */
    async getTVGenres() {
        const response = await this.request('/genre/tv/list');
        return response.genres;
    }

    /**
     * Get similar movies
     */
    async getSimilarMovies(movieId, page = 1) {
        return this.request(`/movie/${movieId}/similar`, { page });
    }

    /**
     * Get similar TV shows
     */
    async getSimilarTV(tvId, page = 1) {
        return this.request(`/tv/${tvId}/similar`, { page });
    }

    /**
     * Get movie recommendations
     */
    async getMovieRecommendations(movieId, page = 1) {
        return this.request(`/movie/${movieId}/recommendations`, { page });
    }

    /**
     * Get TV recommendations
     */
    async getTVRecommendations(tvId, page = 1) {
        return this.request(`/tv/${tvId}/recommendations`, { page });
    }

    /**
     * Get movie reviews
     */
    async getMovieReviews(movieId, page = 1) {
        return this.request(`/movie/${movieId}/reviews`, { page });
    }

    /**
     * Get TV reviews
     */
    async getTVReviews(tvId, page = 1) {
        return this.request(`/tv/${tvId}/reviews`, { page });
    }
}

// Export singleton instance
export default new TMDbAPI();
