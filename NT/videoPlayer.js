/**
 * videoPlayer.js
 * Advanced video player (HLS / YouTube) with custom controls,
 * double‑tap seek, speed, quality, fullscreen.
 * Usage: VideoPlayer.open({ title, stream_url, thumbnail })
 */
window.VideoPlayer = (function () {
  const modal = document.getElementById('video-modal');
  const modalTitle = document.getElementById('modal-title');
  const videoContainer = document.getElementById('video-container');
  const closeBtn = document.getElementById('modal-close');
  let hlsInstance = null;
  let currentVideoElement = null;
  let controlsUI = null;

  // ---------- TOUCH / DOUBLE TAP ----------
  let lastTap = 0;
  function handleDoubleTap(e) {
    const rect = videoContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;
    const now = Date.now();
    if (now - lastTap < 300) {
      // double tap detected
      if (!currentVideoElement) return;
      if (x < half) {
        currentVideoElement.currentTime = Math.max(0, currentVideoElement.currentTime - 10);
      } else {
        currentVideoElement.currentTime = Math.min(currentVideoElement.duration, currentVideoElement.currentTime + 10);
      }
    }
    lastTap = now;
  }

  // ---------- BUILD CUSTOM CONTROLS ----------
  function createControls(videoEl) {
    const controls = document.createElement('div');
    controls.className = 'custom-controls';
    controls.innerHTML = `
      <div class="controls-row">
        <button class="play-pause-btn">▶</button>
        <input type="range" class="seek-bar" min="0" max="100" step="0.1" value="0" />
        <span class="time-display">0:00 / 0:00</span>
        <input type="range" class="volume-bar" min="0" max="1" step="0.05" value="1" />
        <button class="fullscreen-btn">⛶</button>
      </div>
      <div class="controls-row second">
        <select class="speed-select">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
        <select class="quality-select" style="display:none;"></select>
      </div>
    `;
    // Style inline for simplicity (could move to CSS)
    applyControlsStyles(controls);
    return controls;
  }

  function applyControlsStyles(controls) {
    controls.style.position = 'absolute';
    controls.style.bottom = '0';
    controls.style.left = '0';
    controls.style.right = '0';
    controls.style.background = 'rgba(0,0,0,0.7)';
    controls.style.backdropFilter = 'blur(4px)';
    controls.style.padding = '8px';
    controls.style.color = '#fff';
    controls.style.fontSize = '14px';
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.gap = '4px';
    // etc. – more styling would be in CSS, but we keep functional version here.
  }

  // ---------- SETUP CONTROLS LOGIC ----------
  function bindControls(videoEl, controlsWrapper) {
    const playPauseBtn = controlsWrapper.querySelector('.play-pause-btn');
    const seekBar = controlsWrapper.querySelector('.seek-bar');
    const timeDisplay = controlsWrapper.querySelector('.time-display');
    const volumeBar = controlsWrapper.querySelector('.volume-bar');
    const fullscreenBtn = controlsWrapper.querySelector('.fullscreen-btn');
    const speedSelect = controlsWrapper.querySelector('.speed-select');
    const qualitySelect = controlsWrapper.querySelector('.quality-select');

    // Play/Pause
    function updatePlayBtn() {
      playPauseBtn.textContent = videoEl.paused ? '▶' : '⏸';
    }
    playPauseBtn.addEventListener('click', () => {
      videoEl.paused ? videoEl.play() : videoEl.pause();
    });
    videoEl.addEventListener('play', updatePlayBtn);
    videoEl.addEventListener('pause', updatePlayBtn);
    videoEl.addEventListener('ended', updatePlayBtn);

    // Seek bar
    videoEl.addEventListener('timeupdate', () => {
      if (!videoEl.duration) return;
      seekBar.value = (videoEl.currentTime / videoEl.duration) * 100;
      const cur = formatTime(videoEl.currentTime);
      const dur = formatTime(videoEl.duration);
      timeDisplay.textContent = `${cur} / ${dur}`;
    });
    seekBar.addEventListener('input', () => {
      const seekTime = (seekBar.value / 100) * videoEl.duration;
      videoEl.currentTime = seekTime;
    });

    // Volume
    volumeBar.addEventListener('input', () => {
      videoEl.volume = volumeBar.value;
    });
    videoEl.volume = 1;

    // Fullscreen
    fullscreenBtn.addEventListener('click', () => {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        videoEl.webkitRequestFullscreen();
      }
    });

    // Speed
    speedSelect.addEventListener('change', () => {
      videoEl.playbackRate = parseFloat(speedSelect.value);
    });

    // Quality (only for HLS)
    if (hlsInstance) {
      // Populate quality levels
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hlsInstance.levels;
        qualitySelect.innerHTML = '<option value="auto">Auto</option>';
        levels.forEach((level, idx) => {
          const label = level.height ? `${level.height}p` : `Level ${idx}`;
          qualitySelect.innerHTML += `<option value="${idx}">${label}</option>`;
        });
        qualitySelect.style.display = 'inline-block';
        // Default auto (currentLevel = -1)
        qualitySelect.addEventListener('change', () => {
          const val = qualitySelect.value;
          if (val === 'auto') {
            hlsInstance.currentLevel = -1;
          } else {
            hlsInstance.currentLevel = parseInt(val, 10);
          }
        });
      });
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // ---------- OPEN PLAYER ----------
  function open(config) {
    const { title, stream_url, thumbnail } = config;

    // Reset previous
    videoContainer.innerHTML = '';
    currentVideoElement = null;
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    modalTitle.textContent = title || 'Video';

    // Detect video type
    if (stream_url && stream_url.includes('.m3u8')) {
      // HLS stream
      const video = document.createElement('video');
      video.className = 'main-video';
      video.controls = false;
      video.style.width = '100%';
      videoContainer.appendChild(video);

      if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(stream_url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS network error');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.recoverMediaError();
                break;
              default:
                hlsInstance.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream_url;
      } else {
        videoContainer.innerHTML = '<p style="color:white">HLS not supported in this browser.</p>';
        modal.classList.add('active');
        return;
      }

      currentVideoElement = video;
      // Custom controls
      const controlsWrapper = createControls(video);
      videoContainer.appendChild(controlsWrapper);
      bindControls(video, controlsWrapper);
      // Double tap
      video.addEventListener('click', handleDoubleTap);
      video.play().catch(console.warn);

    } else if (stream_url) {
      // YouTube video ID or direct mp4?
      // Assume YouTube ID if short alphanumeric (11 chars typical)
      const isYouTube = /^[a-zA-Z0-9_-]{11}$/.test(stream_url);
      if (isYouTube) {
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '400';
        iframe.src = `https://www.youtube.com/embed/${stream_url}?autoplay=1&rel=0`;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = '12px';
        videoContainer.appendChild(iframe);
      } else {
        // fallback: treat as direct video (mp4 etc.)
        const video = document.createElement('video');
        video.src = stream_url;
        video.controls = true;
        video.style.width = '100%';
        videoContainer.appendChild(video);
        video.play();
      }
    } else {
      videoContainer.innerHTML = '<p style="color:white">No video source available.</p>';
    }

    modal.classList.add('active');
  }

  function close() {
    modal.classList.remove('active');
    if (currentVideoElement) {
      currentVideoElement.pause();
    }
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    videoContainer.innerHTML = '';
    currentVideoElement = null;
  }

  // ---------- EVENT LISTENERS ----------
  closeBtn.addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      close();
    }
  });

  return { open, close };
})();
