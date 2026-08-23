// Main JavaScript - YUYA-inspired portfolio

// Navigation scroll effect
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('.nav');
  
  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      // Toggle aria-expanded for accessibility
      const isOpen = navLinks.classList.contains('open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking on a link
    const links = navLinks.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!navLinks.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
        navLinks.classList.remove('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinksAll = document.querySelectorAll('.nav-link');
  
  navLinksAll.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

