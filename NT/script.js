document.addEventListener("DOMContentLoaded", () => {
    // State Management
    let user = JSON.parse(localStorage.getItem("nt_user"));
    let favorites = JSON.parse(localStorage.getItem("nt_favorites")) || [];
    let recentlyPlayed = JSON.parse(localStorage.getItem("nt_recentlyPlayed")) || null;
    let batches = [];
    let activeTab = "batches"; // 'batches' | 'favorites'
    let searchQuery = "";

    // DOM Elements
    const elements = {
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
        statusMsg: document.getElementById("status-message")
    };

    // Icons (SVGs)
    const icons = {
        study: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
        favOutline: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        favFilled: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
    };

    // Initialize App
    const init = () => {
        initTheme();
        
        if (!user) {
            elements.modal.classList.add("active");
        } else {
            updateProfileUI();
        }

        fetchBatches();
        setupEventListeners();
    };

    // ==========================================
    // THEME HANDLING
    // ==========================================
    const initTheme = () => {
        const savedTheme = localStorage.getItem("nt_theme");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
        
        if (isDark) {
            document.documentElement.setAttribute("data-theme", "dark");
            elements.themeToggle.checked = true;
        }
    };

    elements.themeToggle.addEventListener("change", (e) => {
        if (e.target.checked) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("nt_theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("nt_theme", "light");
        }
    });

    // ==========================================
    // USER PROFILE HANDLING
    // ==========================================
    elements.profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const name = document.getElementById("user-name").value.trim();
        const age = document.getElementById("user-age").value.trim();
        const fileInput = document.getElementById("user-image");
        
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                saveUser(name, age, event.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            saveUser(name, age, null);
        }
    });

    const saveUser = (name, age, image) => {
        user = { name, age, profileImage: image };
        localStorage.setItem("nt_user", JSON.stringify(user));
        elements.modal.classList.remove("active");
        updateProfileUI();
    };

    const updateProfileUI = () => {
        if (!user) return;

        const initial = user.name.charAt(0).toUpperCase();
        let avatarHTML = user.profileImage 
            ? `<img src="${user.profileImage}" alt="${user.name}" class="avatar">`
            : `<div class="avatar">${initial}</div>`;

        elements.profileBtn.innerHTML = avatarHTML;
        elements.panelAvatar.innerHTML = avatarHTML;
        elements.panelName.textContent = user.name;
        elements.panelAge.textContent = `Age: ${user.age}`;

        if (recentlyPlayed) {
            elements.recentlyPlayedText.textContent = recentlyPlayed.title;
            elements.recentlyPlayedText.style.color = 'var(--primary-color)';
            elements.recentlyPlayedText.style.fontWeight = '600';
        }
    };

    // Panel Toggle & Click Outside
    elements.profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.profilePanel.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!elements.profilePanel.contains(e.target) && e.target !== elements.profileBtn) {
            elements.profilePanel.classList.remove("active");
        }
    });

    elements.clearDataBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // ==========================================
    // API & DATA HANDLING
    // ==========================================
    const fetchBatches = async () => {
        try {
            const response = await fetch("https://study-one-access.vercel.app/api/batches");
            const result = await response.json();
            
            if (result.success && result.data) {
                batches = result.data;
                renderBatches();
            } else {
                throw new Error("Invalid data format");
            }
        } catch (error) {
            console.error("Error fetching batches:", error);
            elements.statusMsg.textContent = "Failed to load batches. Please try again later.";
            elements.statusMsg.classList.remove("hidden");
        }
    };

    // ==========================================
    // RENDERING & FILTERING
    // ==========================================
    const renderBatches = () => {
        let filtered = batches;

        // Apply Tab Filter
        if (activeTab === "favorites") {
            filtered = filtered.filter(b => favorites.includes(b.batch_id));
        }

        // Apply Search Filter
        if (searchQuery) {
            filtered = filtered.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        elements.grid.innerHTML = "";

        if (filtered.length === 0) {
            elements.statusMsg.textContent = activeTab === "favorites" && !searchQuery 
                ? "No favorite batches yet." 
                : "No batches found matching your search.";
            elements.statusMsg.classList.remove("hidden");
            return;
        }

        elements.statusMsg.classList.add("hidden");

        const fragment = document.createDocumentFragment();

        filtered.forEach(batch => {
            const isFav = favorites.includes(batch.batch_id);
            const card = document.createElement("div");
            card.className = "batch-card";
            
            card.innerHTML = `
                <img src="${batch.thumbnail}" alt="${batch.title}" class="batch-thumb" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%25%22 height=%22100%25%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23e2e8f0%22 width=%22800%22 height=%22400%22/%3E%3Ctext fill=%22%2394a3b8%22 font-family=%22sans-serif%22 font-size=%2230%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image Available%3C/text%3E%3C/svg%3E'">
                <div class="batch-content">
                    <div class="batch-header">
                        <h3 class="batch-title">${batch.title}</h3>
                        <span class="batch-price">₹${batch.price}</span>
                    </div>
                    <p class="batch-desc">${batch.description || "No description provided."}</p>
                    <div class="batch-actions">
                        <button class="btn primary-btn study-btn" data-id="${batch.batch_id}">
                            ${icons.study} Study
                        </button>
                        <button class="btn outline-btn fav-btn ${isFav ? 'favorited' : ''}" data-id="${batch.batch_id}">
                            ${isFav ? icons.favFilled + ' Unfavorite' : icons.favOutline + ' Favorite'}
                        </button>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });

        elements.grid.appendChild(fragment);
    };

    // ==========================================
    // EVENTS (Tabs, Search, Clicks)
    // ==========================================
    const setupEventListeners = () => {
        // Tab Switching
        elements.tabBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                elements.tabBtns.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                activeTab = e.target.getAttribute("data-tab");
                renderBatches();
            });
        });

        // Search Input
        elements.searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderBatches();
        });

        // Event Delegation for Grid Buttons (Study / Favorite)
        elements.grid.addEventListener("click", (e) => {
            const favBtn = e.target.closest(".fav-btn");
            const studyBtn = e.target.closest(".study-btn");

            if (favBtn) {
                const id = favBtn.getAttribute("data-id");
                toggleFavorite(id);
            }

            if (studyBtn) {
                const id = studyBtn.getAttribute("data-id");
                handleStudy(id);
            }
        });
    };

    const toggleFavorite = (id) => {
        if (favorites.includes(id)) {
            favorites = favorites.filter(favId => favId !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem("nt_favorites", JSON.stringify(favorites));
        renderBatches(); // Re-render to update UI and Tabs
    };

    const handleStudy = (id) => {
        const batch = batches.find(b => b.batch_id === id);
        if (batch) {
            recentlyPlayed = batch;
            localStorage.setItem("nt_recentlyPlayed", JSON.stringify(recentlyPlayed));
            updateProfileUI();
            
            // Visual feedback
            alert(`Opening "${batch.title}" for study...`);
        }
    };

    // Run Initialization
    init();
});
