document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    const loader = document.getElementById('loader');
    const progressBar = document.getElementById('progress-bar');
    const navLinksDesktop = document.querySelectorAll('.sidebar .nav-links a');
    const navLinksMobile = document.querySelectorAll('.bottom-nav a');
    
    const sections = {
        home: document.getElementById('home'),
        about: document.getElementById('about'),
        skills: document.getElementById('skills'),
        projects: document.getElementById('projects'),
        contact: document.getElementById('contact'),
    };

    // Configuration for section fade points based on scroll percentage (0.0 to 1.0)
    // Format: [fadeInStart, activeStart, activeEnd, fadeOutEnd]
    const ranges = {
        home:     [0.00, 0.00, 0.13, 0.16],
        about:    [0.19, 0.22, 0.35, 0.38],
        skills:   [0.41, 0.44, 0.55, 0.58],
        projects: [0.61, 0.64, 0.82, 0.85],
        contact:  [0.88, 0.91, 1.01, 1.01] // activeEnd is 1.01 so it stays visible at exactly 1.0
    };

    let currentProgress = 0;
    let lastRenderedProgress = -1;
    let isVideoLoaded = false;
    let currentActive = null;

    // Set initial GSAP states
    Object.values(sections).forEach(section => {
        gsap.set(section, { opacity: 0, y: 30, visibility: 'hidden' });
    });

    // Handle loader dismissal when video can play
    video.addEventListener('canplaythrough', () => {
        if (!isVideoLoaded) {
            isVideoLoaded = true;
            gsap.to(loader, { 
                opacity: 0, 
                duration: 0.8, 
                ease: 'power2.out',
                onComplete: () => {
                    loader.style.display = 'none';
                    // Trigger a forced UI update on load
                    lastRenderedProgress = -1; 
                } 
            });
        }
    });

    // Fallback: If canplaythrough doesn't fire (e.g. cached video or certain mobile browsers)
    if (video.readyState >= 3) {
        const event = new Event('canplaythrough');
        video.dispatchEvent(event);
    }
    
    // Explicitly load the video to fetch metadata
    video.load();

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    let inactivityTimeout = null;
    let isAutoPlaying = false;
    let accumulatedTargetTime = 0;
    let previousProgress = 0;
    let currentLerpedTime = 0;

    function resetInactivityTimeout() {
        if (isAutoPlaying) {
            isAutoPlaying = false;
            video.pause();
            // Sync our internal tracking exactly to where the video is now
            if (video.readyState >= 1) {
                accumulatedTargetTime = video.currentTime;
                currentLerpedTime = video.currentTime;
            }
        }
        
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            isAutoPlaying = true;
            video.play();
        }, 3000); // 3 seconds
    }

    // Passive scroll listener for performance
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        // Prevent division by zero if body is too small
        if (maxScroll > 0) {
            currentProgress = scrollTop / maxScroll;
        } else {
            currentProgress = 0;
        }
        
        // Ensure bounds
        currentProgress = Math.max(0, Math.min(1, currentProgress));
        
        // Handle auto-play logic
        resetInactivityTimeout();
    }, { passive: true });

    // Initialize the auto-play timer on load
    resetInactivityTimeout();

    function render() {
        // Calculate delta for relative video scrubbing
        const deltaProgress = currentProgress - previousProgress;
        previousProgress = currentProgress;
        
        // 1. Smoothly scrub video towards accumulatedTargetTime
        if (video.readyState >= 1 && video.duration) {
            if (isAutoPlaying) {
                // If auto-playing, the video manages its own currentTime. 
                // We just keep our variables synced so that when the user scrolls again,
                // the scrubbing picks up seamlessly from the current frame.
                accumulatedTargetTime = video.currentTime;
                currentLerpedTime = video.currentTime;
            } else {
                // LOOP MULTIPLIER: How many times the video repeats during a full page scroll
                const LOOP_MULTIPLIER = 3; 
                accumulatedTargetTime += deltaProgress * video.duration * LOOP_MULTIPLIER;
                
                currentLerpedTime = lerp(currentLerpedTime, accumulatedTargetTime, 0.1);
                
                // Modulo perfectly loops the video without messing up the lerp math
                let loopTime = currentLerpedTime % video.duration;
                if (loopTime < 0) loopTime += video.duration;
                
                // EXTREMELY IMPORTANT: Only update video.currentTime if it is NOT currently seeking.
                if (!video.seeking && Math.abs(video.currentTime - loopTime) > 0.01) {
                    video.currentTime = loopTime;
                }
            }
        }
        
        // 2. Only update UI if scroll progress has changed
        if (lastRenderedProgress !== currentProgress) {
            
            // Update progress bar
            progressBar.style.width = `${currentProgress * 100}%`;
            
            let newActive = null;
            
            // Process each section based on exact scroll percentages
            for (const [id, range] of Object.entries(ranges)) {
                const [inStart, activeStart, activeEnd, fadeOutEnd] = range;
                const section = sections[id];
                
                let targetOpacity = 0;
                let targetY = 30; // default state: 30px down
                
                if (currentProgress < inStart) {
                    targetOpacity = 0;
                    targetY = 30;
                    section.classList.remove('is-active');
                    if (id === 'projects') {
                        const grid = section.querySelector('.projects-grid');
                        if (grid) gsap.set(grid, { y: grid.scrollHeight / 2 });
                    }
                } else if (currentProgress >= inStart && currentProgress <= activeStart) {
                    // Fading in
                    const p = activeStart === inStart ? 1 : (currentProgress - inStart) / (activeStart - inStart);
                    targetOpacity = p;
                    targetY = 30 * (1 - p); // From 30 to 0
                    section.classList.add('is-active');
                    
                    if (id === 'projects') {
                        const grid = section.querySelector('.projects-grid');
                        // Hold at the start position during fade in
                        if (grid) gsap.set(grid, { y: (grid.scrollHeight / 2) - 50 }); 
                    }
                    
                    if (newActive === null) newActive = id;
                } else if (currentProgress > activeStart && currentProgress < activeEnd) {
                    // Fully visible
                    targetOpacity = 1;
                    targetY = 0;
                    section.classList.add('is-active');
                    newActive = id;
                    
                    // --- DYNAMIC PARALLAX FOR PROJECTS ---
                    if (id === 'projects') {
                        const localProgress = (currentProgress - activeStart) / (activeEnd - activeStart);
                        const grid = section.querySelector('.projects-grid');
                        if (grid) {
                            const halfHeight = grid.scrollHeight / 2;
                            // Start so the top of the grid is near the middle of the screen
                            const startY = halfHeight - 50; 
                            // End so the bottom of the grid is near the middle of the screen
                            const endY = -halfHeight + 50;
                            
                            const currentY = startY + (endY - startY) * localProgress;
                            gsap.set(grid, { y: currentY });
                        }
                    }
                } else if (currentProgress >= activeEnd && currentProgress <= fadeOutEnd) {
                    // Fading out
                    const p = fadeOutEnd === activeEnd ? 1 : (currentProgress - activeEnd) / (fadeOutEnd - activeEnd);
                    targetOpacity = 1 - p;
                    targetY = -30 * p; // From 0 to -30
                    section.classList.remove('is-active');
                    
                    if (id === 'projects') {
                        const grid = section.querySelector('.projects-grid');
                        // Hold at the end position during fade out
                        if (grid) gsap.set(grid, { y: -(grid.scrollHeight / 2) + 50 });
                    }
                    
                    if (newActive === null) newActive = id;
                } else if (currentProgress > fadeOutEnd) {
                    // Passed it
                    targetOpacity = 0;
                    targetY = -30;
                    section.classList.remove('is-active');
                }
                
                // Set the element styles instantly using GSAP.set (hardware accelerated)
                const newState = `${targetOpacity}_${targetY}`;
                if (section.dataset.lastState !== newState) {
                    section.dataset.lastState = newState;
                    
                    if (targetOpacity === 1) {
                        gsap.set(section, { 
                            clearProps: "opacity", 
                            y: targetY,
                            visibility: 'visible',
                            force3D: true
                        });
                    } else {
                        gsap.set(section, { 
                            opacity: targetOpacity, 
                            y: targetY,
                            visibility: targetOpacity > 0 ? 'visible' : 'hidden',
                            force3D: true
                        });
                    }
                }
            }
            
            // Fallbacks for edge cases
            if (currentProgress === 0) newActive = 'home';
            if (currentProgress === 1) newActive = 'contact';
            
            // Sync Navigation Highlights
            if (newActive && currentActive !== newActive) {
                currentActive = newActive;
                
                navLinksDesktop.forEach(link => {
                    if (link.dataset.section === currentActive) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
                
                navLinksMobile.forEach(link => {
                    if (link.dataset.section === currentActive) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
            
            lastRenderedProgress = currentProgress;
        }

        requestAnimationFrame(render);
    }

    // Handle Navigation Clicks
    const allNavLinks = document.querySelectorAll('a[data-section]');
    allNavLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-section');
            const range = ranges[targetId];
            if (range) {
                // Target the exact start of the "Fully visible" phase
                const targetScroll = range[1] * (document.documentElement.scrollHeight - window.innerHeight);
                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize initial frame
    window.dispatchEvent(new Event('scroll'));
    requestAnimationFrame(render);
});