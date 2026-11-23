import { COMMANDERS } from '../data/commanders';
import { getEra } from '../data/eras';
import { DAILY_MUTATORS } from '../data/metaProgression';
import { RELIC_BY_ID } from '../data/relics';
import type {
  AchievementDef,
  GameSnapshot,
  TurretVisualKind,
  UnitVisualKind,
  UpgradeCategory,
  UpgradeId,
} from '../data/types';
import {
  getNextUpgradeCost,
  getTotalUpgradeLevel,
  getUpgradesByCategory,
  UPGRADE_BY_ID,
} from '../data/upgrades';
import type { BattleCamera } from '../game/camera';
import { WORLD_WIDTH } from '../game/constants';
import type { GameEngine } from '../game/engine';
import {
  getRelicIconUrl,
  getTurretIconUrl,
  getUnitIconUrl,
  getUpgradeIconUrl,
} from '../render/iconRenderer';
import { renderMinimap } from '../render/renderer';
import { formatDuration } from '../storage/records';
import { bindButtonTap } from './tap';

export type DockTab = 'units' | 'turrets' | 'upgrades';

interface CachedCardRef {
  btn: HTMLButtonElement;
  kind: 'unit' | 'upgrade' | 'expand_slot' | 'turret' | 'sell_turret';
  unitId?: UnitVisualKind;
  turretId?: TurretVisualKind;
  upgradeId?: UpgradeId;
  costEl: HTMLElement | null;
  queueBadgeEl: HTMLElement | null;
  levelBadgeEl: HTMLElement | null;
  slotCostEl: HTMLElement | null;
  refundEl: HTMLElement | null;
}

function setTextIfChanged(el: Element, text: string): void {
  if (el.textContent !== text) {
    el.textContent = text;
  }
}

function renderSpriteMarkup(iconUrl: string, alt: string, extraClass = ''): string {
  const cls = extraClass ? `card-sprite ${extraClass}` : 'card-sprite';
  if (!iconUrl) {
    return `<span class="card-sprite-placeholder ${extraClass}" aria-hidden="true"></span>`;
  }
  return `<img class="${cls}" src="${iconUrl}" alt="${alt}" draggable="false" />`;
}

export class HudController {
  public activeTab: DockTab = 'units';
  public upgradeCategory: UpgradeCategory = 'offense';
  public sellHighlightMode = false;

  private topHud = document.getElementById('top-hud')!;
  private bottomHud = document.getElementById('bottom-hud')!;
  private subLeftEl = document.getElementById('hud-sub-left')!;
  private modePillEl = document.getElementById('hud-mode-pill')!;
  private comboPillEl = document.getElementById('hud-combo-pill')!;
  private bossBarEl = document.getElementById('hud-boss-bar')!;
  private bossNameEl = document.getElementById('hud-boss-name')!;
  private bossHpEl = document.getElementById('hud-boss-hp')!;
  private bossFillEl = document.getElementById('hud-boss-fill')!;

  private achToastEl = document.getElementById('achievement-toast')!;
  private achToastNameEl = document.getElementById('ach-toast-name')!;
  private achToastRewardEl = document.getElementById('ach-toast-reward')!;
  private achToastQueue: AchievementDef[] = [];
  private achToastTimer: number | null = null;

  private dockFloatRow = document.getElementById('dock-float-row')!;
  private queueBar = document.getElementById('queue-bar')!;
  private relicStripEl = document.getElementById('relic-strip')!;

  private goldEl = document.getElementById('hud-gold')!;
  private xpEl = document.getElementById('hud-xp')!;
  private eraBadgeEl = document.getElementById('hud-era-badge')!;
  private playerHpEl = document.getElementById('hud-player-hp')!;
  private enemyHpEl = document.getElementById('hud-enemy-hp')!;
  private playerHpBar = document.getElementById('hud-player-hp-bar')!;
  private enemyHpBar = document.getElementById('hud-enemy-hp-bar')!;
  private timerEl = document.getElementById('hud-timer')!;
  private minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  private minimapShell = document.getElementById('minimap-shell')!;
  private feverBarEl = document.getElementById('hud-fever-bar');

  private autoBtn = document.getElementById('btn-auto') as HTMLButtonElement;
  private autoLabelEl = document.getElementById('auto-label')!;
  private speedBtn = document.getElementById('btn-speed') as HTMLButtonElement;
  private speedLabelEl = document.getElementById('speed-label')!;
  private muteBtn = document.getElementById('btn-mute') as HTMLButtonElement;
  private pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;

  private tabUnitsBtn = document.getElementById('tab-units') as HTMLButtonElement;
  private tabTurretsBtn = document.getElementById('tab-turrets') as HTMLButtonElement;
  private tabUpgradesBtn = document.getElementById('tab-upgrades') as HTMLButtonElement;
  private upgradePageSwitchEl = document.getElementById('upgrade-page-switch')!;
  private upgPageButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('#upgrade-page-switch [data-upg-cat]'),
  );
  private turretSlotCountEl = document.getElementById('turret-slot-count')!;
  private upgradeLevelTotalEl = document.getElementById('upgrade-level-total')!;
  private actionCardsEl = document.getElementById('action-cards')!;

  private tacticalBtn = document.getElementById('btn-tactical') as HTMLButtonElement;
  private tacticalFill = document.getElementById('tactical-fill')!;
  private tacticalKicker = document.getElementById('tactical-kicker')!;
  private tacticalLabel = document.getElementById('tactical-label')!;
  private tacticalSub = document.getElementById('tactical-sub')!;

  private evolveBtn = document.getElementById('btn-evolve') as HTMLButtonElement;
  private evolveFill = document.getElementById('evolve-fill')!;
  private evolveKicker = document.getElementById('evolve-kicker')!;
  private evolveLabel = document.getElementById('evolve-label')!;
  private evolveSub = document.getElementById('evolve-sub')!;

  private ultBtn = document.getElementById('btn-ultimate') as HTMLButtonElement;
  private ultFill = document.getElementById('ult-fill')!;
  private ultKicker = document.getElementById('ult-kicker')!;
  private ultLabel = document.getElementById('ult-label')!;
  private ultSub = document.getElementById('ult-sub')!;

  private bannerEl = document.getElementById('event-banner')!;
  private bannerTitle = document.getElementById('event-banner-title')!;
  private bannerSub = document.getElementById('event-banner-sub')!;
  private bannerTimer: number | null = null;

  private renderedEra = -1;
  private renderedTab: DockTab | null = null;
  private renderedUpgradeCategory: UpgradeCategory | null = null;
  private cachedCards: CachedCardRef[] = [];
  private queueProgressEl: HTMLElement | null = null;
  private lastQueueSignature = '';
  private lastRelicCount = -1;
  private suppressUpgradeClickUntil = 0;

  // Dirty-check caches
  private lastGold = -1;
  private lastXp = -1;
  private lastXpEra = -1;
  private lastEraIndex = -1;
  private lastPlayerHp = -1;
  private lastEnemyHp = -1;
  private lastPlayerPct = '';
  private lastEnemyPct = '';
  private lastTacticalPct = '';
  private lastEvolvePct = '';
  private lastUltPct = '';
  private lastFeverPct = '';
  private lastFeverActive: boolean | null = null;
  private lastQueuePct = '';
  private lastSpeed = -1;
  private lastAuto: boolean | null = null;
  private lastInstalledTurrets = -1;
  private lastTurretSlots = -1;
  private lastUpgradeTotal = -1;
  private lastComboCount = -1;
  private lastModeText = '';
  private lastBossUid = -1;
  private lastBossHp = -1;

  // Minimap throttle state (~20Hz idle, instantaneous on camera drag/era change)
  private hudFrameTick = 0;
  private lastMinimapCamX = -9999;
  private lastMinimapEra = -1;
  private lastMinimapUltCount = -1;

  private pulseTimers = new WeakMap<Element, number>();

  private engine: GameEngine;
  private camera: BattleCamera;
  private onToggleMute: () => boolean;
  private onTogglePause: () => void;
  private onUnlockAudio: () => void;
  private onUiTap?: () => void;
  private onUnitEnqueued?: (unitId: UnitVisualKind) => void;

  constructor(params: {
    engine: GameEngine;
    camera: BattleCamera;
    onToggleMute: () => boolean;
    onTogglePause: () => void;
    onUnlockAudio: () => void;
    onUiTap?: () => void;
    onUnitEnqueued?: (unitId: UnitVisualKind) => void;
  }) {
    this.engine = params.engine;
    this.camera = params.camera;
    this.onToggleMute = params.onToggleMute;
    this.onTogglePause = params.onTogglePause;
    this.onUnlockAudio = params.onUnlockAudio;
    this.onUiTap = params.onUiTap;
    this.onUnitEnqueued = params.onUnitEnqueued;

    this.bindEvents();
  }

  private pulseClass(el: Element | null, className: string, durationMs = 260): void {
    if (!el) return;
    const prev = this.pulseTimers.get(el);
    if (prev !== undefined) {
      window.clearTimeout(prev);
    }
    el.classList.remove(className);
    requestAnimationFrame(() => {
      el.classList.add(className);
    });
    const timer = window.setTimeout(() => {
      el.classList.remove(className);
      this.pulseTimers.delete(el);
    }, durationMs);
    this.pulseTimers.set(el, timer);
  }

  public setVisible(visible: boolean): void {
    this.topHud.classList.toggle('hidden', !visible);
    this.bottomHud.classList.toggle('hidden', !visible);
    this.subLeftEl.classList.toggle('hidden', !visible);
    this.dockFloatRow.classList.toggle('hidden', !visible);
    if (!visible) {
      this.queueBar.classList.add('hidden');
      this.relicStripEl.classList.add('hidden');
      this.bossBarEl.classList.add('hidden');
      this.modePillEl.classList.add('hidden');
      this.comboPillEl.classList.add('hidden');
      this.sellHighlightMode = false;
      this.topHud.classList.remove('fever-mode');
      this.minimapShell.classList.remove('fever-mode');
    }
  }

  public setMutedVisual(muted: boolean): void {
    this.muteBtn.classList.toggle('muted', muted);
    this.muteBtn.innerHTML = muted
      ? `<svg viewBox="0 0 24 24" class="svg-icon" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg viewBox="0 0 24 24" class="svg-icon" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  public showBanner(title: string, subtitle: string, accentColor: string): void {
    this.bannerTitle.textContent = title;
    this.bannerTitle.style.color = accentColor;
    this.bannerSub.textContent = subtitle;
    this.bannerEl.style.borderColor = accentColor;
    this.bannerEl.classList.remove('hidden', 'banner-enter');
    requestAnimationFrame(() => {
      this.bannerEl.classList.add('banner-enter');
    });

    if (this.bannerTimer !== null) {
      window.clearTimeout(this.bannerTimer);
    }
    this.bannerTimer = window.setTimeout(() => {
      this.bannerEl.classList.add('hidden');
      this.bannerEl.classList.remove('banner-enter');
      this.bannerTimer = null;
    }, 2600);
  }

  public showAchievementToast(def: AchievementDef): void {
    this.achToastQueue.push(def);
    if (this.achToastTimer === null) {
      this.flushNextToast();
    }
  }

  private flushNextToast(): void {
    const next = this.achToastQueue.shift();
    if (!next) {
      this.achToastTimer = null;
      this.achToastEl.classList.add('hidden');
      return;
    }
    this.achToastNameEl.textContent = next.name;
    this.achToastRewardEl.textContent = `+🏅${next.medalReward}`;
    this.achToastEl.style.borderColor = next.accentColor;
    this.achToastEl.classList.remove('hidden', 'toast-enter');
    requestAnimationFrame(() => {
      this.achToastEl.classList.add('toast-enter');
    });
    this.achToastTimer = window.setTimeout(() => {
      this.achToastEl.classList.add('hidden');
      this.flushNextToast();
    }, 2800);
  }

  public forceRebuildCards(): void {
    this.renderedEra = -1;
    this.renderedTab = null;
    this.renderedUpgradeCategory = null;
    this.cachedCards = [];
    this.queueProgressEl = null;
    this.lastQueueSignature = '';
    this.lastRelicCount = -1;
    this.lastGold = -1;
    this.lastXp = -1;
    this.lastXpEra = -1;
    this.lastEraIndex = -1;
    this.lastPlayerHp = -1;
    this.lastEnemyHp = -1;
    this.lastPlayerPct = '';
    this.lastEnemyPct = '';
    this.lastTacticalPct = '';
    this.lastEvolvePct = '';
    this.lastUltPct = '';
    this.lastFeverPct = '';
    this.lastFeverActive = null;
    this.lastQueuePct = '';
    this.lastSpeed = -1;
    this.lastAuto = null;
    this.lastInstalledTurrets = -1;
    this.lastTurretSlots = -1;
    this.lastUpgradeTotal = -1;
    this.lastComboCount = -1;
    this.lastModeText = '';
    this.lastBossUid = -1;
    this.lastBossHp = -1;
    this.lastMinimapEra = -1;
  }

  public update(snapshot: GameSnapshot): void {
    const p = snapshot.player;
    const e = snapshot.enemy;
    const era = getEra(p.eraIndex);
    this.hudFrameTick++;

    // Top stats (dirty-checked integers)
    const goldInt = Math.floor(p.gold);
    if (goldInt !== this.lastGold) {
      this.lastGold = goldInt;
      setTextIfChanged(this.goldEl, goldInt.toLocaleString());
    }

    const xpInt = Math.floor(p.xp);
    if (xpInt !== this.lastXp || p.eraIndex !== this.lastXpEra) {
      this.lastXp = xpInt;
      this.lastXpEra = p.eraIndex;
      setTextIfChanged(
        this.xpEl,
        era.evolveXp > 0
          ? `${xpInt.toLocaleString()}/${era.evolveXp.toLocaleString()}`
          : `${xpInt.toLocaleString()} XP`,
      );
    }

    if (p.eraIndex !== this.lastEraIndex) {
      const evolved = this.lastEraIndex >= 0 && p.eraIndex > this.lastEraIndex;
      this.lastEraIndex = p.eraIndex;
      setTextIfChanged(this.eraBadgeEl, `${era.roman} ${era.shortName}`);
      if (evolved) {
        this.pulseClass(this.eraBadgeEl, 'era-pop', 680);
        this.pulseClass(this.topHud, 'era-flash', 520);
      }
    }

    const pHpInt = Math.ceil(p.baseHp);
    if (pHpInt !== this.lastPlayerHp) {
      this.lastPlayerHp = pHpInt;
      setTextIfChanged(this.playerHpEl, pHpInt.toLocaleString());
    }
    const eHpInt = Math.ceil(e.baseHp);
    if (eHpInt !== this.lastEnemyHp) {
      this.lastEnemyHp = eHpInt;
      setTextIfChanged(this.enemyHpEl, eHpInt.toLocaleString());
    }

    const pPct = `${Math.max(0, Math.min(100, (p.baseHp / p.baseMaxHp) * 100)).toFixed(1)}%`;
    if (pPct !== this.lastPlayerPct) {
      this.lastPlayerPct = pPct;
      this.playerHpBar.style.width = pPct;
    }
    const ePct = `${Math.max(0, Math.min(100, (e.baseHp / e.baseMaxHp) * 100)).toFixed(1)}%`;
    if (ePct !== this.lastEnemyPct) {
      this.lastEnemyPct = ePct;
      this.enemyHpBar.style.width = ePct;
    }

    // Chrono Fever live gauge & active golden HUD state
    const feverActive = p.feverTimer > 0;
    const feverTarget = p.mods.feverKillsTarget;
    if (feverActive !== this.lastFeverActive) {
      this.lastFeverActive = feverActive;
      this.timerEl.classList.toggle('fever-active', feverActive);
      this.topHud.classList.toggle('fever-mode', feverActive);
      this.minimapShell.classList.toggle('fever-mode', feverActive);
      this.feverBarEl?.classList.toggle('fever-active', feverActive);
    }
    if (feverActive) {
      setTextIfChanged(this.timerEl, `FEVER ${Math.ceil(p.feverTimer)}s`);
    } else {
      setTextIfChanged(this.timerEl, formatDuration(snapshot.elapsed));
    }
    if (this.feverBarEl) {
      const feverFrac = feverActive
        ? Math.max(0, Math.min(1, p.feverTimer / Math.max(1, p.feverDuration)))
        : Math.max(0, Math.min(1, p.feverKills / Math.max(1, feverTarget)));
      const feverPct = `${(feverFrac * 100).toFixed(1)}%`;
      if (feverPct !== this.lastFeverPct) {
        this.lastFeverPct = feverPct;
        this.feverBarEl.style.width = feverPct;
      }
    }

    // Mode / Wave & Kill Combo sub-pills
    const modeLabel =
      snapshot.mode === 'endless'
        ? `♾ WAVE ${snapshot.wave}`
        : snapshot.mode === 'daily' && snapshot.mutators.length > 0
          ? `⚡ ${snapshot.mutators.map((m) => DAILY_MUTATORS[m]?.shortName ?? m).join(' · ')}`
          : '';
    if (modeLabel !== this.lastModeText) {
      this.lastModeText = modeLabel;
      if (modeLabel) {
        this.modePillEl.classList.remove('hidden');
        setTextIfChanged(this.modePillEl, modeLabel);
      } else {
        this.modePillEl.classList.add('hidden');
      }
    }

    if (p.comboCount !== this.lastComboCount) {
      const grew = p.comboCount > this.lastComboCount && p.comboCount >= 2;
      this.lastComboCount = p.comboCount;
      if (p.comboCount >= 2) {
        const bonusPct = Math.min(50, Math.round((p.comboCount - 1) * 2.5));
        this.comboPillEl.classList.remove('hidden');
        setTextIfChanged(this.comboPillEl, `🔥 ${p.comboCount} COMBO +${bonusPct}%`);
        if (grew) this.pulseClass(this.comboPillEl, 'tap-pop', 170);
      } else {
        this.comboPillEl.classList.add('hidden');
      }
    }

    // Live Enemy Boss HP Bar
    let liveBoss = null as (typeof snapshot.units)[number] | null;
    for (let i = 0; i < snapshot.units.length; i++) {
      const u = snapshot.units[i];
      if (u.team === 'enemy' && u.state !== 'dead' && u.eliteKind === 'boss') {
        liveBoss = u;
        break;
      }
    }
    if (liveBoss) {
      if (this.lastBossUid !== liveBoss.uid) {
        this.lastBossUid = liveBoss.uid;
        this.bossBarEl.classList.remove('hidden');
        setTextIfChanged(
          this.bossNameEl,
          `♛ ${liveBoss.eliteTitle ?? '수호군주'} · ${liveBoss.def.name}`,
        );
      }
      const bHp = Math.ceil(liveBoss.hp);
      if (bHp !== this.lastBossHp) {
        this.lastBossHp = bHp;
        setTextIfChanged(this.bossHpEl, `${bHp.toLocaleString()}/${liveBoss.maxHp.toLocaleString()}`);
        this.bossFillEl.style.width = `${Math.max(0, Math.min(100, (liveBoss.hp / liveBoss.maxHp) * 100)).toFixed(1)}%`;
      }
    } else if (this.lastBossUid !== -1) {
      this.lastBossUid = -1;
      this.lastBossHp = -1;
      this.bossBarEl.classList.add('hidden');
    }

    // Auto-Spawn & Speed visuals
    if (snapshot.autoSpawn !== this.lastAuto) {
      this.lastAuto = snapshot.autoSpawn;
      this.autoBtn.classList.toggle('active', snapshot.autoSpawn);
      setTextIfChanged(this.autoLabelEl, snapshot.autoSpawn ? '자동ON' : '자동');
    }
    if (snapshot.speed !== this.lastSpeed) {
      this.lastSpeed = snapshot.speed;
      setTextIfChanged(this.speedLabelEl, `${snapshot.speed}x`);
      this.speedBtn.classList.toggle('active', snapshot.speed >= 2);
      this.speedBtn.classList.toggle('turbo', snapshot.speed === 3);
    }

    // Turret slot count badge & total upgrade level badge
    let installedCount = 0;
    for (let i = 0; i < p.turrets.length; i++) {
      if (p.turrets[i] !== null) installedCount++;
    }
    if (installedCount !== this.lastInstalledTurrets || p.turretSlots !== this.lastTurretSlots) {
      this.lastInstalledTurrets = installedCount;
      this.lastTurretSlots = p.turretSlots;
      setTextIfChanged(this.turretSlotCountEl, `${installedCount}/${p.turretSlots}`);
    }
    const upgradeTotal = getTotalUpgradeLevel(p.upgrades);
    if (upgradeTotal !== this.lastUpgradeTotal) {
      this.lastUpgradeTotal = upgradeTotal;
      setTextIfChanged(this.upgradeLevelTotalEl, `Lv${upgradeTotal}`);
    }

    // Rebuild bottom action cards only when era, active tab, or upgrade page changes
    if (
      this.renderedEra !== p.eraIndex ||
      this.renderedTab !== this.activeTab ||
      (this.activeTab === 'upgrades' && this.renderedUpgradeCategory !== this.upgradeCategory)
    ) {
      this.buildActionCards(p.eraIndex, this.activeTab);
      this.renderedEra = p.eraIndex;
      this.renderedTab = this.activeTab;
      this.renderedUpgradeCategory = this.upgradeCategory;
    }

    // Update affordability & badges on cached card DOM references
    this.updateActionCardStates(snapshot);

    // Update production queue floating bar & collected Relic strip
    this.updateQueueBar(snapshot);
    this.updateRelicStrip(snapshot);

    // Update Commander Tactical Skill button
    if (p.commanderId && COMMANDERS[p.commanderId]) {
      const cmd = COMMANDERS[p.commanderId];
      this.tacticalBtn.classList.remove('hidden');
      this.tacticalBtn.style.setProperty('--cmd-accent', cmd.accentColor);
      const tacReady = p.tacticalCooldown <= 0;
      const tacFrac = tacReady
        ? 1
        : Math.max(0, 1 - p.tacticalCooldown / Math.max(1, p.tacticalMaxCooldown));
      setTextIfChanged(this.tacticalKicker, '전술 스킬');
      setTextIfChanged(this.tacticalLabel, cmd.skillShort);
      setTextIfChanged(
        this.tacticalSub,
        tacReady ? 'READY!' : `${Math.ceil(p.tacticalCooldown)}s`,
      );
      const tacPct = `${(tacFrac * 100).toFixed(1)}%`;
      if (tacPct !== this.lastTacticalPct) {
        this.lastTacticalPct = tacPct;
        this.tacticalFill.style.height = tacPct;
      }
      this.tacticalBtn.classList.toggle('ready', tacReady);
      this.tacticalBtn.disabled = !tacReady;
    } else {
      this.tacticalBtn.classList.add('hidden');
    }

    // Update Evolve power button
    if (era.evolveXp > 0) {
      const nextEra = getEra(p.eraIndex + 1);
      const frac = Math.min(1, p.xp / era.evolveXp);
      const ready = p.xp >= era.evolveXp;
      setTextIfChanged(this.evolveKicker, '시대 진화');
      setTextIfChanged(this.evolveLabel, `${nextEra.roman} ${nextEra.shortName}`);
      setTextIfChanged(this.evolveSub, ready ? '진화 가능!' : `${Math.max(0, Math.ceil(era.evolveXp - p.xp))} XP`);
      const evPct = `${(frac * 100).toFixed(1)}%`;
      if (evPct !== this.lastEvolvePct) {
        this.lastEvolvePct = evPct;
        this.evolveFill.style.height = evPct;
      }
      this.evolveBtn.classList.toggle('ready', ready);
      this.evolveBtn.disabled = !ready;
    } else {
      setTextIfChanged(this.evolveKicker, '최종 시대');
      setTextIfChanged(this.evolveLabel, `${era.roman} ${era.shortName}`);
      setTextIfChanged(this.evolveSub, 'MAX');
      if (this.lastEvolvePct !== '100%') {
        this.lastEvolvePct = '100%';
        this.evolveFill.style.height = '100%';
      }
      this.evolveBtn.classList.remove('ready');
      this.evolveBtn.disabled = true;
    }

    // Update Ultimate power button
    const ultXpCost = this.engine.getUltimateXpCost('player');
    const ultXpTag =
      ultXpCost >= 10000
        ? `${Math.round(ultXpCost / 1000)}kXP`
        : ultXpCost >= 1000
          ? `${(ultXpCost / 1000).toFixed(1).replace(/\.0$/, '')}kXP`
          : `${ultXpCost}XP`;
    const cdReady = p.ultimateCooldown <= 0;
    const xpReady = p.xp >= ultXpCost;
    const ultReady = cdReady && xpReady;
    const ultFrac = !cdReady
      ? Math.max(0, 1 - p.ultimateCooldown / Math.max(1, p.ultimateMaxCooldown))
      : Math.min(1, p.xp / Math.max(1, ultXpCost));

    setTextIfChanged(this.ultKicker, `필살·${ultXpTag}`);
    setTextIfChanged(this.ultLabel, era.ultimate.shortName);
    setTextIfChanged(this.ultSub, !cdReady ? `${Math.ceil(p.ultimateCooldown)}s` : xpReady ? 'READY!' : 'XP 부족');
    const ultPct = `${(ultFrac * 100).toFixed(1)}%`;
    if (ultPct !== this.lastUltPct) {
      this.lastUltPct = ultPct;
      this.ultFill.style.height = ultPct;
    }
    this.ultBtn.classList.toggle('ready', ultReady);
    this.ultBtn.classList.toggle('xp-short', cdReady && !xpReady);
    this.ultBtn.disabled = !ultReady;

    // Render live minimap (~20Hz steady state, immediate when camera drags or era/ult changes)
    const camMoved = Math.abs(this.camera.x - this.lastMinimapCamX) > 1;
    const eraChanged = p.eraIndex !== this.lastMinimapEra;
    const ultChanged = snapshot.ultimates.length !== this.lastMinimapUltCount;
    if (camMoved || eraChanged || ultChanged || this.hudFrameTick % 3 === 0) {
      this.lastMinimapCamX = this.camera.x;
      this.lastMinimapEra = p.eraIndex;
      this.lastMinimapUltCount = snapshot.ultimates.length;
      renderMinimap(this.minimapCanvas, snapshot, this.camera);
    }
  }

  private bindEvents(): void {
    bindButtonTap(this.autoBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      const auto = this.engine.toggleAutoSpawn();
      this.lastAuto = auto;
      this.autoBtn.classList.toggle('active', auto);
      setTextIfChanged(this.autoLabelEl, auto ? '자동ON' : '자동');
      this.pulseClass(this.autoBtn, 'tap-pop', 180);
    });

    bindButtonTap(this.speedBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      const nextSpeed = this.engine.toggleSpeed();
      this.lastSpeed = nextSpeed;
      setTextIfChanged(this.speedLabelEl, `${nextSpeed}x`);
      this.speedBtn.classList.toggle('active', nextSpeed >= 2);
      this.speedBtn.classList.toggle('turbo', nextSpeed === 3);
      this.pulseClass(this.speedBtn, 'tap-pop', 180);
    });

    bindButtonTap(this.muteBtn, () => {
      const muted = this.onToggleMute();
      this.setMutedVisual(muted);
      if (!muted) this.onUiTap?.();
      this.pulseClass(this.muteBtn, 'tap-pop', 180);
    });

    bindButtonTap(this.pauseBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      this.onTogglePause();
    });

    bindButtonTap(this.tabUnitsBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      this.switchTab('units');
    });

    bindButtonTap(this.tabTurretsBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      this.switchTab('turrets');
    });

    const categoryOrder: UpgradeCategory[] = ['offense', 'defense', 'tactics', 'empire', 'special', 'command'];

    bindButtonTap(this.tabUpgradesBtn, () => {
      this.onUnlockAudio();
      this.onUiTap?.();
      if (this.activeTab === 'upgrades') {
        const idx = categoryOrder.indexOf(this.upgradeCategory);
        this.setUpgradeCategory(categoryOrder[(idx + 1) % categoryOrder.length]);
      } else {
        this.switchTab('upgrades');
      }
    });

    for (const btn of this.upgPageButtons) {
      bindButtonTap(btn, () => {
        this.onUnlockAudio();
        this.onUiTap?.();
        const cat = btn.dataset.upgCat as UpgradeCategory | undefined;
        if (cat) this.setUpgradeCategory(cat);
      });
    }

    // Horizontal swipe on upgrade cards steps smoothly across all 6 categories
    let swipeStartX = 0;
    let swipeTracking = false;
    this.actionCardsEl.addEventListener('pointerdown', (ev) => {
      if (this.activeTab !== 'upgrades') return;
      swipeStartX = ev.clientX;
      swipeTracking = true;
    });
    this.actionCardsEl.addEventListener('pointerup', (ev) => {
      if (!swipeTracking || this.activeTab !== 'upgrades') return;
      swipeTracking = false;
      const dx = ev.clientX - swipeStartX;
      if (Math.abs(dx) > 36) {
        this.suppressUpgradeClickUntil = performance.now() + 260;
        this.onUiTap?.();
        const idx = categoryOrder.indexOf(this.upgradeCategory);
        const nextIdx = (idx + (dx < 0 ? 1 : -1) + categoryOrder.length) % categoryOrder.length;
        this.setUpgradeCategory(categoryOrder[nextIdx]);
      }
    });
    this.actionCardsEl.addEventListener('pointercancel', () => {
      swipeTracking = false;
    });

    bindButtonTap(this.tacticalBtn, () => {
      this.onUnlockAudio();
      if (this.engine.triggerTacticalSkill('player')) {
        this.pulseClass(this.tacticalBtn, 'bought-flash', 420);
      }
    });

    bindButtonTap(this.evolveBtn, () => {
      this.onUnlockAudio();
      if (this.engine.evolve('player')) {
        this.pulseClass(this.evolveBtn, 'bought-flash', 420);
      }
    });

    bindButtonTap(this.ultBtn, () => {
      this.onUnlockAudio();
      if (this.engine.triggerUltimate('player')) {
        this.pulseClass(this.ultBtn, 'bought-flash', 420);
      }
    });

    // Interactive Minimap touch & drag camera jump
    let minimapDragging = false;
    const jumpFromEvent = (clientX: number) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.camera.jumpToWorldX(ratio * WORLD_WIDTH);
    };

    this.minimapShell.addEventListener('pointerdown', (ev) => {
      this.onUnlockAudio();
      minimapDragging = true;
      this.minimapShell.setPointerCapture(ev.pointerId);
      jumpFromEvent(ev.clientX);
    });
    this.minimapShell.addEventListener('pointermove', (ev) => {
      if (!minimapDragging) return;
      jumpFromEvent(ev.clientX);
    });
    const stopMiniDrag = () => {
      minimapDragging = false;
    };
    this.minimapShell.addEventListener('pointerup', stopMiniDrag);
    this.minimapShell.addEventListener('pointercancel', stopMiniDrag);
  }

  public setUpgradeCategory(cat: UpgradeCategory): void {
    this.upgradeCategory = cat;
    for (const btn of this.upgPageButtons) {
      btn.classList.toggle('active', btn.dataset.upgCat === cat);
    }
  }

  public switchTab(tab: DockTab): void {
    this.activeTab = tab;
    this.sellHighlightMode = false;
    this.tabUnitsBtn.classList.toggle('active', tab === 'units');
    this.tabUnitsBtn.setAttribute('aria-selected', String(tab === 'units'));
    this.tabTurretsBtn.classList.toggle('active', tab === 'turrets');
    this.tabTurretsBtn.setAttribute('aria-selected', String(tab === 'turrets'));
    this.tabUpgradesBtn.classList.toggle('active', tab === 'upgrades');
    this.tabUpgradesBtn.setAttribute('aria-selected', String(tab === 'upgrades'));
    this.upgradePageSwitchEl.classList.toggle('hidden', tab !== 'upgrades');
  }

  private buildActionCards(eraIndex: number, tab: DockTab): void {
    const era = getEra(eraIndex);
    this.actionCardsEl.innerHTML = '';
    this.cachedCards = [];

    if (tab === 'units') {
      this.actionCardsEl.dataset.cols = String(era.units.length);
      for (const unit of era.units) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.tabIndex = -1;
        btn.className = 'action-card';
        btn.dataset.kind = 'unit';
        btn.dataset.unitId = unit.id;
        btn.title = `${unit.name} (${unit.cost}G)`;

        const iconUrl = getUnitIconUrl(unit.id);
        btn.innerHTML = `
          ${renderSpriteMarkup(iconUrl, unit.name)}
          <span class="card-name">${unit.shortName}</span>
          <span class="card-cost num">${unit.cost.toLocaleString()}G</span>
          <span class="card-queue-badge hidden"></span>
        `;

        bindButtonTap(btn, () => {
          this.onUnlockAudio();
          if (this.engine.enqueueUnit('player', unit.id as UnitVisualKind)) {
            this.onUiTap?.();
            this.onUnitEnqueued?.(unit.id as UnitVisualKind);
            this.pulseClass(btn, 'tap-pop', 190);
          }
        });
        this.actionCardsEl.appendChild(btn);
        this.cachedCards.push({
          btn,
          kind: 'unit',
          unitId: unit.id as UnitVisualKind,
          costEl: btn.querySelector<HTMLElement>('.card-cost'),
          queueBadgeEl: btn.querySelector<HTMLElement>('.card-queue-badge'),
          levelBadgeEl: null,
          slotCostEl: null,
          refundEl: null,
        });
      }
      return;
    }

    if (tab === 'upgrades') {
      const pageUpgrades = getUpgradesByCategory(this.upgradeCategory);
      this.actionCardsEl.dataset.cols = String(pageUpgrades.length);
      for (const upg of pageUpgrades) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.tabIndex = -1;
        btn.className = 'action-card upgrade-card';
        btn.dataset.kind = 'upgrade';
        btn.dataset.upgradeId = upg.id;
        btn.title = `${upg.name} (${upg.effectText})`;

        const iconUrl = getUpgradeIconUrl(upg.id);
        btn.innerHTML = `
          ${renderSpriteMarkup(iconUrl, upg.name, 'upgrade-sprite')}
          <span class="card-name">${upg.shortName}</span>
          <span class="card-effect">${upg.effectText}</span>
          <span class="card-cost num" data-upg-cost>${upg.costs[0].toLocaleString()}G</span>
          <span class="card-level-badge num" data-upg-level>Lv.0</span>
        `;

        bindButtonTap(
          btn,
          () => {
            if (performance.now() < this.suppressUpgradeClickUntil) return;
            this.onUnlockAudio();
            if (this.engine.buyUpgrade('player', upg.id)) {
              this.pulseClass(btn, 'bought-flash', 340);
            }
          },
          { cancelOnSwipe: true },
        );
        this.actionCardsEl.appendChild(btn);
        this.cachedCards.push({
          btn,
          kind: 'upgrade',
          upgradeId: upg.id,
          costEl: btn.querySelector<HTMLElement>('[data-upg-cost]'),
          queueBadgeEl: null,
          levelBadgeEl: btn.querySelector<HTMLElement>('[data-upg-level]'),
          slotCostEl: null,
          refundEl: null,
        });
      }
      return;
    }

    // Turrets Tab (4 cards: Expand Slot, Turret 1, Turret 2, Sell Turret)
    this.actionCardsEl.dataset.cols = '4';

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.tabIndex = -1;
    expandBtn.className = 'action-card';
    expandBtn.dataset.kind = 'expand_slot';
    expandBtn.innerHTML = `
      <div class="card-glyph">
        <svg viewBox="0 0 24 24" class="glyph-svg" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>
          <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="card-name">슬롯 확장</span>
      <span class="card-cost num" data-slot-cost>120G</span>
    `;
    bindButtonTap(expandBtn, () => {
      this.onUnlockAudio();
      if (this.engine.expandTurretSlot('player')) {
        this.pulseClass(expandBtn, 'bought-flash', 300);
      }
    });
    this.actionCardsEl.appendChild(expandBtn);
    this.cachedCards.push({
      btn: expandBtn,
      kind: 'expand_slot',
      costEl: null,
      queueBadgeEl: null,
      levelBadgeEl: null,
      slotCostEl: expandBtn.querySelector<HTMLElement>('[data-slot-cost]'),
      refundEl: null,
    });

    for (const turret of era.turrets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.tabIndex = -1;
      btn.className = 'action-card';
      btn.dataset.kind = 'turret';
      btn.dataset.turretId = turret.id;
      btn.title = `${turret.name} (${turret.cost}G)`;
      const iconUrl = getTurretIconUrl(turret.id);
      btn.innerHTML = `
        ${renderSpriteMarkup(iconUrl, turret.name)}
        <span class="card-name">${turret.shortName}</span>
        <span class="card-cost num">${turret.cost.toLocaleString()}G</span>
      `;
      bindButtonTap(btn, () => {
        this.onUnlockAudio();
        this.sellHighlightMode = false;
        const ok = this.engine.installTurret('player', turret.id as TurretVisualKind);
        if (ok) {
          this.pulseClass(btn, 'bought-flash', 300);
          this.camera.jumpToWorldX(260);
        }
      });
      this.actionCardsEl.appendChild(btn);
      this.cachedCards.push({
        btn,
        kind: 'turret',
        turretId: turret.id as TurretVisualKind,
        costEl: btn.querySelector<HTMLElement>('.card-cost'),
        queueBadgeEl: null,
        levelBadgeEl: null,
        slotCostEl: null,
        refundEl: null,
      });
    }

    const sellBtn = document.createElement('button');
    sellBtn.type = 'button';
    sellBtn.tabIndex = -1;
    sellBtn.className = 'action-card';
    sellBtn.dataset.kind = 'sell_turret';
    sellBtn.innerHTML = `
      <div class="card-glyph sell-glyph">
        <svg viewBox="0 0 24 24" class="glyph-svg" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7v10M15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.2 1.8 3 2.2 3 1 3 2.3-1.3 2-3 2-3-.8-3-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="card-name">포탑 판매</span>
      <span class="card-cost num" data-sell-refund>50% 환급</span>
    `;
    bindButtonTap(sellBtn, () => {
      this.onUnlockAudio();
      const installed = this.engine.player.turrets.filter((t) => t !== null);
      if (installed.length === 0) return;
      if (this.sellHighlightMode || installed.length === 1) {
        this.engine.sellTurret('player');
        this.sellHighlightMode = false;
        this.pulseClass(sellBtn, 'tap-pop', 200);
      } else {
        this.sellHighlightMode = true;
        this.onUiTap?.();
        this.camera.jumpToWorldX(220);
      }
    });
    this.actionCardsEl.appendChild(sellBtn);
    this.cachedCards.push({
      btn: sellBtn,
      kind: 'sell_turret',
      costEl: null,
      queueBadgeEl: null,
      levelBadgeEl: null,
      slotCostEl: null,
      refundEl: sellBtn.querySelector<HTMLElement>('[data-sell-refund]'),
    });
  }

  private updateActionCardStates(snapshot: GameSnapshot): void {
    const p = snapshot.player;
    const era = getEra(p.eraIndex);
    const cards = this.cachedCards;

    if (this.activeTab === 'units') {
      const queueFull = p.queue.length >= 5;
      for (let i = 0; i < cards.length; i++) {
        const ref = cards[i];
        const unitId = ref.unitId;
        if (!unitId) continue;
        const def = era.units.find((u) => u.id === unitId);
        if (!def) continue;
        const effCost = this.engine.getEffectiveUnitCost('player', def.cost);
        const canAfford = p.gold >= effCost && !queueFull;
        ref.btn.classList.toggle('unaffordable', !canAfford);

        if (ref.costEl) {
          setTextIfChanged(ref.costEl, `${effCost.toLocaleString()}G`);
        }

        let queuedCount = 0;
        for (let q = 0; q < p.queue.length; q++) {
          if (p.queue[q].unitId === unitId) queuedCount++;
        }
        if (ref.queueBadgeEl) {
          ref.queueBadgeEl.classList.toggle('hidden', queuedCount === 0);
          if (queuedCount > 0) {
            setTextIfChanged(ref.queueBadgeEl, `x${queuedCount}`);
          }
        }
      }
      return;
    }

    if (this.activeTab === 'upgrades') {
      for (let i = 0; i < cards.length; i++) {
        const ref = cards[i];
        const upgId = ref.upgradeId;
        if (!upgId || !UPGRADE_BY_ID[upgId]) continue;
        const level = p.upgrades[upgId];
        const nextCost = getNextUpgradeCost(upgId, level);
        const maxed = nextCost === null;

        if (ref.levelBadgeEl) {
          setTextIfChanged(ref.levelBadgeEl, maxed ? 'MAX' : `Lv.${level}`);
          ref.levelBadgeEl.classList.toggle('maxed', maxed);
        }

        if (ref.costEl) {
          setTextIfChanged(ref.costEl, maxed ? 'MAX' : `${nextCost.toLocaleString()}G`);
        }

        ref.btn.disabled = maxed;
        ref.btn.classList.toggle('maxed', maxed);
        ref.btn.classList.toggle('unaffordable', maxed || p.gold < nextCost);
      }
      return;
    }

    let hasEmptySlot = false;
    for (let i = 0; i < p.turretSlots; i++) {
      if (p.turrets[i] === null) {
        hasEmptySlot = true;
        break;
      }
    }
    let installedCount = 0;
    let oldestTurret = null as (typeof p.turrets)[number];
    for (let i = 0; i < p.turrets.length; i++) {
      const t = p.turrets[i];
      if (t !== null) {
        installedCount++;
        if (!oldestTurret || t.eraIndex < oldestTurret.eraIndex) {
          oldestTurret = t;
        }
      }
    }
    const nextSlotCost = this.engine.getNextTurretSlotCost('player');

    for (let i = 0; i < cards.length; i++) {
      const ref = cards[i];
      if (ref.kind === 'expand_slot') {
        if (nextSlotCost === null) {
          if (ref.slotCostEl) setTextIfChanged(ref.slotCostEl, 'MAX');
          ref.btn.disabled = true;
          ref.btn.classList.add('unaffordable');
        } else {
          if (ref.slotCostEl) setTextIfChanged(ref.slotCostEl, `${nextSlotCost.toLocaleString()}G`);
          const affordable = p.gold >= nextSlotCost;
          ref.btn.disabled = false;
          ref.btn.classList.toggle('unaffordable', !affordable);
        }
      } else if (ref.kind === 'turret') {
        const tid = ref.turretId;
        const def = era.turrets.find((t) => t.id === tid);
        if (!def) continue;
        const effCost = this.engine.getEffectiveTurretCost('player', def.cost);
        if (ref.costEl) setTextIfChanged(ref.costEl, `${effCost.toLocaleString()}G`);
        const ok = hasEmptySlot && p.gold >= effCost;
        ref.btn.classList.toggle('unaffordable', !ok);
      } else if (ref.kind === 'sell_turret') {
        const canSell = installedCount > 0;
        ref.btn.disabled = !canSell;
        ref.btn.classList.toggle('unaffordable', !canSell);
        ref.btn.classList.toggle('sell-active', this.sellHighlightMode && canSell);
        if (ref.refundEl) {
          if (!canSell || !oldestTurret) {
            setTextIfChanged(ref.refundEl, '포탑 없음');
          } else {
            setTextIfChanged(
              ref.refundEl,
              this.sellHighlightMode ? '다시 눌러 판매' : `+${Math.round(oldestTurret.cost * 0.5)}G`,
            );
          }
        }
      }
    }
  }

  private updateRelicStrip(snapshot: GameSnapshot): void {
    const relics = snapshot.player.relics;
    if (relics.length === this.lastRelicCount) return;
    this.lastRelicCount = relics.length;

    if (relics.length === 0) {
      this.relicStripEl.classList.add('hidden');
      this.relicStripEl.innerHTML = '';
      return;
    }

    this.relicStripEl.classList.remove('hidden');
    this.relicStripEl.innerHTML = relics
      .map((id) => {
        const r = RELIC_BY_ID[id];
        if (!r) return '';
        const icon = getRelicIconUrl(id);
        return `<span class="relic-chip rarity-${r.rarity}" title="${r.name}: ${r.effectText}">
          ${icon ? `<img src="${icon}" alt="${r.shortName}" draggable="false" />` : r.shortName}
        </span>`;
      })
      .join('');
  }

  private updateQueueBar(snapshot: GameSnapshot): void {
    const queue = snapshot.player.queue;
    if (queue.length === 0) {
      if (this.lastQueueSignature !== '') {
        this.queueBar.classList.add('hidden');
        this.lastQueueSignature = '';
        this.queueProgressEl = null;
        this.lastQueuePct = '';
      }
      return;
    }

    if (this.lastQueueSignature === '') {
      this.queueBar.classList.remove('hidden');
    }
    let signature = '';
    for (let i = 0; i < queue.length; i++) {
      signature += (i > 0 ? ',' : '') + queue[i].unitId;
    }
    if (signature !== this.lastQueueSignature) {
      this.lastQueueSignature = signature;
      this.queueBar.innerHTML = '';
      this.queueProgressEl = null;
      this.lastQueuePct = '';
      queue.forEach((item, idx) => {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.tabIndex = -1;
        slot.className = 'queue-slot';
        slot.title = '터치하여 생산 취소 (100% 환급)';
        const iconUrl = getUnitIconUrl(item.unitId);
        slot.innerHTML = `
          ${iconUrl ? `<img src="${iconUrl}" alt="" draggable="false" />` : '<span class="card-sprite-placeholder" aria-hidden="true"></span>'}
          <span class="queue-cancel-x">×</span>
          ${idx === 0 ? '<span class="queue-progress"></span>' : ''}
        `;
        bindButtonTap(slot, () => {
          this.onUnlockAudio();
          this.onUiTap?.();
          this.engine.cancelQueuedUnit('player', idx);
        });
        this.queueBar.appendChild(slot);
        if (idx === 0) {
          this.queueProgressEl = slot.querySelector<HTMLElement>('.queue-progress');
        }
      });
    }

    const head = queue[0];
    if (head && this.queueProgressEl) {
      const pct = `${Math.max(0, Math.min(100, (1 - head.remaining / head.trainTime) * 100)).toFixed(1)}%`;
      if (pct !== this.lastQueuePct) {
        this.lastQueuePct = pct;
        this.queueProgressEl.style.width = pct;
      }
    }
  }
}
