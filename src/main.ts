import './styles/main.css';
import { SoundEngine } from './audio/soundEngine';
import { getEra } from './data/eras';
import type { DifficultyId } from './data/types';
import { BattleCamera } from './game/camera';
import { WORLD_HEIGHT } from './game/constants';
import { GameEngine } from './game/engine';
import { GameRenderer } from './render/renderer';
import { loadRecords, recordMatchResult, saveRecords } from './storage/records';
import { HudController } from './ui/hudController';
import { OverlayController } from './ui/overlayController';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const initialRecords = loadRecords();
const sound = new SoundEngine(initialRecords.muted);
const camera = new BattleCamera();
const renderer = new GameRenderer(canvas);

let resultRecorded = false;
let autoPausedByPortrait = false;
let currentDifficulty: DifficultyId = 'normal';

const engine = new GameEngine();

const hud = new HudController({
  engine,
  camera,
  onUnlockAudio: () => sound.unlock(),
  onToggleMute: () => {
    const muted = sound.toggleMute();
    const rec = loadRecords();
    rec.muted = muted;
    saveRecords(rec);
    return muted;
  },
  onTogglePause: () => {
    if (engine.status === 'playing') {
      engine.setPaused(true);
      overlays.showPause();
    } else if (engine.status === 'paused') {
      engine.setPaused(false);
      overlays.hidePause();
    }
  },
});

hud.setMutedVisual(sound.isMuted());

const overlays = new OverlayController({
  onStart: (difficulty) => {
    sound.unlock();
    startMatch(difficulty);
  },
  onResume: () => {
    sound.unlock();
    engine.setPaused(false);
    overlays.hidePause();
  },
  onRestart: () => {
    sound.unlock();
    startMatch(currentDifficulty);
  },
  onReturnTitle: () => {
    engine.status = 'title';
    hud.setVisible(false);
    overlays.showTitle(loadRecords());
  },
});

engine.setCallbacks({
  onSound: (cue) => sound.play(cue),
  onBanner: (title, sub, accent) => hud.showBanner(title, sub, accent),
});

function startMatch(difficulty: DifficultyId): void {
  currentDifficulty = difficulty;
  resultRecorded = false;
  engine.startNewGame(difficulty);
  camera.reset();
  hud.switchTab('units');
  hud.forceRebuildCards();
  hud.setVisible(true);
  overlays.hideAllGameOverlays();
  const era = getEra(0);
  hud.showBanner(`시대 1: ${era.name}`, '골드 강화와 함께 10시대 성간 문명까지 진화하세요', era.palette.accent);
}

// ============================================================================
// CANVAS TOUCH / MOUSE DRAG CAMERA + DIRECT TURRET TAP-TO-SELL
// ============================================================================
let pointerActive = false;
let pointerId: number | null = null;
let lastPointerX = 0;
let dragDistance = 0;

canvas.addEventListener('pointerdown', (ev) => {
  sound.unlock();
  if (engine.status !== 'playing') return;
  pointerActive = true;
  pointerId = ev.pointerId;
  lastPointerX = ev.clientX;
  dragDistance = 0;
  camera.beginDrag();
  canvas.setPointerCapture(ev.pointerId);
});

canvas.addEventListener('pointermove', (ev) => {
  if (!pointerActive || ev.pointerId !== pointerId) return;
  const dx = ev.clientX - lastPointerX;
  lastPointerX = ev.clientX;
  dragDistance += Math.abs(dx);
  camera.dragByScreenDelta(dx, renderer.getCssSize().height);
});

function finishCanvasPointer(ev: PointerEvent): void {
  if (!pointerActive || ev.pointerId !== pointerId) return;
  pointerActive = false;
  pointerId = null;
  camera.endDrag();

  // If user tapped (didn't drag) while in Sell Turret highlight mode, sell the tapped turret directly
  if (dragDistance < 10 && hud.sellHighlightMode && engine.status === 'playing') {
    const rect = canvas.getBoundingClientRect();
    const scale = rect.height / WORLD_HEIGHT;
    const worldX = (ev.clientX - rect.left) / scale + camera.x;
    const worldY = (ev.clientY - rect.top) / scale;

    for (let i = 0; i < engine.player.turretSlots; i++) {
      if (!engine.player.turrets[i]) continue;
      const pos = engine.getTurretWorldPosition('player', i);
      if (Math.hypot(worldX - pos.x, worldY - pos.y) <= 28) {
        engine.sellTurret('player', i);
        hud.sellHighlightMode = false;
        break;
      }
    }
  }
}

canvas.addEventListener('pointerup', finishCanvasPointer);
canvas.addEventListener('pointercancel', finishCanvasPointer);

// Keyboard support for desktop play & quick verification
const heldKeys = new Set<string>();
window.addEventListener('keydown', (ev) => {
  heldKeys.add(ev.code);
  if (engine.status !== 'playing') return;
  const era = getEra(engine.player.eraIndex);
  if (ev.key === '1' && era.units[0]) engine.enqueueUnit('player', era.units[0].id);
  if (ev.key === '2' && era.units[1]) engine.enqueueUnit('player', era.units[1].id);
  if (ev.key === '3' && era.units[2]) engine.enqueueUnit('player', era.units[2].id);
  if (ev.key === '4' && era.units[3]) engine.enqueueUnit('player', era.units[3].id);
  if (ev.code === 'KeyE') engine.evolve('player');
  if (ev.code === 'Space') {
    ev.preventDefault();
    engine.triggerUltimate('player');
  }
  if (ev.code === 'KeyP' || ev.code === 'Escape') {
    engine.setPaused(true);
    overlays.showPause();
  }
});
window.addEventListener('keyup', (ev) => heldKeys.delete(ev.code));

// ============================================================================
// VIEWPORT RESIZE & PORTRAIT DETECTION
// ============================================================================
function handleResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.resize(w, h, camera);

  const isPortrait = h > w + 24;
  overlays.setPortraitWarning(isPortrait);

  if (isPortrait && engine.status === 'playing') {
    engine.setPaused(true);
    autoPausedByPortrait = true;
  } else if (!isPortrait && autoPausedByPortrait && engine.status === 'paused') {
    autoPausedByPortrait = false;
    engine.setPaused(false);
    overlays.hidePause();
  }
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => window.setTimeout(handleResize, 120));
handleResize();
overlays.showTitle(initialRecords);

// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================
let lastFrameTime = performance.now();

function frame(now: number): void {
  const rawDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  // Smooth keyboard panning
  if (engine.status === 'playing') {
    if (heldKeys.has('ArrowLeft') || heldKeys.has('KeyA')) {
      camera.panByWorld(-640 * rawDt);
    }
    if (heldKeys.has('ArrowRight') || heldKeys.has('KeyD')) {
      camera.panByWorld(640 * rawDt);
    }
  } else if (engine.status === 'title') {
    // Gentle scenic pan across the battlefield behind the title modal
    const maxScroll = camera.getMaxX();
    camera.x = maxScroll * (0.5 - 0.5 * Math.cos(now * 0.00018));
  }

  engine.step(rawDt);
  camera.update(rawDt);

  const snapshot = engine.getSnapshot();
  renderer.render(snapshot, camera, now / 1000, hud.sellHighlightMode);

  if (snapshot.status === 'playing' || snapshot.status === 'paused') {
    hud.update(snapshot);
  } else if ((snapshot.status === 'victory' || snapshot.status === 'defeat') && !resultRecorded) {
    resultRecorded = true;
    hud.update(snapshot);
    const { records, isNewBestTime } = recordMatchResult({
      won: snapshot.status === 'victory',
      difficulty: snapshot.difficulty,
      elapsedSec: snapshot.elapsed,
      eraReached: snapshot.player.eraIndex + 1,
      kills: snapshot.player.kills,
    });
    overlays.showResult(snapshot, records, isNewBestTime);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose clean debug hook on window for automated E2E visual verification
(
  window as unknown as {
    __CHRONO_FRONT__?: {
      engine: GameEngine;
      camera: BattleCamera;
      hud: HudController;
      spritesReady: Promise<void>;
    };
  }
).__CHRONO_FRONT__ = {
  engine,
  camera,
  hud,
  spritesReady: Promise.resolve(),
};

// Clean up any legacy PWA Service Workers & stale caches so iOS Safari always loads fresh assets
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith('chrono-front')).map((k) => caches.delete(k))))
        .catch(() => undefined);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => undefined);
    }
  });
}
