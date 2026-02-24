// Admin Dashboard Logic
(function() {
  'use strict';

  let currentUser = null;
  let cloudinaryUploader = null;

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    if (window.firebaseApp && window.firebaseApp.initFirebase) {
      window.firebaseApp.initFirebase();
    }

    // Check authentication
    checkAuth();

    // Setup event listeners
    setupEventListeners();
  });

  // Check Authentication
  function checkAuth() {
    const { auth } = window.firebaseApp;
    
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      
      if (user) {
        showDashboard();
        loadAllData();
      } else {
        showLogin();
      }
    });
  }

  // Show Login Form
  function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
  }

  // Show Dashboard
  function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Show user info
    if (currentUser) {
      document.getElementById('user-email').textContent = currentUser.email;
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        switchTab(tab);
      });
    });

    // Form submissions
    setupFormHandlers();

    // Initialize Cloudinary uploader
    if (window.CloudinaryUploader) {
      cloudinaryUploader = new window.CloudinaryUploader();
    }
  }

  // Handle Login
  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      await window.firebaseApp.auth.signInWithEmailAndPassword(email, password);
      errorEl.classList.add('hidden');
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
    }
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await window.firebaseApp.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Switch Tab
  function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
    
    const targetPanel = document.getElementById(`${tabName}-panel`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }
  }

  // Load All Data
  async function loadAllData() {
    await Promise.all([
      loadAnnouncements(),
      loadEvents(),
      loadStoreItems(),
      loadStaff(),
      loadRanks()
    ]);
  }

  // ==================== ANNOUNCEMENTS ====================

  async function loadAnnouncements() {
    try {
      const ref = window.firebaseApp.dbRefs.announcements();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      const container = document.getElementById('announcements-list');
      container.innerHTML = '';

      if (data) {
        Object.entries(data).forEach(([id, announcement]) => {
          container.appendChild(createAnnouncementRow(id, announcement));
        });
      } else {
        container.innerHTML = '<p class="empty-state">No announcements yet</p>';
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  }

  function createAnnouncementRow(id, announcement) {
    const row = document.createElement('div');
    row.className = 'data-row glass-morphism';
    row.innerHTML = `
      <div class="data-row-content">
        <div>
          <h4>${window.Security.sanitizeHTML(announcement.title)}</h4>
          <p class="data-meta">${announcement.date} ${announcement.isNew ? '<span class="new-badge">NEW</span>' : ''}</p>
        </div>
        <div class="data-actions">
          <button class="btn-edit" onclick="editAnnouncement('${id}')">Edit</button>
          <button class="btn-delete" onclick="deleteAnnouncement('${id}')">Delete</button>
        </div>
      </div>
    `;
    return row;
  }

  window.editAnnouncement = function(id) {
    window.firebaseApp.dbRefs.announcements().child(id).once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      document.getElementById('announcement-id').value = id;
      document.getElementById('announcement-title').value = data.title;
      document.getElementById('announcement-description').value = data.description;
      document.getElementById('announcement-date').value = data.date;
      document.getElementById('announcement-new').checked = data.isNew;
      document.getElementById('announcement-image-url').value = data.image || '';

      if (data.image) {
        cloudinaryUploader.setPreview('announcement-image-upload', data.image);
      }

      document.getElementById('announcement-form-title').textContent = 'Edit Announcement';
    });
  };

  window.deleteAnnouncement = async function(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await window.firebaseApp.dbRefs.announcements().child(id).remove();
      await loadAnnouncements();
      showNotification('Announcement deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting announcement', 'error');
    }
  };

  // ==================== EVENTS ====================

  async function loadEvents() {
    try {
      const ref = window.firebaseApp.dbRefs.events();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      const container = document.getElementById('events-list');
      container.innerHTML = '';

      if (data) {
        Object.entries(data).forEach(([id, event]) => {
          container.appendChild(createEventRow(id, event));
        });
      } else {
        container.innerHTML = '<p class="empty-state">No events yet</p>';
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  function createEventRow(id, event) {
    const row = document.createElement('div');
    row.className = 'data-row glass-morphism';
    row.innerHTML = `
      <div class="data-row-content">
        <div>
          <h4>${window.Security.sanitizeHTML(event.name)}</h4>
          <p class="data-meta">${new Date(event.timestamp).toLocaleString()}</p>
        </div>
        <div class="data-actions">
          <button class="btn-edit" onclick="editEvent('${id}')">Edit</button>
          <button class="btn-delete" onclick="deleteEvent('${id}')">Delete</button>
        </div>
      </div>
    `;
    return row;
  }

  window.editEvent = function(id) {
    window.firebaseApp.dbRefs.events().child(id).once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      document.getElementById('event-id').value = id;
      document.getElementById('event-name').value = data.name;
      document.getElementById('event-description').value = data.description || '';
      document.getElementById('event-timestamp').value = new Date(data.timestamp).toISOString().slice(0, 16);
      document.getElementById('event-status').value = data.status || 'upcoming';

      document.getElementById('event-form-title').textContent = 'Edit Event';
    });
  };

  window.deleteEvent = async function(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await window.firebaseApp.dbRefs.events().child(id).remove();
      await loadEvents();
      showNotification('Event deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting event', 'error');
    }
  };

  // ==================== STORE ====================

  async function loadStoreItems() {
    try {
      const ref = window.firebaseApp.dbRefs.store();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      const container = document.getElementById('store-list');
      container.innerHTML = '';

      if (data) {
        Object.entries(data).forEach(([id, item]) => {
          container.appendChild(createStoreRow(id, item));
        });
      } else {
        container.innerHTML = '<p class="empty-state">No store items yet</p>';
      }
    } catch (error) {
      console.error('Error loading store items:', error);
    }
  }

  function createStoreRow(id, item) {
    const row = document.createElement('div');
    row.className = 'data-row glass-morphism';
    row.innerHTML = `
      <div class="data-row-content">
        <div>
          <h4>${window.Security.sanitizeHTML(item.name)}</h4>
          <p class="data-meta">${item.category} - ${item.price}</p>
        </div>
        <div class="data-actions">
          <button class="btn-edit" onclick="editStoreItem('${id}')">Edit</button>
          <button class="btn-delete" onclick="deleteStoreItem('${id}')">Delete</button>
        </div>
      </div>
    `;
    return row;
  }

  window.editStoreItem = function(id) {
    window.firebaseApp.dbRefs.store().child(id).once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      document.getElementById('store-id').value = id;
      document.getElementById('store-name').value = data.name;
      document.getElementById('store-price').value = data.price;
      document.getElementById('store-description').value = data.description || '';
      document.getElementById('store-category').value = data.category || '';
      document.getElementById('store-purchase-link').value = data.purchaseLink || '';
      document.getElementById('store-image-url').value = data.image || '';

      if (data.image) {
        cloudinaryUploader.setPreview('store-image-upload', data.image);
      }

      document.getElementById('store-form-title').textContent = 'Edit Store Item';
    });
  };

  window.deleteStoreItem = async function(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await window.firebaseApp.dbRefs.store().child(id).remove();
      await loadStoreItems();
      showNotification('Store item deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting store item', 'error');
    }
  };

  // ==================== STAFF ====================

  async function loadStaff() {
    try {
      const ref = window.firebaseApp.dbRefs.staff();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      const container = document.getElementById('staff-list');
      container.innerHTML = '';

      if (data) {
        Object.entries(data).forEach(([id, member]) => {
          container.appendChild(createStaffRow(id, member));
        });
      } else {
        container.innerHTML = '<p class="empty-state">No staff members yet</p>';
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }

  function createStaffRow(id, member) {
    const row = document.createElement('div');
    row.className = 'data-row glass-morphism';
    row.innerHTML = `
      <div class="data-row-content">
        <div>
          <h4>${window.Security.sanitizeHTML(member.name)}</h4>
          <p class="data-meta">${member.role}</p>
        </div>
        <div class="data-actions">
          <button class="btn-edit" onclick="editStaff('${id}')">Edit</button>
          <button class="btn-delete" onclick="deleteStaff('${id}')">Delete</button>
        </div>
      </div>
    `;
    return row;
  }

  window.editStaff = function(id) {
    window.firebaseApp.dbRefs.staff().child(id).once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      document.getElementById('staff-id').value = id;
      document.getElementById('staff-name').value = data.name;
      document.getElementById('staff-role').value = data.role;
      document.getElementById('staff-avatar-url').value = data.avatar || '';

      if (data.avatar) {
        cloudinaryUploader.setPreview('staff-avatar-upload', data.avatar);
      }

      document.getElementById('staff-form-title').textContent = 'Edit Staff Member';
    });
  };

  window.deleteStaff = async function(id) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await window.firebaseApp.dbRefs.staff().child(id).remove();
      await loadStaff();
      showNotification('Staff member deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting staff member', 'error');
    }
  };

  // ==================== RANKS ====================

  async function loadRanks() {
    try {
      const ref = window.firebaseApp.dbRefs.ranks();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      const container = document.getElementById('ranks-list');
      container.innerHTML = '';

      if (data) {
        Object.entries(data).forEach(([id, rank]) => {
          container.appendChild(createRankRow(id, rank));
        });
      } else {
        container.innerHTML = '<p class="empty-state">No ranks yet</p>';
      }
    } catch (error) {
      console.error('Error loading ranks:', error);
    }
  }

  function createRankRow(id, rank) {
    const row = document.createElement('div');
    row.className = 'data-row glass-morphism';
    row.innerHTML = `
      <div class="data-row-content">
        <div>
          <h4>${window.Security.sanitizeHTML(rank.rankName)}</h4>
          <p class="data-meta">${rank.price} - Order: ${rank.orderIndex || 0}</p>
        </div>
        <div class="data-actions">
          <button class="btn-edit" onclick="editRank('${id}')">Edit</button>
          <button class="btn-delete" onclick="deleteRank('${id}')">Delete</button>
        </div>
      </div>
    `;
    return row;
  }

  window.editRank = function(id) {
    window.firebaseApp.dbRefs.ranks().child(id).once('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      document.getElementById('rank-id').value = id;
      document.getElementById('rank-name').value = data.rankName;
      document.getElementById('rank-price').value = data.price;
      document.getElementById('rank-permissions').value = data.permissionsDescription || '';
      document.getElementById('rank-order').value = data.orderIndex || 0;
      document.getElementById('rank-image-url').value = data.image || '';

      if (data.image) {
        cloudinaryUploader.setPreview('rank-image-upload', data.image);
      }

      document.getElementById('rank-form-title').textContent = 'Edit Rank';
    });
  };

  window.deleteRank = async function(id) {
    if (!confirm('Are you sure you want to delete this rank?')) return;

    try {
      await window.firebaseApp.dbRefs.ranks().child(id).remove();
      await loadRanks();
      showNotification('Rank deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting rank', 'error');
    }
  };

  // ==================== FORM HANDLERS ====================

  function setupFormHandlers() {
    // Announcement form
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
      announcementForm.addEventListener('submit', handleAnnouncementSubmit);
    }

    // Event form
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
      eventForm.addEventListener('submit', handleEventSubmit);
    }

    // Store form
    const storeForm = document.getElementById('store-form');
    if (storeForm) {
      storeForm.addEventListener('submit', handleStoreSubmit);
    }

    // Staff form
    const staffForm = document.getElementById('staff-form');
    if (staffForm) {
      staffForm.addEventListener('submit', handleStaffSubmit);
    }

    // Rank form
    const rankForm = document.getElementById('rank-form');
    if (rankForm) {
      rankForm.addEventListener('submit', handleRankSubmit);
    }

    // Reset buttons
    document.querySelectorAll('.btn-reset').forEach(btn => {
      btn.addEventListener('click', function() {
        const formId = this.dataset.form;
        resetForm(formId);
      });
    });
  }

  async function handleAnnouncementSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('announcement-id').value;
    const imageUrl = document.getElementById('announcement-image-url').value;
    
    const data = {
      title: document.getElementById('announcement-title').value,
      description: document.getElementById('announcement-description').value,
      date: document.getElementById('announcement-date').value,
      isNew: document.getElementById('announcement-new').checked,
      image: imageUrl
    };

    try {
      const ref = window.firebaseApp.dbRefs.announcements();
      if (id) {
        await ref.child(id).update(data);
        showNotification('Announcement updated successfully', 'success');
      } else {
        await ref.push(data);
        showNotification('Announcement created successfully', 'success');
      }
      
      resetForm('announcement');
      await loadAnnouncements();
    } catch (error) {
      showNotification('Error saving announcement', 'error');
    }
  }

  async function handleEventSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('event-id').value;
    
    const data = {
      name: document.getElementById('event-name').value,
      description: document.getElementById('event-description').value,
      timestamp: new Date(document.getElementById('event-timestamp').value).toISOString(),
      status: document.getElementById('event-status').value,
      countdownAutoGenerated: true
    };

    try {
      const ref = window.firebaseApp.dbRefs.events();
      if (id) {
        await ref.child(id).update(data);
        showNotification('Event updated successfully', 'success');
      } else {
        await ref.push(data);
        showNotification('Event created successfully', 'success');
      }
      
      resetForm('event');
      await loadEvents();
    } catch (error) {
      showNotification('Error saving event', 'error');
    }
  }

  async function handleStoreSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('store-id').value;
    const imageUrl = document.getElementById('store-image-url').value;
    
    const data = {
      name: document.getElementById('store-name').value,
      price: document.getElementById('store-price').value,
      description: document.getElementById('store-description').value,
      category: document.getElementById('store-category').value,
      purchaseLink: document.getElementById('store-purchase-link').value,
      image: imageUrl
    };

    try {
      const ref = window.firebaseApp.dbRefs.store();
      if (id) {
        await ref.child(id).update(data);
        showNotification('Store item updated successfully', 'success');
      } else {
        await ref.push(data);
        showNotification('Store item created successfully', 'success');
      }
      
      resetForm('store');
      await loadStoreItems();
    } catch (error) {
      showNotification('Error saving store item', 'error');
    }
  }

  async function handleStaffSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('staff-id').value;
    const avatarUrl = document.getElementById('staff-avatar-url').value;
    
    const data = {
      name: document.getElementById('staff-name').value,
      role: document.getElementById('staff-role').value,
      avatar: avatarUrl
    };

    try {
      const ref = window.firebaseApp.dbRefs.staff();
      if (id) {
        await ref.child(id).update(data);
        showNotification('Staff member updated successfully', 'success');
      } else {
        await ref.push(data);
        showNotification('Staff member created successfully', 'success');
      }
      
      resetForm('staff');
      await loadStaff();
    } catch (error) {
      showNotification('Error saving staff member', 'error');
    }
  }

  async function handleRankSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('rank-id').value;
    const imageUrl = document.getElementById('rank-image-url').value;
    
    const data = {
      rankName: document.getElementById('rank-name').value,
      price: document.getElementById('rank-price').value,
      permissionsDescription: document.getElementById('rank-permissions').value,
      orderIndex: parseInt(document.getElementById('rank-order').value) || 0,
      image: imageUrl
    };

    try {
      const ref = window.firebaseApp.dbRefs.ranks();
      if (id) {
        await ref.child(id).update(data);
        showNotification('Rank updated successfully', 'success');
      } else {
        await ref.push(data);
        showNotification('Rank created successfully', 'success');
      }
      
      resetForm('rank');
      await loadRanks();
    } catch (error) {
      showNotification('Error saving rank', 'error');
    }
  }

  function resetForm(formName) {
    const form = document.getElementById(`${formName}-form`);
    if (form) {
      form.reset();
    }
    
    const idField = document.getElementById(`${formName}-id`);
    if (idField) {
      idField.value = '';
    }

    const titleField = document.getElementById(`${formName}-form-title`);
    if (titleField) {
      titleField.textContent = titleField.textContent.replace('Edit', 'Add');
    }

    // Clear image previews
    const uploadIds = {
      announcement: 'announcement-image-upload',
      store: 'store-image-upload',
      staff: 'staff-avatar-upload',
      rank: 'rank-image-upload'
    };

    if (uploadIds[formName] && cloudinaryUploader) {
      cloudinaryUploader.clearPreview(uploadIds[formName]);
    }
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Export to window
  window.adminDashboard = {
    loadAllData,
    showNotification
  };

})();
