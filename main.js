document.addEventListener('DOMContentLoaded', () => {
  const fadeSections = document.querySelectorAll(
    '.container__about__me, .container__technologies, .container__experience, .container__projects'
  );

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' 
    }
  );

  fadeSections.forEach((section) => observer.observe(section));
});