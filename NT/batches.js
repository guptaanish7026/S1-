/**
 * BATCH DETAILS LOGIC
 * Handles Data Fetching, UI Rendering, Tab Switching, and Subject Accordions.
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial State & DOM Elements
    const urlParams = new URLSearchParams(window.location.search);
    const batchId = urlParams.get('id');

    const DOM = {
        loader: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        errorMsg: document.getElementById('error-message'),
        retryBtn: document.getElementById('retry-btn'),
        appContent: document.getElementById('app-content'),
        
        hero: document.getElementById('hero-section'),
        title: document.getElementById('batch-title'),
        badgeSubjects: document.getElementById('badge-subjects'),
        badgePrice: document.getElementById('badge-price'),
        
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        
        descContainer: document.getElementById('batch-description'),
        subjectsContainer: document.getElementById('subjects-container')
    };

    // SVG Icons
    const ICONS = {
        folder: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        chevron: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
        play: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`
    };

    // 2. Boot Application
    const init = () => {
        // Check Auth deeply again just in case inline script missed
        if (!window.Verification || !window.Verification.isVerified()) {
            window.location.replace('index.html');
            return;
        }

        if (!batchId) {
            showError("Invalid Batch Reference.");
            return;
        }

        applyTheme();
        loadBatchData();
        bindEvents();
    };

    const applyTheme = () => {
        const theme = localStorage.getItem("nt_theme");
        if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    };

    // 3. Fetch Data Logic
    const loadBatchData = async () => {
        showLoader();
        try {
            // Using the secure Proxy Fetch we built in verification.js
            const url = `https://study-one-access.vercel.app/api/batches/${batchId}`;
            const responseData = await window.Verification.secureFetch(url);

            if (responseData && responseData.success && responseData.data) {
                renderUI(responseData.data);
            } else {
                throw new Error("Invalid Data Format Received.");
            }
        } catch (err) {
            console.error(err);
            showError(err.message === "Failed to fetch" ? "Network block detected. Cannot connect to server." : "Failed to load batch content.");
        }
    };

    // 4. Render UI
    const renderUI = (data) => {
        // Handle variations in API structure safely
        const details = data.details || data; 
        const subjects = data.subjects ||[];

        // A. Hero Section
        DOM.title.textContent = details.title || "Premium Batch";
        DOM.badgePrice.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> <span>₹ ${details.price || 'Free'}</span>`;
        DOM.badgeSubjects.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> <span>${subjects.length} Subjects</span>`;
        
        if (details.thumbnail) {
            DOM.hero.style.backgroundImage = `url('${details.thumbnail}')`;
        } else {
            // Fallback premium gradient if no image
            DOM.hero.style.background = 'var(--brand-gradient)';
        }

        // B. Overview Tab
        if (details.description) {
            // Remove inline hardcoded styles from raw HTML for cleaner rendering
            let cleanHTML = details.description.replace(/style="[^"]*"/g, "");
            DOM.descContainer.innerHTML = cleanHTML;
        } else {
            DOM.descContainer.innerHTML = `<p class="text-muted">No overview provided for this batch.</p>`;
        }

        // C. Subjects Tab
        DOM.subjectsContainer.innerHTML = "";
        if (subjects.length > 0) {
            const fragment = document.createDocumentFragment();
            subjects.forEach((sub, index) => {
                const card = document.createElement('div');
                card.className = 'subject-card';
                card.dataset.id = sub.subject_id || index;
                
                // Simulate some internal topics for the accordion since API might just return names
                const mockTopicsHTML = `
                    <ul class="topic-list">
                        <li class="topic-item">${ICONS.play} Chapter 1: Introduction</li>
                        <li class="topic-item">${ICONS.play} Chapter 2: Core Concepts</li>
                        <li class="topic-item" style="color: var(--brand-primary); cursor: pointer;">View all modules →</li>
                    </ul>
                `;

                const actualTopicsHTML = sub.topics 
                    ? `<ul class="topic-list">${sub.topics.map(t => `<li class="topic-item">${ICONS.play} ${t.name || t}</li>`).join('')}</ul>` 
                    : mockTopicsHTML;

                card.innerHTML = `
                    <div class="subject-header">
                        <div class="subject-info">
                            <div class="subject-icon">${ICONS.folder}</div>
                            <div>
                                <h4 class="subject-title">${sub.subject_name || 'Subject Name'}</h4>
                                <p class="subject-subtitle">Premium Modules Available</p>
                            </div>
                        </div>
                        <div class="subject-arrow">${ICONS.chevron}</div>
                    </div>
                    <div class="subject-content">
                        ${actualTopicsHTML}
                    </div>
                `;
                fragment.appendChild(card);
            });
            DOM.subjectsContainer.appendChild(fragment);
        } else {
            DOM.subjectsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <p class="text-muted">No study materials have been uploaded yet.</p>
                </div>
            `;
        }

        // Transition out of Loading
        DOM.loader.classList.add('hidden');
        DOM.appContent.classList.remove('hidden');
    };

    // 5. Events Binding
    const bindEvents = () => {
        // Tab Navigation
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update Buttons
                DOM.tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update Panels
                const targetId = e.target.getAttribute('data-target');
                DOM.tabPanels.forEach(panel => {
                    if (panel.id === targetId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });

        // Subject Accordion Delegation
        DOM.subjectsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.subject-card');
            if (!card) return;

            // Toggle logic
            const isExpanded = card.classList.contains('expanded');
            
            // Optional: Close others
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('expanded'));

            if (!isExpanded) {
                card.classList.add('expanded');
            }
        });

        // Retry Button
        DOM.retryBtn.addEventListener('click', loadBatchData);
    };

    // Utility State Managers
    const showLoader = () => {
        DOM.loader.classList.remove('hidden');
        DOM.errorState.classList.add('hidden');
        DOM.appContent.classList.add('hidden');
    };

    const showError = (message) => {
        DOM.loader.classList.add('hidden');
        DOM.appContent.classList.add('hidden');
        DOM.errorMsg.textContent = message;
        DOM.errorState.classList.remove('hidden');
    };

    // Run
    init();
});
