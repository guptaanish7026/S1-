// Main Dashboard Logic
document.addEventListener("DOMContentLoaded", () => {
    let user = JSON.parse(localStorage.getItem("nt_user"));
    let favorites = JSON.parse(localStorage.getItem("nt_favorites")) ||[];
    let recentlyPlayed = JSON.parse(localStorage.getItem("nt_recentlyPlayed")) || null;
    let batches =[];
    let activeTab = "batches"; 
    let searchQuery = "";

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

    const icons = {
        study: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    };

    const initApp = () => {
        setupTheme();
        if (!user) {
            DOM.modal.classList.add("active");
        } else {
            updateProfileUI();
        }
        fetchBatches();
        bindEvents();
    };

    // Theme (Fixing Dark Mode state wipe)
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
        if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
        else document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("nt_theme", theme);
    });

    // Profile Handling
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
            DOM.recentlyPlayedText.innerHTML = `${recentlyPlayed.title}`;
            DOM.recentlyPlayedText.style.color = 'var(--primary-color)';
            DOM.recentlyPlayedText.style.fontWeight = '600';
        }
    };

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
        if (confirm("Reset application? All data including Verification will be cleared.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // API & Data Render
    const fetchBatches = async () => {
        try {
            const res = await fetch("https://study-one-access.vercel.app/api/batches");
            const data = await res.json();
            if (data.success && data.data) {
                batches = data.data;
                DOM.loadingState.classList.add("hidden");
                renderBatches();
            } else throw new Error();
        } catch (error) {
            DOM.loadingState.classList.add("hidden");
            DOM.statusMsg.textContent = "Failed to load batches.";
            DOM.statusMsg.classList.remove("hidden");
        }
    };

    const renderBatches = () => {
        let filtered = batches;
        if (activeTab === "favorites") filtered = filtered.filter(b => favorites.includes(String(b.batch_id)));
        if (searchQuery) filtered = filtered.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

        DOM.grid.innerHTML = "";
        
        if (filtered.length === 0) {
            DOM.statusMsg.textContent = activeTab === "favorites" && !searchQuery ? "No favorites yet." : "No results found.";
            DOM.statusMsg.classList.remove("hidden");
            return;
        }
        DOM.statusMsg.classList.add("hidden");

        const fragment = document.createDocumentFragment();
        filtered.forEach(batch => {
            const batchId = String(batch.batch_id);
            const isFav = favorites.includes(batchId);
            
            const card = document.createElement("div");
            card.className = "batch-card scale-effect";
            card.innerHTML = `
                <div class="thumb-wrapper">
                    <img src="${batch.thumbnail}" alt="Thumbnail" class="batch-thumb" loading="lazy">
                    <span class="price-badge">₹${batch.price}</span>
                </div>
                <div class="batch-content">
                    <h3 class="batch-title">${batch.title}</h3>
                    <div class="batch-actions">
                        <button class="btn primary-btn study-btn" data-id="${batchId}">
                            ${icons.study} Study
                        </button>
                        <button class="btn fav-btn ${isFav ? 'favorited' : ''}" data-id="${batchId}">
                            ${isFav ? 'Unfavorite ❤️' : 'Favorite ♡'}
                        </button>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        DOM.grid.appendChild(fragment);
    };

    // Events & Logic
    const bindEvents = () => {
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                DOM.tabBtns.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                activeTab = e.target.getAttribute("data-tab");
                renderBatches();
            });
        });

        DOM.searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderBatches();
        });

        DOM.grid.addEventListener("click", (e) => {
            const favBtn = e.target.closest(".fav-btn");
            const studyBtn = e.target.closest(".study-btn");

            if (favBtn) {
                const id = favBtn.getAttribute("data-id");
                if (favorites.includes(id)) {
                    favorites = favorites.filter(favId => favId !== id);
                } else {
                    favorites.push(id);
                }
                localStorage.setItem("nt_favorites", JSON.stringify(favorites));
                renderBatches(); // Syncs UI immediately respecting tab
            }

            if (studyBtn) {
                const id = studyBtn.getAttribute("data-id");
                const batch = batches.find(b => String(b.batch_id) === id);
                if (batch) {
                    recentlyPlayed = batch;
                    localStorage.setItem("nt_recentlyPlayed", JSON.stringify(recentlyPlayed));
                    updateProfileUI();
                }

                // Core Verification Trigger
                window.Verification.requireVerification(() => {
                    window.location.href = `batches.html?id=${id}`;
                });
            }
        });
    };

    initApp();
});
