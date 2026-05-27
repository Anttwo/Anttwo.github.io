/* =========================================================
   site.js — micro-interactions for the homepage
   - Scroll-reveal (IntersectionObserver) with section + stagger
   - Magnetic hover on .pub-actions buttons
   - Pointer-driven gradient on .pub-card
   - Smooth-scroll for in-page anchors
   - News collapse toggle
   ========================================================= */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function revealOnScroll() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-stagger, .section')
        .forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger, .section')
      .forEach(el => io.observe(el));
  }

  function magneticButtons() {
    const items = document.querySelectorAll('.pub-actions .label-info, .icon-pill');
    items.forEach((el) => {
      let raf = 0;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx * 4}px, ${dy * 4 - 1}px)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  function cardSpotlight() {
    document.querySelectorAll('.pub-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });
  }

  function smoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      a.addEventListener('click', (e) => {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function newsCollapse() {
    const toggle = document.querySelector('[data-news-toggle]');
    const collapse = document.querySelector('[data-news-collapse]');
    if (!toggle || !collapse) return;

    toggle.addEventListener('click', () => {
      const isOpen = collapse.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const label = toggle.querySelector('[data-news-toggle-label]');
      if (label) label.textContent = isOpen ? 'Show less' : 'Show more';
    });
  }

  function pubBibtexToggle() {
    document.querySelectorAll('[data-bibtex-toggle]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-bibtex-toggle');
        const target = document.getElementById(targetId);
        if (!target) return;
        const isOpen = target.classList.toggle('is-open');
        const icon = btn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        if (icon) {
          icon.classList.toggle('fa-chevron-down', !isOpen);
          icon.classList.toggle('fa-chevron-up', isOpen);
        }
      });
    });
  }

  function themeToggle() {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';

    function render(theme) {
      // Icon represents the mode you'll switch INTO. Uses the original
      // Material Icons Outlined glyphs (sun / moon) so the look stays minimal.
      const next = theme === 'dark' ? 'light' : 'dark';
      btn.innerHTML = next === 'light'
        ? '<span class="material-icons-outlined">light_mode</span>'
        : '<span class="material-icons-outlined">dark_mode</span>';
      const label = 'Switch to ' + next + ' mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }

    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    render(saved);

    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      render(next);
    });

    document.body.appendChild(btn);
  }

  // Hero / lite-mode state -----------------------------------------------
  let heroScene = null;
  let heroPendingInit = false;

  function tryStartHero() {
    if (heroScene || heroPendingInit) return;
    if (typeof window.initHeroMesh !== 'function') {
      // hero-mesh.js (ES module) hasn't executed yet; retry shortly
      heroPendingInit = true;
      const retry = () => {
        heroPendingInit = false;
        if (!document.body.classList.contains('is-lite')) initHero();
      };
      setTimeout(retry, 60);
      return;
    }
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    heroScene = window.initHeroMesh(canvas, {
      autoRotate: 0.00045,
    });
  }

  function initHero() { tryStartHero(); }

  function destroyHero() {
    if (heroScene && typeof heroScene.destroy === 'function') {
      heroScene.destroy();
    }
    heroScene = null;
  }

  function liteToggle() {
    const STORE_KEY = 'lite-mode';
    const hero = document.querySelector('.hero');
    const lite = document.querySelector('.site-header');
    if (!hero || !lite) return;

    const btn = document.createElement('button');
    btn.className = 'lite-toggle';
    btn.type = 'button';

    function render() {
      const isLite = document.body.classList.contains('is-lite');
      btn.innerHTML = isLite
        ? '<i class="fa fa-magic"></i><span>Restore animation</span>'
        : '<i class="fa fa-bolt"></i><span>Lite mode</span>';
      btn.setAttribute(
        'aria-label',
        isLite ? 'Restore the animated hero' : 'Switch to a lighter version of this page'
      );
      btn.setAttribute('title', btn.getAttribute('aria-label'));
    }

    // Apply persisted choice without animating on initial load
    const saved = (() => {
      try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
    })();
    if (saved === '1') {
      document.body.classList.add('is-lite');
    } else {
      // Default: full hero — kick off particles
      initHero();
    }
    render();

    let busy = false;
    function setMode(toLite) {
      if (busy) return;
      const cur = document.body.classList.contains('is-lite');
      if (cur === toLite) return;
      busy = true;

      const fadingOut = toLite ? hero : lite;
      const fadingIn  = toLite ? lite : hero;

      // Phase 1: fade out the current view
      fadingOut.style.opacity = '0';
      fadingOut.style.pointerEvents = 'none';

      setTimeout(() => {
        // Phase 2: swap visibility via body class
        document.body.classList.toggle('is-lite', toLite);

        // Reset inline styles before fade-in (CSS controls final state)
        fadingOut.style.opacity = '';
        fadingOut.style.pointerEvents = '';

        // Force browser to paint hidden state, then fade in
        fadingIn.style.opacity = '0';
        // eslint-disable-next-line no-unused-expressions
        fadingIn.offsetHeight;
        requestAnimationFrame(() => {
          fadingIn.style.opacity = '1';
        });
        setTimeout(() => { fadingIn.style.opacity = ''; }, 450);

        // Particles lifecycle
        if (toLite) destroyHero();
        else initHero();

        try { localStorage.setItem(STORE_KEY, toLite ? '1' : '0'); } catch (e) {}
        render();
        busy = false;
      }, 380);
    }

    btn.addEventListener('click', () => {
      setMode(!document.body.classList.contains('is-lite'));
    });

    document.body.appendChild(btn);
  }

  onReady(() => {
    liteToggle();
    revealOnScroll();
    magneticButtons();
    cardSpotlight();
    smoothAnchors();
    newsCollapse();
    pubBibtexToggle();
    themeToggle();
  });
})();
