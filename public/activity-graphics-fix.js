(() => {
  const frame = document.getElementById('storyosFrame');
  if (!frame) return;

  const MAP = [
    ['שעת סיפור והמחשה', '/activity-buttons/story-illustrated.png', 'שעת סיפור בהמחשה'],
    ['כשהציור קם לתחייה', '/activity-buttons/drawing-comes-alive.png', 'כשהציור קם לתחייה'],
    ['תיאטרון בובות', '/activity-buttons/puppet-theater.png', 'תיאטרון בובות אינטימי לגן'],
    ['עולם קטן, קסם גדול', '/activity-buttons/small-world-big-magic.png', 'עולם קטן, קסם גדול'],
    ['שיר נולד בגן', '/activity-buttons/song-is-born.png', 'שיר נולד בגן']
  ];

  const cache = new Map();

  function edgeBlackToTransparent(image) {
    return new Promise((resolve) => {
      const source = document.createElement('canvas');
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;
      const ctx = source.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const im = ctx.getImageData(0, 0, source.width, source.height);
      const d = im.data;
      const w = source.width, h = source.height;
      const seen = new Uint8Array(w * h);
      const qx = new Int32Array(w * h);
      const qy = new Int32Array(w * h);
      let head = 0, tail = 0;

      const isEdgeBlack = (x, y) => {
        const i = (y * w + x) * 4;
        return d[i + 3] > 0 && d[i] < 28 && d[i + 1] < 28 && d[i + 2] < 28;
      };
      const push = (x, y) => {
        const p = y * w + x;
        if (seen[p] || !isEdgeBlack(x, y)) return;
        seen[p] = 1; qx[tail] = x; qy[tail] = y; tail++;
      };

      for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
      for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

      while (head < tail) {
        const x = qx[head], y = qy[head++];
        const i = (y * w + x) * 4;
        d[i + 3] = 0;
        if (x > 0) push(x - 1, y);
        if (x + 1 < w) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y + 1 < h) push(x, y + 1);
      }

      ctx.putImageData(im, 0, 0);

      // Crop transparent outer margins so the artwork can use the card area fully.
      let minX = w, minY = h, maxX = -1, maxY = -1;
      const cleaned = ctx.getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = cleaned[(y * w + x) * 4 + 3];
          if (a > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(image.src);
        return;
      }

      const cw = maxX - minX + 1, ch = maxY - minY + 1;
      const out = document.createElement('canvas');
      const pad = 8;
      out.width = cw + pad * 2;
      out.height = ch + pad * 2;
      out.getContext('2d').drawImage(source, minX, minY, cw, ch, pad, pad, cw, ch);
      resolve(out.toDataURL('image/png'));
    });
  }

  function cleanSource(src) {
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => resolve(await edgeBlackToTransparent(img));
      img.onerror = () => resolve(src);
      img.src = src + '?v=20260817-1632';
    });
    cache.set(src, promise);
    return promise;
  }

  function ensureStyles(doc) {
    if (doc.getElementById('activityGraphicsFixStyles')) return;
    const style = doc.createElement('style');
    style.id = 'activityGraphicsFixStyles';
    style.textContent = `
      .activity-tiles{align-items:stretch!important}
      .activity-tile.activity-graphic-fixed{
        position:relative!important;
        overflow:hidden!important;
        padding:8px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:var(--paper)!important;
      }
      .activity-tile.activity-graphic-fixed > *:not(.activity-fixed-image){display:none!important}
      .activity-tile.activity-graphic-fixed .activity-fixed-image{
        display:block!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center center!important;
        margin:auto!important;
        border:0!important;
        background:transparent!important;
        border-radius:16px!important;
      }
    `;
    doc.head.appendChild(style);
  }

  async function apply() {
    const doc = frame.contentDocument;
    if (!doc) return;
    const container = doc.querySelector('.activity-tiles');
    if (!container) return;
    ensureStyles(doc);

    const ordered = [];
    for (const [program, src, alt] of MAP) {
      const tile = container.querySelector(`.activity-tile[data-program="${program}"]`);
      if (!tile) continue;
      ordered.push(tile);
      tile.classList.add('activity-graphic-fixed');

      let img = tile.querySelector('.activity-fixed-image');
      if (!img) {
        img = doc.createElement('img');
        img.className = 'activity-fixed-image';
        img.alt = alt;
        img.draggable = false;
        tile.appendChild(img);
      }
      const cleaned = await cleanSource(src);
      if (img.src !== cleaned) img.src = cleaned;
    }

    // Explicit order 1→5; in RTL grid, item 1 appears at the right edge.
    ordered.forEach(tile => container.appendChild(tile));
  }

  function schedule() {
    apply();
    setTimeout(apply, 100);
    setTimeout(apply, 400);
    setTimeout(apply, 1000);
  }

  frame.addEventListener('load', () => {
    schedule();
    const doc = frame.contentDocument;
    const container = doc && doc.querySelector('.activity-tiles');
    if (container) {
      new MutationObserver(() => schedule()).observe(container, { childList: true, subtree: true });
    }
  });

  if (frame.contentDocument && frame.contentDocument.readyState === 'complete') schedule();
})();
