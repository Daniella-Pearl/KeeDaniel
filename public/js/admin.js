// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer') || (() => {
    const div = document.createElement('div');
    div.id = 'toastContainer';
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;
  })();

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.borderLeftColor = colors[type] || colors.success;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.success}" style="color: ${colors[type] || colors.success}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// IMAGE UPLOAD HANDLING
// ============================================
function setupImageUpload(uploadElementId, fileInputId, previewId, inputId) {
  console.log('🔧 Setting up image upload:', { uploadElementId, fileInputId, previewId, inputId });
  
  const uploadArea = document.getElementById(uploadElementId);
  const fileInput = document.getElementById(fileInputId);
  const preview = document.getElementById(previewId);
  const hiddenInput = document.getElementById(inputId);
  
  if (!uploadArea || !fileInput) {
    console.error('❌ Upload elements not found:', { 
      uploadArea: !!uploadArea, 
      fileInput: !!fileInput 
    });
    return;
  }
  
  console.log('✅ Upload elements found');
  
  // Click to upload
  uploadArea.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  };
  
  // Drag and drop support
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#e94560';
    uploadArea.style.background = 'rgba(233, 69, 96, 0.05)';
    uploadArea.style.transform = 'scale(1.02)';
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#e5e7eb';
    uploadArea.style.background = '#f8f9fa';
    uploadArea.style.transform = 'scale(1)';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#e5e7eb';
    uploadArea.style.background = '#f8f9fa';
    uploadArea.style.transform = 'scale(1)';
    
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      console.log('📁 File dropped:', file.name, file.type, file.size);
      handleFileUpload(file, preview, hiddenInput, uploadArea);
    }
  });
  
  // File selection
  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files.length) {
      const file = e.target.files[0];
      console.log('📁 File selected:', file.name, file.type, file.size);
      handleFileUpload(file, preview, hiddenInput, uploadArea);
    }
  };
  
  console.log('✅ Image upload setup complete');
}

async function handleFileUpload(file, preview, hiddenInput, uploadArea) {
  if (!file) {
    console.error('❌ No file provided');
    return;
  }
  
  console.log('📤 Processing file upload:', file.name);
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    showToast('Please upload a valid image file (JPG, PNG, GIF, WEBP, SVG)', 'error');
    console.error('❌ Invalid file type:', file.type);
    return;
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('File size must be less than 10MB', 'error');
    console.error('❌ File too large:', file.size);
    return;
  }
  
  // Show preview immediately
  if (preview) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      preview.style.animation = 'fadeIn 0.5s ease';
    };
    reader.readAsDataURL(file);
  }
  
  // Prepare form data
  const formData = new FormData();
  formData.append('image', file);
  
  // Save original content
  const originalText = uploadArea.innerHTML;
  
  // Show uploading state
  uploadArea.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  uploadArea.style.borderColor = '#e94560';
  uploadArea.style.background = 'rgba(233, 69, 96, 0.05)';
  
  try {
    console.log('📤 Sending upload request...');
    
    const response = await fetch('/api/upload/image', { 
      method: 'POST', 
      body: formData 
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Upload response:', data);
    
    if (data.success) {
      // Set the hidden input value
      if (hiddenInput) {
        hiddenInput.value = data.imageUrl;
        console.log('✅ Hidden input set to:', data.imageUrl);
      }
      
      // Update preview with server URL
      if (preview) {
        preview.src = data.imageUrl;
      }
      
      // Hide upload area
      if (uploadArea) {
        uploadArea.style.display = 'none';
      }
      
      showToast('Image uploaded successfully! 🎉', 'success');
      console.log('✅ Image upload complete');
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    showToast('Failed to upload image. Please try again.', 'error');
    
    // Restore upload area
    if (uploadArea) {
      uploadArea.innerHTML = originalText;
      uploadArea.style.borderColor = '#e5e7eb';
      uploadArea.style.background = '#f8f9fa';
      uploadArea.style.transform = 'scale(1)';
    }
  }
}

// ============================================
// FORM VALIDATION - Create Collection
// ============================================
function validateCollectionForm(event) {
  event.preventDefault();
  
  console.log('🔍 Validating collection form...');
  
  const form = event.target;
  const nameInput = form.querySelector('input[name="name"]');
  const descriptionInput = form.querySelector('textarea[name="description"]');
  
  // Reset previous errors
  clearErrors(form);
  
  let isValid = true;
  
  // Validate Collection Name
  if (!nameInput || !nameInput.value.trim()) {
    if (nameInput) showFieldError(nameInput, 'Collection name is required');
    isValid = false;
  } else if (nameInput.value.trim().length < 2) {
    showFieldError(nameInput, 'Collection name must be at least 2 characters');
    isValid = false;
  } else if (nameInput.value.trim().length > 100) {
    showFieldError(nameInput, 'Collection name cannot exceed 100 characters');
    isValid = false;
  }
  
  // Validate Description (optional)
  if (descriptionInput && descriptionInput.value.trim().length > 500) {
    showFieldError(descriptionInput, 'Description cannot exceed 500 characters');
    isValid = false;
  }
  
  if (!isValid) {
    showToast('Please fix the errors below', 'error');
    console.log('❌ Form validation failed');
    return false;
  }
  
  console.log('✅ Form validation passed, submitting...');
  showToast('Creating collection...', 'info');
  form.submit();
  return true;
}

// ============================================
// FORM VALIDATION - Account Settings
// ============================================
function validateAccountForm(event) {
  event.preventDefault();
  
  console.log('🔍 Validating account form...');
  
  const form = event.target;
  const magazineNameInput = form.querySelector('input[name="magazineName"]');
  
  // Reset previous errors
  clearErrors(form);
  
  let isValid = true;
  
  // Validate Magazine Name
  if (!magazineNameInput || !magazineNameInput.value.trim()) {
    if (magazineNameInput) showFieldError(magazineNameInput, 'Magazine name is required');
    isValid = false;
  } else if (magazineNameInput.value.trim().length < 2) {
    showFieldError(magazineNameInput, 'Magazine name must be at least 2 characters');
    isValid = false;
  } else if (magazineNameInput.value.trim().length > 100) {
    showFieldError(magazineNameInput, 'Magazine name cannot exceed 100 characters');
    isValid = false;
  }
  
  if (!isValid) {
    showToast('Please enter a valid magazine name', 'error');
    return false;
  }
  
  console.log('✅ Account form validation passed, submitting...');
  showToast('Saving changes...', 'info');
  form.submit();
  return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showFieldError(input, message) {
  if (!input) return;
  
  input.classList.add('error');
  
  // Remove existing error message
  const parent = input.parentElement;
  const existingError = parent.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  errorDiv.style.cssText = `
    color: #ef4444;
    font-size: 12px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  `;
  
  parent.appendChild(errorDiv);
  
  // Add shake animation
  input.style.animation = 'shake 0.4s ease';
  setTimeout(() => {
    input.style.animation = '';
  }, 400);
}

function clearErrors(form) {
  if (!form) return;
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('input, textarea').forEach(el => {
    el.style.animation = '';
  });
}

// ============================================
// GENERATE MAGIC LINK
// ============================================
async function generateMagicLink() {
  const userId = document.querySelector('input[name="userId"]')?.value || 
                 window.location.pathname.split('/')[3];
  
  if (!userId) {
    showToast('User ID not found', 'error');
    return;
  }
  
  const btn = document.getElementById('generateMagicLinkBtn');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;
    
    const response = await fetch(`/admin/users/${userId}/magic-link`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to generate magic link');
    
    const data = await response.json();
    
    const box = document.getElementById('magicLinkBox');
    const input = document.getElementById('magicLinkInput');
    
    if (box && input) {
      input.value = data.magicLink;
      box.style.display = 'block';
      box.style.animation = 'fadeIn 0.4s ease';
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(data.magicLink);
        showToast('Magic link copied to clipboard!', 'success');
      } catch {
        input.select();
        document.execCommand('copy');
        showToast('Magic link copied!', 'success');
      }
      
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.background = '';
      }, 3000);
    }
  } catch (error) {
    console.error('Error generating magic link:', error);
    showToast('Failed to generate magic link', 'error');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================
// CONFIRM DELETE
// ============================================
function confirmDelete(message = 'Are you sure you want to delete this?') {
  if (confirm(message)) {
    showToast('Deleting...', 'warning');
    return true;
  }
  return false;
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Admin page loaded');
  
  // Setup collection form validation
  const collectionForm = document.querySelector('form[action*="/collections"]');
  if (collectionForm) {
    console.log('✅ Collection form found, attaching validation');
    collectionForm.addEventListener('submit', validateCollectionForm);
  } else {
    console.log('⚠️ Collection form not found');
  }
  
  // Setup account form validation
  const accountForm = document.querySelector('form[action*="/update"]');
  if (accountForm) {
    console.log('✅ Account form found, attaching validation');
    accountForm.addEventListener('submit', validateAccountForm);
  } else {
    console.log('⚠️ Account form not found');
  }
  
  // Setup thumbnail upload
  console.log('🔧 Setting up thumbnail upload...');
  setupImageUpload('thumbnailUpload', 'thumbnailFile', 'thumbnailPreview', 'thumbnailInput');
  
  // Auto-dismiss alerts
  document.querySelectorAll('.alert, .error-message, .success-message').forEach(el => {
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-20px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 5000);
  });
  
  // Add animation to cards
  document.querySelectorAll('.stat-card, .collection-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animation = `fadeIn 0.5s ease forwards`;
    card.style.animationDelay = `${index * 0.1}s`;
  });
});

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.generateMagicLink = generateMagicLink;
window.confirmDelete = confirmDelete;
window.showToast = showToast;