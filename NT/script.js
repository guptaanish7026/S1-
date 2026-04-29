/* =========================================
   CSS VARIABLES & THEME
========================================= */
:root {
    --bg-color: #f0f4f8;
    --bg-alt: #e2e8f0;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.4);
    --surface-color: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --border-color: rgba(15, 23, 42, 0.1);
    --primary-color: #3b82f6;
    --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    --danger-color: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.1);
    --shadow-soft: 0 8px 30px rgba(0, 0, 0, 0.04);
    --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.08);
    --radius-md: 12px;
    --radius-lg: 20px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
    --bg-color: #0b1121;
    --bg-alt: #1e293b;
    --glass-bg: rgba(30, 41, 59, 0.75);
    --glass-border: rgba(255, 255, 255, 0.08);
    --surface-color: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border-color: rgba(255, 255, 255, 0.1);
    --shadow-soft: 0 8px 30px rgba(0, 0, 0, 0.3);
    --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.5);
    --danger-bg: rgba(239, 68, 68, 0.15);
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }

body {
    background-color: var(--bg-color);
    color: var(--text-primary);
    transition: background-color var(--transition), color var(--transition);
    min-height: 100vh;
}

.container { max-width: 1280px; margin: 0 auto; padding: 24px; }

/* Global Glass & Utilities */
.glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-soft);
}

.scale-effect:active { transform: scale(0.95); }
.hidden { display: none !important; }

/* Header & Nav */
.app-header {
    position: sticky; top: 0; z-index: 100;
    padding: 12px 24px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--border-color);
}
.glass-header {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.header-center h1 {
    font-size: 1.25rem; font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-right { display: flex; align-items: center; gap: 16px; }
.header-logo { height: 36px; width: 36px; object-fit: contain; border-radius: 50%; }

/* Profile & Themes */
.profile-trigger { background: none; border: none; cursor: pointer; border-radius: 50%; transition: transform 0.2s; }
.profile-trigger:hover { transform: scale(1.05); }
.avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--primary-gradient); color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1.2rem; object-fit: cover;
}

.theme-switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.theme-switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 30px; }
[data-theme="dark"] .slider { background-color: var(--primary-color); }
.slider:before {
    position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
    background-color: white; transition: .4s; border-radius: 50%;
}
input:checked + .slider:before { transform: translateX(24px); }

/* Profile Panel */
.profile-panel {
    position: absolute; top: 70px; left: 24px; width: 300px; border-radius: var(--radius-lg);
    opacity: 0; visibility: hidden; transform: translateY(-15px); transition: var(--transition);
}
.profile-panel.active { opacity: 1; visibility: visible; transform: translateY(0); }
.panel-header { padding: 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--border-color); }
.panel-body { padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
.panel-footer { padding: 16px 24px; }

/* Tabs & Search */
.search-container { position: relative; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; }
.search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
#search-input {
    width: 100%; padding: 16px 16px 16px 50px; border-radius: 40px; border: 2px solid transparent;
    background: var(--surface-color); color: var(--text-primary); outline: none; transition: var(--transition); box-shadow: var(--shadow-soft);
}
#search-input:focus { border-color: var(--primary-color); }

.tabs-container { display: flex; justify-content: center; gap: 10px; margin-bottom: 40px; }
.tab-btn {
    background: transparent; border: none; font-size: 1.05rem; color: var(--text-secondary);
    padding: 12px 24px; cursor: pointer; font-weight: 600; transition: var(--transition); border-radius: 30px;
}
.tab-btn:hover { color: var(--text-primary); background: var(--border-color); }
.tab-btn.active { color: white; background: var(--text-primary); }

/* Loaders */
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 16px; }
.modern-spinner { width: 48px; height: 48px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Grid & Cards */
.grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px; }
.batch-card {
    background: var(--surface-color); border-radius: var(--radius-lg); border: 1px solid var(--border-color);
    overflow: hidden; box-shadow: var(--shadow-soft); transition: var(--transition); display: flex; flex-direction: column;
}
.batch-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-hover); }
.thumb-wrapper { position: relative; width: 100%; padding-top: 56.25%; background: var(--bg-alt); overflow: hidden; }
.batch-thumb { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; }
.price-badge {
    position: absolute; top: 12px; right: 12px; background: var(--glass-bg); backdrop-filter: blur(8px);
    color: var(--text-primary); padding: 6px 12px; border-radius: 20px; font-weight: 800; border: 1px solid var(--glass-border);
}
.batch-content { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; }
.batch-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 24px; }
.batch-actions { display: flex; gap: 12px; }

/* Buttons & Inputs */
.btn {
    padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.95rem; font-weight: 600;
    cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition);
}
.full-width { width: 100%; }
.primary-btn { background: var(--primary-gradient); color: white; }
.primary-btn:hover { box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }
.fav-btn { background: transparent; border: 2px solid var(--border-color); color: var(--text-primary); }
.fav-btn.favorited { background: var(--danger-bg); border-color: transparent; color: var(--danger-color); }
.danger-btn { background: var(--danger-bg); color: var(--danger-color); }
.danger-btn:hover { background: var(--danger-color); color: white; }

.input-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.input-group label { font-size: 0.9rem; font-weight: 600; }
.input-group input { padding: 14px; border: 2px solid var(--border-color); border-radius: var(--radius-md); background: var(--surface-color); color: var(--text-primary); outline: none; }
.input-group input:focus { border-color: var(--primary-color); }

/* Modals & Animations */
.modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;
    visibility: hidden; opacity: 0; transition: var(--transition);
}
.modal-overlay.active { visibility: visible; opacity: 1; }
.modal-content { padding: 32px; border-radius: var(--radius-lg); width: 90%; max-width: 420px; }
.scale-in { transform: scale(0.95); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-overlay.active .scale-in { transform: scale(1); }

/* VERIFICATION SYSTEM UI */
.device-id-box {
    background: var(--bg-alt); padding: 12px; border-radius: var(--radius-md);
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-family: monospace; font-size: 1rem;
}
.copy-btn { background: none; border: none; color: var(--primary-color); cursor: pointer; display: flex; }
.verification-logo { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: block; object-fit: contain; }

.timer-box {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border);
    padding: 10px 24px; border-radius: 30px; z-index: 9999; box-shadow: var(--shadow-hover);
    font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-primary);
}

.page-fade-in { animation: fadeIn 0.6s ease forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Batch Page Typography */
.batch-page-header { margin-bottom: 30px; }
.subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
.subject-chip { background: var(--bg-alt); padding: 12px; border-radius: var(--radius-md); font-weight: 600; text-align: center; }

@media (max-width: 768px) {
    .header-center h1 { font-size: 1.1rem; }
    .grid-container { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .tabs-container { flex-wrap: wrap; }
    .tab-btn { width: 48%; text-align: center; padding: 10px; }
}
