// Utility helper functions

/**
 * Debounce function to limit function calls
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function execution rate
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format runtime in minutes to hours and minutes
 */
export function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}dk`;
    return `${hours}sa ${mins}dk`;
}

/**
 * Format date to readable format
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Format year from date string
 */
export function getYear(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
}

/**
 * Format rating to one decimal place
 */
export function formatRating(rating) {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Get rating color based on score
 */
export function getRatingColor(rating) {
    if (rating >= 7.5) return 'var(--color-success)';
    if (rating >= 6.0) return 'var(--color-warning)';
    return 'var(--color-error)';
}

/**
 * Shuffle array randomly
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Calculate cosine similarity between two arrays
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Create genre vector for similarity calculation
 */
export function createGenreVector(genreIds, allGenreIds) {
    return allGenreIds.map(id => genreIds.includes(id) ? 1 : 0);
}

/**
 * Normalize score to 0-1 range
 */
export function normalizeScore(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

/**
 * Get random items from array
 */
export function getRandomItems(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
}

/**
 * Check if value is in range
 */
export function inRange(value, min, max) {
    return value >= min && value <= max;
}

/**
 * Create URL with query parameters
 */
export function buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Remove duplicates from array by key
 */
export function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

/**
 * Sort array by multiple criteria
 */
export function sortBy(array, ...criteria) {
    return array.sort((a, b) => {
        for (const criterion of criteria) {
            const { key, order = 'asc' } = typeof criterion === 'string'
                ? { key: criterion, order: 'asc' }
                : criterion;

            const aVal = a[key];
            const bVal = b[key];

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

/**
 * Create delay promise
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            await delay(delayMs * Math.pow(2, attempt - 1));
        }
    }
}
