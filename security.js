// Security Protection Layers

// HTML Sanitization - Escape dangerous characters
function sanitizeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Deep sanitization for objects
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeHTML(obj) : obj;
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

// URL validation
function isValidURL(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Image validation
function isValidImage(filename) {
  const validExtensions = ['png', 'jpg', 'jpeg', 'webp'];
  const ext = filename.split('.').pop().toLowerCase();
  return validExtensions.includes(ext);
}

// Rate Limiting System
class RateLimiter {
  constructor() {
    this.actions = new Map();
  }

  // Check if action is allowed
  canPerform(actionKey, cooldownMs) {
    const now = Date.now();
    const lastAction = this.actions.get(actionKey);
    
    if (!lastAction || now - lastAction >= cooldownMs) {
      this.actions.set(actionKey, now);
      return true;
    }
    
    const remainingMs = cooldownMs - (now - lastAction);
    return { allowed: false, remainingMs };
  }

  // Get remaining cooldown time
  getRemainingCooldown(actionKey, cooldownMs) {
    const now = Date.now();
    const lastAction = this.actions.get(actionKey);
    
    if (!lastAction) return 0;
    
    const elapsed = now - lastAction;
    return Math.max(0, cooldownMs - elapsed);
  }

  // Clear specific action cooldown
  clear(actionKey) {
    this.actions.delete(actionKey);
  }

  // Clear all cooldowns
  clearAll() {
    this.actions.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Debounce function for form submissions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Form submission with rate limiting
function safeFormSubmit(formId, submitHandler, cooldownMs = 800) {
  const form = document.getElementById(formId);
  if (!form) return;

  const debouncedHandler = debounce(async (e) => {
    e.preventDefault();
    
    const canSubmit = rateLimiter.canPerform(`form_${formId}`, cooldownMs);
    if (canSubmit !== true) {
      console.warn(`Form submission rate limited. Wait ${Math.ceil(canSubmit.remainingMs / 1000)}s`);
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    // Sanitize all form inputs
    for (let [key, value] of formData.entries()) {
      data[key] = sanitizeHTML(value);
    }

    try {
      await submitHandler(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, 300);

  form.addEventListener('submit', debouncedHandler);
}

// File size validation
function validateFileSize(file, maxSizeMB = 5) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  return { valid: true };
}

// Cloudinary upload with security checks
async function secureCloudinaryUpload(file, uploadPreset = 'dawnmc', cloudName = 'damr6r9op') {
  // Rate limit check (10 second cooldown)
  const canUpload = rateLimiter.canPerform('cloudinary_upload', 10000);
  if (canUpload !== true) {
    throw new Error(`Upload cooldown active. Wait ${Math.ceil(canUpload.remainingMs / 1000)} seconds`);
  }

  // Validate file size
  const sizeCheck = validateFileSize(file, 5);
  if (!sizeCheck.valid) {
    throw new Error(sizeCheck.error);
  }

  // Validate file type
  if (!isValidImage(file.name)) {
    throw new Error('Invalid file format. Only PNG, JPG, and WEBP allowed');
  }

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

// XSS Protection - Strip scripts and dangerous attributes
function stripDangerousContent(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove all script tags
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove all event handlers
  const allElements = div.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  
  // Remove iframes
  const iframes = div.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
  
  return div.innerHTML;
}

// Safe render - Sanitize before injecting into DOM
function safeRender(elementId, content) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (typeof content === 'string') {
    element.textContent = content;
  } else if (content instanceof HTMLElement) {
    element.innerHTML = '';
    element.appendChild(content);
  }
}

// Input validation helpers
const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  price: (price) => /^\$?\d+(\.\d{2})?$/.test(price),
  
  date: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },
  
  notEmpty: (str) => str && str.trim().length > 0,
  
  maxLength: (str, max) => str && str.length <= max
};

// Export to window
if (typeof window !== 'undefined') {
  window.Security = {
    sanitizeHTML,
    sanitizeObject,
    isValidURL,
    isValidImage,
    rateLimiter,
    debounce,
    safeFormSubmit,
    validateFileSize,
    secureCloudinaryUpload,
    stripDangerousContent,
    safeRender,
    validators
  };
}
