// ContecPark – Apple-Like Premium Animations
// =========================================================

(function() {
    'use strict';

    let _scrollHandler = null;
    let _heroHandler = null;
    let _seqScrollHandler = null;

    document.addEventListener('DOMContentLoaded', () => {
        initAll();

        const app = document.getElementById('app');
        if (app) {
            // Debounce to prevent multiple rapid fires on the same navigation
            let _moTimer = null;
            const mo = new MutationObserver(() => {
                clearTimeout(_moTimer);
                _moTimer = setTimeout(() => requestAnimationFrame(initAll), 50);
            });
            mo.observe(app, { childList: true });
        }
    });

    function initAll() {
        initScrollAnimations();
        initAuroraParallax();
        init3DTilt();
        initMagneticElements();
        initImageSequence();
    }

    // ── 1. Scroll-Driven Cinematic Animation ────────────────────
    function initScrollAnimations() {
        const els = document.querySelectorAll('[data-animate]:not(.is-visible)');
        if (!els.length) return;

        // Cinematic progressive reveal
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        els.forEach(el => io.observe(el));
    }

    // ── 1.5 Image Sequence Scrubber ────────────────────────────
    function initImageSequence() {
        const seqContainer = document.getElementById('hero-bottle-sequence');
        if (!seqContainer) return;

        if (_seqScrollHandler) {
            window.removeEventListener('scroll', _seqScrollHandler);
            _seqScrollHandler = null;
        }

        const images = Array.from(seqContainer.querySelectorAll('.seq-img'));
        const totalFrames = images.length;
        if (totalFrames === 0) return;

        // Show first image immediately
        images.forEach((img, i) => { img.style.opacity = i === 0 ? '1' : '0'; });

        const pinSection = seqContainer.closest('.hero-pin-section');
        if (!pinSection) return;

        const textBox   = document.querySelector('.bottle-3d-text');
        const textTitle = textBox ? textBox.querySelector('h3') : null;
        const textSub   = textBox ? textBox.querySelector('p')  : null;

        // feature cards indexed pf1..pf6
        const featCards = [
            document.getElementById('pf1'), document.getElementById('pf2'),
            document.getElementById('pf3'), document.getElementById('pf4'),
            document.getElementById('pf5'), document.getElementById('pf6')
        ];

        function getBenefit(n) {
            // n is 1-based
            const lang = window.currentLang || 'ro';
            const dict = window.T ? (window.T[lang] || window.T['ro'] || {}) : {};
            return {
                title: dict['t360_title_' + n] || '',
                desc:  dict['t360_desc_'  + n] || ''
            };
        }

        let lastN = -1;

        function tick() {
            // Distance from top of page to top of section
            const sectionTop    = pinSection.offsetTop;
            const sectionHeight = pinSection.offsetHeight;          // ≈ 250vh
            const scrolled      = window.scrollY;
            const maxScroll     = sectionHeight - window.innerHeight;
            const raw           = scrolled - sectionTop;
            const progress      = Math.min(Math.max(raw / maxScroll, 0), 1);

            // Scroll progress bar
            const fillBar = document.getElementById('pin-scroll-fill');
            if (fillBar) fillBar.style.width = (progress * 100) + '%';

            // Image crossfade
            const frameExact    = progress * (totalFrames - 1);        // 0 … 5
            const frameIndex    = Math.floor(frameExact);               // 0 … 4
            const frameProgress = frameExact - frameIndex;             // 0 … 1

            images.forEach((img, i) => {
                if (i === frameIndex)     img.style.opacity = String(1 - frameProgress * 0.55);
                else if (i === frameIndex + 1) img.style.opacity = String(frameProgress);
                else img.style.opacity = '0';
            });

            // Subtle scale
            seqContainer.style.transform = `scale(${Math.max(0.85, 1 - progress * 0.15)})`;

            // Benefit text  (1-based, maps 6 frames -> 6 texts)
            const n = Math.min(frameIndex + 1, 6);
            if (n !== lastN) {
                lastN = n;

                // Highlight active feature card with blur-in
                featCards.forEach((c, ci) => {
                    if (!c) return;
                    if (ci === n - 1) c.classList.add('active');
                    else c.classList.remove('active');
                });

                if (textBox && textTitle && textSub) {
                    textBox.classList.remove('text-visible');
                    textBox.classList.add('text-fade');
                    setTimeout(() => {
                        const b = getBenefit(n);
                        textTitle.innerHTML = b.title || '';
                        textSub.innerHTML   = b.desc  || '';
                        textBox.classList.remove('text-fade');
                        textBox.classList.add('text-visible');
                    }, 160);
                }
            }
        }

        _seqScrollHandler = tick;
        window.addEventListener('scroll', tick, { passive: true });
        tick(); // initial render
    }

    // ── 2. Aurora & Water Parallax ─────────────────────────────
    function initAuroraParallax() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        if (_scrollHandler) window.removeEventListener('scroll', _scrollHandler);
        
        const blobs = document.querySelectorAll('.aurora-blob');
        if (!blobs.length) return;

        _scrollHandler = function() {
            const y = window.scrollY;
            blobs.forEach((b, i) => {
                b.style.transform = `translateY(${y * (0.1 + i * 0.05)}px)`;
            });
        };
        window.addEventListener('scroll', _scrollHandler, { passive: true });
    }

    // ── 3. 3D Spatial Tilt Interactions (Apple TV style) ───────
    function init3DTilt() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        const cards = document.querySelectorAll('.product-card, .highlight-card');
        
        cards.forEach(card => {
            if (card.dataset.tiltInit) return;
            card.dataset.tiltInit = 'true';

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const rotateX = -(y / rect.height) * 15;
                const rotateY = (x / rect.width) * 15;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'none'; 
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            });
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s linear';
            });
        });
    }

    // ── 4. Magnetic UI Elements ─────────────────────────────────
    function initMagneticElements() {
        const magnets = document.querySelectorAll('.nav-link, .cta-btn');
        
        magnets.forEach(btn => {
            if (btn.dataset.magInit) return;
            btn.dataset.magInit = 'true';

            btn.addEventListener('mousemove', e => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

})();
