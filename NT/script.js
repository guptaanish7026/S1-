document.addEventListener("DOMContentLoaded", () => {
    // State Management
    let user = JSON.parse(localStorage.getItem("nt_user"));
    let favorites = JSON.parse(localStorage.getItem("nt_favorites")) ||[];
    let recentlyPlayed = JSON.parse(localStorage.getItem("nt_recentlyPlayed")) || null;
    let batches =[];
    let activeTab = "batches"; 
    let searchQuery = "";

    // DOM Elements
    const DOM = {
        modal: document.getElementById("onboarding-modal"),
        profileForm: document.getElementById("profile-form"),
        profileBtn: document.getElementById("profile-btn"),
        profilePanel: document.getElementById("profile-panel"),
        panelAvatar: document.getElementById("panel-avatar"),
        panelName: document.getElementById("panel-name"),
        panelAge: document.getElementById("panel-age"),
        recentlyPlayedText: document.getElementById("recently-played-text"),
        clearDataBtn: document.getElementById("clear-data-btn"),
        themeToggle: document.getElementById("theme-toggle"),
        searchInput: document.getElementById("search-input"),
        tabBtns: document.querySelectorAll(".tab-btn"),
        grid: document.getElementById("batches-grid"),
        loadingState: document.getElementById("loading-state"),
        statusMsg: document.getElementById("status-message")
    };

    // Icons Setup (Inline SVG for performance)
    const icons = {
        study: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
        play: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`
    };

    // Initialize Application
    const initApp = () => {
        setupTheme();
        
        if (!user) {
            DOM.modal.classList.add("active");
        } else {
            updateProfileUI();
        }

        renderSkeleton();
        fetchBatches();
        bindEvents();
    };

    // ==========================================
    // THEME HANDLING
    // ==========================================
    const setupTheme = () => {
        const savedTheme = localStorage.getItem("nt_theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute("data-theme", "dark");
            DOM.themeToggle.checked = true;
        }
    };

    DOM.themeToggle.addEventListener("change", (e) => {
        const theme = e.target.checked ? "dark" : "light";
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        localStorage.setItem("nt_theme", theme);
    });

    // ==========================================
    // USER PROFILE
    // ==========================================
    DOM.profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("user-name").value.trim();
        const age = document.getElementById("user-age").value.trim();
        const fileInput = document.getElementById("user-image");
        
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => saveUser(name, age, event.target.result);
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            saveUser(name, age, null);
        }
    });

    const saveUser = (name, age, image) => {
        user = { name, age, profileImage: image };
        localStorage.setItem("nt_user", JSON.stringify(user));
        DOM.modal.classList.remove("active");
        updateProfileUI();
    };

    const updateProfileUI = () => {
        if (!user) return;
        const initial = user.name.charAt(0).toUpperCase();
        const avatarHTML = user.profileImage 
            ? `<img src="${user.profileImage}" alt="${user.name}" class="avatar">`
            : `<div class="avatar">${initial}</div>`;

        DOM.profileBtn.innerHTML = avatarHTML;
        DOM.panelAvatar.innerHTML = avatarHTML;
        DOM.panelName.textContent = user.name;
        DOM.panelAge.textContent = `Age: ${user.age}`;

        if (recentlyPlayed) {
            DOM.recentlyPlayedText.innerHTML = `${icons.play} ${recentlyPlayed.title}`;
            DOM.recentlyPlayedText.style.color = 'var(--primary-color)';
            DOM.recentlyPlayedText.style.display = 'flex';
            DOM.recentlyPlayedText.style.alignItems = 'center';
            DOM.recentlyPlayedText.style.gap = '8px';
        }
    };

    // Toggle Profile Panel
    DOM.profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        DOM.profilePanel.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!DOM.profilePanel.contains(e.target) && e.target !== DOM.profileBtn) {
            DOM.profilePanel.classList.remove("active");
        }
    });

    DOM.clearDataBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all local data? This action cannot be undone.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // ==========================================
    // API FETCH & SKELETON LOADER
    // ==========================================
    const renderSkeleton = () => {
        DOM.grid.innerHTML = Array(6).fill(`
            <div class="skeleton-card">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `).join("");
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch("https://study-one-access.vercel.app/api/batches");
            const data = await res.json();
            
            if (data.success && data.data) {
                batches = data.data;
                DOM.loadingState.classList.add("hidden");
                renderBatches();
            } else {
                throw new Error("Invalid format");
            }
        } catch (error) {
            console.error(error);
            DOM.loadingState.classList.add("hidden");
            DOM.grid.innerHTML = "";
            DOM.statusMsg.textContent = "Failed to initialize system. Please reload.";
            DOM.statusMsg.classList.remove("hidden");
        }
    };

    // ==========================================
    // RENDER UI & FILTERING
    // ==========================================
    const renderBatches = () => {
        let filtered = batches;

        if (activeTab === "favorites") {
            filtered = filtered.filter(b => favorites.includes(String(b.batch_id)));
        }

        if (searchQuery) {
            filtered = filtered.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        DOM.grid.innerHTML = "";

        if (filtered.length === 0) {
            DOM.statusMsg.textContent = activeTab === "favorites" && !searchQuery 
                ? "No favorite batches found. Start adding some ❤️" 
                : "No batches found matching your search.";
            DOM.statusMsg.classList.remove("hidden");
            return;
        }

        DOM.statusMsg.classList.add("hidden");

        const fragment = document.createDocumentFragment();

        filtered.forEach(batch => {
            const batchId = String(batch.batch_id);
            const isFav = favorites.includes(batchId);
            
            const card = document.createElement("div");
            card.className = "batch-card scale-effect-card";
            // NOTE: Description is completely removed per requirement
            card.innerHTML = `
                <div class="thumb-wrapper">
                    <img src="${batch.thumbnail}" alt="Thumbnail" class="batch-thumb" loading="lazy">
                    <span class="price-badge">₹${batch.price}</span>
                </div>
                <div class="batch-content">
                    <h3 class="batch-title">${batch.title}</h3>
                    <div class="batch-actions">
                        <button class="btn primary-btn scale-effect study-btn" data-id="${batchId}">
                            ${icons.study} Study
                        </button>
                        <button class="btn fav-btn scale-effect ${isFav ? 'favorited' : ''}" data-id="${batchId}">
                            ${isFav ? 'Unfavorite ❤️' : 'Favorite ♡'}
                        </button>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });

        DOM.grid.appendChild(fragment);
    };

    // ==========================================
    // EVENTS (Tabs, Search, Actions)
    // ==========================================
    const bindEvents = () => {
        // Tabs
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                DOM.tabBtns.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                activeTab = e.target.getAttribute("data-tab");
                renderBatches();
            });
        });

        // Search
        DOM.searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderBatches();
        });

        // Delegate Clicks for Buttons
        DOM.grid.addEventListener("click", (e) => {
            const favBtn = e.target.closest(".fav-btn");
            const studyBtn = e.target.closest(".study-btn");

            if (favBtn) {
                const id = favBtn.getAttribute("data-id");
                toggleFavorite(id, favBtn);
            }

            if (studyBtn) {
                const id = studyBtn.getAttribute("data-id");
                handleStudyClick(id);
            }
        });
    };

    // Completely Fixed Favorite Logic
    const toggleFavorite = (id, buttonElement) => {
        if (favorites.includes(id)) {
            // Remove
            favorites = favorites.filter(favId => favId !== id);
            buttonElement.classList.remove("favorited");
            buttonElement.innerHTML = 'Favorite ♡';
        } else {
            // Add
            favorites.push(id);
            buttonElement.classList.add("favorited");
            buttonElement.innerHTML = 'Unfavorite ❤️';
        }
        
        // Save to storage
        localStorage.setItem("nt_favorites", JSON.stringify(favorites));

        // If user is currently inside the favorites tab, re-render immediately to reflect removal
        if (activeTab === "favorites") {
            renderBatches();
        }
    };

    const handleStudyClick = (id) => {
        const batch = batches.find(b => String(b.batch_id) === id);
        if (batch) {
            recentlyPlayed = batch;
            localStorage.setItem("nt_recentlyPlayed", JSON.stringify(recentlyPlayed));
            updateProfileUI();
        }
    };

    // Boot App
    initApp();
});
