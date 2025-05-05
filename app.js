/**
 * Film Gallery Application
 * Main application logic for the film gallery
 */

// Configuration
const CONFIG = {
    ITEMS_PER_PAGE: 20,
    DEFAULT_IMAGE: "img/default-poster.jpg"
};

// Application module
const App = (function() {
    // Private variables
    let currentPage = 1;
    let isProcessing = false;
    let gallerySetupComplete = false;
    let lastClickTime = 0; // For debounce
    
    // DOM Elements Cache
    let elements = {};
    
    // Helper Functions
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const isMobile = () => {
        return window.innerWidth <= 767;
    };
    
    const log = (message, data) => {
        if (data) {
            console.log(`LOG: ${message}`, data);
        } else {
            console.log(`LOG: ${message}`);
        }
    };
    
    /**
     * Cache DOM elements for better performance
     */
    const cacheElements = () => {
        // Get references to all the elements we'll need
        elements = {
            startScreen: document.getElementById('startScreen'),
            logo: document.getElementById('logo'),
            startButton: document.getElementById('startButton'),
            boxy: document.getElementById('boxy'),
            gallery: document.getElementById('gallery'),
            loadMoreButton: document.getElementById('loadMoreButton'),
            posterContainer: document.getElementById('posterContainer'),
            backButton: document.getElementById('backButton'),
            moviePoster: document.getElementById('moviePoster'),
            movieTitle: document.getElementById('movieTitle'),
            movieDirector: document.getElementById('movieDirector'),
            movieActors: document.getElementById('movieActors'),
            movieSynopsis: document.getElementById('movieSynopsis'),
            fests: document.getElementById('fests'),
            mfest: document.getElementById('mfest'),
            maud: document.getElementById('maud'),
            mgenre: document.getElementById('mgenre'),
            mlength: document.getElementById('mlength'),
            video: document.getElementById('video')
        };
        
        log("DOM elements cached");
    };
    
    /**
     * Set up event handlers
     */
    const setupEventHandlers = () => {
        // Start button
        if (elements.startButton) {
            elements.startButton.addEventListener('click', async () => {
                log("Start button clicked");
                
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    // Transition from start screen to gallery
                    await fadeOut(elements.startScreen);
                    await fadeIn(elements.boxy);
                    window.scrollTo(0, 0);
                } catch (error) {
                    log("Error transitioning to gallery view:", error);
                    
                    // Fallback
                    elements.startScreen.style.display = 'none';
                    elements.boxy.style.display = 'block';
                } finally {
                    setTimeout(() => { isProcessing = false; }, 600);
                }
            });
            
            log("Start button handler set up");
        }
        
        // Back button
        if (elements.backButton) {
            elements.backButton.addEventListener('click', async () => {
                log("Back button clicked");
                
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    // Pause and hide video if playing
                    if (elements.video) {
                        elements.video.pause();
                        elements.video.style.display = 'none';
                    }
                    
                    // Transition back to gallery
                    await fadeOut(elements.posterContainer);
                    await fadeIn(elements.boxy);
                    window.scrollTo(0, 0);
                } catch (error) {
                    log("Error returning to gallery view:", error);
                    
                    // Fallback
                    elements.posterContainer.style.display = 'none';
                    elements.boxy.style.display = 'block';
                } finally {
                    setTimeout(() => { isProcessing = false; }, 600);
                }
            });
            
            log("Back button handler set up");
        }
        
        // Load more button
        if (elements.loadMoreButton) {
            elements.loadMoreButton.addEventListener('click', () => {
                log("Load more button clicked");
                
                if (isProcessing) return;
                
                // Load next page
                currentPage++;
                loadFilmsToGallery(currentPage);
                
                // Hide button if no more pages
                if (!FilmData.hasMorePages(currentPage)) {
                    elements.loadMoreButton.style.display = 'none';
                }
            });
            
            log("Load more button handler set up");
        }
    };
    
    /**
     * Set up gallery with click handlers for items
     */
    const setupGallery = () => {
        log("Setting up gallery");
        
        // Create gallery if it doesn't exist
        if (!elements.gallery.querySelector('.gallery-grid')) {
            elements.gallery.innerHTML = '<div class="gallery-grid"></div>';
        }
        
        gallerySetupComplete = true;
        log("Gallery setup complete");
    };
    
    /**
     * Load films to the gallery view
     * @param {number} page - Page number to load
     */
    const loadFilmsToGallery = async (page = 1) => {
        try {
            log(`Loading films for page ${page}`);
            
            if (!elements.gallery) {
                log("Gallery element not found");
                return;
            }
            
            // Get films for the current page
            const films = FilmData.getFilmsForPage(page);
            
            if (films.length === 0) {
                log("No films found for this page");
                return;
            }
            
            log(`Found ${films.length} films for page ${page}`);
            
            // Get the gallery grid
            const galleryGrid = elements.gallery.querySelector('.gallery-grid') || elements.gallery;
            
            // Create gallery items
            films.forEach(film => {
                if (!film || !film._id) return;
                
                // Create gallery item
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.dataset.id = film._id;
                
                // Set image
                const img = document.createElement('img');
                img.src = film.image || CONFIG.DEFAULT_IMAGE;
                img.alt = film.title || 'Film';
                img.onerror = function() {
                    this.src = CONFIG.DEFAULT_IMAGE;
                };
                
                // Set title
                const title = document.createElement('div');
                title.className = 'gallery-item-title';
                title.textContent = film.title || 'Untitled Film';
                
                // Add to gallery
                item.appendChild(img);
                item.appendChild(title);
                
                // Add click event
                item.addEventListener('click', () => {
                    handleGalleryItemClick(film._id);
                });
                
                galleryGrid.appendChild(item);
            });
            
            log(`Added ${films.length} items to gallery`);
            
            // Show/hide load more button
            if (FilmData.hasMorePages(page)) {
                elements.loadMoreButton.style.display = 'block';
            } else {
                elements.loadMoreButton.style.display = 'none';
            }
            
        } catch (error) {
            log("Error loading films to gallery:", error);
        }
    };
    
    /**
     * Handle gallery item click
     * @param {string} id - Film ID
     */
    const handleGalleryItemClick = async (id) => {
        log(`Gallery item clicked: ${id}`);
        
        // Simple debounce
        const now = new Date().getTime();
        if (now - lastClickTime < 500 || isProcessing) {
            log("Click debounced or processing in progress");
            return;
        }
        lastClickTime = now;
        isProcessing = true;
        
        try {
            // Get film data
            const film = FilmData.getFilmById(id);
            
            if (!film) {
                log(`Film with ID ${id} not found`);
                return;
            }
            
            // Display film details
            await displayFilmDetails(film);
            
        } catch (error) {
            log("Error handling gallery item click:", error);
        } finally {
            setTimeout(() => { isProcessing = false; }, 600);
        }
    };
    
    /**
     * Display film details in the detail view
     * @param {Object} film - Film data
     */
    const displayFilmDetails = async (film) => {
        if (!film) {
            log("No film provided to displayFilmDetails");
            return;
        }
        
        log("Displaying film details", film);
        
        try {
            // Update image
            if (elements.moviePoster) {
                elements.moviePoster.src = film.image || CONFIG.DEFAULT_IMAGE;
                elements.moviePoster.alt = film.title || 'Film Poster';
                elements.moviePoster.onerror = function() {
                    this.src = CONFIG.DEFAULT_IMAGE;
                };
            }
            
            // Update text elements
            if (elements.movieTitle) elements.movieTitle.textContent = film.title || '';
            if (elements.movieDirector) elements.movieDirector.textContent = film.director || '';
            if (elements.movieActors) elements.movieActors.textContent = film.actors || '';
            if (elements.movieSynopsis) elements.movieSynopsis.textContent = film.synopsis || '';
            
            // Handle festival field
            if (film.fest && elements.mfest && elements.fests) {
                elements.mfest.textContent = film.fest;
                elements.fests.style.display = 'block';
            } else if (elements.fests) {
                elements.fests.style.display = 'none';
            }
            
            // Handle tags fields
            if (elements.maud) {
                const audText = Array.isArray(film.aud) ? film.aud.join(', ') : film.aud || '';
                elements.maud.textContent = audText;
            }
            
            if (elements.mgenre) {
                const genreText = Array.isArray(film.genre) ? film.genre.join(', ') : film.genre || '';
                elements.mgenre.textContent = genreText;
            }
            
            // Handle length field
            if (elements.mlength) {
                if (film.length) {
                    elements.mlength.textContent = film.length + ' דקות';
                    elements.mlength.style.display = 'inline';
                } else {
                    elements.mlength.textContent = '';
                    elements.mlength.style.display = 'none';
                }
            }
            
            // Handle video
            if (elements.video) {
                if (film.video && film.video.trim()) {
                    elements.video.src = film.video;
                    elements.video.style.display = 'block';
                } else {
                    elements.video.style.display = 'none';
                    elements.video.src = '';
                }
            }
            
            // View transitions
            await fadeOut(elements.boxy);
            await fadeIn(elements.posterContainer);
            window.scrollTo(0, 0);
            
            log("Film details displayed successfully");
        } catch (error) {
            log("Error displaying film details:", error);
            
            // Fallback transition
            elements.boxy.style.display = 'none';
            elements.posterContainer.style.display = 'block';
        }
    };
    
    /**
     * Fade in animation helper
     * @param {HTMLElement} element - Element to fade in
     * @returns {Promise} Resolves when animation completes
     */
    const fadeIn = async (element) => {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            // Reset display and opacity
            element.style.opacity = '0';
            element.style.display = 'block';
            
            // Add transition
            element.style.transition = 'opacity 0.5s ease';
            
            // Trigger reflow
            void element.offsetWidth;
            
            // Fade in
            element.style.opacity = '1';
            
            // Wait for animation to complete
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, 500);
        });
    };
    
    /**
     * Fade out animation helper
     * @param {HTMLElement} element - Element to fade out
     * @returns {Promise} Resolves when animation completes
     */
    const fadeOut = async (element) => {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            // Set transition
            element.style.transition = 'opacity 0.5s ease';
            
            // Fade out
            element.style.opacity = '0';
            
            // Wait for animation to complete
            setTimeout(() => {
                element.style.display = 'none';
                element.style.transition = '';
                resolve();
            }, 500);
        });
    };
    
    // Public API
    return {
        /**
         * Initialize the application
         */
        init: async function() {
            log("Initializing application");
            
            try {
                // Cache DOM elements
                cacheElements();
                
                // Initialize film data
                await FilmData.init();
                
                // Set up event handlers
                setupEventHandlers();
                
                // Set up gallery and load initial films
                setupGallery();
                
                // Only show gallery on start button click
                // Start screen is visible by default
                
                log("Application initialized successfully");
                
                // Check if mobile and apply mobile optimizations
                if (isMobile()) {
                    log("Mobile device detected, applying mobile optimizations");
                    document.body.classList.add('mobile');
                }
                
            } catch (error) {
                log("Error initializing application:", error);
            }
        }
    };
})();

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // First load the film data
    FilmData.init().then(() => {
        // Then initialize the app
        App.init();
        
        console.log("Film Gallery initialized successfully");
    });
});
