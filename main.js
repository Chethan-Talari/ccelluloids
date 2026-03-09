document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initParallax();
  initFilters();
  initLightbox();
  setActiveLink();
});

function initNav() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.site-nav');
  if (!burger || !nav) return;
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
}

function setActiveLink() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current) a.style.color = '#f3b352';
  });
}

function initReveal() {
  const nodes = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  nodes.forEach((n) => observer.observe(n));
}

function initParallax() {
  const hero = document.querySelector('[data-parallax] .hero-media');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY * 0.08;
    hero.style.transform = `translateY(${y}px) scale(1.08)`;
  }, { passive: true });

  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = 'translateY(0)'));
  });
}

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.gallery-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      cards.forEach((card) => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? 'inline-block' : 'none';
      });
    });
  });
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxText = document.getElementById('lightboxText');
  const close = document.getElementById('lightboxClose');
  if (!lightbox || !lightboxImage || !close) return;

  document.querySelectorAll('.gallery-card img').forEach((img) => {
    img.addEventListener('click', () => {
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightboxText.textContent = img.closest('.gallery-card').querySelector('p')?.textContent || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  const closeBox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  };
  close.addEventListener('click', closeBox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeBox();
  });
}
