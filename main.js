document.addEventListener("DOMContentLoaded", () => {
  const fadeSections = document.querySelectorAll(
    ".container__about__me, .container__technologies, .container__experience, .container__projects, .footer__contact"
  );

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  fadeSections.forEach((section) => observer.observe(section));
});

document.querySelectorAll(".nav__links a").forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    const navbarHeight = document.querySelector(".nav__bar").offsetHeight;

    const offsetPosition =
      targetElement.getBoundingClientRect().top +
      window.pageYOffset -
      navbarHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  });
});
