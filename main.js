(function () {
    "use strict";

    function initLoadingScreen(onComplete) {
        const screen = document.getElementById("loading-screen");
        if (!screen) {
            onComplete();
            return;
        }

        setTimeout(() => {
            screen.classList.add("hidden");
            document.body.style.overflow = "";
            screen.addEventListener(
                "transitionend",
                () => {
                    screen.remove();
                    onComplete();
                },
                { once: true },
            );
        }, 1200);
    }

    function initScrollProgress() {
        const bar = document.createElement("div");
        bar.className = "scroll-progress";
        bar.style.width = "0%";
        document.body.appendChild(bar);

        window.addEventListener(
            "scroll",
            () => {
                const scrolled = window.scrollY;
                const total =
                    document.documentElement.scrollHeight - window.innerHeight;
                const pct = total > 0 ? (scrolled / total) * 100 : 0;
                bar.style.width = pct + "%";
            },
            { passive: true },
        );
    }

    function initNav() {
      console.log('ENTROU NO INITNAV');
  
      const nav = document.querySelector('.nav__bar');
  
      if (!nav) {
          console.log('NAV NÃO ENCONTRADA');
          return;
      }
  
      const btn = document.querySelector('.nav__bar__button');
      const links = document.querySelector('.nav__links');
  
      console.log({ btn, links });
  
      if (!btn || !links) return;
  
      function openMenu() {
          links.classList.add("open");
      }
  
      function closeMenu() {
          links.classList.remove("open");
      }
  
      function toggleMenu() {
          if (links.classList.contains("open")) closeMenu();
          else openMenu();
      }
  
      btn.addEventListener("click", (e) => {
          console.log("CLIQUE");
          e.preventDefault();
          e.stopPropagation();
          toggleMenu();
      });
  
      document.addEventListener("click", (e) => {
          if (!links.classList.contains("open")) return;
  
          const clickedInsideLinks = links.contains(e.target);
          const clickedInsideBtn = btn.contains(e.target);
  
          if (!clickedInsideLinks && !clickedInsideBtn) {
              closeMenu();
          }
      });
  
      links.querySelectorAll("a").forEach((a) => {
          a.addEventListener("click", closeMenu);
      });
  }

    function initReveal() {
        const sections = document.querySelectorAll(
            "section, .container__projects__project",
        );
        sections.forEach((el) => el.classList.add("reveal"));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting)
                        entry.target.classList.add("visible");
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
        );

        sections.forEach((el) => observer.observe(el));
    }

    function initSkillCards() {
        const cards = document.querySelectorAll(
            ".container__technologies__images__tech",
        );

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    cards.forEach((card, i) => {
                        card.style.opacity = "0";
                        card.style.transform = "translateY(24px)";
                        card.style.transition = `opacity 0.5s ${i * 0.05}s ease, transform 0.5s ${i * 0.05}s ease`;

                        setTimeout(
                            () => {
                                card.style.opacity = "1";
                                card.style.transform = "translateY(0)";
                            },
                            50 + i * 50,
                        );
                    });
                    observer.disconnect();
                }
            },
            { threshold: 0.1 },
        );

        const grid = document.querySelector(".container__technologies__images");
        if (grid) observer.observe(grid);
    }

    function initTimeline() {
        const items = document.querySelectorAll(
            ".container__experience__timeline > li",
        );

        items.forEach((item) => {
            item.style.opacity = "0";
            item.style.transform = "translateX(-20px)";
            item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const item = entry.target;
                        const idx = Array.from(items).indexOf(item);
                        setTimeout(() => {
                            item.style.opacity = "1";
                            item.style.transform = "translateX(0)";
                        }, idx * 70);
                        observer.unobserve(item);
                    }
                });
            },
            { threshold: 0.15 },
        );

        items.forEach((item) => observer.observe(item));
    }

    function initProfileWrapper() {
        const img = document.querySelector(".container__apresentation img");
        if (
            !img ||
            img.parentElement?.classList.contains("profile__img__wrapper")
        )
            return;

        const wrapper = document.createElement("div");
        wrapper.className = "profile__img__wrapper";
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    }

    function initTypingEffect() {
        const el = document.querySelector(
            ".container__apresentation__texts__header",
        );
        if (!el) return;

        const texts = [
            "Cientista de Dados",
            "ML Engineer",
            "Especialista em IA",
            "Desenvolvedor Python",
        ];
        let textIdx = 0;
        let charIdx = 0;
        let deleting = false;

        el.textContent = "";

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

            setTimeout(type, deleting ? 40 : 80);
        }

        setTimeout(type, 1400);
    }

    function initProjectModals() {
        const PROJECTS = [
            {
                title: "AssistantAI",
                techs: ["Python", "LangChain", "Groq", "Streamlit"],
                description: `O AssistantAI é um chatbot desenvolvido em Python que permite ao usuário fazer perguntas com base em arquivos PDF enviados diretamente para a interface. O sistema utiliza LangChain para orquestrar o pipeline de RAG (Retrieval-Augmented Generation), Groq como provedor de LLM de alta velocidade, e Streamlit para a interface web. Os documentos são processados em chunks, vetorizados e armazenados em memória para consulta semântica em tempo real.`,
                github: "https://github.com/louuispy/Chatbot-with-PDF-reader",
                media: { type: "video", src: "./assets/AssistantAI.mp4" },
            },
            {
                title: "Algoritmo de Detecção de Objetos em Imagens",
                techs: ["Python", "YOLOv8"],
                description: `Algoritmo de visão computacional desenvolvido com YOLOv8 para detecção e classificação de objetos em imagens estáticas. O modelo identifica múltiplos objetos simultaneamente, desenhando bounding boxes com labels e scores de confiança. O projeto explora o uso de modelos pré-treinados e fine-tuning para domínios específicos.`,
                github: "https://github.com/louuispy/Deteccao-de-Objetos-em-Imagens",
                media: { type: "image", src: "./assets/Deteccao.png" },
            },
            {
                title: "Algoritmo de Detecção de Mãos",
                techs: ["Python", "OpenCV", "Mediapipe"],
                description: `Sistema de detecção e rastreamento de mãos em tempo real via webcam, utilizando a biblioteca Mediapipe para mapear os 21 landmarks da mão detectada. OpenCV é usado para captura de frames e renderização dos pontos e conexões sobre o vídeo ao vivo. O projeto serve como base para aplicações de gesture control e interfaces sem toque.`,
                github: "https://github.com/louuispy/Hand-Detection-Tracking",
                media: { type: "image", src: "./assets/DeteccaoMaos.png" },
            },
            {
                title: "Automação para deletar repositórios do Github",
                techs: ["Python", "PyAutoGui", "PyPerClip"],
                description: `Automação desktop desenvolvida com PyAutoGUI e PyPerClip para acelerar o processo de remoção de múltiplos repositórios no GitHub. O script controla o mouse e teclado de forma programática, navegando pela interface web e executando as etapas de confirmação automaticamente, eliminando trabalho manual repetitivo.`,
                github: "https://github.com/louuispy/Automatizacao-Excluir-Repositorios-GitHub",
                media: { type: "video", src: "./assets/Automacao.mp4" },
            },
            {
                title: "Chatbot com RAG multimodal",
                techs: ["Python", "LangChain"],
                description: `Chatbot com RAG multimodal via linha de comando que processa PDFs, vídeos do YouTube e imagens como base de conhecimento para responder perguntas com LLM. Feito em Python, utilizando LangChain e base64.`,
                github: "https://github.com/louuispy/multimodal-rag-cli-gt",
                media: {
                    type: "video",
                    src: "./assets/rag_multimodal_video.mov",
                },
            },
        ];

        const GITHUB_SVG = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.620.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.480C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/></svg>`;

        const overlay = document.createElement("div");
        overlay.className = "modal__overlay";
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

        const titleEl = overlay.querySelector(".modal__title");
        const mediaWrap = overlay.querySelector(".modal__media__wrap");
        const descEl = overlay.querySelector(".modal__description");
        const techsEl = overlay.querySelector(".modal__techs");
        const githubEl = overlay.querySelector(".modal__github");
        const closeBtn = overlay.querySelector(".modal__close");

        function openModal(data) {
            titleEl.textContent = data.title;
            descEl.textContent = data.description;
            githubEl.href = data.github;

            mediaWrap.innerHTML = "";
            if (data.media) {
                const wrap = document.createElement("div");
                wrap.className = "modal__video";

                if (data.media.type === "image") {
                    wrap.innerHTML = `<img src="${data.media.src}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
                } else if (data.media.type === "video") {
                    wrap.innerHTML = `<video src="${data.media.src}" controls loop style="width:100%;height:100%;object-fit:cover;display:block;"></video>`;
                } else if (data.media.type === "youtube") {
                    const src = data.media.src;
                    const id = src.includes("youtu.be")
                        ? src.split("/").pop().split("?")[0]
                        : new URL(src).searchParams.get("v");
                    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen style="width:100%;height:100%;border:none;display:block;"></iframe>`;
                }

                mediaWrap.appendChild(wrap);
            }

            techsEl.innerHTML = data.techs.map((t) => `<li>${t}</li>`).join("");
            overlay.classList.add("open");
            document.body.style.overflow = "hidden";
        }

        function closeModal() {
            overlay.classList.remove("open");
            document.body.style.overflow = "";
            setTimeout(() => {
                mediaWrap.innerHTML = "";
            }, 350);
        }

        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeModal();
        });

        const cards = document.querySelectorAll(
            ".container__projects__project",
        );
        cards.forEach((card, i) => {
            const data = PROJECTS[i];
            if (!data) return;

            const btns = document.createElement("div");
            btns.style.cssText =
                "display: flex; gap: 10px; flex-wrap: wrap; margin-top: auto;";

            const detailBtn = document.createElement("button");
            detailBtn.className = "btn__details";
            detailBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Ver detalhes
      `;
            detailBtn.addEventListener("click", () => openModal(data));
            btns.appendChild(detailBtn);
            card.appendChild(btns);
        });
    }

    function injectLoadingScreen() {
        const div = document.createElement("div");
        div.id = "loading-screen";
        div.innerHTML = `
      <div class="loading-logo">Carregando</div>
      <div class="loading-bar"><div class="loading-bar-fill"></div></div>
    `;
        document.body.prepend(div);
        document.body.style.overflow = "hidden";
    }

    function init() {
        injectLoadingScreen();
        initProfileWrapper();
        initScrollProgress();
        initNav();
        initReveal();
        initSkillCards();
        initTimeline();
        initTypingEffect();
        initProjectModals();
        initLoadingScreen(() => {});
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
