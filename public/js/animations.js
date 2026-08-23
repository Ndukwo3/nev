// Animations - YUYA-inspired smooth effects

document.addEventListener('DOMContentLoaded', function() {
  // Expandable sections functionality (accordion behavior)
  const expandableSections = document.querySelectorAll('.expandable-section');
  let accordionId = 0;
  
  const setExpandedState = (section, expanded) => {
    const header = section.querySelector('.expandable-header');
    if (expanded) {
      section.classList.add('expanded');
    } else {
      section.classList.remove('expanded');
    }
    if (header) {
      header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  };

  expandableSections.forEach(section => {
    const header = section.querySelector('.expandable-header');
    const content = section.querySelector('.expandable-content');
    if (content && !content.id) {
      accordionId += 1;
      content.id = `expandable-content-${accordionId}`;
    }

    if (header) {
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', section.classList.contains('expanded') ? 'true' : 'false');
      header.setAttribute('aria-controls', content ? content.id : '');

      const toggleSection = () => {
        const isCurrentlyExpanded = section.classList.contains('expanded');
        
        // Close all other sections
        expandableSections.forEach(otherSection => {
          if (otherSection !== section) {
            setExpandedState(otherSection, false);
          }
        });
        
        // Toggle the clicked section
        setExpandedState(section, !isCurrentlyExpanded);
      };

      header.addEventListener('click', function() {
        toggleSection();
      });

      header.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleSection();
        }
      });
    }
  });

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll('.work-item, .about-section, .contact-section, .expandable-section');
  animateElements.forEach(el => {
    observer.observe(el);
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
          const targetPosition = target.offsetTop - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
