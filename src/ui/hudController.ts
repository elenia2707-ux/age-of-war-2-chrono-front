import { getEra } from '../data/eras';
import type { GameSnapshot, TurretVisualKind, UnitVisualKind } from '../data/types';
import type { BattleCamera } from '../game/camera';
import { WORLD_WIDTH } from '../game/constants';
import type { GameEngine } from '../game/engine';
import { getTurretIconUrl, getUnitIconUrl } from '../render/iconRenderer';
import { renderMinimap } from '../render/renderer';
import { formatDuration } from '../storage/records';

export type DockTab = 'units' | 'turrets';

export class HudController {
  public activeTab: DockTab = 'units';
  public sellHighlightMode = false;

  private topHud = document.getElementById('top-hud')!;
  private bottomHud = document.getElementById('bottom-hud')!;
  private queueBar = document.getElementById('queue-bar')!;
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

  private speedBtn = document.getElementById('btn-speed') as HTMLButtonElement;
  private muteBtn = document.getElementById('btn-mute') as HTMLButtonElement;
  private pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;

  private tabUnitsBtn = document.getElementById('tab-units') as HTMLButtonElement;
  private tabTurretsBtn = document.getElementById('tab-turrets') as HTMLButtonElement;
  private turretSlotCountEl = document.getElementById('turret-slot-count')!;
  private actionCardsEl = document.getElementById('action-cards')!;

  private evolveBtn = document.getElementById('btn-evolve') as HTMLButtonElement;
  private evolveFill = document.getElementById('evolve-fill')!;
  private evolveKicker = document.getElementById('evolve-kicker')!;
  private evolveLabel = document.getElementById('evolve-label')!;
  private evolveSub = document.getElementById('evolve-sub')!;

  private ultBtn = document.getElementById('btn-ultimate') as HTMLButtonElement;
  private ultFill = document.getElementById('ult-fill')!;
  private ultLabel = document.getElementById('ult-label')!;
  private ultSub = document.getElementById('ult-sub')!;

  private bannerEl = document.getElementById('event-banner')!;
  private bannerTitle = document.getElementById('event-banner-title')!;
  private bannerSub = document.getElementById('event-banner-sub')!;
  private bannerTimer: number | null = null;

  private renderedEra = -1;
  private renderedTab: DockTab | null = null;
  private lastQueueSignature = '';

  private engine: GameEngine;
  private camera: BattleCamera;
  private onToggleMute: () => boolean;
  private onTogglePause: () => void;
  private onUnlockAudio: () => void;

  constructor(params: {
    engine: GameEngine;
    camera: BattleCamera;
    onToggleMute: () => boolean;
    onTogglePause: () => void;
    onUnlockAudio: () => void;
  }) {
    this.engine = params.engine;
    this.camera = params.camera;
    this.onToggleMute = params.onToggleMute;
    this.onTogglePause = params.onTogglePause;
    this.onUnlockAudio = params.onUnlockAudio;

    this.bindEvents();
  }

  public setVisible(visible: boolean): void {
    this.topHud.classList.toggle('hidden', !visible);
    this.bottomHud.classList.toggle('hidden', !visible);
    if (!visible) {
      this.queueBar.classList.add('hidden');
      this.sellHighlightMode = false;
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
    this.bannerEl.classList.remove('hidden');

    if (this.bannerTimer !== null) {
      window.clearTimeout(this.bannerTimer);
    }
    this.bannerTimer = window.setTimeout(() => {
      this.bannerEl.classList.add('hidden');
      this.bannerTimer = null;
    }, 2800);
  }

  public forceRebuildCards(): void {
    this.renderedEra = -1;
    this.renderedTab = null;
    this.lastQueueSignature = '';
  }

  public update(snapshot: GameSnapshot): void {
    const p = snapshot.player;
    const e = snapshot.enemy;
    const era = getEra(p.eraIndex);

    // Top stats
    this.goldEl.textContent = Math.floor(p.gold).toLocaleString();
    this.xpEl.textContent =
      era.evolveXp > 0
        ? `${Math.floor(p.xp).toLocaleString()}/${era.evolveXp.toLocaleString()}`
        : `${Math.floor(p.totalXp).toLocaleString()} MAX`;
    this.eraBadgeEl.textContent = `${era.roman} ${era.shortName}`;

    this.playerHpEl.textContent = Math.ceil(p.baseHp).toLocaleString();
    this.enemyHpEl.textContent = Math.ceil(e.baseHp).toLocaleString();
    this.playerHpBar.style.width = `${Math.max(0, Math.min(100, (p.baseHp / p.baseMaxHp) * 100)).toFixed(1)}%`;
    this.enemyHpBar.style.width = `${Math.max(0, Math.min(100, (e.baseHp / e.baseMaxHp) * 100)).toFixed(1)}%`;
    this.timerEl.textContent = formatDuration(snapshot.elapsed);

    // Speed visual
    this.speedBtn.textContent = `${snapshot.speed}x`;
    this.speedBtn.classList.toggle('active', snapshot.speed === 2);

    // Turret slot count badge
    const installedCount = p.turrets.filter((t) => t !== null).length;
    this.turretSlotCountEl.textContent = `${installedCount}/${p.turretSlots}`;

    // Rebuild bottom action cards only when era or active tab changes
    if (this.renderedEra !== p.eraIndex || this.renderedTab !== this.activeTab) {
      this.buildActionCards(p.eraIndex, this.activeTab);
      this.renderedEra = p.eraIndex;
      this.renderedTab = this.activeTab;
    }

    // Update affordability & badges on cards
    this.updateActionCardStates(snapshot);

    // Update production queue floating bar
    this.updateQueueBar(snapshot);

    // Update Evolve power button
    if (era.evolveXp > 0) {
      const nextEra = getEra(p.eraIndex + 1);
      const frac = Math.min(1, p.xp / era.evolveXp);
      const ready = p.xp >= era.evolveXp;
      this.evolveKicker.textContent = '시대 진화';
      this.evolveLabel.textContent = `${nextEra.roman} ${nextEra.shortName}`;
      this.evolveSub.textContent = ready ? '진화 가능!' : `${Math.max(0, Math.ceil(era.evolveXp - p.xp))} XP`;
      this.evolveFill.style.height = `${(frac * 100).toFixed(1)}%`;
      this.evolveBtn.classList.toggle('ready', ready);
      this.evolveBtn.disabled = !ready;
    } else {
      this.evolveKicker.textContent = '최종 시대';
      this.evolveLabel.textContent = 'VII 미래';
      this.evolveSub.textContent = 'MAX';
      this.evolveFill.style.height = '100%';
      this.evolveBtn.classList.remove('ready');
      this.evolveBtn.disabled = true;
    }

    // Update Ultimate power button
    const ultReady = p.ultimateCooldown <= 0;
    const ultFrac = ultReady ? 1 : Math.max(0, 1 - p.ultimateCooldown / Math.max(1, p.ultimateMaxCooldown));
    this.ultLabel.textContent = era.ultimate.shortName;
    this.ultSub.textContent = ultReady ? 'READY' : `${Math.ceil(p.ultimateCooldown)}s`;
    this.ultFill.style.height = `${(ultFrac * 100).toFixed(1)}%`;
    this.ultBtn.classList.toggle('ready', ultReady);
    this.ultBtn.disabled = !ultReady;

    // Render live minimap
    renderMinimap(this.minimapCanvas, snapshot, this.camera);
  }

  private bindEvents(): void {
    this.speedBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.engine.toggleSpeed();
    });

    this.muteBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      const muted = this.onToggleMute();
      this.setMutedVisual(muted);
    });

    this.pauseBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.onTogglePause();
    });

    this.tabUnitsBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.switchTab('units');
    });

    this.tabTurretsBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.switchTab('turrets');
    });

    this.evolveBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.engine.evolve('player');
    });

    this.ultBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.engine.triggerUltimate('player');
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

  public switchTab(tab: DockTab): void {
    this.activeTab = tab;
    this.sellHighlightMode = false;
    this.tabUnitsBtn.classList.toggle('active', tab === 'units');
    this.tabUnitsBtn.setAttribute('aria-selected', String(tab === 'units'));
    this.tabTurretsBtn.classList.toggle('active', tab === 'turrets');
    this.tabTurretsBtn.setAttribute('aria-selected', String(tab === 'turrets'));
  }

  private buildActionCards(eraIndex: number, tab: DockTab): void {
    const era = getEra(eraIndex);
    this.actionCardsEl.innerHTML = '';

    if (tab === 'units') {
      this.actionCardsEl.dataset.cols = String(era.units.length);
      for (const unit of era.units) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action-card';
        btn.dataset.kind = 'unit';
        btn.dataset.unitId = unit.id;
        btn.title = `${unit.name} (${unit.cost}G)`;

        const iconUrl = getUnitIconUrl(unit.id);
        btn.innerHTML = `
          <img class="card-sprite" src="${iconUrl}" alt="${unit.name}" />
          <span class="card-name">${unit.shortName}</span>
          <span class="card-cost num">${unit.cost.toLocaleString()}G</span>
          <span class="card-queue-badge hidden"></span>
        `;

        btn.addEventListener('click', () => {
          this.onUnlockAudio();
          this.engine.enqueueUnit('player', unit.id as UnitVisualKind);
        });
        this.actionCardsEl.appendChild(btn);
      }
      return;
    }

    // Turrets Tab (4 cards: Expand Slot, Turret 1, Turret 2, Sell Turret)
    this.actionCardsEl.dataset.cols = '4';

    // 1. Expand Slot Card
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
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
    expandBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      this.engine.expandTurretSlot('player');
    });
    this.actionCardsEl.appendChild(expandBtn);

    // 2 & 3. Era Turrets
    for (const turret of era.turrets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'action-card';
      btn.dataset.kind = 'turret';
      btn.dataset.turretId = turret.id;
      btn.title = `${turret.name} (${turret.cost}G)`;
      const iconUrl = getTurretIconUrl(turret.id);
      btn.innerHTML = `
        <img class="card-sprite" src="${iconUrl}" alt="${turret.name}" />
        <span class="card-name">${turret.shortName}</span>
        <span class="card-cost num">${turret.cost.toLocaleString()}G</span>
      `;
      btn.addEventListener('click', () => {
        this.onUnlockAudio();
        this.sellHighlightMode = false;
        const ok = this.engine.installTurret('player', turret.id as TurretVisualKind);
        if (ok) {
          this.camera.jumpToWorldX(260);
        }
      });
      this.actionCardsEl.appendChild(btn);
    }

    // 4. Sell Turret Card
    const sellBtn = document.createElement('button');
    sellBtn.type = 'button';
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
    sellBtn.addEventListener('click', () => {
      this.onUnlockAudio();
      const installed = this.engine.player.turrets.filter((t) => t !== null);
      if (installed.length === 0) return;
      if (this.sellHighlightMode || installed.length === 1) {
        this.engine.sellTurret('player');
        this.sellHighlightMode = false;
      } else {
        // First tap focuses base & highlights turrets; tap a turret on base OR tap Sell again to sell oldest
        this.sellHighlightMode = true;
        this.camera.jumpToWorldX(220);
      }
    });
    this.actionCardsEl.appendChild(sellBtn);
  }

  private updateActionCardStates(snapshot: GameSnapshot): void {
    const p = snapshot.player;
    const era = getEra(p.eraIndex);
    const cards = this.actionCardsEl.querySelectorAll<HTMLButtonElement>('.action-card');

    if (this.activeTab === 'units') {
      const queueFull = p.queue.length >= 5;
      for (const card of cards) {
        const unitId = card.dataset.unitId as UnitVisualKind;
        const def = era.units.find((u) => u.id === unitId);
        if (!def) continue;
        const canAfford = p.gold >= def.cost && !queueFull;
        card.classList.toggle('unaffordable', !canAfford);

        const queuedCount = p.queue.filter((q) => q.unitId === unitId).length;
        const badge = card.querySelector<HTMLElement>('.card-queue-badge');
        if (badge) {
          badge.classList.toggle('hidden', queuedCount === 0);
          badge.textContent = `x${queuedCount}`;
        }
      }
      return;
    }

    const hasEmptySlot = p.turrets.slice(0, p.turretSlots).some((t) => t === null);
    const installed = p.turrets.filter((t) => t !== null);
    const nextSlotCost = this.engine.getNextTurretSlotCost('player');

    for (const card of cards) {
      const kind = card.dataset.kind;
      if (kind === 'expand_slot') {
        const costEl = card.querySelector<HTMLElement>('[data-slot-cost]');
        if (nextSlotCost === null) {
          if (costEl) costEl.textContent = 'MAX';
          card.disabled = true;
          card.classList.add('unaffordable');
        } else {
          if (costEl) costEl.textContent = `${nextSlotCost.toLocaleString()}G`;
          const affordable = p.gold >= nextSlotCost;
          card.disabled = false;
          card.classList.toggle('unaffordable', !affordable);
        }
      } else if (kind === 'turret') {
        const tid = card.dataset.turretId as TurretVisualKind;
        const def = era.turrets.find((t) => t.id === tid);
        if (!def) continue;
        const ok = hasEmptySlot && p.gold >= def.cost;
        card.classList.toggle('unaffordable', !ok);
      } else if (kind === 'sell_turret') {
        const canSell = installed.length > 0;
        card.disabled = !canSell;
        card.classList.toggle('unaffordable', !canSell);
        card.classList.toggle('sell-active', this.sellHighlightMode && canSell);
        const refundEl = card.querySelector<HTMLElement>('[data-sell-refund]');
        if (refundEl) {
          if (!canSell) {
            refundEl.textContent = '포탑 없음';
          } else {
            const oldest = installed.reduce((best, cur) => (cur!.eraIndex < best!.eraIndex ? cur : best))!;
            refundEl.textContent = this.sellHighlightMode
              ? '다시 눌러 판매'
              : `+${Math.round(oldest.cost * 0.5)}G`;
          }
        }
      }
    }
  }

  private updateQueueBar(snapshot: GameSnapshot): void {
    const queue = snapshot.player.queue;
    if (queue.length === 0) {
      this.queueBar.classList.add('hidden');
      this.lastQueueSignature = '';
      return;
    }

    this.queueBar.classList.remove('hidden');
    const signature = queue.map((q) => q.unitId).join(',');
    if (signature !== this.lastQueueSignature) {
      this.lastQueueSignature = signature;
      this.queueBar.innerHTML = '';
      queue.forEach((item, idx) => {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'queue-slot';
        slot.title = '터치하여 생산 취소 (100% 환급)';
        slot.innerHTML = `
          <img src="${getUnitIconUrl(item.unitId)}" alt="" />
          <span class="queue-cancel-x">×</span>
          ${idx === 0 ? '<span class="queue-progress"></span>' : ''}
        `;
        slot.addEventListener('click', () => {
          this.onUnlockAudio();
          this.engine.cancelQueuedUnit('player', idx);
        });
        this.queueBar.appendChild(slot);
      });
    }

    // Update live training progress bar on first slot
    const head = queue[0];
    const progressEl = this.queueBar.querySelector<HTMLElement>('.queue-progress');
    if (head && progressEl) {
      const pct = Math.max(0, Math.min(100, (1 - head.remaining / head.trainTime) * 100));
      progressEl.style.width = `${pct.toFixed(1)}%`;
    }
  }
}
