
(function () {
  'use strict';

  /* ── LOADING SCREEN ──────────────────────────────────────── */
  function initLoadingScreen(onComplete) {
    const screen = document.getElementById('loading-screen');
    if (!screen) { onComplete(); return; }

    // Aguarda a barra de progresso terminar (1.4s) + margem leve
    setTimeout(() => {
      screen.classList.add('hidden');
      document.body.style.overflow = '';

      // Inicia canvas só após o fade out do loading (0.6s de transition)
      screen.addEventListener('transitionend', () => {
        screen.remove();
        onComplete();
      }, { once: true });
    }, 1500);
  }

  /* ── CUSTOM CURSOR ───────────────────────────────────────── */
  function initCursor() {
    if (window.innerWidth <= 768) return;

    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.className = 'cursor-outer';
    inner.className = 'cursor-inner';
    document.body.appendChild(outer);
    document.body.appendChild(inner);

    let mx = -100, my = -100;
    let ox = -100, oy = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      inner.style.left = mx + 'px';
      inner.style.top  = my + 'px';
    });

    // Smooth outer follow
    function tickCursor() {
      ox += (mx - ox) * 0.12;
      oy += (my - oy) * 0.12;
      outer.style.left = ox + 'px';
      outer.style.top  = oy + 'px';
      requestAnimationFrame(tickCursor);
    }
    tickCursor();

    // Hover states
    const hoverEls = document.querySelectorAll('a, button, .container__technologies__images__tech');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => outer.classList.add('hovering'));
      el.addEventListener('mouseleave', () => outer.classList.remove('hovering'));
    });
  }

  /* ── CANVAS PARTICLE FIELD ───────────────────────────────── */
  function initCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });

    canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
      pointer-events: none;
      display: block;
    `;

    let VW, VH, PH;
    let particles = [];
    let scrollY   = 0;
    let lastFrame = 0;
    let mouse     = { x: -9999, y: -9999 };

    const COLORS = [
      [45,  10, 120],
      [55,  15, 140],
      [65,  20, 160],
      [38,   8, 100],
      [72,  22, 150],
    ];

    const REPULSION_RADIUS = 120;
    const REPULSION_FORCE  = 6;
    const RETURN_SPRING    = 0.055;
    const DAMPING          = 0.80;
    const CONN_DIST        = 85;
    const CONN_DIST2       = CONN_DIST * CONN_DIST;

    // ── SPATIAL GRID ─────────────────────────────────────────
    // Divide a viewport em células — só compara partículas vizinhas
    const CELL = CONN_DIST; // célula = raio de conexão
    let grid = {};

    function gridKey(x, y) {
      return `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
    }

    function buildGrid() {
      grid = {};
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p._sy < -CONN_DIST || p._sy > VH + CONN_DIST) continue;
        const k = gridKey(p._sx, p._sy);
        if (!grid[k]) grid[k] = [];
        grid[k].push(i);
      }
    }

    function drawConnections() {
      buildGrid();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(80, 20, 180, 0.09)';
      ctx.lineWidth   = 0.4;

      const checked = new Set();

      for (const key in grid) {
        const [cx, cy] = key.split(',').map(Number);
        // Verifica célula atual e 4 vizinhas (evita duplicatas)
        for (let nx = cx - 1; nx <= cx + 1; nx++) {
          for (let ny = cy - 1; ny <= cy + 1; ny++) {
            const nkey = `${nx},${ny}`;
            const neighbors = grid[nkey];
            if (!neighbors) continue;

            const cell = grid[key];
            for (let a = 0; a < cell.length; a++) {
              for (let b = 0; b < neighbors.length; b++) {
                const i = cell[a], j = neighbors[b];
                if (i >= j) continue; // evita duplicatas
                const pairKey = `${i}-${j}`;
                if (checked.has(pairKey)) continue;
                checked.add(pairKey);

                const pi = particles[i], pj = particles[j];
                const dx = pi._sx - pj._sx;
                const dy = pi._sy - pj._sy;
                if (dx * dx + dy * dy < CONN_DIST2) {
                  ctx.moveTo(pi._sx, pi._sy);
                  ctx.lineTo(pj._sx, pj._sy);
                }
              }
            }
          }
        }
      }
      ctx.stroke();
    }

    // ── PARTÍCULAS ───────────────────────────────────────────
    class Particle {
      constructor() {
        this.ox = Math.random() * VW;
        this.oy = Math.random() * PH;
        this.x  = this.ox;
        this.y  = this.oy;
        this.vx = 0;
        this.vy = 0;

        this.driftAngle  = Math.random() * Math.PI * 2;
        this.driftRadius = Math.random() * 24 + 6;
        this.driftSpeed  = (Math.random() * 0.006 + 0.002) * (Math.random() > 0.5 ? 1 : -1);

        this.r         = Math.random() * 1.6 + 0.5;
        this.colorIdx  = Math.floor(Math.random() * COLORS.length); // índice direto
        this.baseAlpha = Math.random() * 0.5 + 0.15;
        this.alpha     = this.baseAlpha;
        this._sx       = this.x;
        this._sy       = 0;
      }

      update() {
        this.driftAngle += this.driftSpeed;
        const targetX = this.ox + Math.cos(this.driftAngle) * this.driftRadius;
        const targetY = this.oy + Math.sin(this.driftAngle) * this.driftRadius;

        const dx    = this.x - mouse.x;
        const dy    = this.y - mouse.y;
        const dist2 = dx * dx + dy * dy;

        if (dist2 < REPULSION_RADIUS * REPULSION_RADIUS && dist2 > 0) {
          const d = Math.sqrt(dist2);
          const force = (REPULSION_RADIUS - d) / REPULSION_RADIUS;
          this.vx += (dx / d) * force * REPULSION_FORCE;
          this.vy += (dy / d) * force * REPULSION_FORCE;
          this.alpha = Math.min(this.baseAlpha * 2.2, 0.8);
        } else {
          this.alpha += (this.baseAlpha - this.alpha) * 0.04;
        }

        this.vx += (targetX - this.x) * RETURN_SPRING;
        this.vy += (targetY - this.y) * RETURN_SPRING;
        this.vx *= DAMPING;
        this.vy *= DAMPING;
        this.x  += this.vx;
        this.y  += this.vy;

        this._sx = this.x;
        this._sy = this.y - scrollY;
      }
    }

    // Batch por cor — um fillStyle por grupo, globalAlpha por partícula
    function drawParticles() {
      const byColor = [[], [], [], [], []]; // índice fixo, sem alloc dinâmica

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p._sy < -10 || p._sy > VH + 10) continue;
        byColor[p.colorIdx].push(p);
      }

      for (let c = 0; c < COLORS.length; c++) {
        const group = byColor[c];
        if (!group.length) continue;
        const [r, g, b] = COLORS[c];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        for (let i = 0; i < group.length; i++) {
          const p = group[i];
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p._sx, p._sy, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // ── SETUP ────────────────────────────────────────────────
    function getPageHeight() {
      return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    }

    let targetCount = 0;
    const BATCH_SIZE = 10; // cria 10 partículas por frame — imperceptível para o usuário

    function setup() {
      VW = canvas.width  = canvas.offsetWidth  || window.innerWidth;
      VH = canvas.height = canvas.offsetHeight || window.innerHeight;
      PH = getPageHeight();

      targetCount = Math.min(Math.floor((VW * PH) / 14000), 120);
      particles   = []; // começa vazio, preenchido gradualmente no animate
    }

    // ── ANIMATE ──────────────────────────────────────────────
    function animate(ts) {
      const minInterval = document.hidden ? 50 : 16;
      if (ts - lastFrame < minInterval) { requestAnimationFrame(animate); return; }
      lastFrame = ts;

      // Adiciona partículas gradualmente — evita travar o main thread
      if (particles.length < targetCount) {
        const toAdd = Math.min(BATCH_SIZE, targetCount - particles.length);
        for (let i = 0; i < toAdd; i++) particles.push(new Particle());
      }

      scrollY = window.scrollY;
      ctx.clearRect(0, 0, VW, VH);

      particles.forEach(p => p.update());
      // drawConnections();
      drawParticles();

      requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY + window.scrollY;
    });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', setup);

    setup();
    setTimeout(setup, 600);
    requestAnimationFrame(animate);
  }

  /* ── SCROLL PROGRESS BAR ─────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.style.width = '0%';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      const pct      = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ── NAV SCROLL BEHAVIOR ─────────────────────────────────── */
  function initNav() {
    const nav = document.querySelector('.nav__bar');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }, { passive: true });

    const btn  = document.querySelector('.nav__bar__button');
    const links = document.querySelector('.nav__links');
    const open  = document.querySelector('.ri-menu-line');

    if (!btn || !links) return;

    function openMenu() {
      links.classList.add('open');
      if (open) open.style.opacity = '0.5';
      document.body.style.overflow = '';
    }

    function closeMenu() {
      links.classList.remove('open');
      if (open) open.style.opacity = '1';
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      links.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Fecha ao clicar fora do painel
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && !btn.contains(e.target)) {
        closeMenu();
      }
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ── REVEAL ON SCROLL ────────────────────────────────────── */
  function initReveal() {
    const sections = document.querySelectorAll('section, .container__projects__project');

    sections.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    sections.forEach(el => observer.observe(el));
  }

  /* ── SKILL CARDS STAGGER ─────────────────────────────────── */
  function initSkillCards() {
    const cards = document.querySelectorAll('.container__technologies__images__tech');

    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        cards.forEach((card, i) => {
          card.style.opacity    = '0';
          card.style.transform  = 'translateY(30px) scale(0.95)';
          card.style.transition = `opacity 0.5s ${i * 0.06}s cubic-bezier(0.23,1,0.32,1), transform 0.5s ${i * 0.06}s cubic-bezier(0.23,1,0.32,1)`;

          setTimeout(() => {
            card.style.opacity   = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, 50 + i * 60);
        });
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    const grid = document.querySelector('.container__technologies__images');
    if (grid) observer.observe(grid);
  }

  /* ── TIMELINE STAGGER ────────────────────────────────────── */
  function initTimeline() {
    const items = document.querySelectorAll('.container__experience__timeline > li');

    items.forEach((item, i) => {
      item.style.opacity    = '0';
      item.style.transform  = 'translateX(-30px)';
      item.style.transition = `opacity 0.6s cubic-bezier(0.23,1,0.32,1), transform 0.6s cubic-bezier(0.23,1,0.32,1)`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const item = entry.target;
          const idx  = Array.from(items).indexOf(item);
          setTimeout(() => {
            item.style.opacity   = '1';
            item.style.transform = 'translateX(0)';
          }, idx * 80);
          observer.unobserve(item);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(item => observer.observe(item));
  }

  /* ── GLITCH TEXT ON NAME ─────────────────────────────────── */
  function initGlitchTitle() {
    const title = document.querySelector('.title__strong');
    if (!title) return;

    const original = title.textContent;
    const chars = '!<>-_\\/[]{}—=+*^?#ABCDE01234';

    const SHADOWS = [
      '0.05em 0 0 rgba(220,80,220,0.75), -0.03em -0.04em 0 rgba(255,100,180,0.7)',
      '-0.05em -0.025em 0 rgba(180,50,255,0.75), 0.025em 0.035em 0 rgba(255,80,200,0.7)',
      '0.05em 0.035em 0 rgba(220,60,240,0.75), 0.03em 0 0 rgba(255,100,180,0.7)',
      '-0.03em 0.02em 0 rgba(200,50,255,0.75), 0.04em -0.02em 0 rgba(255,80,200,0.7)',
    ];

    let scrambleInterval = null;
    let shadowInterval   = null;

    function startGlitch() {
      // Text-shadow glitch em loop
      clearInterval(shadowInterval);
      shadowInterval = setInterval(() => {
        title.style.textShadow = SHADOWS[Math.floor(Math.random() * SHADOWS.length)];
      }, 80);

      // Scramble uma única vez, depois mostra o nome original
      let iterations = 0;
      clearInterval(scrambleInterval);
      scrambleInterval = setInterval(() => {
        title.textContent = original
          .split('')
          .map((char) => {
            if (char === ' ') return ' ';
            if (Math.random() > 0.5) return chars[Math.floor(Math.random() * chars.length)];
            return char;
          })
          .join('');

        iterations++;
        // Após ~10 frames volta ao nome e para o scramble
        if (iterations >= 10) {
          clearInterval(scrambleInterval);
          scrambleInterval = null;
          title.textContent = original;
        }
      }, 40);
    }

    function stopGlitch() {
      clearInterval(scrambleInterval);
      clearInterval(shadowInterval);
      scrambleInterval = null;
      shadowInterval   = null;

      title.textContent = original;
      title.style.transition = 'text-shadow 0.3s ease';
      title.style.textShadow = 'none';
      setTimeout(() => {
        title.style.textShadow = '';
        title.style.transition = '';
      }, 300);
    }

    title.addEventListener('mouseenter', startGlitch);
    title.addEventListener('mouseleave', stopGlitch);
  }

  /* ── PROFILE IMAGE WRAPPER ───────────────────────────────── */
  function initProfileWrapper() {
    const img = document.querySelector('.container__apresentation img');
    if (!img) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'profile__img__wrapper';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // Remove margin-top da img (agora é do wrapper)
    img.style.marginTop = '0';

    // Após a animação de entrada terminar, remove-a para que
    // o transform do hover não seja bloqueado pelo fill-mode
    img.addEventListener('animationend', () => {
      img.style.animation = 'none';
      img.style.transform = 'scale(1)';
      img.style.opacity   = '1';
      img.style.filter    = 'saturate(0.8) contrast(1.1)';
    }, { once: true });
  }

  /* ── SECTION COUNTER NUMBERS ─────────────────────────────── */
  function initCounterBadges() {
    const sections = document.querySelectorAll('section');
    sections.forEach((sec, i) => {
      const badge = document.createElement('div');
      badge.textContent = String(i + 1).padStart(2, '0');
      badge.style.cssText = `
        position: absolute;
        top: 32px;
        right: 10vw;
        font-family: 'Orbitron', sans-serif;
        font-size: 4rem;
        font-weight: 900;
        color: rgba(123,47,255,0.06);
        pointer-events: none;
        user-select: none;
        line-height: 1;
        z-index: 0;
      `;
      // Appenda no body para que right: 10vw seja relativo ao viewport
      // e não à seção (evita desalinhamento em seções com max-width)
      document.body.appendChild(badge);

      // Posiciona verticalmente de acordo com o offset da seção
      function updatePos() {
        const rect = sec.getBoundingClientRect();
        badge.style.top = (window.scrollY + rect.top + 32) + 'px';
      }

      updatePos();
      window.addEventListener('resize', updatePos);
    });
  }

  /* ── AMBIENT GLOW ON HOVER ───────────────────────────────── */
  function initAmbientGlow() {
    const cards = document.querySelectorAll(
      '.container__experience__timeline__content, .container__projects__project, .container__about__me__paragraph'
    );

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');

        card.style.background = `
          radial-gradient(circle at ${x}% ${y}%, rgba(123,47,255,0.1) 0%, transparent 60%),
          var(--panel-hi)
        `;
      });

      card.addEventListener('mouseleave', () => {
        card.style.background = '';
      });
    });
  }

  /* ── TYPING EFFECT FOR SUBTITLE ─────────────────────────── */
  function initTypingEffect() {
    const el = document.querySelector('.container__apresentation__texts__header');
    if (!el) return;

    const texts = ['ML Engineer','Especialista em IA', 'Desenvolvedor Python'];
    let textIdx = 0, charIdx = 0, deleting = false;

    el.textContent = '';

    function type() {
      const current = texts[textIdx];

      if (!deleting) {
        el.textContent = current.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(type, 2200);
          return;
        }
      } else {
        el.textContent = current.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          textIdx = (textIdx + 1) % texts.length;
        }
      }

      setTimeout(type, deleting ? 45 : 90);
    }

    setTimeout(type, 1800);
  }

  /* ── PROJECT MODALS ──────────────────────────────────────── */
  function initProjectModals() {

    // Dados de cada projeto — indexados pela ordem dos cards no DOM
    // media: { type: 'image' | 'video' | 'youtube', src: '...' }
    const PROJECTS = [
      {
        title: 'AssistantAI',
        techs: ['Python', 'LangChain', 'Groq', 'Streamlit'],
        description: `O AssistantAI é um chatbot desenvolvido em Python que permite ao usuário fazer perguntas com base em arquivos PDF enviados diretamente para a interface. O sistema utiliza LangChain para orquestrar o pipeline de RAG (Retrieval-Augmented Generation), Groq como provedor de LLM de alta velocidade, e Streamlit para a interface web. Os documentos são processados em chunks, vetorizados e armazenados em memória para consulta semântica em tempo real.`,
        github: 'https://github.com/louuispy/Chatbot-with-PDF-reader',
        media: { type: 'video', src: './assets/AssistantAI.mp4' },
      },
      {
        title: 'Algoritmo de Detecção de Objetos em Imagens',
        techs: ['Python', 'YOLOv8'],
        description: `Algoritmo de visão computacional desenvolvido com YOLOv8 para detecção e classificação de objetos em imagens estáticas. O modelo identifica múltiplos objetos simultaneamente, desenhando bounding boxes com labels e scores de confiança. O projeto explora o uso de modelos pré-treinados e fine-tuning para domínios específicos.`,
        github: 'https://github.com/louuispy/Deteccao-de-Objetos-em-Imagens',
        media: { type: 'image', src: './assets/Deteccao.png' },
      },
      {
        title: 'Algoritmo de Detecção de Mãos',
        techs: ['Python', 'OpenCV', 'Mediapipe'],
        description: `Sistema de detecção e rastreamento de mãos em tempo real via webcam, utilizando a biblioteca Mediapipe para mapear os 21 landmarks da mão detectada. OpenCV é usado para captura de frames e renderização dos pontos e conexões sobre o vídeo ao vivo. O projeto serve como base para aplicações de gesture control e interfaces sem toque.`,
        github: 'https://github.com/louuispy/Hand-Detection-Tracking',
        media: { type: 'image', src: './assets/DeteccaoMaos.png' },
      },
      {
        title: 'Automação para deletar repositórios do Github',
        techs: ['Python', 'PyAutoGui', 'PyPerClip'],
        description: `Automação desktop desenvolvida com PyAutoGUI e PyPerClip para acelerar o processo de remoção de múltiplos repositórios no GitHub. O script controla o mouse e teclado de forma programática, navegando pela interface web e executando as etapas de confirmação automaticamente, eliminando trabalho manual repetitivo.`,
        github: 'https://github.com/louuispy/Automatizacao-Excluir-Repositorios-GitHub',
        media: { type: 'video', src: './assets/Automacao.mp4' },
      },
      {
        title: 'Chatbot com RAG multimodal',
        techs: ['Python', 'LangChain'],
        description: `Chatbot com RAG multimodal via linha de comando que processa PDFs,
            vídeos do YouTube e imagens como base de conhecimento para responder
            perguntas com LLM. Feito em Python, utilizando LangChain e base64.`,
        github: 'https://github.com/louuispy/multimodal-rag-cli-gt',
        media: { type: 'video', src: './assets/rag_multimodal_video.mov' },
      },
    ];

    const GITHUB_SVG = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.620.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/></svg>`;

    // Cria o overlay do modal uma única vez
    const overlay = document.createElement('div');
    overlay.className = 'modal__overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title"></h2>
          <button class="modal__close" aria-label="Fechar">✕</button>
        </div>
        <div class="modal__media__wrap"></div>
        <div class="modal__body">
          <p class="modal__description"></p>
          <ul class="modal__techs"></ul>
        </div>
        <div class="modal__footer">
          <a class="modal__github" target="_blank" rel="noopener">
            ${GITHUB_SVG}
            <span>Ver no GitHub</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const titleEl   = overlay.querySelector('.modal__title');
    const mediaWrap = overlay.querySelector('.modal__media__wrap');
    const descEl    = overlay.querySelector('.modal__description');
    const techsEl   = overlay.querySelector('.modal__techs');
    const githubEl  = overlay.querySelector('.modal__github');
    const closeBtn  = overlay.querySelector('.modal__close');

    function openModal(data) {
      titleEl.textContent = data.title;
      descEl.textContent  = data.description;
      githubEl.href       = data.github;

      // Media — imagem, vídeo local ou YouTube
      mediaWrap.innerHTML = '';
      if (data.media) {
        const wrap = document.createElement('div');
        wrap.className = 'modal__video';

        if (data.media.type === 'image') {
          wrap.innerHTML = `<img src="${data.media.src}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
        } else if (data.media.type === 'video') {
          wrap.innerHTML = `<video src="${data.media.src}" controls loop style="width:100%;height:100%;object-fit:cover;display:block;"></video>`;
        } else if (data.media.type === 'youtube') {
          const src = data.media.src;
          const id  = src.includes('youtu.be')
            ? src.split('/').pop().split('?')[0]
            : new URL(src).searchParams.get('v');
          wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen style="width:100%;height:100%;border:none;display:block;"></iframe>`;
        }

        mediaWrap.appendChild(wrap);
      }

      // Tecnologias
      techsEl.innerHTML = data.techs.map(t => `<li>${t}</li>`).join('');

      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { mediaWrap.innerHTML = ''; }, 400);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Injeta botão "Ver detalhes" em cada card e vincula os dados
    const cards = document.querySelectorAll('.container__projects__project');
    cards.forEach((card, i) => {
      const data = PROJECTS[i];
      if (!data) return;

      const btns = document.createElement('div');
      btns.style.cssText = 'grid-area: btns; display: flex; gap: 10px; align-items: end; flex-wrap: wrap;';

      const detailBtn = document.createElement('button');
      detailBtn.className = 'btn__details';
      detailBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Ver detalhes
      `;
      detailBtn.addEventListener('click', () => openModal(data));
      btns.appendChild(detailBtn);
      card.appendChild(btns);
    });
  }

  /* ── INJECT CSS ORBS ─────────────────────────────────────── */
  function injectOrbs() {
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= 9; i++) {
      const orb = document.createElement('div');
      orb.className = `orb orb-${i}`;
      frag.appendChild(orb);
    }
    document.body.appendChild(frag);
  }

  /* ── LOADING SCREEN HTML INJECTION ──────────────────────── */
  function injectLoadingScreen() {
    const div = document.createElement('div');
    div.id = 'loading-screen';
    div.innerHTML = `
      <div class="loading-logo">Inicializando sistema</div>
      <div class="loading-bar"><div class="loading-bar-fill"></div></div>
    `;
    document.body.prepend(div);
    document.body.style.overflow = 'hidden';

    // Revela o body agora que o loading screen já está no lugar
    document.body.style.visibility = 'visible';
  }

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    injectOrbs();
    injectLoadingScreen();

    initProfileWrapper();
    initCursor();
    initScrollProgress();
    initNav();
    initReveal();
    initSkillCards();
    initTimeline();
    initGlitchTitle();
    initCounterBadges();
    initAmbientGlow();
    initTypingEffect();
    initProjectModals();

    initLoadingScreen(() => {
      initCanvas();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();