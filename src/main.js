import './style.css'

console.log('Portfolio initialized.');

// Basic accordion logic for Works section
document.addEventListener('DOMContentLoaded', () => {
  const expandables = document.querySelectorAll('.expandable-header');
  
  expandables.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const toggle = header.querySelector('.expandable-toggle');
      
      if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        toggle.style.transform = 'rotate(180deg)';
      } else {
        content.style.display = 'none';
        toggle.style.transform = 'rotate(0deg)';
      }
    });
  });
});
