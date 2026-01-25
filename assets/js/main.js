document.addEventListener('DOMContentLoaded', () => {

  /**
   * Smooth scroll for anchor links
   */
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      // Ensure it's a real anchor link and not just '#'
      if (href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /**
   * Scroll reveal animation using Intersection Observer
   */
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-reveal', 'revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const revealElements = document.querySelectorAll('[data-reveal]');
  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  /**
   * Glassmorphism navbar scroll effect
   */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

});
