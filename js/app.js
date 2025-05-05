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
    
    // Fallback image path (used when FilmData is not available or image is undefined)
    const FALLBACK_IMAGE = "./img/default-poster.jpg";
    
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
     * Safe image setter - prevents undefined URLs
     * @param {HTMLImageElement} imgElement - Image element to set src for
     * @param {string} imgSrc - Source URL for the image
     * @param {string} altText - Alt text for the image
     */
    const setSafeImageSrc = (imgElement, imgSrc, altText = "Image") => {
        if (!imgElement) return;
        
        // Set alt text if provided
        if (altText) {
            imgElement.alt = altText;
        }
        
        // Check if image source is valid
        if (imgSrc && typeof imgSrc === 'string' && imgSrc.trim() !== '') {
            imgElement.src = imgSrc;
        } else {
            log("Invalid image source, using fallback", imgSrc);
            imgElement.src = FALLBACK_IMAGE;
        }
        
        // Add error handler to prevent 404s
        imgElement.onerror = function() {
            log("Image failed to load:", this.src);
            // Only set fallback if not already using it (prevent loops)
            if (this.src !== FALLBACK_IMAGE) {
                this.src = FALLBACK_IMAGE;
            }
            this.onerror = null; // Remove handler to prevent loops
        };
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
            prevButton: document.getElementById('prevButton'),
            nextButton: document.getElementById('nextButton'),
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
        // Start button - DIRECT IMPLEMENTATION FOR RELIABILITY
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
                
                // Scroll to show the new items
                if (elements.gallery) {
                    setTimeout(() => {
                        // Scroll to the right to show new items
                        elements.gallery.scrollLeft = elements.gallery.scrollWidth;
                    }, 100);
                }
            });
            
            log("Load more button handler set up");
        }
        
        // Set up gallery navigation
        setupGalleryNavigation();
    };
    
    /**
     * Set up horizontal gallery navigation
     */
    const setupGalleryNavigation = () => {
        // Get navigation buttons
        if (!elements.prevButton || !elements.nextButton || !elements.gallery) {
            log("Navigation elements not found");
            return;
        }
        
        // Set scroll amount - width of 1 item + gap
        const scrollAmount = 220; // 200px item width + 20px gap
        
        // Previous button click
        elements.prevButton.addEventListener('click', () => {
            log("Previous button clicked");
            elements.gallery.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Next button click
        elements.nextButton.addEventListener('click', () => {
            log("Next button clicked");
            elements.gallery.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Show/hide buttons based on scroll position
        elements.gallery.addEventListener('scroll', () => {
            // Check if we can scroll left
            if (elements.gallery.scrollLeft <= 0) {
                elements.prevButton.style.opacity = '0.3';
            } else {
                elements.prevButton.style.opacity = '1';
            }
            
            // Check if we can scroll right
            if (elements.gallery.scrollLeft + elements.gallery.clientWidth >= elements.gallery.scrollWidth - 10) {
                elements.nextButton.style.opacity = '0.3';
                
                // If we're at the end and there are more items to load
                if (typeof FilmData !== 'undefined' && FilmData.hasMorePages && FilmData.hasMorePages(currentPage)) {
                    // Show load more button
                    if (elements.loadMoreButton) {
                        elements.loadMoreButton.style.display = 'block';
                    }
                }
            } else {
                elements.nextButton.style.opacity = '1';
                
                // Hide load more button when not at the end
                if (elements.loadMoreButton) {
                    elements.loadMoreButton.style.display = 'none';
                }
            }
        });
        
        log("Gallery navigation set up");
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
        
        // Initialize navigation buttons
        if (elements.prevButton) {
            elements.prevButton.style.opacity = '0.3'; // Initially disable previous button
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
            
            // Safety check for FilmData
            if (typeof FilmData === 'undefined' || !FilmData.getFilmsForPage) {
                log("ERROR: FilmData module not available");
                return;
            }
            
            // Get films for the current page
            const films = FilmData.getFilmsForPage(page);
            
            if (!films || films.length === 0) {
                log("No films found for this page");
                return;
            }
            
            log(`Found ${films.length} films for page ${page}`);
            
            // Limit to 5 items per page for horizontal scrolling
            const itemsPerPage = 5;
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const filmsToShow = films.slice(0, endIndex);
            
            // Clear gallery if this is the first page
            if (page === 1) {
                elements.gallery.innerHTML = '';
            }
            
            // Create gallery items
            filmsToShow.forEach((film, index) => {
                // Skip items already shown in previous pages
                if (page > 1 && index < (page - 1) * itemsPerPage) {
                    return;
                }
                
                if (!film || !film._id) return;
                
                // Create gallery item
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.dataset.id = film._id;
                
                // Set image
                const img = document.createElement('img');
                
                // Use safe image setter (prevents undefined URLs)
                const defaultImage = 
                    (typeof FilmData !== 'undefined' && FilmData.DEFAULT_IMAGE) 
                    ? FilmData.DEFAULT_IMAGE 
                    : FALLBACK_IMAGE;
                    
                setSafeImageSrc(img, film.image || defaultImage, film.title || 'Film');
                
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
                
                elements.gallery.appendChild(item);
            });
            
            log(`Added films to gallery (showing ${startIndex + 1} to ${endIndex} of ${films.length})`);
            
            // Update navigation buttons visibility
            if (elements.nextButton) {
                if (typeof FilmData !== 'undefined' && FilmData.hasMorePages && FilmData.hasMorePages(page)) {
                    // There are more pages to load
                    elements.nextButton.style.opacity = '1';
                } else if (endIndex < films.length) {
                    // There are more items in the current results to show
                    elements.nextButton.style.opacity = '1';
                } else {
                    // No more items to show
                    elements.nextButton.style.opacity = '0.3';
                }
            }
            
            // Hide load more button initially
            if (elements.loadMoreButton) {
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
            // Safety check for FilmData
            if (typeof FilmData === 'undefined' || !FilmData.getFilmById) {
                log("ERROR: FilmData module not available");
                isProcessing = false;
                return;
            }
            
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
            // Update image - use safe image setter
            if (elements.moviePoster) {
                const defaultImage = 
                    (typeof FilmData !== 'undefined' && FilmData.DEFAULT_IMAGE) 
                    ? FilmData.DEFAULT_IMAGE 
                    : FALLBACK_IMAGE;
                    
                setSafeImageSrc(elements.moviePoster, film.image || defaultImage, film.title || 'Film Poster');
            }
            
            // Update text elements - with null checks
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
            
            // Handle video - with safety checks
            if (elements.video) {
                if (film.video && typeof film.video === 'string' && film.video.trim() !== '') {
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
                
                // Initialize film data if available
                if (typeof FilmData !== 'undefined' && FilmData.init) {
                    try {
                        await FilmData.init();
                        log("Film data initialized");
                    } catch (error) {
                        log("Error initializing film data:", error);
                    }
                } else {
                    log("WARNING: FilmData module not found or init method missing");
                }
                
                // Set up event handlers
                setupEventHandlers();
                
                // Set up gallery
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
