(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];

  function initNavigation() {
    const nav = $(".nav__bar");
    const button = $(".nav__bar__button");
    const links = $(".nav__links");
    if (!nav || !button || !links) return;

    const close = () => {
      links.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    };

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !links.classList.contains("open");
      links.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", close);
    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) close();
    });
    window.addEventListener(
      "scroll",
      () => nav.classList.toggle("scrolled", window.scrollY > 20),
      { passive: true },
    );
  }

  function initScrollProgress() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${total > 0 ? (window.scrollY / total) * 100 : 0}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initReveal() {
    const sections = $$(".story-section, .project-card, .footer__inner");
    sections.forEach((element) => element.classList.add("reveal"));
    if (!("IntersectionObserver" in window)) {
      sections.forEach((element) => element.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px" },
    );
    sections.forEach((element) => observer.observe(element));
  }

  function init() {
    initNavigation();
    initScrollProgress();
    initReveal();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
