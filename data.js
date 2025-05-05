/**
 * Film Gallery Data Handler
 * - Fetches and manages film data
 * - Provides methods to load films and access film details
 */

// Configuration
const CONFIG = {
    ITEMS_PER_PAGE: 20,
    DEFAULT_IMAGE: "img/default-poster.jpg",
    DATA_FILE: "data/films.json"
};

// Data module
const FilmData = (function() {
    // Private variables
    let _films = [];
    let _currentPage = 1;
    let _totalPages = 1;
    let _idToFilmMap = {};
    let _isLoaded = false;
    
    // Private methods
    const _buildIdMap = (films) => {
        const map = {};
        films.forEach(film => {
            if (film && film._id) {
                map[film._id] = film;
            }
        });
        return map;
    };

    // Public API
    return {
        /**
         * Initialize data module and load initial data
         * @returns {Promise<boolean>} True if successful
         */
        init: async function() {
            try {
                // Try to load from the JSON file
                const response = await fetch(CONFIG.DATA_FILE);
                
                if (!response.ok) {
                    console.error("Failed to load film data:", response.status);
                    // Switch to demo data if can't load JSON
                    this.loadDemoData();
                    return true;
                }
                
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    _films = data;
                    _idToFilmMap = _buildIdMap(data);
                    _totalPages = Math.ceil(_films.length / CONFIG.ITEMS_PER_PAGE);
                    _isLoaded = true;
                    console.log(`Loaded ${_films.length} films from data file`);
                    return true;
                } else {
                    console.warn("No films found in data file");
                    this.loadDemoData();
                    return true;
                }
            } catch (error) {
                console.error("Error initializing film data:", error);
                // Switch to demo data if can't load JSON
                this.loadDemoData();
                return true;
            }
        },
        
        /**
         * Load demo data when no external data is available
         */
        loadDemoData: function() {
            console.log("Loading demo data");
            
            // Create some demo film entries
            _films = [
                {
                    _id: "film1",
                    title: "לשחק עם הרוח",
                    director: "דניאל כהן",
                    actors: "רות מזרחי, דוד לוי, שרה אהרוני",
                    synopsis: "סיפור מרגש על מציאת משמעות חדשה בחיים.",
                    image: "https://static.wixstatic.com/media/nsplsh_36726174314a61505934_lossy128webp.webp",
                    genre: ["דרמה", "רומנטיקה"],
                    aud: ["כל המשפחה"],
                    length: "95",
                    fest: "פסטיבל חיפה 2023",
                    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                },
                {
                    _id: "film2",
                    title: "הנווד האחרון",
                    director: "טל אביב",
                    actors: "אבי לוי, מירי אלוני, יעקב כהן",
                    synopsis: "מסע עצמי במדבר יהודה שהופך לחיפוש אחר משמעות.",
                    image: "https://static.wixstatic.com/media/nsplsh_376a656e49444a7661756668_lossy128webp.webp",
                    genre: ["הרפתקאות", "דרמה"],
                    aud: ["בוגרים"],
                    length: "110",
                    video: ""
                },
                {
                    _id: "film3",
                    title: "מעבר לגבול",
                    director: "נועה פרידמן",
                    actors: "אורן חזן, ליאת שניר, דני שפירא",
                    synopsis: "מבט על קהילה קטנה בגבול הצפון המתמודדת עם אתגרים.",
                    image: "https://static.wixstatic.com/media/nsplsh_56b36168664148627063514a7351386145336367_lossy128webp.webp",
                    genre: ["תיעודי"],
                    aud: ["בוגרים"],
                    length: "85",
                    fest: "דוקאביב 2023",
                    video: "https://www.youtube.com/watch?v=aBkTkxKDduc"
                }
            ];
            
            // Add more demo films to have a good amount for testing
            for (let i = 4; i <= 25; i++) {
                _films.push({
                    _id: `film${i}`,
                    title: `סרט לדוגמה ${i}`,
                    director: `במאי ${i}`,
                    actors: "שחקן כלשהו, שחקנית כלשהי",
                    synopsis: "זהו סרט לדוגמה שנוצר עבור גלריית הסרטים.",
                    image: `https://picsum.photos/seed/${i}/300/450`,
                    genre: i % 2 === 0 ? ["קומדיה"] : ["מתח"],
                    aud: ["בוגרים"],
                    length: `${70 + i}`,
                    video: ""
                });
            }
            
            _idToFilmMap = _buildIdMap(_films);
            _totalPages = Math.ceil(_films.length / CONFIG.ITEMS_PER_PAGE);
            _isLoaded = true;
            
            console.log(`Loaded ${_films.length} demo films`);
        },
        
        /**
         * Get films for a specific page
         * @param {number} page - Page number (1-based)
         * @returns {Array} Films for the requested page
         */
        getFilmsForPage: function(page = 1) {
            const start = (page - 1) * CONFIG.ITEMS_PER_PAGE;
            const end = start + CONFIG.ITEMS_PER_PAGE;
            return _films.slice(start, end);
        },
        
        /**
         * Get a film by its ID
         * @param {string} id - Film ID
         * @returns {Object|null} Film data or null if not found
         */
        getFilmById: function(id) {
            return _idToFilmMap[id] || null;
        },
        
        /**
         * Get total number of pages
         * @returns {number} Total pages
         */
        getTotalPages: function() {
            return _totalPages;
        },
        
        /**
         * Check if there are more pages to load
         * @param {number} currentPage - Current page number
         * @returns {boolean} True if more pages exist
         */
        hasMorePages: function(currentPage) {
            return currentPage < _totalPages;
        },
        
        /**
         * Check if data is loaded
         * @returns {boolean} True if data is loaded
         */
        isLoaded: function() {
            return _isLoaded;
        }
    };
})();
