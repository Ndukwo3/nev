// Contact functionality - Copy to clipboard

document.addEventListener('DOMContentLoaded', function() {
  const copyButtons = document.querySelectorAll('.copy-btn');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const emailWrapper = this.closest('.email-wrapper');
      const emailLink = emailWrapper?.querySelector('.email-link');
      const email = emailLink?.textContent.trim() || emailLink?.getAttribute('href')?.replace('mailto:', '');
      
      if (email) {
        // Copy to clipboard
        navigator.clipboard.writeText(email).then(function() {
          // Update button text
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          button.classList.add('copied');
          
          // Reset after 2 seconds
          setTimeout(function() {
            button.textContent = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(function(err) {
          console.error('Failed to copy email:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = email;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(function() {
              button.textContent = 'Copy';
              button.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('Fallback copy failed:', err);
          }
          document.body.removeChild(textArea);
        });
      }
    });
  });
});

