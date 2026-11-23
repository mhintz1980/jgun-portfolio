// Zero-copy <video> scrubber on a Blob URL (works with zero HTTP Range support).
// Uploads to WebGL only when requestVideoFrameCallback / seeked delivers a new painted frame,
// coalesces rapid scroll seeks via !video.seeking, and snaps to the final angle on settle.

const activeVideos = new Set();

export function unlockVideos() {
  for (const s of activeVideos) {
    if (!s.hasPainted && !s.closed && s.video.readyState >= 2) {
      s.video.play().then(() => {
        if (!s.closed) s.video.pause();
        s.kickSeek();
      }).catch(() => {});
    }
  }
}

export function createVideoScrubber({ url, tex, n = 360, onPainted, onFallback }) {
  tex.isVideoTexture = true;
  tex.update = () => {};
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';

  const s = {
    url, tex, n, deg: 360 / n, video: v,
    started: false, ready: false, hasPainted: false, failed: false, closed: false,
    wanted: -1, lastSeekIdx: -1, shown: -1, reqDeg: 0, shownDeg: 0, height: 0,
    blobUrl: null,
    kickSeek() {
      if (s.ready && !s.closed && !v.seeking && s.wanted >= 0 && s.wanted !== s.lastSeekIdx) {
        issueSeek(s.wanted);
      }
    },
  };

  function issueSeek(idx) {
    s.lastSeekIdx = idx;
    v.currentTime = (idx + 0.5) / 30;
  }

  function markPainted(mediaTime) {
    if (s.closed) return;
    const idx = ((Math.floor(mediaTime * 30 + 0.001) % s.n) + s.n) % s.n;
    s.shown = idx;
    s.shownDeg = ((idx * s.deg) % 360 + 360) % 360;
    s.tex.needsUpdate = true;
    if (!s.hasPainted) {
      s.hasPainted = true;
      onPainted?.(s);
    }
  }

  let rvfcBound = false;
  function bindRVFC() {
    if (rvfcBound || !v.requestVideoFrameCallback) return;
    rvfcBound = true;
    const onVF = (_now, meta) => {
      if (s.closed) return;
      markPainted(meta.mediaTime);
      v.requestVideoFrameCallback(onVF);
    };
    v.requestVideoFrameCallback(onVF);
  }

  v.addEventListener('seeked', () => {
    if (s.closed) return;
    if (!v.requestVideoFrameCallback || !s.hasPainted) {
      markPainted(v.currentTime);
    }
    if (s.wanted >= 0 && s.wanted !== s.lastSeekIdx) {
      issueSeek(s.wanted);
    }
  });

  v.addEventListener('error', () => {
    if (s.closed || s.failed) return;
    s.failed = true;
    onFallback?.(v.error || new Error('Video error'));
  });

  function onLoadedData() {
    if (s.closed || s.ready) return;
    s.ready = true;
    s.height = v.videoHeight || 0;
    s.tex.image = v;
    bindRVFC();
    issueSeek(s.wanted >= 0 ? s.wanted : 0);
  }

  v.addEventListener('loadeddata', onLoadedData);

  async function start() {
    if (s.started || s.closed) return;
    s.started = true;
    activeVideos.add(s);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (s.closed) return;
      s.blobUrl = URL.createObjectURL(blob);
      v.src = s.blobUrl;
      v.load();
      if (v.readyState >= 2) onLoadedData();
    } catch (e) {
      if (s.closed) return;
      s.failed = true;
      onFallback?.(e);
    }
  }

  function seek(idx) {
    s.wanted = idx;
    s.reqDeg = ((idx * s.deg) % 360 + 360) % 360;
    if (!s.ready || s.failed || s.closed || v.seeking) return;
    if (idx !== s.lastSeekIdx) issueSeek(idx);
  }

  function dispose() {
    s.closed = true;
    activeVideos.delete(s);
    v.removeAttribute('src');
    v.load();
    if (s.blobUrl) { URL.revokeObjectURL(s.blobUrl); s.blobUrl = null; }
  }

  return { state: s, start, seek, dispose };
}
