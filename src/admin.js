import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://twsgsjjdjqcbafuktiow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c2dzampkanFjYmFmdWt0aW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU3MTgsImV4cCI6MjEwMjg5MTcxOH0._OqayETEcAPr8GW8Gn9KZ-SKrCz5wfHcT9ZuaBfV7ew';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

const togglePassword = document.getElementById('toggle-password');
const addProjBtn = document.getElementById('add-proj-btn');
const formMsg = document.getElementById('form-msg');

const categorySelect = document.getElementById('proj-category');
const fgImage = document.getElementById('fg-image');
const fgContentImages = document.getElementById('fg-content-images');
const fgVideo = document.getElementById('fg-video');
const fgDocument = document.getElementById('fg-document');
const fgDesc = document.getElementById('fg-desc');
const fgLink = document.getElementById('fg-link');

if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    if (e.target.value === 'CVs / RESUMEs') {
      if(fgImage) fgImage.style.display = 'none';
      if(fgContentImages) fgContentImages.style.display = 'none';
      if(fgVideo) fgVideo.style.display = 'none';
      if(fgDesc) fgDesc.style.display = 'none';
      if(fgLink) fgLink.style.display = 'none';
      if(fgDocument) fgDocument.style.display = 'block';
    } else {
      if(fgImage) fgImage.style.display = 'block';
      if(fgContentImages) fgContentImages.style.display = 'block';
      if(fgVideo) fgVideo.style.display = 'flex';
      if(fgDesc) fgDesc.style.display = 'block';
      if(fgLink) fgLink.style.display = 'block';
      if(fgDocument) fgDocument.style.display = 'none';
    }
  });
}

// Edit state
let editingId = null;
let editingProject = null;
const projectsContainer = document.getElementById('projects-container');

// Toggle Password visibility
if (togglePassword) {
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'text') {
      this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'; 
    } else {
      this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'; 
    }
  });
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    fetchProjects();
  } else {
    authSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }
});

// Login
loginBtn.addEventListener('click', async () => {
  loginBtn.textContent = 'Logging in...';
  authError.style.display = 'none';
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    authError.textContent = error.message;
    authError.style.display = 'block';
  }
  loginBtn.textContent = 'Log In';
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Fetch Projects and Render Categorized List
async function fetchProjects() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  projectsContainer.innerHTML = '';
  
  if (!projects || projects.length === 0) {
    projectsContainer.innerHTML = '<p>No projects found. Add one from the panel!</p>';
    return;
  }

  // Group projects by category
  const categories = {};
  projects.forEach(proj => {
    if (!categories[proj.category]) categories[proj.category] = [];
    categories[proj.category].push(proj);
  });

  // Render each category
  for (const [category, items] of Object.entries(categories)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';
    
    groupDiv.innerHTML = `<h3 class="category-title">${category}</h3>`;
    
    const listDiv = document.createElement('div');
    listDiv.className = 'projects-list';

    items.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'admin-project-card';
      card.dataset.id = proj.id;
      card.style.cursor = 'grab';
      
      const imgHtml = proj.image_url 
        ? `<img src="${proj.image_url}" class="admin-project-img" alt="Thumbnail">` 
        : `<div class="admin-project-img" style="background:#eee;"></div>`;
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.style.cssText = 'width:auto;padding:8px 16px;margin-right:8px;';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => startEdit(proj);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => deleteProject(proj.id);

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      card.innerHTML = `
        ${imgHtml}
        <div class="admin-project-details">
          <h4>${proj.title}</h4>
          <p>${proj.description || 'No description provided.'}</p>
        </div>
      `;
      card.appendChild(actions);
      listDiv.appendChild(card);
    });

    groupDiv.appendChild(listDiv);
    projectsContainer.appendChild(groupDiv);

    Sortable.create(listDiv, {
      animation: 150,
      onEnd: async function (evt) {
        const itemEls = listDiv.querySelectorAll('.admin-project-card');
        const updates = Array.from(itemEls).map((el, index) => {
          return {
            id: el.dataset.id,
            sort_order: index
          };
        });
        
        for (const update of updates) {
          const { error } = await supabase
            .from('projects')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
          if (error) console.error('Error updating sort_order:', error);
        }
      }
    });
  }
}

// Start Edit Mode
function startEdit(proj) {
  editingId = proj.id;
  editingProject = proj;

  document.getElementById('proj-category').value = proj.category;
  document.getElementById('proj-category').dispatchEvent(new Event('change'));
  document.getElementById('proj-title').value = proj.title || '';
  document.getElementById('proj-desc').value = proj.description || '';
  document.getElementById('proj-link').value = proj.project_link || '';
  document.getElementById('proj-video').checked = proj.is_video || false;

  addProjBtn.textContent = 'Update Project';

  // Show cancel button
  let cancelBtn = document.getElementById('cancel-edit-btn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.className = 'btn';
    cancelBtn.style.cssText = 'background:transparent;margin-top:8px;';
    cancelBtn.textContent = 'Cancel Edit';
    cancelBtn.onclick = cancelEdit;
    addProjBtn.parentNode.insertBefore(cancelBtn, addProjBtn.nextSibling);
  }

  // Scroll to form
  document.querySelector('.upload-panel').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Edit
function cancelEdit() {
  editingId = null;
  editingProject = null;
  addProjBtn.textContent = 'Publish Project';
  document.getElementById('proj-title').value = '';
  document.getElementById('proj-desc').value = '';
  document.getElementById('proj-link').value = '';
  document.getElementById('proj-video').checked = false;
  document.getElementById('proj-image').value = '';
  document.getElementById('proj-content-images').value = '';
  const docInput = document.getElementById('proj-document');
  if (docInput) docInput.value = '';
  document.getElementById('proj-category').dispatchEvent(new Event('change'));
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.remove();
}

// Add / Update Project
addProjBtn.addEventListener('click', async () => {
  const category = document.getElementById('proj-category').value;
  const title = document.getElementById('proj-title').value;
  const desc = document.getElementById('proj-desc').value;
  const link = document.getElementById('proj-link').value;
  const fileInput = document.getElementById('proj-image');
  const contentImagesInput = document.getElementById('proj-content-images');
  const documentInput = document.getElementById('proj-document');
  const isVideo = document.getElementById('proj-video').checked;

  if (!title) {
    showMessage('Project Title is required!', '#ff3b30');
    return;
  }

  if (category === 'CVs / RESUMEs') {
    if (!editingId && !documentInput.files.length) {
      showMessage('Please upload a PDF document!', '#ff3b30');
      return;
    }
  } else {
    if (!editingId && !fileInput.files.length && !isVideo) {
      showMessage('Please upload a thumbnail image!', '#ff3b30');
      return;
    }
  }

  addProjBtn.textContent = editingId ? 'Updating...' : 'Publishing...';
  addProjBtn.disabled = true;

  try {
    let imageUrl = '';
    let contentImageUrls = [];
    let fileUrl = '';
    
    // Upload PDF document
    if (category === 'CVs / RESUMEs' && documentInput && documentInput.files.length > 0) {
      const file = documentInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `doc-${Math.random()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);
        
      fileUrl = publicUrlData.publicUrl;
    }

    // Upload thumbnail image
    if (category !== 'CVs / RESUMEs' && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `thumb-${Math.random()}.${fileExt}`;
      const filePath = `${category.replace(/[^a-zA-Z0-9]/g, '')}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrlData.publicUrl;
    }

    // Upload case study images if provided
    if (category !== 'CVs / RESUMEs' && contentImagesInput.files.length > 0) {
      for (let i = 0; i < contentImagesInput.files.length; i++) {
        const file = contentImagesInput.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `content-${Math.random()}.${fileExt}`;
        const filePath = `${category.replace(/[^a-zA-Z0-9]/g, '')}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(filePath);
          
        contentImageUrls.push(publicUrlData.publicUrl);
      }
    }

    if (editingId) {
      // Build update payload — only include image fields if new ones were uploaded
      const updateData = { category, title, description: desc, project_link: link, is_video: isVideo };
      if (imageUrl) updateData.image_url = imageUrl;
      if (contentImageUrls.length > 0) updateData.content_images = contentImageUrls;
      if (fileUrl) updateData.file_url = fileUrl;

      const { error: dbError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', editingId);

      if (dbError) throw dbError;
      showMessage('Project updated successfully!', '#00c300');
      cancelEdit();
    } else {
      // Insert new project
      const { error: dbError } = await supabase
        .from('projects')
        .insert([{ 
          category, title,
          description: desc, 
          image_url: imageUrl, 
          project_link: link, 
          is_video: isVideo,
          content_images: contentImageUrls,
          file_url: fileUrl
        }]);

      if (dbError) throw dbError;
      showMessage('Project published successfully!', '#00c300');
    }
    
    // Reset form
    document.getElementById('proj-title').value = '';
    document.getElementById('proj-desc').value = '';
    document.getElementById('proj-link').value = '';
    document.getElementById('proj-video').checked = false;
    fileInput.value = '';
    contentImagesInput.value = '';
    if (documentInput) documentInput.value = '';
    
    fetchProjects();

  } catch (error) {
    console.error(error);
    showMessage('Error: ' + error.message, '#ff3b30');
  } finally {
    addProjBtn.textContent = editingId ? 'Update Project' : 'Publish Project';
    addProjBtn.disabled = false;
  }
});

// Delete Project
window.deleteProject = async (id, imageUrl) => {
  if (!confirm('Are you absolutely sure you want to delete this project?')) return;

  try {
    // Delete from DB
    const { error: dbError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    fetchProjects();
  } catch (error) {
    console.error(error);
    alert('Error deleting project!');
  }
};

function showMessage(msg, color) {
  formMsg.textContent = msg;
  formMsg.style.color = color;
  setTimeout(() => formMsg.textContent = '', 3000);
}
