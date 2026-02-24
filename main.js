// Main Website Logic
(function() {
  'use strict';

  let playerCount = 0;
  let targetPlayerCount = 0;
  let playerInterval = null;

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase
    if (window.firebaseApp && window.firebaseApp.initFirebase) {
      window.firebaseApp.initFirebase();
    }

    // Load all data
    await Promise.all([
      loadAnnouncements(),
      loadEvents(),
      loadStore(),
      loadStaff(),
      loadRanks()
    ]);

    // Start player count system
    initPlayerSystem();

    // Setup event listeners
    setupEventListeners();
  });

  // Load Announcements
  async function loadAnnouncements() {
    try {
      const ref = window.firebaseApp.dbRefs.announcements();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        const announcements = Object.entries(data)
          .map(([id, announcement]) => ({ id, ...announcement }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderAnnouncements(announcements);
      } else {
        renderPlaceholderAnnouncements();
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      renderPlaceholderAnnouncements();
    }
  }

  // Render Announcements
  function renderAnnouncements(announcements) {
    const container = document.getElementById('announcements-grid');
    if (!container) return;

    container.innerHTML = '';
    
    announcements.forEach((announcement, index) => {
      const card = createAnnouncementCard(announcement, index);
      container.appendChild(card);
    });
  }

  // Create Announcement Card
  function createAnnouncementCard(announcement, index) {
    const card = document.createElement('div');
    card.className = 'announcement-card glass-morphism';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Sanitize content
    const title = window.Security ? window.Security.sanitizeHTML(announcement.title) : announcement.title;
    const description = window.Security ? window.Security.sanitizeHTML(announcement.description) : announcement.description;
    const date = window.Security ? window.Security.sanitizeHTML(announcement.date) : announcement.date;

    card.innerHTML = `
      <div class="announcement-accent"></div>
      <div class="announcement-content">
        <div class="announcement-header">
          <h3 class="announcement-title">${title}</h3>
          ${announcement.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <div class="announcement-date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${date}</span>
        </div>
        <p class="announcement-description">${description}</p>
        ${announcement.image ? `<img src="${announcement.image}" alt="${title}" class="announcement-image" loading="lazy">` : ''}
      </div>
    `;

    return card;
  }

  // Placeholder Announcements
  function renderPlaceholderAnnouncements() {
    const placeholders = [
      {
        id: '1',
        title: 'Welcome to Dawn MC',
        date: 'February 24, 2026',
        description: 'Join our competitive gaming network and experience epic gameplay!',
        isNew: true
      },
      {
        id: '2',
        title: 'Server Launch',
        date: 'February 20, 2026',
        description: 'Our servers are now live! Connect and start your adventure.',
        isNew: true
      }
    ];
    renderAnnouncements(placeholders);
  }

  // Load Events
  async function loadEvents() {
    try {
      const ref = window.firebaseApp.dbRefs.events();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        const events = Object.entries(data)
          .map(([id, event]) => ({ id, ...event }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        renderEventStrip(events[0]); // Show closest event
      } else {
        renderPlaceholderEvent();
      }
    } catch (error) {
      console.error('Error loading events:', error);
      renderPlaceholderEvent();
    }
  }

  // Render Event Strip
  function renderEventStrip(event) {
    const strip = document.getElementById('event-strip');
    if (!strip || !event) return;

    const name = window.Security ? window.Security.sanitizeHTML(event.name) : event.name;
    
    strip.innerHTML = `
      <div class="event-content">
        <div class="event-pulse"></div>
        <span class="event-name">${name}</span>
        <div class="event-countdown" id="event-countdown"></div>
      </div>
    `;

    // Start countdown
    if (event.timestamp) {
      startCountdown(event.timestamp);
    }
  }

  // Countdown Timer
  function startCountdown(timestamp) {
    const countdownEl = document.getElementById('event-countdown');
    if (!countdownEl) return;

    function update() {
      const now = new Date().getTime();
      const target = new Date(timestamp).getTime();
      const distance = target - now;

      if (distance < 0) {
        countdownEl.innerHTML = '<span class="event-live">LIVE NOW!</span>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.innerHTML = `
        <div class="countdown-item">
          <span class="countdown-value">${String(days).padStart(2, '0')}</span>
          <span class="countdown-label">DD</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item">
          <span class="countdown-value">${String(hours).padStart(2, '0')}</span>
          <span class="countdown-label">HH</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item">
          <span class="countdown-value">${String(minutes).padStart(2, '0')}</span>
          <span class="countdown-label">MM</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item">
          <span class="countdown-value">${String(seconds).padStart(2, '0')}</span>
          <span class="countdown-label">SS</span>
        </div>
      `;
    }

    update();
    setInterval(update, 1000);
  }

  // Placeholder Event
  function renderPlaceholderEvent() {
    const event = {
      name: 'SEASON 3 LAUNCH EVENT',
      timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };
    renderEventStrip(event);
  }

  // Load Store Items
  async function loadStore() {
    try {
      const ref = window.firebaseApp.dbRefs.store();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        const items = Object.entries(data).map(([id, item]) => ({ id, ...item }));
        renderStore(items);
      } else {
        renderPlaceholderStore();
      }
    } catch (error) {
      console.error('Error loading store:', error);
      renderPlaceholderStore();
    }
  }

  // Render Store
  function renderStore(items) {
    const container = document.getElementById('store-grid');
    if (!container) return;

    container.innerHTML = '';
    
    items.forEach((item, index) => {
      const card = createStoreCard(item, index);
      container.appendChild(card);
    });
  }

  // Create Store Card
  function createStoreCard(item, index) {
    const card = document.createElement('div');
    card.className = 'store-card glass-morphism';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const name = window.Security ? window.Security.sanitizeHTML(item.name) : item.name;
    const price = window.Security ? window.Security.sanitizeHTML(item.price) : item.price;
    const category = window.Security ? window.Security.sanitizeHTML(item.category) : item.category;
    const description = window.Security ? window.Security.sanitizeHTML(item.description || '') : item.description || '';

    card.innerHTML = `
      ${item.image ? `<div class="store-image-wrapper"><img src="${item.image}" alt="${name}" class="store-image" loading="lazy"></div>` : '<div class="store-icon">🎮</div>'}
      <div class="store-info">
        <h3 class="store-name">${name}</h3>
        ${category ? `<p class="store-category">${category}</p>` : ''}
        ${description ? `<p class="store-description">${description}</p>` : ''}
        <div class="store-footer">
          <span class="store-price">${price}</span>
          <button class="store-btn" onclick="window.open('${item.purchaseLink || '#'}', '_blank')">
            Purchase
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // Placeholder Store
  function renderPlaceholderStore() {
    const placeholders = [
      { id: '1', name: 'VIP Rank', price: '$19.99', category: 'Ranks', description: 'Access exclusive perks!' },
      { id: '2', name: 'Starter Pack', price: '$9.99', category: 'Crates', description: 'Get started with essentials' },
      { id: '3', name: 'Premium Rank', price: '$29.99', category: 'Ranks', description: 'Ultimate benefits' }
    ];
    renderStore(placeholders);
  }

  // Load Staff
  async function loadStaff() {
    try {
      const ref = window.firebaseApp.dbRefs.staff();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        const staff = Object.entries(data).map(([id, member]) => ({ id, ...member }));
        renderStaff(staff);
      } else {
        renderPlaceholderStaff();
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      renderPlaceholderStaff();
    }
  }

  // Render Staff
  function renderStaff(staff) {
    const container = document.getElementById('staff-grid');
    if (!container) return;

    container.innerHTML = '';
    
    staff.forEach((member, index) => {
      const card = createStaffCard(member, index);
      container.appendChild(card);
    });
  }

  // Create Staff Card
  function createStaffCard(member, index) {
    const card = document.createElement('div');
    card.className = 'staff-card glass-morphism';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const name = window.Security ? window.Security.sanitizeHTML(member.name) : member.name;
    const role = window.Security ? window.Security.sanitizeHTML(member.role) : member.role;

    card.innerHTML = `
      <div class="staff-avatar">
        ${member.avatar ? `<img src="${member.avatar}" alt="${name}">` : '<div class="staff-placeholder">👤</div>'}
      </div>
      <div class="staff-info">
        <h3 class="staff-name">${name}</h3>
        <p class="staff-role">${role}</p>
      </div>
    `;

    return card;
  }

  // Placeholder Staff
  function renderPlaceholderStaff() {
    const placeholders = [
      { id: '1', name: 'Steve_MC', role: 'Server Owner' },
      { id: '2', name: 'Alex_Admin', role: 'Head Administrator' },
      { id: '3', name: 'Herobrine', role: 'Community Manager' },
      { id: '4', name: 'Notch', role: 'Developer' }
    ];
    renderStaff(placeholders);
  }

  // Load Ranks
  async function loadRanks() {
    try {
      const ref = window.firebaseApp.dbRefs.ranks();
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        const ranks = Object.entries(data)
          .map(([id, rank]) => ({ id, ...rank }))
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        
        // Store for admin use if needed
        window.ranksData = ranks;
      }
    } catch (error) {
      console.error('Error loading ranks:', error);
    }
  }

  // Player Count System with smooth interpolation
  function initPlayerSystem() {
    const playerEl = document.getElementById('player-count');
    if (!playerEl) return;

    // Fetch player count
    async function fetchPlayers() {
      try {
        // Mock player count (replace with actual API if available)
        targetPlayerCount = Math.floor(Math.random() * 100) + 50;
      } catch (error) {
        console.error('Error fetching players:', error);
        targetPlayerCount = 0;
      }
    }

    // Smooth animation
    function animateCount() {
      if (playerCount < targetPlayerCount) {
        playerCount = Math.min(playerCount + 1, targetPlayerCount);
      } else if (playerCount > targetPlayerCount) {
        playerCount = Math.max(playerCount - 1, targetPlayerCount);
      }
      
      if (playerEl) {
        playerEl.textContent = playerCount;
      }
      
      requestAnimationFrame(animateCount);
    }

    // Initial fetch and start animation
    fetchPlayers();
    animateCount();

    // Poll every 25-30 seconds (rate limit compliant)
    setInterval(fetchPlayers, 27000);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu) {
          mobileMenu.classList.remove('active');
        }
      });
    });

    // Loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
          document.body.style.overflow = 'unset';
        }, 500);
      }, 1500);
    }
  }

  // Lazy loading for images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Refresh data function (can be called from console or admin dashboard)
  window.refreshData = async function() {
    await Promise.all([
      loadAnnouncements(),
      loadEvents(),
      loadStore(),
      loadStaff(),
      loadRanks()
    ]);
    console.log('Data refreshed successfully');
  };

})();
