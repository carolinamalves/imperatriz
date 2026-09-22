document.addEventListener('DOMContentLoaded', () => {

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready');
  }

  // ---- Ano no footer ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Header: sombra/fundo ao fazer scroll ----
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Menu mobile (overlay de ecrã inteiro) ----
  const menuToggle = document.getElementById('menuToggle');
  const navOverlay = document.getElementById('navOverlay');
  const navOverlayClose = document.getElementById('navOverlayClose');

  const openMenu = () => {
    navOverlay.classList.add('is-open');
    menuToggle.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    navOverlay.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', () => {
    navOverlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  navOverlayClose.addEventListener('click', closeMenu);

  navOverlay.querySelectorAll('.nav-overlay__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) closeMenu();
  });

  // ---- Lightbox da galeria ----
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.galeria__item img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ---- Thumbnails dos serviços (sempre corre, não depende do GSAP) ----
  document.querySelectorAll('.servico-row[data-thumb]').forEach(row => {
    const thumb = row.querySelector('.servico-row__thumb');
    if (thumb) thumb.style.backgroundImage = `url("${row.dataset.thumb}")`;
  });

  // =========================================================
  // A partir daqui: tudo depende do GSAP. Se não estiver
  // disponível (ex: sem internet), o site fica na mesma
  // 100% visível e utilizável — só sem as animações extra.
  // =========================================================
  if (!hasGSAP) return;

  // Ajuda a dividir um texto em <span class="word"> animáveis
  // (por palavra ou por letra), preservando o texto original
  // como fallback se algo correr mal a meio.
  function splitText(el, mode) {
    if (!el) return [];
    const raw = el.textContent.trim();
    const parts = mode === 'chars' ? raw.split('') : raw.split(/\s+/);
    el.innerHTML = parts
      .map(p => `<span class="word">${p === '' ? '&nbsp;' : p}</span>`)
      .join(mode === 'chars' ? '' : ' ');
    return el.querySelectorAll('.word');
  }

  // ---- Entrada do hero: coroa cai, "IMPERATRIZ" letra a letra, script, resto em stagger ----
  const heroCrown = document.querySelector('.hero__brand-crown');
  const heroScript = document.querySelector('.hero__brand-script');
  const heroWordEl = document.querySelector('.hero__brand-word');
  const heroWordChars = splitText(heroWordEl, 'chars');

  gsap.set(heroCrown, { opacity: 0, y: -30, scale: 0.6, transformOrigin: 'center' });
  gsap.set(heroScript, { opacity: 0, y: 22 });
  gsap.set(heroWordChars, { opacity: 0, y: 55, rotateZ: 8 });

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 });
  heroTl
    .to(heroCrown, { opacity: 1, y: 0, scale: 1, duration: 0.85 })
    .to(heroWordChars, { opacity: 1, y: 0, rotateZ: 0, duration: 0.75, stagger: 0.035 }, '-=0.45')
    .to(heroScript, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
    .fromTo('[data-hero-item]',
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15 },
      '-=0.3'
    );

  // ---- Hero fixo (pin) com parallax/zoom acentuado ao fazer scroll ----
  gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=120%',
      scrub: 1,
      pin: true
    }
  })
    .to('#heroContent', { opacity: 0, y: -120, scale: 0.82, ease: 'none' }, 0)
    .to('#heroBg', { scale: 1.35, ease: 'none' }, 0);

  // ---- Revelação em scroll (agrupada por proximidade, mais amplitude) ----
  ScrollTrigger.batch('.reveal-up', {
    start: 'top 88%',
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 56 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }
    )
  });
  ScrollTrigger.batch('.reveal-img', {
    start: 'top 88%',
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 56, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: 'power3.out' }
    )
  });

  // ---- Painéis "cortina" sobre as imagens (wipe reveal) ----
  document.querySelectorAll('[data-wipe]').forEach(wipeEl => {
    const panel = wipeEl.querySelector('.wipe-panel');
    if (!panel) return;
    gsap.set(panel, { scaleX: 1 });
    gsap.to(panel, {
      scaleX: 0,
      duration: 1.2,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: wipeEl, start: 'top 78%' }
    });
  });

  // ---- Statement: coroa + frase palavra a palavra em 3D ----
  gsap.fromTo('.statement__crown',
    { opacity: 0, scale: 0.85 },
    {
      opacity: 0.05, scale: 1, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.statement', start: 'top 65%' }
    }
  );
  const statementWords = splitText(document.querySelector('.statement__text'), 'words');
  gsap.fromTo(statementWords,
    { opacity: 0, y: 60, rotateX: -50 },
    {
      opacity: 1, y: 0, rotateX: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.statement', start: 'top 65%' }
    }
  );

  // ---- CTA final: coroa de fundo a revelar ----
  gsap.fromTo('.final-cta__crown',
    { opacity: 0, scale: 0.85 },
    {
      opacity: 0.04, scale: 1, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.final-cta', start: 'top 70%' }
    }
  );

  // ---- Contadores (stats) ----
  document.querySelectorAll('[data-count-to]').forEach(el => {
    const target = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    const suffix = el.dataset.countSuffix || '';
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.fromTo(counter, { val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = counter.val.toFixed(decimals) + suffix; }
        });
      }
    });
  });

  // ---- Galeria: scroll horizontal fixo (apenas em ecrãs largos) ----
  const galeriaTrack = document.getElementById('galeriaTrack');
  if (galeriaTrack) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const distance = () => Math.max(0, galeriaTrack.scrollWidth - window.innerWidth);
      const tween = gsap.to(galeriaTrack, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '#galeria',
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: 1,
          pin: '#galeriaPin',
          invalidateOnRefresh: true
        }
      });
      return () => {
        if (tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
        gsap.set(galeriaTrack, { clearProps: 'transform' });
      };
    });
  }

  // ---- Cursor personalizado (só em dispositivos com rato) ----
  if (hasFinePointer) {
    document.documentElement.classList.add('has-fine-cursor');
    const cursorDot = document.querySelector('.cursor__dot');
    const cursorRing = document.querySelector('.cursor__ring');

    gsap.set([cursorDot, cursorRing], { xPercent: -50, yPercent: -50 });
    const moveDot = gsap.quickTo(cursorDot, 'x', { duration: 0.05, ease: 'none' });
    const moveDotY = gsap.quickTo(cursorDot, 'y', { duration: 0.05, ease: 'none' });
    const moveRing = gsap.quickTo(cursorRing, 'x', { duration: 0.45, ease: 'power3.out' });
    const moveRingY = gsap.quickTo(cursorRing, 'y', { duration: 0.45, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      moveDot(e.clientX); moveDotY(e.clientY);
      moveRing(e.clientX); moveRingY(e.clientY);
    });

    document.addEventListener('mouseover', (e) => {
      const interactive = e.target.closest('a, button, [data-tilt], .galeria__item, .servico-row');
      const onDark = e.target.closest('.hero, .statement, .footer, .fundadora, .final-cta, .marquee, .servico-card--featured, .nav-overlay');
      cursorRing.classList.toggle('is-hover', !!interactive);
      cursorRing.classList.toggle('is-light', !!onDark);
    });

    // ---- Botões magnéticos ----
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: relX * 0.35, y: relY * 0.45, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });

    // ---- Tilt 3D nos cards ----
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const quickRotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      const quickRotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 800, transformOrigin: 'center' });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        quickRotY(px * 14);
        quickRotX(-py * 14);
      });
      card.addEventListener('mouseleave', () => {
        quickRotY(0);
        quickRotX(0);
      });
    });
  }

});
