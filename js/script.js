document.addEventListener('DOMContentLoaded', () => {

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasScrollTo = typeof window.ScrollToPlugin !== 'undefined';
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // A classe "gsap-ready" já foi adicionada mais cedo por um script
  // inline no <head> (para esconder os elementos antes da primeira
  // pintura, sem "piscar"). Se o GSAP afinal não carregou, removemo-la
  // aqui para tudo voltar a ficar visível (fallback seguro).
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (hasScrollTo) gsap.registerPlugin(ScrollToPlugin);
  } else {
    document.documentElement.classList.remove('gsap-ready');
  }

  // ---- Scroll suave para os links âncora (substitui o CSS
  // scroll-behavior:smooth, que entra em conflito com o scrub do
  // ScrollTrigger e causa engasgos nas animações). ----
  if (hasGSAP && hasScrollTo) {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        gsap.to(window, { duration: 1, ease: 'power2.inOut', scrollTo: { y: target, autoKill: true } });
      });
    });
  }

  // ---- Recalcular posições ao terminar de carregar tudo (imagens
  // lazy podem alterar a altura da página depois do primeiro cálculo). ----
  if (hasGSAP) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
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

  // ---- Lightbox da galeria (fotos e o vídeo) ----
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.galeria__item img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.remove('is-video');
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  const openLightboxVideo = (src, poster) => {
    lightboxVideo.src = src;
    lightboxVideo.poster = poster || '';
    lightboxVideo.currentTime = 0;
    lightbox.classList.add('is-video', 'is-open');
    document.body.style.overflow = 'hidden';
    lightboxVideo.play().catch(() => {});
  };

  // Vídeos da galeria (já em loop, silenciosos): clicar abre no lightbox com som
  document.querySelectorAll('.galeria__item--video').forEach(item => {
    item.addEventListener('click', () => {
      const sourceVideo = item.querySelector('video');
      sourceVideo.pause();
      openLightboxVideo(sourceVideo.currentSrc || sourceVideo.src);
    });
  });

  // Qualquer outro gatilho de vídeo (ex: "Ver mensagem" na foto da Mônica)
  document.querySelectorAll('[data-video-trigger]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      openLightboxVideo(trigger.dataset.videoTrigger, trigger.dataset.videoPoster);
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightboxVideo.pause();
    document.querySelectorAll('.galeria__item--video video').forEach(v => v.play().catch(() => {}));
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

  // ---- Entrada do hero: título, subtítulo, CTA e etiquetas em stagger ----
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
    .fromTo('[data-hero-item]',
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15 }
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
    .to('#heroBg', {
      scale: 1.35,
      ease: 'none',
      // Em vez de dar zoom a partir do centro da foto, foca na parede
      // onde está a placa "Imperatriz by Mônica Carnot" (lado direito).
      transformOrigin: '76% 38%'
    }, 0);

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

  // ---- Revelação "presa" ao scroll, como um filme ----
  // Em vez de disparar uma vez (onEnter + duration), cada elemento tem
  // o seu próprio scrollTrigger com "scrub": o progresso da animação
  // segue diretamente a posição do scroll. Desces → avança; sobes →
  // anda em reverse. Não há "once" porque não há nada para consumir —
  // funciona sempre, tantas vezes quantas subires/desceres.
  document.querySelectorAll('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 56 },
      {
        opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: 0.4 }
      }
    );
  });
  document.querySelectorAll('.reveal-img').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 56, scale: 0.9 },
      {
        opacity: 1, y: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: 0.4 }
      }
    );
  });

  // ---- Painéis "cortina" sobre as imagens (wipe reveal), também presos ao scroll ----
  document.querySelectorAll('[data-wipe]').forEach(wipeEl => {
    const panel = wipeEl.querySelector('.wipe-panel');
    if (!panel) return;
    gsap.set(panel, { scaleX: 1 });
    gsap.to(panel, {
      scaleX: 0,
      ease: 'none',
      scrollTrigger: { trigger: wipeEl, start: 'top 88%', end: 'top 45%', scrub: 0.4 }
    });
  });

  // ---- Statement: coroa + frase palavra a palavra em 3D, presos ao scroll ----
  gsap.fromTo('.statement__crown',
    { opacity: 0, scale: 0.85 },
    {
      opacity: 0.05, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.statement', start: 'top 95%', end: 'top 40%', scrub: 0.4 }
    }
  );
  const statementWords = splitText(document.querySelector('.statement__text'), 'words');
  gsap.fromTo(statementWords,
    { opacity: 0, y: 60, rotateX: -50 },
    {
      opacity: 1, y: 0, rotateX: 0, ease: 'none',
      scrollTrigger: { trigger: '.statement', start: 'top 90%', end: 'top 35%', scrub: 0.4 }
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
      const onDark = e.target.closest('.hero, .statement, .footer, .fundadora, .marquee, .nav-overlay');
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

  // Recálculo final de segurança: garante que todas as posições de
  // scroll ficam corretas mesmo que algo (imagens, vídeos) ainda esteja
  // a carregar e a alterar ligeiramente a altura da página.
  ScrollTrigger.refresh();

});
