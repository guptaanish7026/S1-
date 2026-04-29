/**
 * VERIFICATION & ROUTE PROTECTION SYSTEM
 * Added Secure Proxy Fetch to Bypass CORS & Vercel Blocks.
 */
window.Verification = (() => {
    const STORAGE_KEY = 'nt_premium_session';
    const DEVICE_ID_KEY = 'nt_device_id';

    // 1. Persistent Device ID
    const getDeviceId = () => {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    };

    // 2. State Check
    const isVerified = () => {
        const sessionStr = localStorage.getItem(STORAGE_KEY);
        if (!sessionStr) return false;
        try {
            const session = JSON.parse(sessionStr);
            if (Date.now() > session.expiryTime) {
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    };

    // 🔥 THE ULTIMATE CORS BYPASS SYSTEM
    const secureFetch = async (url) => {
        const encodedUrl = encodeURIComponent(url);
        const endpoints =[
            url, // Attempt 1: Direct API Call
            `https://api.allorigins.win/raw?url=${encodedUrl}`, // Attempt 2: Proxy Bypass 1
            `https://corsproxy.io/?${encodedUrl}` // Attempt 3: Proxy Bypass 2
        ];

        for (let i = 0; i < endpoints.length; i++) {
            try {
                const response = await fetch(endpoints[i]);
                const data = await response.json();
                if (data) return data; 
            } catch (err) {
                // Wait 1.5 seconds before trying the next bypass method
                await new Promise(res => setTimeout(res, 1500));
            }
        }
        throw new Error("Failed to fetch");
    };

    // 3. Inject Modal
    const injectModalDOM = () => {
        if (document.getElementById('verification-modal')) return;

        const modalHTML = `
            <div class="modal-overlay" id="verification-modal">
                <div class="modal-content scale-in">
                    <div class="verify-logo-container">
                        <img src="NT/images/NTlogo.png" alt="Logo" onerror="this.style.display='none'">
                    </div>
                    
                    <div class="modal-header" style="margin-bottom: 20px;">
                        <h2>Verification</h2>
                        <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">Enter your premium key to unlock this batch.</p>
                    </div>
                    
                    <div class="device-id-box">
                        <span id="display-device-id" style="font-weight: bold; color: var(--text-primary);"></span>
                        <button class="copy-btn" id="copy-device-id" title="Copy Device ID">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>

                    <div class="input-group">
                        <input type="text" id="access-key-input" placeholder="Enter Access Key" autocomplete="off" style="text-align: center; font-weight: 600; letter-spacing: 1px;">
                        <p id="verify-error" class="hidden" style="color: var(--danger-color); font-size: 0.85rem; text-align: center; margin-top: -5px; font-weight: 600;"></p>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 25px;">
                        <button class="btn primary-btn scale-effect" id="verify-submit-btn" style="flex: 1;">Verify Access</button>
                        <button class="btn scale-effect" style="background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); flex: 1;" onclick="window.open('https://nexttoppers.com', '_blank')">Get Key</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('display-device-id').textContent = getDeviceId();
        document.getElementById('copy-device-id').addEventListener('click', () => {
            navigator.clipboard.writeText(getDeviceId());
            alert('Device ID Copied to Clipboard!');
        });
    };

    // 4. Floating Timer
    const injectTimerDOM = () => {
        if (!isVerified() || document.getElementById('auth-timer')) return;
        
        const timerHTML = `
            <div class="floating-timer scale-in" id="auth-timer">
                <span id="timer-text">--:--:--</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', timerHTML);
        
        const interval = setInterval(() => {
            if (!isVerified()) {
                clearInterval(interval);
                document.getElementById('auth-timer')?.remove();
                alert('Session Expired. Please verify again.');
                window.location.reload();
                return;
            }
            
            const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const remaining = session.expiryTime - Date.now();
            const hours = Math.floor((remaining / (1000 * 60 * 60)));
            const mins = Math.floor((remaining / 1000 / 60) % 60);
            const secs = Math.floor((remaining / 1000) % 60);
            
            const txt = document.getElementById('timer-text');
            if (txt) txt.textContent = `Access Valid: ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }, 1000);
    };

    // 5. Main Verification Flow
    const requireVerification = (onSuccessCallback) => {
        if (isVerified()) {
            injectTimerDOM();
            return onSuccessCallback();
        }

        injectModalDOM();
        const modal = document.getElementById('verification-modal');
        const submitBtn = document.getElementById('verify-submit-btn');
        const inputField = document.getElementById('access-key-input');
        const errorText = document.getElementById('verify-error');

        modal.classList.add('active');

        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', async () => {
            const key = inputField.value.trim();
            if (!key) return;

            newSubmitBtn.textContent = 'Verifying... Please wait ⏳';
            newSubmitBtn.disabled = true;
            errorText.classList.add('hidden');

            try {
                // Fetch with Proxy Bypass System
                const data = await secureFetch(`https://study-one-access.vercel.app/verify?key=${encodeURIComponent(key)}`);

                // 1. Catch Explicit Invalid API responses {"valid": false}
                if (data.valid === false || data.success === false) {
                    throw new Error("Invalid Key. Access Denied.");
                }

                // 2. Validate Success & Device ID
                if (data.success || data.valid) {
                    const localDevice = String(getDeviceId()).trim();
                    const apiDevice = data.deviceId ? String(data.deviceId).trim() : null;

                    if (apiDevice && apiDevice !== localDevice) {
                        throw new Error("Device ID Mismatch. Key tied to another device.");
                    }

                    // Approved
                    const validityHours = data.validity || 24; 
                    const expiry = Date.now() + (validityHours * 60 * 60 * 1000);
                    
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        verified: true,
                        key: data.key || key,
                        expiryTime: expiry
                    }));
                    
                    alert(`Welcome ${data.name || ''}! Access Granted.`);
                    modal.classList.remove('active');
                    injectTimerDOM();
                    onSuccessCallback();
                } else {
                    throw new Error("Invalid API Response Format.");
                }
            } catch (err) {
                if (err.message === "Failed to fetch") {
                    errorText.textContent = "Network Blocked. Please check your internet.";
                } else {
                    errorText.textContent = err.message;
                }
                errorText.classList.remove('hidden');
            } finally {
                newSubmitBtn.textContent = 'Verify Access';
                newSubmitBtn.disabled = false;
            }
        });
    };

    if (isVerified()) {
        window.addEventListener('DOMContentLoaded', injectTimerDOM);
    }

    // EXPORT secureFetch globally so other files can bypass CORS too
    return { getDeviceId, isVerified, requireVerification, secureFetch };
})();
