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

        const pinSection = seqContainer.closest('.hero-pin-section');
        if (!pinSection) return;

        const textBox   = document.querySelector('.bottle-3d-text');
        const textTitle = textBox ? textBox.querySelector('h3') : null;
        const textSub   = textBox ? textBox.querySelector('p')  : null;

        const featCards = [
            document.getElementById('pf1'), document.getElementById('pf2'),
            document.getElementById('pf3'), document.getElementById('pf4'),
            document.getElementById('pf5'), document.getElementById('pf6')
        ];

        function getBenefit(n) {
            const lang = window.currentLang || 'ro';
            const dict = window.T ? (window.T[lang] || window.T['ro'] || {}) : {};
            return {
                title: dict['t360_title_' + n] || '',
                desc:  dict['t360_desc_'  + n] || ''
            };
        }

        let lastN = -1;
        let ticking = false;

        function tick() {
            const sectionTop    = pinSection.offsetTop;
            const sectionHeight = pinSection.offsetHeight;
            const scrolled      = window.scrollY;
            const maxScroll     = sectionHeight - window.innerHeight;
            const raw           = scrolled - sectionTop;
            const progress      = Math.min(Math.max(raw / maxScroll, 0), 1);

            const fillBar = document.getElementById('pin-scroll-fill');
            if (fillBar) fillBar.style.width = (progress * 100) + '%';

            const frameExact    = progress * (totalFrames - 1);
            const frameIndex    = Math.floor(frameExact);
            const frameProgress = frameExact - frameIndex;

            // PERFORMANCE: Only update opacity for what's changed
            images.forEach((img, i) => {
                if (i === frameIndex) {
                    img.style.opacity = String(1 - frameProgress);
                    img.style.zIndex = '2';
                } else if (i === frameIndex + 1) {
                    img.style.opacity = String(frameProgress);
                    img.style.zIndex = '3';
                } else {
                    img.style.opacity = '0';
                    img.style.zIndex = '1';
                }
            });

            const n = Math.min(frameIndex + 1, 6);
            if (n !== lastN) {
                lastN = n;
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
            ticking = false;
        }

        _seqScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(tick);
                ticking = true;
            }
        };
        window.addEventListener('scroll', _seqScrollHandler, { passive: true });
        tick();
    }

    // ── 2. Aurora & Water Parallax ─────────────────────────────
    function initAuroraParallax() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 1024) return; // Disable on mobile to save CPU
        
        if (_scrollHandler) window.removeEventListener('scroll', _scrollHandler);
        
        const blobs = document.querySelectorAll('.aurora-blob');
        if (!blobs.length) return;

        let ticking = false;
        _scrollHandler = function() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    blobs.forEach((b, i) => {
                        b.style.transform = `translate3d(0, ${y * (0.1 + i * 0.05)}px, 0)`;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', _scrollHandler, { passive: true });
    }

    // ── 3. 3D Spatial Tilt Interactions (Apple TV style) ───────
    function init3DTilt() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 1024) return; // Mouse only feature
        
        const cards = document.querySelectorAll('.product-card, .highlight-card');
        
        cards.forEach(card => {
            if (card.dataset.tiltInit) return;
            card.dataset.tiltInit = 'true';

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const rotateX = -(y / rect.height) * 12;
                const rotateY = (x / rect.width) * 12;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'none'; 
            }, { passive: true });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.4s ease';
            });
        });
    }

    // ── 4. Magnetic UI Elements ─────────────────────────────────
    function initMagneticElements() {
        if (window.innerWidth < 1024) return; // Mouse only
        const magnets = document.querySelectorAll('.nav-link, .cta-btn');
        
        magnets.forEach(btn => {
            if (btn.dataset.magInit) return;
            btn.dataset.magInit = 'true';

            btn.addEventListener('mousemove', e => {
                const rect = btn.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
                const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
                
                btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }, { passive: true });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

})();
