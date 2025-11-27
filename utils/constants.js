// API Configuration
export const TMDB_API_KEY = '5f9cb28b6592e9dbff751d984d4a498b';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image Sizes
export const IMAGE_SIZES = {
    poster: 'w500',
    backdrop: 'w1280',
    profile: 'w185',
    logo: 'w300'
};

// Genre IDs (TMDb)
export const GENRES = {
    // Movies & TV
    28: 'Aksiyon',
    12: 'Macera',
    16: 'Animasyon',
    35: 'Komedi',
    80: 'Suç',
    99: 'Belgesel',
    18: 'Dram',
    10751: 'Aile',
    14: 'Fantastik',
    36: 'Tarih',
    27: 'Korku',
    10402: 'Müzik',
    9648: 'Gizem',
    10749: 'Romantik',
    878: 'Bilim Kurgu',
    10770: 'TV Film',
    53: 'Gerilim',
    10752: 'Savaş',
    37: 'Vahşi Batı',
    // TV Specific
    10759: 'Aksiyon & Macera',
    10762: 'Çocuk',
    10763: 'Haber',
    10764: 'Reality',
    10765: 'Bilim Kurgu & Fantastik',
    10766: 'Pembe Dizi',
    10767: 'Talk Show',
    10768: 'Savaş & Politika'
};

// Emotional Tones
export const TONES = {
    fun: 'Eğlenceli',
    serious: 'Ciddi',
    dark: 'Karanlık',
    light: 'Hafif'
};

// Themes
export const THEMES = {
    trueStory: 'Gerçek Hikaye',
    superhero: 'Süper Kahraman',
    dystopia: 'Distopya',
    romance: 'Romantizm',
    crime: 'Suç',
    war: 'Savaş',
    comingOfAge: 'Büyüme Hikayesi',
    revenge: 'İntikam',
    survival: 'Hayatta Kalma'
};

// Duration Preferences (in minutes)
export const DURATION = {
    short: { min: 0, max: 90, label: 'Kısa (<90 dk)' },
    medium: { min: 90, max: 150, label: 'Orta (90-150 dk)' },
    long: { min: 150, max: 999, label: 'Uzun (>150 dk)' }
};

// Year Ranges
export const YEAR_RANGES = {
    classic: { min: 1950, max: 1990, label: 'Klasik (1950-1990)' },
    modern: { min: 1990, max: 2010, label: 'Modern (1990-2010)' },
    current: { min: 2010, max: new Date().getFullYear(), label: 'Güncel (2010+)' }
};

// Age Ratings
export const AGE_RATINGS = {
    family: 'Aile Dostu',
    teen: '13+',
    adult: '18+'
};

// Popularity Levels
export const POPULARITY_LEVELS = {
    mainstream: 'Ana Akım',
    independent: 'Bağımsız',
    cult: 'Kült'
};

// Scoring Weights
export const SCORING_WEIGHTS = {
    genre: 0.30,
    cast: 0.25,
    similarity: 0.25,
    rating: 0.10,
    popularity: 0.10
};

// Cache Duration (in milliseconds)
export const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

// LocalStorage Keys
export const STORAGE_KEYS = {
    preferences: 'movieapp_preferences',
    watchlist: 'movieapp_watchlist',
    favorites: 'movieapp_favorites',
    history: 'movieapp_history',
    cache: 'movieapp_cache'
};
