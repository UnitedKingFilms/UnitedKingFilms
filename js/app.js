/**
 * Film Gallery Application
 * Main application logic for the film gallery
 */

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
        
        log("DOM elements cached", elements);
    };
    
    /**
     * Set up event handlers
     */
    const setupEventHandlers = () => {
        // Start button - DIRECT IMPLEMENTATION FOR DEBUGGING
        if (elements.startButton) {
            log("Setting up start button handler");
            
            elements.startButton.addEventListener('click', () => {
                log("Start button clicked");
                
                // Simple direct transition for reliability
                elements.startScreen.style.display = 'none';
                elements.boxy.style.display = 'block';
                
                log("Transitioned to gallery view");
            });
            
            log("Start button handler set up");
        } else {
            log("ERROR: Start button element not found!");
        }
        
        // Back button - DIRECT IMPLEMENTATION FOR DEBUGGING
        if (elements.backButton) {
            log("Setting up back button handler");
            
            elements.backButton.addEventListener('click', () => {
                log("Back button clicked");
                
                // Pause video if playing
                if (elements.video) {
                    elements.video.pause();
                    elements.video.style.display = 'none';
                }
                
                // Simple direct transition for reliability
                elements.posterContainer.style.display = 'none';
                elements.boxy.style.display = 'block';
                
                log("Transitioned to gallery view");
            });
            
            log("Back button handler set up");
        } else {
            log("ERROR: Back button element not found!");
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
        if (!elements.gallery) {
            log("ERROR: Gallery element not found!");
            return;
        }
        
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
                img.src = film.image || FilmData.DEFAULT_IMAGE;
                img.alt = film.title || 'Film';
                img.onerror = function() {
                    this.src = FilmData.DEFAULT_IMAGE;
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
                    log(`Gallery item clicked: ${film._id}`);
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
    const handleGalleryItemClick = (id) => {
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
                isProcessing = false;
                return;
            }
            
            // Display film details with direct DOM manipulation
            displayFilmDetails(film);
            
        } catch (error) {
            log("Error handling gallery item click:", error);
            isProcessing = false;
        }
    };
    
    /**
     * Display film details in the detail view
     * @param {Object} film - Film data
     */
    const displayFilmDetails = (film) => {
        if (!film) {
            log("No film provided to displayFilmDetails");
            isProcessing = false;
            return;
        }
        
        log("Displaying film details", film);
        
        try {
            // Update image
            if (elements.moviePoster) {
                elements.moviePoster.src = film.image || FilmData.DEFAULT_IMAGE;
                elements.moviePoster.alt = film.title || 'Film Poster';
                elements.moviePoster.onerror = function() {
                    this.src = FilmData.DEFAULT_IMAGE;
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
            
            // Direct view transition
            elements.boxy.style.display = 'none';
            elements.posterContainer.style.display = 'block';
            window.scrollTo(0, 0);
            
            log("Film details displayed successfully");
        } catch (error) {
            log("Error displaying film details:", error);
        } finally {
            // Ensure isProcessing is reset
            setTimeout(() => { isProcessing = false; }, 600);
        }
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
                if (typeof FilmData !== 'undefined' && FilmData.init) {
                    await FilmData.init();
                } else {
                    log("WARNING: FilmData module not found or init method missing");
                }
                
                // Set up event handlers
                setupEventHandlers();
                
                // Set up gallery and load initial films
                setupGallery();
                
                // Load initial films if FilmData is available
                if (typeof FilmData !== 'undefined' && FilmData.getFilmsForPage) {
                    loadFilmsToGallery(1);
                } else {
                    log("WARNING: Cannot load films, FilmData module not properly initialized");
                }
                
                log("Application initialized successfully");
                
                // Check if mobile and apply mobile optimizations
                if (window.innerWidth <= 767) {
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
    console.log("DOM loaded, initializing application");
    
    // Initialize the app directly for more reliable startup
    App.init();
    
    console.log("Film Gallery initialization triggered");
});
