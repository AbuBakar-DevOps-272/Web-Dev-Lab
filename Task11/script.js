const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let brushColor = document.getElementById('colorPicker').value;
let brushSize = Number(document.getElementById('brushSize').value);
let brushType = document.getElementById('brushType').value;
let brushOpacity = Number(document.getElementById('brushOpacity')?.value ?? 1);
let isEraser = false;

const previewBubble = document.getElementById('previewBubble');
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

// Theme helper functions
function setTheme(isDark) {
  if (isDark) {
    root.classList.add('dark');
    themeToggle.checked = true;
    themeToggle.setAttribute('aria-checked', 'true');
  } else {
    root.classList.remove('dark');
    themeToggle.checked = false;
    themeToggle.setAttribute('aria-checked', 'false');
  }
  // update preview color for harmony with theme
  updatePreview();
  // update logo color (via css variables already set by .dark)
}

// prefer saved or system preference on load
function initTheme() {
  const saved = localStorage.getItem('artistry-theme');
  if (saved === 'dark') setTheme(true);
  else if (saved === 'light') setTheme(false);
  else {
    // detect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark);
  }
}

// toggle handler
themeToggle.addEventListener('change', (e) => {
  const isDark = e.target.checked;
  setTheme(isDark);
  // Ensure brush contrasts with the newly selected canvas color
  ensureContrastBrush();
  localStorage.setItem('artistry-theme', isDark ? 'dark' : 'light');
});

// Ensure lines are smooth by default
ctx.lineJoin = 'round';

// Ensure we have the preview dot element
const previewDot = document.querySelector('#previewBubble .preview-dot');

// set/update preview UI
function updatePreview() {
  // keep preview container size unchanged, change inner dot
  const dotSize = Math.max(8, Math.min(40, brushSize)); // clamp to avoid huge dots
  if (previewDot) {
    previewDot.style.width = dotSize + 'px';
    previewDot.style.height = dotSize + 'px';
    previewDot.style.borderRadius = brushType === 'round' ? '50%' : '8px';
    // set color: show erased indicator in theme-appropriate style
    if (isEraser) {
      // for dark theme show a soft light dot to represent eraser, else white
      if (root.classList.contains('dark')) {
        previewDot.style.background = 'rgba(255,255,255,0.06)';
        previewDot.style.boxShadow = '0 4px 10px rgba(255,255,255,0.02) inset';
      } else {
        previewDot.style.background = '#fff';
        previewDot.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06) inset';
      }
    } else {
      previewDot.style.background = brushColor;
      previewDot.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
    }
    previewDot.style.opacity = brushOpacity;
  }
}

// Pointer events for touch and mouse
// Don't add duplicate events: use pointer events when supported, otherwise fall back
if (window.PointerEvent) {
  canvas.addEventListener('pointerdown', (e) => { preventDefaultIfTouch(e); startDraw(e); }, {passive:false});
  canvas.addEventListener('pointerup', (e) => { stopDraw(e); }, {passive:false});
  canvas.addEventListener('pointermove', (e) => { draw(e); }, {passive:false});
  canvas.addEventListener('pointerleave', (e) => { stopDraw(e); }, {passive:false});
} else {
  // Mouse fallback
  canvas.addEventListener('mousedown', (e) => { startDraw(e); });
  canvas.addEventListener('mouseup', (e) => { stopDraw(e); });
  canvas.addEventListener('mousemove', (e) => { draw(e); });
  canvas.addEventListener('mouseleave', (e) => { stopDraw(e); });

  // Touch fallback – Passive false so we can prevent scroll
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, {passive: false});
  canvas.addEventListener('touchend', (e) => { stopDraw(e); }, {passive: false});
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, {passive: false});
}

// DPI-aware canvas sizing (preserve drawings on resize)
function resizeCanvasForDPR() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.round(rect.width) || 900;
  const cssH = Math.round(rect.height) || 600;

  // Save current drawing as data URL
  const prevData = canvas.toDataURL();

  // Set pixel size according to DPR
  const newPixelW = Math.round(cssW * dpr);
  const newPixelH = Math.round(cssH * dpr);
  canvas.width = newPixelW;
  canvas.height = newPixelH;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  // Draw previous image back onto the pixel canvas then set CSS transform for drawing
  const img = new Image();
  img.onload = () => {
    // draw to full pixel canvas (no scaling transform) to restore exact pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // set transform so subsequent drawing coordinates are in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineJoin = 'round';
  };
  img.src = prevData;
}

// utility to get pointer coords in CSS pixels
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  return {
    x: (clientX - rect.left),
    y: (clientY - rect.top),
  };
}

// use correct mapping for brushType -> lineCap
function getLineCap() {
  return brushType === 'round' ? 'round' : 'butt'; // 'square' option maps to 'butt'
}

// startDraw uses proper properties and small dot for immediate click
function startDraw(e) {
  const pos = getPointerPos(e);
  drawing = true;
  // pointer capture for pointer events only
  if (e.pointerId && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);

  // ensure stroke settings are set immediately
  ctx.lineWidth = brushSize;
  ctx.lineCap = getLineCap();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = brushColor;
  ctx.globalAlpha = brushOpacity;
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  // a tiny line to place the dot if the user just taps/clicks
  ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
  ctx.stroke();
}

function stopDraw(e) {
  drawing = false;
  ctx.beginPath();
  // release pointer capture for pointer events
  if (e && e.pointerId && canvas.releasePointerCapture) {
    canvas.releasePointerCapture(e.pointerId);
  }
}

// draw uses pos values and ensures correct transform/linecap
function draw(e) {
  if (!drawing) return;

  // ensure stroke properties (in case changed mid-draw)
  ctx.lineWidth = brushSize;
  ctx.lineCap = getLineCap();
  ctx.strokeStyle = brushColor;
  ctx.globalAlpha = brushOpacity;
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

  const pos = getPointerPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

// clear canvas correctly accounting for transform
function clearCanvas() {
  // grab dpr to restore transform after clearing
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);  // identity transform in pixel space
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // return to CSS-space scaling
}

// Event binding improvements: prevent default for pointer/touch to avoid scroll interfering
function preventDefaultIfTouch(e) {
  // let pointer events proceed but prevent page scrolling if touch event
  if (e.cancelable) e.preventDefault();
}

// when brush size changes, update preview dot size (not bubble)
document.getElementById('brushSize').addEventListener('input', (e) => {
  brushSize = Number(e.target.value);
  updatePreview(); // only update inner dot size
});

// Update handlers that change color/opacity/eraser to update preview-dot instead of container
document.getElementById('colorPicker').addEventListener('change', (e) => {
  brushColor = e.target.value;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  updatePreview();
});

document.getElementById('brushType').addEventListener('change', (e) => {
  brushType = e.target.value;
  updatePreview();
});

const opacityInput = document.getElementById('brushOpacity');
opacityInput.addEventListener('input', (e) => {
  brushOpacity = Number(e.target.value);
  updatePreview();
});

document.getElementById('eraserToggle').addEventListener('change', (e) => {
  isEraser = e.target.checked;
  updatePreview();
});

// debounce for window resize
let resizeTimeout;
function scheduleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => resizeCanvasForDPR(), 150);
}
window.addEventListener('resize', scheduleResize);

// helper to normalize hex color string (accepts #rgb or #rrggbb)
function normalizeHex(hex) {
  if (!hex) return '';
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    const r = hex[1], g = hex[2], b = hex[3];
    return '#' + r + r + g + g + b + b;
  }
  return hex;
}

// Ensure brush color contrasts with canvas based on the current theme
function ensureContrastBrush() {
  const cp = document.getElementById('colorPicker');
  const current = normalizeHex(cp?.value || brushColor || '#000000');
  // On light mode (no .dark) we want canvas black -> brush white by default
  // On dark mode (has .dark) we want canvas white -> brush black by default
  const isDarkTheme = root.classList.contains('dark');

  const defaultLightBrush = '#ffffff'; // brush used on black canvas (light UI)
  const defaultDarkBrush = '#000000';  // brush used on white canvas (dark UI)

  // If the user hasn't chosen an explicit color and is still using a default black/white, swap it
  if (current === '#000000' || current === '#ffffff') {
    const newBrush = isDarkTheme ? defaultDarkBrush : defaultLightBrush;
    brushColor = newBrush;
    if (cp) cp.value = newBrush;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    const matchSw = document.querySelector(`.color-swatch[data-color="${newBrush}"]`);
    if (matchSw) matchSw.classList.add('selected');
  }
  // Update preview to reflect possible new brush color and opacity
  updatePreview();
}

// call once on init & ensure theme is initialized first
(function init() {
  // select first palette color
  const firstSw = document.querySelector('.color-swatch');
  if (firstSw) firstSw.classList.add('selected');

  initTheme();
  // set initial canvas size correctly for the current DPR
  resizeCanvasForDPR();

  // ensure brush contrasts with initial canvas color
  ensureContrastBrush();

  updatePreview();
})();
