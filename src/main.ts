import './styles/main.css';
import { SoundEngine } from './audio/soundEngine';
import { getEra } from './data/eras';
import { DAILY_MUTATORS, getDailyChallengeInfo } from './data/metaProgression';
import type { UnitVisualKind } from './data/types';
import { BattleCamera } from './game/camera';
import { WORLD_HEIGHT } from './game/constants';
import { GameEngine } from './game/engine';
import { GameRenderer } from './render/renderer';
import {
  loadRecords,
  recordDiscoveredRelic,
  recordDiscoveredUnit,
  recordMatchResult,
  saveRecords,
} from './storage/records';
import { HudController } from './ui/hudController';
import { OverlayController, type StartLaunchConfig } from './ui/overlayController';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const initialRecords = loadRecords();
const sound = new SoundEngine(initialRecords.muted);
const camera = new BattleCamera();
const renderer = new GameRenderer(canvas);

let resultRecorded = false;
let autoPausedByPortrait = false;
let currentLaunch: StartLaunchConfig = {
  mode: 'campaign',
  difficulty: 'normal',
  commanderId: initialRecords.selectedCommander,
};
const seenUnitsInSession = new Set<UnitVisualKind>(initialRecords.discoveredUnits);

const engine = new GameEngine();

function trackUnitDiscovery(unitId: UnitVisualKind): void {
  if (seenUnitsInSession.has(unitId)) return;
  seenUnitsInSession.add(unitId);
  const { newlyUnlocked } = recordDiscoveredUnit(unitId);
  if (newlyUnlocked.length > 0) {
    sound.play('achievement');
    for (const ach of newlyUnlocked) {
      hud.showAchievementToast(ach);
    }
  }
}

const hud = new HudController({
  engine,
  camera,
  onUnlockAudio: () => sound.unlock(),
  onUiTap: () => sound.play('ui_tap'),
  onUnitEnqueued: (unitId) => trackUnitDiscovery(unitId),
  onToggleMute: () => {
    const muted = sound.toggleMute();
    const rec = loadRecords();
    rec.muted = muted;
    saveRecords(rec);
    return muted;
  },
  onTogglePause: () => {
    if (overlays.isRelicDraftOpen()) return;
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
  onUiTap: () => {
    sound.unlock();
    sound.play('ui_tap');
  },
  onUpgradeSound: () => {
    sound.unlock();
    sound.play('upgrade');
  },
  onStart: (launch) => {
    sound.unlock();
    sound.play('ui_tap');
    startMatch(launch);
  },
  onResume: () => {
    sound.unlock();
    sound.play('ui_tap');
    engine.setPaused(false);
    overlays.hidePause();
  },
  onRestart: () => {
    sound.unlock();
    sound.play('ui_tap');
    startMatch(currentLaunch);
  },
  onReturnTitle: () => {
    sound.play('ui_tap');
    engine.status = 'title';
    hud.setVisible(false);
    overlays.showTitle(loadRecords());
  },
  onSelectRelic: (relicId) => {
    sound.unlock();
    engine.selectRelic(relicId, 'player');
    const { newlyUnlocked } = recordDiscoveredRelic(relicId);
    if (newlyUnlocked.length > 0) {
      sound.play('achievement');
      for (const ach of newlyUnlocked) {
        hud.showAchievementToast(ach);
      }
    }
    if (!autoPausedByPortrait) {
      engine.setPaused(false);
    }
  },
});

engine.setCallbacks({
  onSound: (cue) => sound.play(cue),
  onComboSound: (combo) => sound.playCombo(combo),
  onUltimateSound: (kind) => sound.playUltimate(kind),
  onBanner: (title, sub, accent) => hud.showBanner(title, sub, accent),
  onRelicDraft: (choices) => {
    if (engine.status === 'playing') {
      engine.setPaused(true);
      overlays.showRelicDraft(choices);
    }
  },
});

function startMatch(launch: StartLaunchConfig): void {
  currentLaunch = launch;
  resultRecorded = false;
  const records = loadRecords();

  if (launch.mode === 'daily') {
    const daily = getDailyChallengeInfo();
    engine.startNewGame(daily.difficulty, daily.seed, {
      mode: 'daily',
      commanderId: launch.commanderId,
      sanctuary: records.sanctuary,
      mutators: [...daily.mutators],
      dailyDateKey: daily.dateKey,
    });
  } else {
    engine.startNewGame(launch.difficulty, undefined, {
      mode: launch.mode,
      commanderId: launch.commanderId,
      sanctuary: records.sanctuary,
    });
  }

  camera.reset();
  hud.switchTab('units');
  hud.forceRebuildCards();
  hud.setVisible(true);
  overlays.hideAllGameOverlays();

  const era = getEra(0);
  if (launch.mode === 'endless') {
    hud.showBanner(
      '무한 크로노 웨이브 개전!',
      '웨이브 돌파와 크로노 유물 조합으로 한계에 도전하세요',
      '#c084fc',
    );
  } else if (launch.mode === 'daily') {
    const mNames = engine.mutators.map((m) => DAILY_MUTATORS[m]?.name ?? m).join(' + ');
    hud.showBanner(`일일 시공 챌린지 개전!`, `특수 변칙: ${mNames}`, '#fde047');
  } else {
    hud.showBanner(
      `시대 1: ${era.name}`,
      '전술 스킬 · 크로노 유물과 함께 12시대 초월 문명까지 진화하세요',
      era.palette.accent,
    );
  }

  // Open starter relic draft modal if triggered at 0:00 (Starter Relic Sanctuary or Relic Rush mutator)
  if (engine.pendingRelicDraft.length > 0) {
    engine.setPaused(true);
    overlays.showRelicDraft(engine.pendingRelicDraft);
  }
}

// ============================================================================
// iOS SAFARI / STANDALONE PWA VIEWPORT & TOUCH-SCROLL LOCK
// ============================================================================
function lockViewportOrigin(): void {
  const vv = window.visualViewport;
  const displaced =
    window.scrollX !== 0 ||
    window.scrollY !== 0 ||
    document.documentElement.scrollTop !== 0 ||
    document.documentElement.scrollLeft !== 0 ||
    document.body.scrollTop !== 0 ||
    document.body.scrollLeft !== 0 ||
    (vv != null && (Math.abs(vv.offsetTop) > 0.5 || Math.abs(vv.offsetLeft) > 0.5));

  if (displaced) {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartedOnButton = false;

document.addEventListener(
  'touchstart',
  (ev) => {
    sound.unlock();
    const touches = ev.touches;
    if (!touches) return;
    if (touches.length === 1) {
      touchStartX = touches[0].clientX;
      touchStartY = touches[0].clientY;
      touchStartedOnButton = ev.target instanceof Element && ev.target.closest('button') !== null;
    } else if (touches.length > 1 && ev.cancelable) {
      touchStartedOnButton = false;
      const target = ev.target;
      if (!(target instanceof Element && target.closest('button'))) {
        ev.preventDefault();
      }
    }
  },
  { passive: false },
);

document.addEventListener(
  'touchmove',
  (ev) => {
    if (!ev.cancelable) return;
    if (touchStartedOnButton && ev.touches && ev.touches.length === 1) {
      const dx = ev.touches[0].clientX - touchStartX;
      const dy = ev.touches[0].clientY - touchStartY;
      if (Math.hypot(dx, dy) < 12) {
        return;
      }
    }
    ev.preventDefault();
  },
  { passive: false },
);

for (const evtName of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
  document.addEventListener(
    evtName,
    (ev) => {
      if (ev.cancelable) {
        ev.preventDefault();
      }
    },
    { passive: false },
  );
}

document.addEventListener(
  'dblclick',
  (ev) => {
    if (ev.cancelable) {
      ev.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener('selectstart', (ev) => {
  ev.preventDefault();
});

document.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
});

function blurActiveButton(): void {
  const active = document.activeElement;
  if (active instanceof HTMLButtonElement) {
    active.blur();
  }
  lockViewportOrigin();
}

document.addEventListener('click', () => {
  blurActiveButton();
  requestAnimationFrame(blurActiveButton);
});
window.addEventListener('scroll', lockViewportOrigin, { passive: true });
window.visualViewport?.addEventListener('scroll', lockViewportOrigin);
window.addEventListener(
  'touchend',
  () => {
    touchStartedOnButton = false;
    lockViewportOrigin();
    requestAnimationFrame(blurActiveButton);
  },
  { passive: true },
);
window.addEventListener(
  'touchcancel',
  () => {
    touchStartedOnButton = false;
  },
  { passive: true },
);
window.addEventListener(
  'pointerdown',
  () => {
    sound.unlock();
  },
  { passive: true },
);
window.addEventListener(
  'pointerup',
  () => {
    requestAnimationFrame(blurActiveButton);
  },
  { passive: true },
);
window.addEventListener(
  'mouseup',
  () => {
    requestAnimationFrame(blurActiveButton);
  },
  { passive: true },
);

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
  if (ev.key === '1' && era.units[0]) {
    if (engine.enqueueUnit('player', era.units[0].id)) trackUnitDiscovery(era.units[0].id);
  }
  if (ev.key === '2' && era.units[1]) {
    if (engine.enqueueUnit('player', era.units[1].id)) trackUnitDiscovery(era.units[1].id);
  }
  if (ev.key === '3' && era.units[2]) {
    if (engine.enqueueUnit('player', era.units[2].id)) trackUnitDiscovery(era.units[2].id);
  }
  if (ev.key === '4' && era.units[3]) {
    if (engine.enqueueUnit('player', era.units[3].id)) trackUnitDiscovery(era.units[3].id);
  }
  if (ev.code === 'KeyQ') engine.triggerTacticalSkill('player');
  if (ev.code === 'KeyE') engine.evolve('player');
  if (ev.code === 'KeyF') engine.toggleAutoSpawn();
  if (ev.code === 'KeyR') engine.toggleSpeed();
  if (ev.code === 'Space') {
    ev.preventDefault();
    engine.triggerUltimate('player');
  }
  if (ev.code === 'KeyP' || ev.code === 'Escape') {
    if (!overlays.isRelicDraftOpen()) {
      engine.setPaused(true);
      overlays.showPause();
    }
  }
});
window.addEventListener('keyup', (ev) => heldKeys.delete(ev.code));

// ============================================================================
// VIEWPORT RESIZE & PORTRAIT DETECTION (iOS Standalone PWA Safe!)
// ============================================================================
function handleResize(): void {
  lockViewportOrigin();
  const rect = canvas.getBoundingClientRect();
  const vv = window.visualViewport;
  const w = Math.round(rect.width || vv?.width || window.innerWidth);
  const h = Math.round(rect.height || vv?.height || window.innerHeight);
  if (w < 10 || h < 10) return;

  renderer.resize(w, h, camera);

  const isPortrait = h > w + 24;
  overlays.setPortraitWarning(isPortrait);

  if (isPortrait && engine.status === 'playing') {
    engine.setPaused(true);
    autoPausedByPortrait = true;
  } else if (!isPortrait && autoPausedByPortrait && engine.status === 'paused' && !overlays.isRelicDraftOpen()) {
    autoPausedByPortrait = false;
    engine.setPaused(false);
    overlays.hidePause();
  }
}

window.addEventListener('resize', handleResize);
window.visualViewport?.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
  handleResize();
  window.setTimeout(handleResize, 80);
  window.setTimeout(handleResize, 260);
  window.setTimeout(handleResize, 520);
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    sound.unlock();
    window.setTimeout(handleResize, 60);
  }
});
if (typeof ResizeObserver !== 'undefined') {
  const appEl = document.getElementById('app');
  if (appEl) {
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(appEl);
  }
}
handleResize();
overlays.showTitle(initialRecords);

// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================
let lastFrameTime = performance.now();

function frame(now: number): void {
  lockViewportOrigin();

  const rawDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  if (engine.status === 'playing') {
    if (heldKeys.has('ArrowLeft') || heldKeys.has('KeyA')) {
      camera.panByWorld(-640 * rawDt);
    }
    if (heldKeys.has('ArrowRight') || heldKeys.has('KeyD')) {
      camera.panByWorld(640 * rawDt);
    }
  } else if (engine.status === 'title') {
    const maxScroll = camera.getMaxX();
    camera.x = maxScroll * (0.5 - 0.5 * Math.cos(now * 0.00018));
  }

  engine.step(rawDt);
  camera.update(rawDt);

  const snapshot = engine.getSnapshot();

  // Track any newly spawned player units (including Auto-Spawned units) for the Codex
  let bossAlive = false;
  for (let i = 0; i < snapshot.units.length; i++) {
    const u = snapshot.units[i];
    if (u.state === 'dead') continue;
    if (u.team === 'player') {
      trackUnitDiscovery(u.def.id);
    } else if (u.eliteKind === 'boss') {
      bossAlive = true;
    }
  }

  // Subtle rhythmic battle pulse audio
  sound.tickBattlePulse({
    playing: snapshot.status === 'playing',
    fever: snapshot.player.feverTimer > 0,
    bossAlive,
    eraIndex: snapshot.player.eraIndex,
  });

  renderer.render(snapshot, camera, now / 1000, hud.sellHighlightMode);

  if (snapshot.status === 'playing' || snapshot.status === 'paused') {
    hud.update(snapshot);
  } else if ((snapshot.status === 'victory' || snapshot.status === 'defeat') && !resultRecorded) {
    resultRecorded = true;
    hud.update(snapshot);
    const summary = recordMatchResult({
      won: snapshot.status === 'victory',
      difficulty: snapshot.difficulty,
      elapsedSec: snapshot.elapsed,
      eraReached: snapshot.player.eraIndex + 1,
      kills: snapshot.player.kills,
      mode: snapshot.mode,
      waveReached: snapshot.wave,
      maxCombo: snapshot.player.maxCombo,
      bossKills: snapshot.player.bossKills,
      baseHpRatio: snapshot.player.baseHp / Math.max(1, snapshot.player.baseMaxHp),
      relicsCollected: snapshot.player.relics,
      dailyDateKey: engine.dailyDateKey,
    });
    if (summary.newlyUnlockedAchievements.length > 0) {
      sound.play('achievement');
      for (const ach of summary.newlyUnlockedAchievements) {
        hud.showAchievementToast(ach);
      }
    }
    overlays.showResult(snapshot, summary);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose clean debug hook on window for automated E2E visual & performance verification
(
  window as unknown as {
    __CHRONO_FRONT__?: {
      engine: GameEngine;
      camera: BattleCamera;
      hud: HudController;
      overlays: OverlayController;
      getPerfStats: () => ReturnType<GameRenderer['getPerfStats']>;
      spritesReady: Promise<void>;
    };
  }
).__CHRONO_FRONT__ = {
  engine,
  camera,
  hud,
  overlays,
  getPerfStats: () => renderer.getPerfStats(),
  spritesReady: Promise.resolve(),
};

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
