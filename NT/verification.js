// Verification System - Protected Route Logic
window.Verification = (() => {
    // State
    const STORAGE_KEY = 'nt_auth_session';
    const DEVICE_ID_KEY = 'nt_device_id';

    // Generate or get Device ID
    const getDeviceId = () => {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    };

    // Check if user is currently verified and within time
    const isVerified = () => {
        const sessionStr = localStorage.getItem(STORAGE_KEY);
        if (!sessionStr) return false;
        
        try {
            const session = JSON.parse(sessionStr);
            if (Date.now() > session.expiry) {
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    };

    // Inject the verification modal dynamically to DOM
    const injectModalDOM = () => {
        if (document.getElementById('verification-modal')) return;

        const modalHTML = `
            <div class="modal-overlay" id="verification-modal">
                <div class="modal-content glass-panel scale-in">
                    <img src="NT/images/NTlogo.png" alt="Logo" class="verification-logo" onerror="this.style.display='none'">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin-bottom: 8px;">Verification Required</h2>
                        <p class="text-muted">Enter your access key to unlock study materials.</p>
                    </div>
                    
                    <div class="device-id-box">
                        <span id="display-device-id"></span>
                        <button class="copy-btn" id="copy-device-id" title="Copy Device ID">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>

                    <div class="input-group">
                        <input type="text" id="access-key-input" placeholder="Enter Access Key" autocomplete="off">
                        <p id="verify-error" class="text-muted hidden" style="color: var(--danger-color); font-size: 0.85rem; margin-top: -5px;"></p>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="btn primary-btn full-width" id="verify-submit-btn">Verify Access</button>
                        <button class="btn full-width" style="background: var(--bg-alt);" onclick="window.open('https://nexttoppers.com', '_blank')">Get Key</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Bind events
        document.getElementById('display-device-id').textContent = getDeviceId();
        document.getElementById('copy-device-id').addEventListener('click', () => {
            navigator.clipboard.writeText(getDeviceId());
            alert('Device ID Copied!');
        });
    };

    // Handle Live Timer UI
    const injectTimerDOM = () => {
        if (!isVerified() || document.getElementById('auth-timer')) return;
        
        const timerHTML = `
            <div class="timer-box" id="auth-timer">
                <span id="timer-text">--:--:--</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', timerHTML);
        startTimerLoop();
    };

    const startTimerLoop = () => {
        const interval = setInterval(() => {
            if (!isVerified()) {
                clearInterval(interval);
                document.getElementById('auth-timer')?.remove();
                alert('Session expired. Please verify again.');
                window.location.reload();
                return;
            }
            
            const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const remaining = session.expiry - Date.now();
            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((remaining / 1000 / 60) % 60);
            const secs = Math.floor((remaining / 1000) % 60);
            
            const textElement = document.getElementById('timer-text');
            if (textElement) {
                textElement.textContent = `Access: ${hours}h ${mins}m ${secs}s`;
            }
        }, 1000);
    };

    // Primary Gateway Function
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

        // Remove old listeners to prevent duplication
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

        newSubmitBtn.addEventListener('click', async () => {
            const key = inputField.value.trim();
            if (!key) return;

            newSubmitBtn.textContent = 'Verifying...';
            newSubmitBtn.disabled = true;
            errorText.classList.add('hidden');

            try {
                const res = await fetch(`https://study-one-access.vercel.app/verify?key=${key}`);
                const data = await res.json();

                if (data.success && data.deviceId === getDeviceId()) {
                    // Valid!
                    const expiry = Date.now() + (data.validity * 60 * 60 * 1000);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        key: data.key,
                        name: data.name,
                        expiry: expiry
                    }));
                    
                    alert(`Welcome, ${data.name}!`);
                    modal.classList.remove('active');
                    injectTimerDOM();
                    onSuccessCallback();
                } else if (data.success && data.deviceId !== getDeviceId()) {
                    throw new Error("Device ID mismatch. This key belongs to another device.");
                } else {
                    throw new Error("Invalid Key.");
                }
            } catch (err) {
                errorText.textContent = err.message || "Verification Failed";
                errorText.classList.remove('hidden');
            } finally {
                newSubmitBtn.textContent = 'Verify Access';
                newSubmitBtn.disabled = false;
            }
        });
    };

    // Initialization check for Timer on page load
    if (isVerified()) {
        window.addEventListener('DOMContentLoaded', injectTimerDOM);
    }

    return {
        getDeviceId,
        isVerified,
        requireVerification
    };
})();
