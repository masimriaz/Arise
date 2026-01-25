document.addEventListener('DOMContentLoaded', () => {

  /**
   * Smooth scroll for anchor links
   */
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
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
   * Staggered fade-in for cards
   */
  const fadeInElements = document.querySelectorAll('.fade-in-up');
  fadeInElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
  });

  /**
   * Newsletter form basic validation
   */
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    const input = newsletterForm.querySelector('.newsletter-input');
    const btn = newsletterForm.querySelector('.newsletter-btn');
    
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      const email = input?.value;
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        btn.textContent = 'Subscribed!';
        btn.style.background = 'var(--color-accent-emerald)';
        setTimeout(() => {
          btn.textContent = 'Subscribe';
          input.value = '';
        }, 2000);
      } else {
        input?.classList.add('is-invalid');
        setTimeout(() => input?.classList.remove('is-invalid'), 2000);
      }
    });
  }

  /**
   * Active nav link highlighting
   */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
