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
     * Reset all screens to their initial state
     * Shows only start screen, hides everything else
     */
    const resetAllScreens = () => {
        log("Resetting all screens to initial state");
        
        try {
            // First hide everything
            if (elements.startScreen) elements.startScreen.style.display = 'flex';
            if (elements.boxy) elements.boxy.style.display = 'none';
            if (elements.posterContainer) elements.posterContainer.style.display = 'none';
            
            log("Screen reset complete");
        } catch (error) {
            log("Error resetting screens:", error);
        }
    };
    
    /**
     * Show only the gallery screen
     */
    const showGalleryScreen = () => {
        log("Showing gallery screen only");
        
        try {
            if (elements.boxy) elements.boxy.style.display = 'block';
            if (elements.startScreen) elements.startScreen.style.display = 'none';
            if (elements.posterContainer) elements.posterContainer.style.display = 'none';
            
            log("Gallery display complete");
        } catch (error) {
            log("Error showing gallery:", error);
        }
    };
    
    /**
     * Show only the film detail screen
     */
    const showFilmDetailScreen = () => {
        log("Showing film detail screen only");
        
        try {
            if (elements.posterContainer) elements.posterContainer.style.display = 'block';
            if (elements.startScreen) elements.startScreen.style.display = 'none';
            if (elements.boxy) elements.boxy.style.display = 'none';
            
            log("Film detail display complete");
        } catch (error) {
            log("Error showing film details:", error);
        }
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
                
                // Use our new screen management function
                showGalleryScreen();
                
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
                
                // Use our new screen management function
                showGalleryScreen();
                
                log("Transitioned to gallery view");
            });
            
            log("Back button handler set up");
        } else {
            log("ERROR: Back button element not found!");
        }
    };
    
    /**
     * Debug helper: Create dummy gallery content
     * This is used if FilmData is not available
     */
    const createDummyGalleryContent = () => {
        log("Creating dummy gallery content for testing");
        
        if (!elements.gallery) return;
        
        // Clear gallery
        elements.gallery.innerHTML = '';
        
        // Create some dummy items
        for (let i = 1; i <= 5; i++) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.opacity = '1';
            
            // For mobile, add mobile-specific class
            if (isMobile) {
                item.classList.add('mobile-gallery-item');
                item.style.display = 'block';
                item.style.width = '90%';
                item.style.maxWidth = '350px';
                item.style.marginBottom = '20px';
            }
            
            item.dataset.id = `dummy-${i}`;
            
            // Set image
            const img = document.createElement('img');
            img.src = FALLBACK_IMAGE;
            img.alt = `Test Film ${i}`;
            
            // For mobile, fix image styling
            if (isMobile) {
                img.style.width = '100%';
                img.style.height = 'auto';
            }
            
            // Set title
            const title = document.createElement('div');
            title.className = 'gallery-item-title';
            title.textContent = `Test Film ${i}`;
            
            // Add to gallery
            item.appendChild(img);
            item.appendChild(title);
            
            // Add click event
            item.addEventListener('click', () => {
                alert(`This is a dummy film ${i} for testing`);
            });
            
            elements.gallery.appendChild(item);
        }
        
        log("Added 5 dummy items to gallery");
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
        
        gallerySetupComplete = true;
        log("Gallery setup complete");
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
        } else {
            log("Desktop device detected");
            document.body.classList.remove('mobile');
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
                
                // Create dummy gallery content for testing
                createDummyGalleryContent();
                
                // VERY IMPORTANT: Reset all screens to their initial state
                log("Resetting all screens to initial state");
                resetAllScreens();
                
                log("Application initialized successfully");
                
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
