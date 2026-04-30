/* ============================================================
   PORTFOLIO — script.js
   Theme toggle · email assembly · hamburger · carousel
   IntersectionObservers: reveal · title · blob · active nav
   LERP smooth scroll (desktop only)
   ============================================================ */

/* ── Title slide-in on scroll ────────────────────────────── */
/* Only section-label needs JS trigger — headings use animation-timeline: view() */
const titleObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('title-visible');
      titleObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });


const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

const blobObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('blob-active', entry.isIntersecting);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.hero, .contact').forEach(el => blobObserver.observe(el));

document.querySelectorAll('.reveal:not(.section-heading):not(.section-label), .reveal-stagger').forEach(el => {
  revealObserver.observe(el);
});

document.querySelectorAll('.section-label, .section-heading').forEach(el => {
  titleObserver.observe(el);
});

/* ── Active nav highlight ────────────────────────────────── */
const navLinks = [...document.querySelectorAll('.nav-links a')];
const allSections = [...document.querySelectorAll('section[id]')];

const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active',
          link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });

allSections.forEach(s => activeObserver.observe(s));

/* ── Smooth scroll on anchor clicks ─────────────────────── */
const NAV_H = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--nav-h')) || 70;

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
    if (smoothScroll) smoothScroll.scrollTo(top);
    else window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Theme ──────────────────────────────────────────────── */
const html  = document.documentElement;
const saved = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
html.setAttribute('data-theme', saved);

const themeBtn = document.getElementById('themeToggle');
themeBtn.querySelector('.theme-icon').textContent = saved === 'dark' ? '○' : '◉';

themeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeBtn.querySelector('.theme-icon').textContent = next === 'dark' ? '○' : '◉';
});

/* ── Email assembly (bot protection) ───────────────────── */
const emailEl = document.getElementById('contact-email-link');
if (emailEl) {
	const addr = atob(emailEl.dataset.e);
	emailEl.href = 'mailto:' + addr;
	emailEl.textContent = addr;
}

/* ── Hamburger menu ─────────────────────────────────────── */
const ham  = document.getElementById('hamburger');
const menu = document.getElementById('mobileMenu');

let scrollPos = 0;

function lockScroll() {
  scrollPos = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPos}px`;
  document.body.style.width = '100%';
}

function unlockScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollPos);
}

if (ham && menu) {
  ham.addEventListener('click', () => {
    const open = ham.classList.toggle('open');
    menu.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
    open ? lockScroll() : unlockScroll();
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      menu.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      unlockScroll();
    });
  });
  menu.addEventListener('touchmove', e => {
    e.preventDefault();
  }, { passive: false });
}

/* ── Carousel ───────────────────────────────────────────── */
const track   = document.getElementById('carouselTrack');
const btnPrev = document.getElementById('carouselPrev');
const btnNext = document.getElementById('carouselNext');
const dots    = [...document.querySelectorAll('.carousel-dot')];

if (track && btnPrev && btnNext) {
  let cur   = 0;
  const cards = [...track.querySelectorAll('.project-card')];

  function goTo(n) {
    cur = Math.max(0, Math.min(n, cards.length - 1));
    const gap  = parseFloat(getComputedStyle(track).gap) || 24;
    const cardW = cards[0]?.offsetWidth || 0;
    // Slide the track — CSS cubic-bezier handles the spring overshoot
    track.style.transform = `translateX(-${cur * (cardW + gap)}px)`;
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur === cards.length - 1;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  btnPrev.addEventListener('click', () => goTo(cur - 1));
  btnNext.addEventListener('click', () => goTo(cur + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  window.addEventListener('resize', () => goTo(cur), { passive: true });

  // Two-finger trackpad horizontal swipe
  const wrapper = track.closest('.carousel-wrapper');
  let swipeLocked = false;
  wrapper.addEventListener('wheel', (e) => {
    // Only act on clearly horizontal gestures
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (swipeLocked) return;
    swipeLocked = true;
    if (e.deltaX > 20)       goTo(cur + 1);
    else if (e.deltaX < -20) goTo(cur - 1);
    setTimeout(() => { swipeLocked = false; }, 600);
  }, { passive: false });


  // Touch swipe for mobile
  let touchStartX = 0;
  let touchStartY = 0;

  wrapper.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  wrapper.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goTo(cur + 1);
      else        goTo(cur - 1);
    }
  }, { passive: true });

  goTo(0);
}


/* ── Lerp smooth scroll ──────────────────────────────────── */
const smoothScroll = (() => {
  if ('ontouchstart' in window) return null;

  let cur = window.scrollY;
  let tgt = window.scrollY;
  let raf = null;
  const EASE = 0.3;

  const lerp = (a, b, t) => a + (b - a) * t;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;

  function tick() {
    cur = lerp(cur, tgt, EASE);
    window.scrollTo(0, cur);
    if (Math.abs(tgt - cur) > 0.05) {
      raf = requestAnimationFrame(tick);
    } else {
      window.scrollTo(0, tgt);
      cur = tgt;
      raf = null;
    }
  }

  window.addEventListener('wheel', e => {
    e.preventDefault();
    tgt = Math.max(0, Math.min(tgt + e.deltaY, maxY()));
    if (!raf) { cur = window.scrollY; raf = requestAnimationFrame(tick); }
  }, { passive: false });

  return {
    scrollTo(y) {
      tgt = Math.max(0, Math.min(y, maxY()));
      if (!raf) { cur = window.scrollY; raf = requestAnimationFrame(tick); }
    }
  };
})();
