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

    // Hero Role Cycling Animation
    const roleWords = document.querySelectorAll('.hero-role-word');
    if (roleWords.length > 0) {
        let currentRole = 0;
        setInterval(() => {
            roleWords[currentRole].classList.remove('active');
            currentRole = (currentRole + 1) % roleWords.length;
            roleWords[currentRole].classList.add('active');
        }, 2500);
    }

    // Custom Water Drop Cursor Tracking
    const cursor = document.querySelector('.water-drop-cursor');
    if (cursor) {
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;

        let targetSize = 30; // Increased default normal size
        let currentSize = 30;
        const sizeSpeed = 0.15; // Smooth size changes
        const speed = 0.15;     // Lag speed for follow effect

        let cursorScale = { value: 1 };

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Reveal cursor on first mouse move
            cursor.style.opacity = 1;
        });

        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = 0;
        });

        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = 1;
        });

        // Loop to interpolate cursor position & size (adds water-like inertia)
        function animateCursor() {
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;
            
            cursorX += dx * speed;
            cursorY += dy * speed;
            
            // Interpolate current size to target size
            currentSize += (targetSize - currentSize) * sizeSpeed;
            cursor.style.width = `${currentSize}px`;
            cursor.style.height = `${currentSize}px`;

            // Calculate base transform positioning (keeps it a perfect circle with dynamic scale)
            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) scale(${cursorScale.value})`;
            
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Add hovering state for interactive elements
        function addHoverListeners() {
            // Buttons, links, CTA, social links
            const buttons = document.querySelectorAll('a, button, .cta-button, .social-link, .project-link');
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    cursor.classList.add('hovering');
                    targetSize = 50; // Increased button hover size
                });
                btn.addEventListener('mouseleave', () => {
                    cursor.classList.remove('hovering');
                    targetSize = 30; // Back to default normal size
                });
                
                // Elastic bounce animations on click
                btn.addEventListener('click', () => {
                    // Bounce the button itself
                    gsap.fromTo(btn, 
                        { scale: 0.92 }, 
                        { scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)", clearProps: "scale" }
                    );

                    // Bounce the cursor scale (expand -> elastic settle)
                    gsap.fromTo(cursorScale, 
                        { value: 0.4 }, 
                        { value: 1, duration: 0.6, ease: "elastic.out(1.4, 0.3)" }
                    );
                });
            });

            // Standard layout cards or tags (moderate hover size)
            const tagsAndCards = document.querySelectorAll('.project-card, .skill-tag');
            tagsAndCards.forEach(target => {
                // Ignore if it's already a button/link child
                if (target.closest('a') || target.closest('button')) return;

                target.addEventListener('mouseenter', () => {
                    cursor.classList.add('hovering');
                    targetSize = 40; // Increased card hover size
                });
                target.addEventListener('mouseleave', () => {
                    cursor.classList.remove('hovering');
                    targetSize = 30;
                });
            });
        }
        addHoverListeners();

        // Mouse click squish (standard click on document body)
        window.addEventListener('mousedown', (e) => {
            // If we clicked a button, the button's specific elastic bounce will handle it
            if (e.target.closest('a') || e.target.closest('button')) return;

            gsap.to(cursorScale, { value: 0.6, duration: 0.1 });
        });
        window.addEventListener('mouseup', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;

            gsap.to(cursorScale, { value: 1, duration: 0.2, ease: "power2.out" });
        });
    }

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
    let lastRenderedProgress = 0; // Initialize to 0 so render doesn't force run until loaded
    let isVideoLoaded = false;
    let isAppLoaded = false;
    let currentActive = null;

    // Set initial GSAP states
    Object.values(sections).forEach(section => {
        gsap.set(section, { opacity: 0, y: 30, visibility: 'hidden' });
    });
    // Hide navigational elements initially during loader
    gsap.set(['.sidebar', '.bottom-nav', '.progress-bar-container'], { opacity: 0 });

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
                    isAppLoaded = true;
                    
                    if (window.scrollY === 0) {
                        // Clean fade-in for Home and Navs at scroll 0
                        const homeSection = sections['home'];
                        gsap.set(homeSection, { visibility: 'visible' });
                        gsap.fromTo(homeSection, 
                            { opacity: 0, y: 40 }, 
                            { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
                        );
                        
                        gsap.to(['.sidebar', '.bottom-nav', '.progress-bar-container'], {
                            opacity: 1,
                            duration: 1,
                            ease: 'power2.out'
                        });
                        
                        lastRenderedProgress = 0;
                    } else {
                        // User has already scrolled, show navs instantly and render correct section
                        gsap.set(['.sidebar', '.bottom-nav', '.progress-bar-container'], { opacity: 1 });
                        lastRenderedProgress = -1; // force render immediate scroll position
                    }
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
        }, 1000); // 1 second
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
        if (isAppLoaded && lastRenderedProgress !== currentProgress) {
            
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
                            clearProps: "opacity,transform", 
                            visibility: 'visible'
                        });
                    } else {
                        gsap.set(section, { 
                            opacity: targetOpacity, 
                            y: targetY,
                            visibility: targetOpacity > 0 ? 'visible' : 'hidden'
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

    // Copy Email to Clipboard Functionality
    const copyBtn = document.querySelector('.copy-email-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering outer events
            const email = copyBtn.getAttribute('data-email');
            navigator.clipboard.writeText(email).then(() => {
                const tooltip = copyBtn.querySelector('.tooltip-text');
                if (tooltip) {
                    tooltip.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        tooltip.textContent = 'Copy Email';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy email: ', err);
            });
        });
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