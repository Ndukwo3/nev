import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://twsgsjjdjqcbafuktiow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c2dzampkanFjYmFmdWt0aW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU3MTgsImV4cCI6MjEwMjg5MTcxOH0._OqayETEcAPr8GW8Gn9KZ-SKrCz5wfHcT9ZuaBfV7ew';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProjects = [];

async function loadProjects() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!projects || projects.length === 0) return;

    allProjects = projects;
    
    // Group projects by category
    const categories = {};
    projects.forEach(proj => {
      if (!categories[proj.category]) categories[proj.category] = [];
      categories[proj.category].push(proj);
    });

    // Handle CVs dropdown
    const cvDropdown = document.getElementById('cv-dropdown');
    if (cvDropdown && categories['CVs / RESUMEs']) {
      cvDropdown.innerHTML = '';
      categories['CVs / RESUMEs'].forEach(cv => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'dropdown-item';
        a.textContent = cv.title;
        
        // Change text on hover
        a.onmouseenter = () => { a.textContent = 'Click to view'; };
        a.onmouseleave = () => { a.textContent = cv.title; };

        a.onclick = (e) => {
          e.preventDefault();
          openCvModal(cv.id);
        };
        li.appendChild(a);
        cvDropdown.appendChild(li);
      });
    }

    // Find all expandable sections
    const sections = document.querySelectorAll('.expandable-section');
    sections.forEach(section => {
      const titleEl = section.querySelector('.expandable-title');
      if (!titleEl) return;
      
      const categoryName = titleEl.textContent.trim();
      const workGrid = section.querySelector('.work-grid');
      
      if (categories[categoryName] && workGrid) {
        // Clear existing hardcoded content
        workGrid.innerHTML = '';
        
        // Inject Supabase projects
        categories[categoryName].forEach(proj => {
          const item = document.createElement('div');
          item.className = 'work-item';
          
          item.style.cursor = 'pointer';
          item.onclick = () => {
            const hasContentImages = proj.content_images && proj.content_images.length > 0;
            if (!hasContentImages && proj.project_link) {
              // Open external link directly
              let finalLink = proj.project_link;
              if (!/^https?:\/\//i.test(finalLink)) {
                finalLink = 'https://' + finalLink;
              }
              window.open(finalLink, '_blank', 'noopener,noreferrer');
            } else {
              // Open Behance-style modal
              openProjectModal(proj.id);
            }
          };

          const img = document.createElement('img');
          img.src = proj.image_url;
          img.alt = proj.title;
          img.loading = 'lazy';
          
          const info = document.createElement('div');
          info.className = 'work-info';
          info.innerHTML = `
            <h3 class="work-title">${proj.title}</h3>
            <p class="work-category">${proj.description || ''}</p>
          `;
          
          item.appendChild(img);
          item.appendChild(info);
          workGrid.appendChild(item);
        });
      }
    });

  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Modal Logic
window.openProjectModal = (projectId) => {
  const proj = allProjects.find(p => p.id === projectId);
  if (!proj) return;

  document.getElementById('modal-title').textContent = proj.title;
  document.getElementById('modal-desc').textContent = proj.description || '';
  
  const imagesContainer = document.getElementById('modal-images');
  imagesContainer.innerHTML = '';

  if (proj.content_images && proj.content_images.length > 0) {
    proj.content_images.forEach(imgUrl => {
      const img = document.createElement('img');
      img.src = imgUrl;
      imagesContainer.appendChild(img);
    });
  } else if (proj.image_url) {
    // Fallback to thumbnail if no content images exist
    const img = document.createElement('img');
    img.src = proj.image_url;
    imagesContainer.appendChild(img);
  }

  document.getElementById('project-modal').classList.add('active');
  document.body.style.overflow = 'hidden'; // prevent background scrolling
};

window.closeModal = () => {
  document.getElementById('project-modal').classList.remove('active');
  document.body.style.overflow = 'auto';
};

// CV Modal Logic
window.openCvModal = (cvId) => {
  const cv = allProjects.find(p => p.id === cvId);
  if (!cv) return;

  document.getElementById('cv-modal-title').textContent = cv.title;
  
  const iframe = document.getElementById('cv-iframe');
  const fallback = document.getElementById('cv-mobile-fallback');
  const dlBtn = document.getElementById('cv-download-btn');
  
  // Basic mobile check
  if (window.innerWidth <= 768) {
    iframe.style.display = 'none';
    fallback.style.display = 'block';
    dlBtn.href = cv.file_url || cv.project_link || '#';
  } else {
    iframe.style.display = 'block';
    fallback.style.display = 'none';
    iframe.src = (cv.file_url || cv.project_link || '') + '#toolbar=0';
  }

  document.getElementById('cv-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCvModal = () => {
  document.getElementById('cv-modal').classList.remove('active');
  document.getElementById('cv-iframe').src = '';
  document.body.style.overflow = 'auto';
};

// Initialize
document.addEventListener('DOMContentLoaded', loadProjects);
