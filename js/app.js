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
    let updateVisibleItems = null;
    let isMobile = false; // Track if we're on mobile
    
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
                
                // Handle button click animation and image change for mobile
                if (isMobile) {
                    // Force immediate image change before any transitions
                    elements.startButton.style.backgroundImage = "url('../img/buttons/start-button-hover.png')";
                    elements.startButton.classList.add('clicked', 'button-press-animation');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        elements.startButton.classList.remove('button-press-animation');
                    }, 300);
                    
                    // Reset after navigation transition
                    setTimeout(() => {
                        elements.startButton.classList.remove('clicked');
                        // Only reset background image if not hovered
                        if (!elements.startButton.matches(':hover')) {
                            elements.startButton.style.backgroundImage = "";
                        }
                    }, 600);
                }
                
                // Simple direct transition for reliability - explicitly hide others
                if (elements.startScreen) elements.startScreen.style.display = 'none';
                if (elements.boxy) elements.boxy.style.display = 'block';
                if (elements.posterContainer) elements.posterContainer.style.display = 'none';
                
                // Force gallery setup again for mobile just to be sure
                if (isMobile && elements.gallery) {
                    setupMobileGallery();
                }
                
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
                
                // Handle button click animation and image change for mobile
                if (isMobile) {
                    // Force immediate image change before any transitions
                    elements.backButton.style.backgroundImage = "url('../img/buttons/back-button-hover.png')";
                    elements.backButton.classList.add('clicked', 'button-press-animation');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        elements.backButton.classList.remove('button-press-animation');
                    }, 300);
                    
                    // Reset after navigation transition
                    setTimeout(() => {
                        elements.backButton.classList.remove('clicked');
                        // Only reset background image if not hovered
                        if (!elements.backButton.matches(':hover')) {
                            elements.backButton.style.backgroundImage = "";
                        }
                    }, 600);
                }
                
                // Pause video if playing
                if (elements.video) {
                    elements.video.pause();
                    elements.video.style.display = 'none';
                }
                
                // Simple direct transition for reliability - explicitly hide others
                if (elements.posterContainer) elements.posterContainer.style.display = 'none';
                if (elements.boxy) elements.boxy.style.display = 'block';
                if (elements.startScreen) elements.startScreen.style.display = 'none';
                
                // Force gallery setup again for mobile just to be sure
                if (isMobile && elements.gallery) {
                    setupMobileGallery();
                }
                
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
                
                // Handle button click animation and image change for mobile
                if (isMobile) {
                    // Force immediate image change before any transitions
                    elements.loadMoreButton.style.backgroundImage = "url('../img/buttons/load-more-button-hover.png')";
                    elements.loadMoreButton.classList.add('clicked', 'button-press-animation');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        elements.loadMoreButton.classList.remove('button-press-animation');
                    }, 300);
                    
                    // Reset after a short delay
                    setTimeout(() => {
                        elements.loadMoreButton.classList.remove('clicked');
                        // Only reset background image if not hovered
                        if (!elements.loadMoreButton.matches(':hover')) {
                            elements.loadMoreButton.style.backgroundImage = "";
                        }
                    }, 1000);
                }
                
                // Load next page
                currentPage++;
                loadFilmsToGallery(currentPage);
                
                // Scroll behavior based on device type
                if (elements.gallery) {
                    setTimeout(() => {
                        if (isMobile) {
                            // For mobile, scroll down to show new items
                            window.scrollTo({ 
                                top: document.body.scrollHeight, 
                                behavior: 'smooth' 
                            });
                        } else {
                            // For desktop, scroll right to show new items
                            elements.gallery.scrollLeft = elements.gallery.scrollWidth;
                        }
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
        
        // For mobile, we don't use the horizontal navigation
        if (isMobile) {
            if (elements.prevButton) elements.prevButton.style.display = 'none';
            if (elements.nextButton) elements.nextButton.style.display = 'none';
            
            // Define mobile version of updateVisibleItems that shows all items
            updateVisibleItems = () => {
                log("Mobile: Showing all gallery items for vertical scrolling");
                
                // Get all gallery items
                const items = elements.gallery.querySelectorAll('.gallery-item');
                
                // Show all items
                items.forEach(item => {
                    item.style.display = 'block';
                });
            };
            
            // Expose the update function
            App.updateVisibleItems = updateVisibleItems;
            
            log("Mobile gallery navigation setup complete");
            return;
        }
        
        // Desktop navigation setup
        // Track current visible range
        let visibleStartIndex = 0;
        let visibleEndIndex = 4; // 0-4 = 5 items
        let maxIndex = 0; // Will be set when films are loaded
        
        // Previous button click
        elements.prevButton.addEventListener('click', () => {
            log("Previous button clicked");
            
            if (visibleStartIndex <= 0) {
                log("Already at the beginning");
                return;
            }
            
            // Move the visible range one position left
            visibleStartIndex--;
            visibleEndIndex--;
            
            // Update the gallery
            updateVisibleItems();
        });
        
        // Next button click
        elements.nextButton.addEventListener('click', () => {
            log("Next button clicked");
            
            if (visibleEndIndex >= maxIndex) {
                log("Already at the end");
                // Load more items if available
                if (typeof FilmData !== 'undefined' && FilmData.hasMorePages && FilmData.hasMorePages(currentPage)) {
                    log("Loading more items");
                    currentPage++;
                    loadFilmsToGallery(currentPage);
                    return;
                }
                return;
            }
            
            // Move the visible range one position right
            visibleStartIndex++;
            visibleEndIndex++;
            
            // Update the gallery
            updateVisibleItems();
        });
        
        // Function to update the gallery with the current visible range
        updateVisibleItems = () => {
            log(`Updating visible items: ${visibleStartIndex} to ${visibleEndIndex}`);
            
            // Get all gallery items
            const items = elements.gallery.querySelectorAll('.gallery-item');
            
            // If we don't have enough items, return
            if (items.length <= 0) {
                log("No items in gallery");
                return;
            }
            
            maxIndex = items.length - 1;
            
            // Show/hide items based on visible range
            items.forEach((item, index) => {
                if (index >= visibleStartIndex && index <= visibleEndIndex) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Update navigation buttons
            elements.prevButton.style.opacity = visibleStartIndex <= 0 ? '0.3' : '1';
            elements.nextButton.style.opacity = visibleEndIndex >= maxIndex ? '0.3' : '1';
            
            // If we're at the end and there's more to load, show the next button
            if (visibleEndIndex >= maxIndex) {
                if (typeof FilmData !== 'undefined' && FilmData.hasMorePages && FilmData.hasMorePages(currentPage)) {
                    elements.nextButton.style.opacity = '1';
                }
            }
        };
        
        // Expose the update function for the loadFilmsToGallery function to use
        App.updateVisibleItems = updateVisibleItems;
        
        log("Desktop gallery navigation set up");
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
        
        // Initialize navigation buttons (for desktop only)
        if (!isMobile && elements.prevButton) {
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
            
            // Don't limit to 5, load all films but only show 5
            const allFilms = films;
            
            // Clear gallery if this is the first page
            if (page === 1) {
                elements.gallery.innerHTML = '';
            }
            
            // Create gallery items
            allFilms.forEach((film, index) => {
                if (!film || !film._id) return;
                
                // Create gallery item
                const item = document.createElement('div');
                item.className = 'gallery-item';
                
                // For mobile, add mobile-specific class
                if (isMobile) {
                    item.classList.add('mobile-gallery-item');
                    
                    // Mobile: Force styling for vertical gallery
                    item.style.display = 'block';
                    item.style.width = '90%';
                    item.style.maxWidth = '350px';
                    item.style.marginBottom = '20px';
                } else {
                    // Desktop: Only show first 5 items, hide the rest
                    if (index > 4 && page === 1) {
                        item.style.display = 'none';
                    }
                }
                
                item.dataset.id = film._id;
                
                // Set image
                const img = document.createElement('img');
                
                // Use safe image setter (prevents undefined URLs)
                const defaultImage = 
                    (typeof FilmData !== 'undefined' && FilmData.DEFAULT_IMAGE) 
                    ? FilmData.DEFAULT_IMAGE 
                    : FALLBACK_IMAGE;
                    
                setSafeImageSrc(img, film.image || defaultImage, film.title || 'Film');
                
                // For mobile, fix image styling
                if (isMobile) {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.aspectRatio = '2/3'; // Maintain poster aspect ratio
                }
                
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
            
            log(`Added ${allFilms.length} items to gallery`);
            
            // For mobile, ensure gallery is vertical
            if (isMobile) {
                log("Forcing vertical gallery layout for mobile");
                setupMobileGallery();
            } else if (typeof App.updateVisibleItems === 'function') {
                // For desktop, use normal visibility update
                App.updateVisibleItems();
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
            
            // Direct view transition - explicitly hide others
            if (elements.startScreen) elements.startScreen.style.display = 'none';
            if (elements.boxy) elements.boxy.style.display = 'none';
            if (elements.posterContainer) elements.posterContainer.style.display = 'block';
            
            window.scrollTo(0, 0);
            
            log("Film details displayed successfully");
        } catch (error) {
            log("Error displaying film details:", error);
        } finally {
            // Ensure isProcessing is reset
            setTimeout(() => { isProcessing = false; }, 600);
        }
    };
    
    /**
     * Detect if we're on a mobile device and apply mobile-specific behaviors
     */
    const setupMobileDetection = () => {
        // Check if mobile device based on screen width - more aggressive threshold (800px)
        isMobile = window.innerWidth <= 800;
        
        if (isMobile) {
            log("Mobile device detected, applying mobile optimizations");
            document.body.classList.add('mobile');
            
            // Force immediate mobile gallery setup
            setupMobileGallery();
        } else {
            log("Desktop device detected");
            document.body.classList.remove('mobile');
        }
        
        // Handle resize events for responsive behavior
        window.addEventListener('resize', () => {
            const wasMobile = isMobile;
            isMobile = window.innerWidth <= 800; // Use same threshold
            
            // Only take action if device type has changed
            if (wasMobile !== isMobile) {
                log(`Device type changed to ${isMobile ? 'mobile' : 'desktop'}`);
                
                if (isMobile) {
                    document.body.classList.add('mobile');
                    
                    // Force mobile gallery setup
                    setupMobileGallery();
                } else {
                    document.body.classList.remove('mobile');
                    
                    // Reset to desktop layout
                    setupDesktopGallery();
                }
            }
        });
    };
    
    /**
     * Set up mobile-specific gallery layout
     */
    const setupMobileGallery = () => {
        log("Setting up mobile-specific gallery");
        
        // Hide navigation buttons
        if (elements.prevButton) elements.prevButton.style.display = 'none';
        if (elements.nextButton) elements.nextButton.style.display = 'none';
        
        // Force gallery to be vertical layout container
        if (elements.gallery) {
            elements.gallery.style.display = 'flex';
            elements.gallery.style.flexDirection = 'column';
            elements.gallery.style.alignItems = 'center';
            elements.gallery.style.width = '100%';
            elements.gallery.style.overflowY = 'auto';
            elements.gallery.style.overflowX = 'hidden';
            elements.gallery.style.maxHeight = '100%'; // Allow vertical scrolling
            
            // Add mobile class to gallery
            elements.gallery.classList.add('mobile-gallery');
            
            // Update all existing gallery items
            const items = elements.gallery.querySelectorAll('.gallery-item');
            items.forEach(item => {
                // Add mobile-specific class
                item.classList.add('mobile-gallery-item');
                
                // Force display and styling
                item.style.display = 'block';
                item.style.width = '90%';
                item.style.maxWidth = '350px';
                item.style.marginBottom = '20px';
                
                // Make sure images have proper aspect ratio
                const img = item.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.aspectRatio = '2/3'; // Maintain poster aspect ratio
                }
            });
        }
        
        // Define mobile version of updateVisibleItems that shows all items
        updateVisibleItems = () => {
            log("Mobile: Showing all gallery items for vertical scrolling");
            
            // Get all gallery items
            const items = elements.gallery.querySelectorAll('.gallery-item');
            
            // Show all items
            items.forEach(item => {
                item.style.display = 'block';
                
                // Ensure mobile styling
                item.classList.add('mobile-gallery-item');
                item.style.width = '90%';
                item.style.maxWidth = '350px';
                item.style.marginBottom = '20px';
                
                // Update image styles
                const img = item.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.aspectRatio = '2/3';
                }
            });
        };
        
        // Expose the update function
        App.updateVisibleItems = updateVisibleItems;
        
        // Force update right now
        if (typeof updateVisibleItems === 'function') {
            updateVisibleItems();
        }
        
        log("Mobile gallery setup complete");
    };
    
    /**
     * Reset to desktop gallery layout
     */
    const setupDesktopGallery = () => {
        log("Reverting to desktop gallery");
        
        // Show navigation buttons
        if (elements.prevButton) elements.prevButton.style.display = 'block';
        if (elements.nextButton) elements.nextButton.style.display = 'block';
        
        // Reset gallery container styles
        if (elements.gallery) {
            elements.gallery.style.display = '';
            elements.gallery.style.flexDirection = '';
            elements.gallery.style.alignItems = '';
            elements.gallery.style.overflowY = '';
            elements.gallery.style.overflowX = '';
            elements.gallery.classList.remove('mobile-gallery');
            
            // Reset all gallery items
            const items = elements.gallery.querySelectorAll('.gallery-item');
            items.forEach(item => {
                item.classList.remove('mobile-gallery-item');
                item.style.width = '';
                item.style.maxWidth = '';
                item.style.marginBottom = '';
                
                // Reset image styles
                const img = item.querySelector('img');
                if (img) {
                    img.style.width = '';
                    img.style.height = '';
                    img.style.aspectRatio = '';
                }
            });
        }
        
        // Reset to desktop navigation function
        setupGalleryNavigation();
        
        log("Desktop gallery setup complete");
    };
    
    // Public API
    return {
        /**
     * Initialize the application
     */
    init: async function() {
        log("Initializing application");
        
        try {
            // Cache DOM elements first
            cacheElements();
            
            // Set up mobile detection
            setupMobileDetection();
            
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
            
            // IMPORTANT: Make sure only the start screen is visible initially
            log("Setting initial visibility of screens");
            if (elements.startScreen) elements.startScreen.style.display = 'flex';
            if (elements.boxy) elements.boxy.style.display = 'none';
            if (elements.posterContainer) elements.posterContainer.style.display = 'none';
            
            // Wait a moment then force another mobile check
            setTimeout(() => {
                if (isMobile && elements.gallery) {
                    log("Forcing mobile gallery setup again after initialization");
                    setupMobileGallery();
                    
                    // Again ensure only start screen is visible at beginning
                    if (elements.startScreen) elements.startScreen.style.display = 'flex';
                    if (elements.boxy) elements.boxy.style.display = 'none';
                    if (elements.posterContainer) elements.posterContainer.style.display = 'none';
                }
            }, 500);
            
            log("Application initialized successfully");
            
        } catch (error) {
            log("Error initializing application:", error);
        }
    },
        // Make updateVisibleItems accessible to other functions
        updateVisibleItems: null
    };
})();

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing application");
    
    // Initialize the app directly for more reliable startup
    App.init();
    
    console.log("Film Gallery initialization triggered");
});
