// Cloudinary Upload System

const CLOUDINARY_CONFIG = {
  cloudName: 'damr6r9op',
  uploadPreset: 'dawnmc',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
  cooldownMs: 10000 // 10 seconds
};

class CloudinaryUploader {
  constructor(config = CLOUDINARY_CONFIG) {
    this.config = config;
    this.uploadInProgress = false;
    this.previewContainer = null;
  }

  // Create upload widget HTML
  createUploadWidget(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'cloudinary-upload-widget';
    widget.innerHTML = `
      <div class="upload-area glass-morphism" id="${containerId}-dropzone">
        <div class="upload-content">
          <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="upload-text">Click to upload or drag and drop</p>
          <p class="upload-hint">PNG, JPG, WEBP (max 5MB)</p>
          <input type="file" id="${containerId}-input" accept="image/png,image/jpeg,image/webp" hidden>
        </div>
        <div class="upload-progress hidden" id="${containerId}-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="${containerId}-progress-fill"></div>
          </div>
          <p class="progress-text" id="${containerId}-progress-text">Uploading...</p>
        </div>
      </div>
      <div class="upload-preview hidden" id="${containerId}-preview">
        <img src="" alt="Preview" id="${containerId}-preview-img">
        <button class="remove-btn" id="${containerId}-remove">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <p class="upload-error hidden" id="${containerId}-error"></p>
    `;

    container.appendChild(widget);
    this.attachEventListeners(containerId, options);
  }

  // Attach event listeners
  attachEventListeners(containerId, options) {
    const dropzone = document.getElementById(`${containerId}-dropzone`);
    const input = document.getElementById(`${containerId}-input`);
    const removeBtn = document.getElementById(`${containerId}-remove`);

    // Click to upload
    dropzone.addEventListener('click', () => {
      if (!this.uploadInProgress) {
        input.click();
      }
    });

    // File input change
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file, containerId, options);
      }
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleFile(file, containerId, options);
      }
    });

    // Remove button
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearPreview(containerId);
        if (options.onRemove) {
          options.onRemove();
        }
      });
    }
  }

  // Handle file selection
  async handleFile(file, containerId, options) {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.showError(containerId, validation.error);
      return;
    }

    // Show preview
    this.showPreview(file, containerId);

    // Check rate limit
    if (window.Security) {
      const canUpload = window.Security.rateLimiter.canPerform(
        `cloudinary_upload_${containerId}`, 
        this.config.cooldownMs
      );
      
      if (canUpload !== true) {
        this.showError(
          containerId, 
          `Please wait ${Math.ceil(canUpload.remainingMs / 1000)} seconds before uploading again`
        );
        return;
      }
    }

    // Upload file
    try {
      const url = await this.uploadFile(file, containerId);
      if (options.onSuccess) {
        options.onSuccess(url);
      }
    } catch (error) {
      this.showError(containerId, error.message);
      this.clearPreview(containerId);
    }
  }

  // Validate file
  validateFile(file) {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size must be less than ${this.config.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file format
    const extension = file.name.split('.').pop().toLowerCase();
    if (!this.config.allowedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Only ${this.config.allowedFormats.join(', ').toUpperCase()} files are allowed`
      };
    }

    return { valid: true };
  }

  // Show file preview
  showPreview(file, containerId) {
    const preview = document.getElementById(`${containerId}-preview`);
    const previewImg = document.getElementById(`${containerId}-preview-img`);
    const dropzone = document.getElementById(`${containerId}-dropzone`);

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.classList.remove('hidden');
      dropzone.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Clear preview
  clearPreview(containerId) {
    const preview = document.getElementById(`${containerId}-preview`);
    const previewImg = document.getElementById(`${containerId}-preview-img`);
    const dropzone = document.getElementById(`${containerId}-dropzone`);
    const input = document.getElementById(`${containerId}-input`);
    const error = document.getElementById(`${containerId}-error`);

    previewImg.src = '';
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
    error.classList.add('hidden');
    input.value = '';
  }

  // Upload file to Cloudinary
  async uploadFile(file, containerId) {
    this.uploadInProgress = true;
    this.showProgress(containerId, true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('cloud_name', this.config.cloudName);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      const data = await response.json();
      this.showProgress(containerId, false);
      this.uploadInProgress = false;
      
      return data.secure_url;
    } catch (error) {
      this.showProgress(containerId, false);
      this.uploadInProgress = false;
      throw error;
    }
  }

  // Show/hide progress
  showProgress(containerId, show) {
    const progress = document.getElementById(`${containerId}-progress`);
    const content = progress?.previousElementSibling;
    
    if (show) {
      content?.classList.add('hidden');
      progress?.classList.remove('hidden');
    } else {
      content?.classList.remove('hidden');
      progress?.classList.add('hidden');
    }
  }

  // Show error message
  showError(containerId, message) {
    const error = document.getElementById(`${containerId}-error`);
    if (error) {
      error.textContent = message;
      error.classList.remove('hidden');
      
      setTimeout(() => {
        error.classList.add('hidden');
      }, 5000);
    }
  }

  // Set preview from URL
  setPreview(containerId, imageUrl) {
    if (!imageUrl) return;
    
    const preview = document.getElementById(`${containerId}-preview`);
    const previewImg = document.getElementById(`${containerId}-preview-img`);
    const dropzone = document.getElementById(`${containerId}-dropzone`);

    previewImg.src = imageUrl;
    preview.classList.remove('hidden');
    dropzone.classList.add('hidden');
  }
}

// Export to window
if (typeof window !== 'undefined') {
  window.CloudinaryUploader = CloudinaryUploader;
  window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;
}
