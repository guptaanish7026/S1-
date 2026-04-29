(function () {
  const API_BASE = '/api'; // Adjust if needed

  // ---------- STATE ----------
  let currentBatch = null;
  let activeSubjectId = null;
  let folderStack = []; // [{ id, title }]
  let currentItems = [];

  // ---------- DOM REFS ----------
  const loader = document.getElementById('loader');
  const app = document.getElementById('app');
  const themeToggle = document.getElementById('theme-toggle');
  const heroThumb = document.getElementById('hero-thumbnail');
  const heroTitle = document.getElementById('hero-title');
  const heroPrice = document.getElementById('hero-price');
  const batchTitleHeader = document.getElementById('batch-title');
  const descContainer = document.getElementById('description-container');
  const subjectList = document.getElementById('subject-list');
  const breadcrumb = document.getElementById('breadcrumb');
  const fileGrid = document.getElementById('file-grid');
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  // ---------- UTILS ----------
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => parent.querySelectorAll(sel);

  // Theme
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return applyTheme(saved);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Fetch helper
  async function fetchAPI(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  // Tabs
  function switchTab(tabId) {
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    panels.forEach(panel => panel.classList.toggle('active', panel.id === `${tabId}-panel`));
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ---------- RENDER HELPERS ----------
  function renderHero(details) {
    heroThumb.src = details.thumbnail || '';
    heroTitle.textContent = details.title || 'Untitled Batch';
    heroPrice.textContent = details.price ? `₹${details.price}` : '';
    batchTitleHeader.textContent = details.title || 'Batch';
  }

  function renderDescription(descriptionHTML) {
    descContainer.innerHTML = descriptionHTML || '<p>No description available.</p>';
    // The CSS will auto-fix image overflow
  }

  function renderSubjects(subjects) {
    subjectList.innerHTML = '';
    if (!subjects || subjects.length === 0) {
      subjectList.innerHTML = '<li class="subject-item">No subjects</li>';
      return;
    }
    subjects.forEach(sub => {
      const li = document.createElement('li');
      li.className = 'subject-item';
      li.textContent = sub.subject_name;
      li.dataset.subjectId = sub.subject_id;
      li.addEventListener('click', () => selectSubject(sub.subject_id, sub.subject_name));
      subjectList.appendChild(li);
    });
  }

  function selectSubject(subjectId, subjectName) {
    // Highlight active subject
    qsa('.subject-item', subjectList).forEach(li => {
      li.classList.toggle('active-subject', li.dataset.subjectId === subjectId);
    });
    activeSubjectId = subjectId;
    // Reset folder stack to root (subject)
    folderStack = [{ id: subjectId, title: subjectName }];
    loadFolderContents(subjectId);
    // Ensure study material panel is visible
    switchTab('study-material');
  }

  // ---------- FOLDER NAVIGATION ----------
  async function loadFolderContents(folderId) {
    try {
      fileGrid.innerHTML = '<div class="folder-card"><span>Loading...</span></div>';
      const data = await fetchAPI(`/folders/${folderId}`);
      const items = data?.folders || data?.files || data || []; // flexible response
      currentItems = items;
      renderFolderItems(items);
    } catch (err) {
      console.error(err);
      fileGrid.innerHTML = '<div class="file-card"><span>Failed to load.</span></div>';
    }
  }

  function renderFolderItems(items) {
    fileGrid.innerHTML = '';
    if (!items.length) {
      fileGrid.innerHTML = '<div class="file-card"><span>No content</span></div>';
      return;
    }
    items.forEach(item => {
      const card = document.createElement('div');
      if (item.type === 'folder') {
        card.className = 'folder-card';
        card.innerHTML = `<div class="folder-icon"></div><div class="item-title">${item.title || item.folder_name || 'Folder'}</div>`;
        card.addEventListener('click', () => navigateToFolder(item.folder_id || item.id, item.title || item.folder_name));
      } else if (item.type === 'file') {
        card.className = 'file-card';
        const icon = item.stream_url ? (item.stream_url.includes('.m3u8') ? '🎬' : '▶️') : '📄';
        card.innerHTML = `<div class="file-icon" style="font-size:2rem">${icon}</div><div class="item-title">${item.title || 'File'}</div>`;
        card.addEventListener('click', () => handleFileClick(item));
      }
      fileGrid.appendChild(card);
    });
    updateBreadcrumb();
  }

  function navigateToFolder(folderId, folderTitle) {
    folderStack.push({ id: folderId, title: folderTitle });
    loadFolderContents(folderId);
  }

  function goBackToFolder(index) {
    // index = position in folderStack to keep
    folderStack = folderStack.slice(0, index + 1);
    const currentFolder = folderStack[folderStack.length - 1];
    loadFolderContents(currentFolder.id);
  }

  function updateBreadcrumb() {
    breadcrumb.innerHTML = '';
    folderStack.forEach((f, i) => {
      const btn = document.createElement('button');
      btn.className = 'breadcrumb-btn';
      btn.textContent = f.title;
      btn.addEventListener('click', () => goBackToFolder(i));
      if (i < folderStack.length - 1) {
        breadcrumb.appendChild(btn);
        breadcrumb.appendChild(document.createTextNode(' / '));
      } else {
        // current folder
        const span = document.createElement('span');
        span.className = 'breadcrumb-current';
        span.textContent = f.title;
        span.style.color = 'var(--text)';
        breadcrumb.appendChild(span);
      }
    });
  }

  // ---------- FILE HANDLING ----------
  function handleFileClick(file) {
    if (file.stream_url) {
      // Video
      openVideoPlayer({
        title: file.title || 'Video',
        stream_url: file.stream_url,
        thumbnail: file.thumbnail || ''
      });
    } else if (file.download_links && Array.isArray(file.download_links) && file.download_links.length) {
      const firstLink = file.download_links[0];
      if (typeof firstLink === 'string' && firstLink.includes('.pdf')) {
        window.open(firstLink, '_blank');
      } else {
        // fallback: open first link
        window.open(firstLink, '_blank');
      }
    } else {
      // No stream, no download – maybe just show info or ignore
      alert('No playable content available.');
    }
  }

  // ---------- INITIAL LOAD ----------
  async function loadBatch() {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batch_id');
    if (!batchId) {
      loader.innerHTML = '<p style="color:var(--text)">Invalid batch ID.</p>';
      return;
    }
    try {
      const result = await fetchAPI(`/batches/${batchId}`);
      const data = result.data;
      currentBatch = data;
      // Render hero
      renderHero(data.details);
      // Render description for overview
      renderDescription(data.details.description);
      // Render subjects in sidebar
      renderSubjects(data.subjects);
      // Hide loader, show app
      loader.style.display = 'none';
      app.style.display = 'block';
    } catch (err) {
      loader.innerHTML = '<p style="color:var(--text)">Failed to load batch. Please try again.</p>';
      console.error(err);
    }
  }

  // ---------- VIDEO PLAYER BRIDGE ----------
  function openVideoPlayer(config) {
    if (window.VideoPlayer && typeof window.VideoPlayer.open === 'function') {
      window.VideoPlayer.open(config);
    } else {
      alert('Video player not available.');
    }
  }

  // Start everything
  initTheme();
  loadBatch();

  // Expose for debugging (optional)
  window.batchSystem = {
    selectSubject,
    loadFolderContents,
    goBackToFolder
  };
})();
