import { COMMANDER_LIST, COMMANDERS } from '../data/commanders';
import { DIFFICULTIES, DIFFICULTY_LIST } from '../data/difficulty';
import { ERAS, getEra } from '../data/eras';
import {
  ACHIEVEMENTS,
  DAILY_MUTATORS,
  getDailyChallengeInfo,
  getSanctuaryCost,
  SANCTUARY_UPGRADES,
} from '../data/metaProgression';
import { RELIC_BY_ID, RELIC_SYNERGIES, RELICS } from '../data/relics';
import type {
  CommanderId,
  DifficultyId,
  GameMode,
  GameSnapshot,
  RelicId,
} from '../data/types';
import {
  getCommanderIconUrl,
  getRelicIconUrl,
  getSanctuaryIconUrl,
  getUnitIconUrl,
} from '../render/iconRenderer';
import {
  buySanctuaryUpgrade,
  formatDuration,
  loadRecords,
  resetSanctuaryUpgrades,
  setSelectedCommander,
  type MatchResultSummary,
  type PlayerRecords,
} from '../storage/records';
import { bindButtonTap } from './tap';

type CodexTab = 'ach' | 'relics' | 'units';

export interface StartLaunchConfig {
  mode: GameMode;
  difficulty: DifficultyId;
  commanderId: CommanderId;
}

export class OverlayController {
  public selectedDifficulty: DifficultyId = 'normal';
  public selectedMode: GameMode = 'campaign';
  public selectedCommander: CommanderId = 'vanguard';

  private codexTab: CodexTab = 'ach';
  private codexPage = 0;

  private titleOverlay = document.getElementById('overlay-title')!;
  private sanctuaryOverlay = document.getElementById('overlay-sanctuary')!;
  private codexOverlay = document.getElementById('overlay-codex')!;
  private relicOverlay = document.getElementById('overlay-relic')!;
  private pauseOverlay = document.getElementById('overlay-pause')!;
  private resultOverlay = document.getElementById('overlay-result')!;
  private rotateOverlay = document.getElementById('overlay-rotate')!;

  private titleMedalBadge = document.getElementById('title-medal-badge')!;
  private sanctuaryLvBadge = document.getElementById('sanctuary-lv-badge')!;
  private codexCountBadge = document.getElementById('codex-count-badge')!;
  private commanderSelectorEl = document.getElementById('commander-selector')!;
  private commanderDescEl = document.getElementById('commander-desc')!;

  private modeSelectorEl = document.getElementById('mode-selector')!;
  private diffHeadingLabel = document.getElementById('diff-heading-label')!;
  private diffSelector = document.getElementById('difficulty-selector')!;
  private diffDescEl = document.getElementById('difficulty-desc');
  private titleRecordsEl = document.getElementById('title-records')!;
  private latestRecords: PlayerRecords | null = null;

  private sanctuaryMedalsEl = document.getElementById('sanctuary-medals')!;
  private sanctuaryGridEl = document.getElementById('sanctuary-grid')!;

  private codexPageLabelEl = document.getElementById('codex-page-label')!;
  private codexGridEl = document.getElementById('codex-grid')!;
  private codexPrevBtn = document.getElementById('btn-codex-prev') as HTMLButtonElement;
  private codexNextBtn = document.getElementById('btn-codex-next') as HTMLButtonElement;

  private relicDraftCardsEl = document.getElementById('relic-draft-cards')!;
  private relicRerollBtn = document.getElementById('btn-relic-reroll') as HTMLButtonElement | null;

  private resultModal = document.getElementById('result-modal');
  private resultConfetti = document.getElementById('result-confetti');
  private resultBadge = document.getElementById('result-badge')!;
  private resultTitle = document.getElementById('result-title')!;
  private resultSub = document.getElementById('result-subtitle')!;
  private resultStats = document.getElementById('result-stats')!;
  private resultRelicsEl = document.getElementById('result-relics')!;

  private onUiTap?: () => void;
  private onUpgradeSound?: () => void;
  private onSelectRelic?: (relicId: RelicId) => void;
  private onRerollRelic?: () => boolean;
  private getDraftContext?: () => { ownedRelics: RelicId[]; rerollsLeft: number };

  constructor(callbacks: {
    onStart: (launch: StartLaunchConfig) => void;
    onResume: () => void;
    onRestart: () => void;
    onReturnTitle: () => void;
    onSelectRelic: (relicId: RelicId) => void;
    onRerollRelic?: () => boolean;
    getDraftContext?: () => { ownedRelics: RelicId[]; rerollsLeft: number };
    onUiTap?: () => void;
    onUpgradeSound?: () => void;
  }) {
    this.onUiTap = callbacks.onUiTap;
    this.onUpgradeSound = callbacks.onUpgradeSound;
    this.onSelectRelic = callbacks.onSelectRelic;
    this.onRerollRelic = callbacks.onRerollRelic;
    this.getDraftContext = callbacks.getDraftContext;

    const initial = loadRecords();
    this.selectedCommander = initial.selectedCommander;

    this.buildCommanderButtons();
    this.buildModeButtons();
    this.buildDifficultyButtons();
    this.bindMetaModals();

    if (this.relicRerollBtn) {
      bindButtonTap(this.relicRerollBtn, () => {
        if (this.onRerollRelic?.()) {
          this.onUiTap?.();
        }
      });
    }

    bindButtonTap(document.getElementById('btn-start-game') as HTMLButtonElement, () => {
      const daily = getDailyChallengeInfo();
      const diff = this.selectedMode === 'daily' ? daily.difficulty : this.selectedDifficulty;
      callbacks.onStart({
        mode: this.selectedMode,
        difficulty: diff,
        commanderId: this.selectedCommander,
      });
    });
    bindButtonTap(document.getElementById('btn-resume') as HTMLButtonElement, callbacks.onResume);
    bindButtonTap(document.getElementById('btn-pause-restart') as HTMLButtonElement, callbacks.onRestart);
    bindButtonTap(document.getElementById('btn-pause-title') as HTMLButtonElement, callbacks.onReturnTitle);
    bindButtonTap(document.getElementById('btn-result-retry') as HTMLButtonElement, callbacks.onRestart);
    bindButtonTap(document.getElementById('btn-result-title') as HTMLButtonElement, callbacks.onReturnTitle);
  }

  private replayModalEnter(overlayEl: Element): void {
    const modal = overlayEl.querySelector('.glass-modal');
    if (!modal) return;
    modal.classList.remove('modal-enter');
    modal.classList.add('modal-enter');
    modal.addEventListener(
      'animationend',
      () => {
        modal.classList.remove('modal-enter');
      },
      { once: true },
    );
  }

  public showTitle(records: PlayerRecords): void {
    this.latestRecords = records;
    this.selectedCommander = records.selectedCommander;
    this.syncCommanderSelection();
    this.renderTitleMetaBadges(records);
    this.renderTitleRecords(records);
    this.updateModeAndDifficultyUI();
    this.titleOverlay.classList.remove('hidden');
    this.sanctuaryOverlay.classList.add('hidden');
    this.codexOverlay.classList.add('hidden');
    this.relicOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.resultOverlay.classList.add('hidden');
    this.replayModalEnter(this.titleOverlay);
  }

  public hideAllGameOverlays(): void {
    this.titleOverlay.classList.add('hidden');
    this.sanctuaryOverlay.classList.add('hidden');
    this.codexOverlay.classList.add('hidden');
    this.relicOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.resultOverlay.classList.add('hidden');
  }

  public isRelicDraftOpen(): boolean {
    return !this.relicOverlay.classList.contains('hidden');
  }

  public showRelicDraft(choices: RelicId[]): void {
    if (choices.length === 0) return;
    const wasOpen = this.isRelicDraftOpen();
    this.relicDraftCardsEl.innerHTML = '';

    const ctx = this.getDraftContext?.() ?? { ownedRelics: [], rerollsLeft: 0 };
    if (this.relicRerollBtn) {
      this.relicRerollBtn.textContent =
        ctx.rerollsLeft > 0 ? `🎲 재추첨 (${ctx.rerollsLeft})` : '🎲 재추첨 소진';
      this.relicRerollBtn.disabled = ctx.rerollsLeft <= 0;
    }

    for (const id of choices) {
      const def = RELIC_BY_ID[id];
      if (!def) continue;
      const syn = RELIC_SYNERGIES[def.synergy];
      let currentSynCount = 0;
      for (const ownedId of ctx.ownedRelics) {
        if (RELIC_BY_ID[ownedId]?.synergy === def.synergy) currentSynCount++;
      }
      const nextSynCount = currentSynCount + 1;
      const unlocksSet = nextSynCount === 2 || nextSynCount === 3;
      const synLabel =
        nextSynCount >= 3
          ? `${syn.glyph} ${syn.shortName} 3세트!`
          : nextSynCount === 2
            ? `${syn.glyph} ${syn.shortName} 2세트!`
            : `${syn.glyph} ${syn.shortName} ${nextSynCount}/2`;
      const synTip = nextSynCount >= 3 ? syn.threeSetDesc : syn.twoSetDesc;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `relic-draft-card rarity-${def.rarity}${unlocksSet ? ' synergy-ready' : ''}`;
      card.dataset.relicId = def.id;
      card.style.setProperty('--relic-accent', def.accentColor);
      const rarityLabel =
        def.rarity === 'mythic' ? '신화' : def.rarity === 'epic' ? '영웅' : '희귀';
      const iconUrl = getRelicIconUrl(def.id);
      card.innerHTML = `
        <div class="relic-card-badges">
          <span class="relic-rarity-pill">${rarityLabel}</span>
          <span class="relic-synergy-pill${unlocksSet ? ' active' : ''}" style="--syn-color:${syn.accentColor}" title="${synTip}">${synLabel}</span>
        </div>
        <div class="relic-icon-frame">
          ${iconUrl ? `<img src="${iconUrl}" alt="${def.name}" draggable="false" />` : ''}
        </div>
        <strong class="relic-card-title">${def.name}</strong>
        <p class="relic-card-effect">${def.effectText}</p>
        <span class="relic-card-flavor">${unlocksSet ? `시너지 각성: ${synTip}` : def.flavorText}</span>
        <span class="relic-pick-cta">${unlocksSet ? '✨ 시너지 각성!' : '선택 공명'}</span>
      `;
      bindButtonTap(card, () => {
        this.relicOverlay.classList.add('hidden');
        this.onSelectRelic?.(def.id);
      });
      this.relicDraftCardsEl.appendChild(card);
    }

    this.relicOverlay.classList.remove('hidden');
    if (!wasOpen) {
      this.replayModalEnter(this.relicOverlay);
    }
  }

  public showPause(): void {
    this.pauseOverlay.classList.remove('hidden');
    this.replayModalEnter(this.pauseOverlay);
  }

  public hidePause(): void {
    this.pauseOverlay.classList.add('hidden');
  }

  public showResult(snapshot: GameSnapshot, summary: MatchResultSummary): void {
    const { records, isNewBestTime, isNewBestWave, medalsEarned, newlyUnlockedAchievements } = summary;
    const isEndless = snapshot.mode === 'endless';
    const won = snapshot.status === 'victory';
    const celebrate = won || (isEndless && snapshot.wave >= 5);
    const diff = DIFFICULTIES[snapshot.difficulty];
    const reachedEra = getEra(snapshot.player.eraIndex);
    const bestTime = records.bestVictoryTimeSec[snapshot.difficulty];

    this.resultModal?.classList.toggle('victory-mode', celebrate);
    this.resultModal?.classList.toggle('defeat-mode', !celebrate);
    this.resultConfetti?.classList.toggle('hidden', !celebrate);

    if (isEndless) {
      this.resultBadge.textContent = isNewBestWave
        ? `NEW RECORD · WAVE ${snapshot.wave}`
        : `ENDLESS · WAVE ${snapshot.wave}`;
      this.resultBadge.classList.toggle('defeat', false);
      this.resultBadge.classList.toggle('new-record', isNewBestWave);
      this.resultTitle.textContent = `무한 웨이브 ${snapshot.wave} 돌파!`;
      this.resultSub.textContent = `획득 메달 +🏅${medalsEarned} · 최고 콤보 ${snapshot.player.maxCombo} · 보스 토벌 ${snapshot.player.bossKills}기`;
    } else {
      this.resultBadge.textContent = won
        ? isNewBestTime
          ? 'NEW RECORD · VICTORY'
          : 'VICTORY'
        : 'DEFEAT';
      this.resultBadge.classList.toggle('defeat', !won);
      this.resultBadge.classList.toggle('new-record', won && isNewBestTime);
      this.resultTitle.textContent = won
        ? snapshot.mode === 'daily'
          ? '일일 시공 챌린지 제패!'
          : '적 기지 파괴!'
        : '기지 함락';
      this.resultSub.textContent = won
        ? `${diff.name} 난이도를 ${formatDuration(snapshot.elapsed)} 만에 제패! (+🏅${medalsEarned} 크로노 메달 획득)`
        : `${reachedEra.name}에서 분전했습니다 (+🏅${medalsEarned} 크로노 메달 획득 · 성소에서 영구 강화 가능!)`;
    }

    const fourthCell = isEndless
      ? `<span>최고 무한 웨이브</span><strong class="num">WAVE ${records.bestEndlessWave}</strong>`
      : `<span>${diff.name} 최단 기록</span><strong class="num">${formatDuration(bestTime)}</strong>`;

    this.resultStats.innerHTML = `
      <div class="result-stat-item" style="--stagger:0">
        <span>획득 크로노 메달</span>
        <strong class="num" style="color:#fde047">+🏅 ${medalsEarned} (보유 ${records.chronoMedals})</strong>
      </div>
      <div class="result-stat-item" style="--stagger:1">
        <span>전투 시간 · 도달 시대</span>
        <strong class="num">${formatDuration(snapshot.elapsed)} · ${reachedEra.roman} ${reachedEra.shortName}</strong>
      </div>
      <div class="result-stat-item" style="--stagger:2">
        <span>처치 / 최대 콤보 / 보스</span>
        <strong class="num">${snapshot.player.kills}킬 · ${snapshot.player.maxCombo}콤보 · ${snapshot.player.bossKills}보스</strong>
      </div>
      <div class="result-stat-item" style="--stagger:3">
        ${fourthCell}
      </div>
    `;

    const maxRelicsShown = 5;
    const shownRelics = snapshot.player.relics.slice(0, maxRelicsShown);
    const extraRelics = Math.max(0, snapshot.player.relics.length - shownRelics.length);
    let relicItems = shownRelics
      .map((id) => {
        const r = RELIC_BY_ID[id];
        if (!r) return '';
        const icon = getRelicIconUrl(id);
        return `<span class="result-mini-chip">${icon ? `<img src="${icon}" alt="" />` : ''}${r.shortName}</span>`;
      })
      .join('');
    if (extraRelics > 0) {
      relicItems += `<span class="result-mini-chip">+유물 ${extraRelics}종</span>`;
    }

    const maxAchShown = 3;
    const shownAch = newlyUnlockedAchievements.slice(0, maxAchShown);
    const extraAch = Math.max(0, newlyUnlockedAchievements.length - shownAch.length);
    let achItems = shownAch
      .map((a) => `<span class="result-mini-chip ach-chip">🏆 ${a.name} (+🏅${a.medalReward})</span>`)
      .join('');
    if (extraAch > 0) {
      achItems += `<span class="result-mini-chip ach-chip">🏆 외 ${extraAch}개 달성!</span>`;
    }

    if (relicItems || achItems) {
      this.resultRelicsEl.classList.remove('hidden');
      this.resultRelicsEl.innerHTML = relicItems + achItems;
    } else {
      this.resultRelicsEl.classList.add('hidden');
      this.resultRelicsEl.innerHTML = '';
    }

    this.resultOverlay.classList.remove('hidden');
    this.replayModalEnter(this.resultOverlay);
  }

  public setPortraitWarning(isPortrait: boolean): void {
    this.rotateOverlay.classList.toggle('hidden', !isPortrait);
  }

  private buildCommanderButtons(): void {
    this.commanderSelectorEl.innerHTML = '';
    for (const cmd of COMMANDER_LIST) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `commander-btn${cmd.id === this.selectedCommander ? ' selected' : ''}`;
      btn.dataset.cmd = cmd.id;
      btn.style.setProperty('--cmd-accent', cmd.accentColor);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(cmd.id === this.selectedCommander));
      const iconUrl = getCommanderIconUrl(cmd.id);
      btn.innerHTML = `
        ${iconUrl ? `<img class="cmd-icon" src="${iconUrl}" alt="${cmd.name}" draggable="false" />` : ''}
        <div class="cmd-meta">
          <strong>${cmd.name}</strong>
          <small>${cmd.skillShort}</small>
        </div>
      `;
      bindButtonTap(btn, () => {
        this.onUiTap?.();
        this.selectedCommander = cmd.id;
        this.latestRecords = setSelectedCommander(cmd.id);
        this.syncCommanderSelection();
      });
      this.commanderSelectorEl.appendChild(btn);
    }
    this.syncCommanderSelection();
  }

  private syncCommanderSelection(): void {
    const cmd = COMMANDERS[this.selectedCommander] ?? COMMANDERS.vanguard;
    for (const el of this.commanderSelectorEl.querySelectorAll<HTMLButtonElement>('.commander-btn')) {
      const active = el.dataset.cmd === cmd.id;
      el.classList.toggle('selected', active);
      el.setAttribute('aria-checked', String(active));
    }
    this.commanderDescEl.textContent = `[패시브] ${cmd.passiveDesc} · [전술] ${cmd.skillName} (${cmd.cooldown}s)`;
    this.commanderDescEl.style.borderColor = cmd.accentColor;
  }

  private buildModeButtons(): void {
    const buttons = this.modeSelectorEl.querySelectorAll<HTMLButtonElement>('[data-mode]');
    for (const btn of buttons) {
      bindButtonTap(btn, () => {
        this.onUiTap?.();
        const mode = btn.dataset.mode as GameMode | undefined;
        if (!mode) return;
        this.selectedMode = mode;
        for (const b of buttons) {
          b.classList.toggle('selected', b.dataset.mode === mode);
        }
        this.updateModeAndDifficultyUI();
        if (this.latestRecords) this.renderTitleRecords(this.latestRecords);
      });
    }
  }

  private buildDifficultyButtons(): void {
    this.diffSelector.innerHTML = '';
    for (const diff of DIFFICULTY_LIST) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `diff-btn diff-${diff.id}${diff.id === this.selectedDifficulty ? ' selected' : ''}`;
      btn.dataset.diff = diff.id;
      btn.style.setProperty('--diff-accent', diff.accentColor);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(diff.id === this.selectedDifficulty));
      btn.innerHTML = `<strong>${diff.name}</strong><small>${diff.shortTag}</small>`;

      bindButtonTap(btn, () => {
        if (this.selectedMode === 'daily') return;
        this.onUiTap?.();
        this.selectedDifficulty = diff.id;
        this.updateModeAndDifficultyUI();
        if (this.latestRecords) {
          this.renderTitleRecords(this.latestRecords);
        }
      });

      this.diffSelector.appendChild(btn);
    }
    this.updateModeAndDifficultyUI();
  }

  private updateModeAndDifficultyUI(): void {
    const isDaily = this.selectedMode === 'daily';
    const daily = getDailyChallengeInfo();
    const activeDiffId = isDaily ? daily.difficulty : this.selectedDifficulty;
    const diff = DIFFICULTIES[activeDiffId];

    for (const el of this.diffSelector.querySelectorAll<HTMLButtonElement>('.diff-btn')) {
      const active = el.dataset.diff === activeDiffId;
      el.classList.toggle('selected', active);
      el.classList.toggle('locked-mode', isDaily && !active);
      el.setAttribute('aria-checked', String(active));
    }

    if (isDaily) {
      const m1 = DAILY_MUTATORS[daily.mutators[0]];
      const m2 = DAILY_MUTATORS[daily.mutators[1]];
      const cleared = this.latestRecords?.dailyClearedDate === daily.dateKey;
      this.diffHeadingLabel.textContent = `오늘의 시공 챌린지 (${daily.dateKey}) ${cleared ? '· ✅ 클리어 완료' : '· 첫 클리어 +🏅35'}`;
      if (this.diffDescEl) {
        this.diffDescEl.textContent = `[${m1.name}] ${m1.description} / [${m2.name}] ${m2.description}`;
        this.diffDescEl.style.borderColor = '#fde047';
      }
    } else if (this.selectedMode === 'endless') {
      this.diffHeadingLabel.textContent = '무한 크로노 웨이브 — AI 난이도 선택';
      if (this.diffDescEl) {
        this.diffDescEl.textContent = `매 28초(또는 적 차원문 돌파 시 즉시!) 웨이브 상승 · 3웨이브마다 유물 드래프트 · 5웨이브마다 수호군주 보스 출현`;
        this.diffDescEl.style.borderColor = '#c084fc';
      }
    } else {
      this.diffHeadingLabel.textContent = 'AI 난이도 선택 (6단계)';
      if (this.diffDescEl) {
        this.diffDescEl.textContent = diff.description;
        this.diffDescEl.style.borderColor = diff.accentColor;
      }
    }
  }

  private bindMetaModals(): void {
    bindButtonTap(document.getElementById('btn-open-sanctuary') as HTMLButtonElement, () => {
      this.onUiTap?.();
      this.openSanctuary();
    });
    bindButtonTap(document.getElementById('btn-sanctuary-close') as HTMLButtonElement, () => {
      this.onUiTap?.();
      this.sanctuaryOverlay.classList.add('hidden');
      const rec = loadRecords();
      this.latestRecords = rec;
      this.renderTitleMetaBadges(rec);
    });
    bindButtonTap(document.getElementById('btn-sanctuary-reset') as HTMLButtonElement, () => {
      const res = resetSanctuaryUpgrades();
      this.latestRecords = res.records;
      this.onUiTap?.();
      this.renderSanctuaryModal();
      this.renderTitleMetaBadges(res.records);
    });

    bindButtonTap(document.getElementById('btn-open-codex') as HTMLButtonElement, () => {
      this.onUiTap?.();
      this.codexPage = 0;
      this.openCodex();
    });
    bindButtonTap(document.getElementById('btn-codex-close') as HTMLButtonElement, () => {
      this.onUiTap?.();
      this.codexOverlay.classList.add('hidden');
    });

    const codexTabs = document.querySelectorAll<HTMLButtonElement>('[data-codex-tab]');
    for (const tabBtn of codexTabs) {
      bindButtonTap(tabBtn, () => {
        this.onUiTap?.();
        const t = tabBtn.dataset.codexTab as CodexTab | undefined;
        if (!t) return;
        this.codexTab = t;
        this.codexPage = 0;
        for (const b of codexTabs) {
          b.classList.toggle('active', b.dataset.codexTab === t);
        }
        this.renderCodexModal();
      });
    }

    bindButtonTap(this.codexPrevBtn, () => {
      this.onUiTap?.();
      const total = this.getCodexTotalPages();
      this.codexPage = (this.codexPage - 1 + total) % total;
      this.renderCodexModal();
    });
    bindButtonTap(this.codexNextBtn, () => {
      this.onUiTap?.();
      const total = this.getCodexTotalPages();
      this.codexPage = (this.codexPage + 1) % total;
      this.renderCodexModal();
    });
  }

  private openSanctuary(): void {
    this.latestRecords = loadRecords();
    this.renderSanctuaryModal();
    this.sanctuaryOverlay.classList.remove('hidden');
    this.replayModalEnter(this.sanctuaryOverlay);
  }

  private renderSanctuaryModal(): void {
    const rec = this.latestRecords ?? loadRecords();
    this.sanctuaryMedalsEl.textContent = `🏅 ${rec.chronoMedals.toLocaleString()} 메달`;
    this.sanctuaryGridEl.innerHTML = '';

    for (const def of SANCTUARY_UPGRADES) {
      const lv = rec.sanctuary[def.id] ?? 0;
      const cost = getSanctuaryCost(def.id, lv);
      const maxed = cost === null;
      const canBuy = !maxed && rec.chronoMedals >= cost;
      const iconUrl = getSanctuaryIconUrl(def.id);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `sanctuary-card${maxed ? ' maxed' : !canBuy ? ' unaffordable' : ''}`;
      card.dataset.sanctuaryId = def.id;
      card.disabled = maxed || !canBuy;
      card.innerHTML = `
        <div class="sanc-card-top">
          ${iconUrl ? `<img src="${iconUrl}" alt="${def.name}" draggable="false" />` : ''}
          <div class="sanc-title-wrap">
            <strong>${def.shortName}</strong>
            <span class="sanc-lv num">Lv.${lv}/${def.maxLevel}</span>
          </div>
        </div>
        <p class="sanc-effect">${def.effectText}</p>
        <span class="sanc-cost num">${maxed ? 'MAX 달성' : `🏅 ${cost} 강화`}</span>
      `;
      bindButtonTap(card, () => {
        const res = buySanctuaryUpgrade(def.id);
        if (res.ok) {
          this.latestRecords = res.records;
          this.onUpgradeSound?.();
          this.renderSanctuaryModal();
          this.renderTitleMetaBadges(res.records);
        }
      });
      this.sanctuaryGridEl.appendChild(card);
    }
  }

  private openCodex(): void {
    this.latestRecords = loadRecords();
    this.renderCodexModal();
    this.codexOverlay.classList.remove('hidden');
    this.replayModalEnter(this.codexOverlay);
  }

  private getCodexTotalPages(): number {
    if (this.codexTab === 'ach') return Math.ceil(ACHIEVEMENTS.length / 8); // 3 pages
    if (this.codexTab === 'relics') return Math.ceil(RELICS.length / 6); // 3 pages
    return ERAS.length; // 12 pages (1 Era of 4 units per page)
  }

  private renderCodexModal(): void {
    const rec = this.latestRecords ?? loadRecords();
    const totalPages = this.getCodexTotalPages();
    this.codexPage = Math.max(0, Math.min(totalPages - 1, this.codexPage));

    if (this.codexTab === 'ach') {
      this.codexPageLabelEl.textContent = `업적 ${this.codexPage + 1}/${totalPages}`;
      this.codexGridEl.dataset.cols = '4';
      const slice = ACHIEVEMENTS.slice(this.codexPage * 8, (this.codexPage + 1) * 8);
      this.codexGridEl.innerHTML = slice
        .map((a) => {
          const unlocked = rec.unlockedAchievements.includes(a.id);
          return `
            <div class="codex-item ach-item${unlocked ? ' unlocked' : ' locked'}">
              <div class="codex-item-head">
                <strong>${unlocked ? '🏆' : '🔒'} ${a.name}</strong>
                <span class="codex-reward num">+🏅${a.medalReward}</span>
              </div>
              <p>${a.description}</p>
            </div>
          `;
        })
        .join('');
    } else if (this.codexTab === 'relics') {
      this.codexPageLabelEl.textContent = `유물 ${this.codexPage + 1}/${totalPages}`;
      this.codexGridEl.dataset.cols = '3';
      const slice = RELICS.slice(this.codexPage * 6, (this.codexPage + 1) * 6);
      this.codexGridEl.innerHTML = slice
        .map((r) => {
          const seen = rec.discoveredRelics.includes(r.id);
          const icon = getRelicIconUrl(r.id);
          const syn = RELIC_SYNERGIES[r.synergy];
          return `
            <div class="codex-item relic-item rarity-${r.rarity}${seen ? ' unlocked' : ''}">
              <div class="codex-relic-row">
                ${icon ? `<img src="${icon}" alt="${r.name}" draggable="false" />` : ''}
                <div>
                  <strong>${r.name}</strong>
                  <small class="rarity-tag">${syn.glyph} ${syn.shortName} · ${r.rarity.toUpperCase()}${seen ? ' · 발견됨' : ''}</small>
                </div>
              </div>
              <p>${r.effectText}</p>
            </div>
          `;
        })
        .join('');
    } else {
      const era = getEra(this.codexPage);
      this.codexPageLabelEl.textContent = `${era.roman} ${era.shortName} (${this.codexPage + 1}/12)`;
      this.codexGridEl.dataset.cols = '4';
      this.codexGridEl.innerHTML = era.units
        .map((u) => {
          const seen = rec.discoveredUnits.includes(u.id);
          const icon = getUnitIconUrl(u.id);
          const roleKo =
            u.role === 'melee'
              ? '근접'
              : u.role === 'ranged'
                ? '원거리'
                : u.role === 'heavy'
                  ? '중장갑'
                  : '공성';
          return `
            <div class="codex-item unit-item${seen ? ' unlocked' : ''}">
              <div class="codex-unit-art">
                ${icon ? `<img src="${icon}" alt="${u.name}" draggable="false" />` : ''}
                <span class="unit-role-pill">${roleKo}</span>
              </div>
              <strong>${u.name}</strong>
              <p class="num">HP ${u.maxHp.toLocaleString()} · 공격 ${u.damage.toLocaleString()} · ${u.cost.toLocaleString()}G</p>
            </div>
          `;
        })
        .join('');
    }
  }

  private renderTitleMetaBadges(records: PlayerRecords): void {
    this.titleMedalBadge.textContent = `🏅 ${records.chronoMedals.toLocaleString()} 메달`;
    const totalSancLv = Object.values(records.sanctuary).reduce((a, b) => a + b, 0);
    this.sanctuaryLvBadge.textContent = `Lv.${totalSancLv}`;
    this.codexCountBadge.textContent = `${records.unlockedAchievements.length}/${ACHIEVEMENTS.length}`;
  }

  private renderTitleRecords(records: PlayerRecords): void {
    const diff = DIFFICULTIES[this.selectedDifficulty];
    const bestForDiff = records.bestVictoryTimeSec[this.selectedDifficulty];
    const thirdLabel =
      this.selectedMode === 'endless' ? '최고 무한 웨이브' : `최단 승리 (${diff.name})`;
    const thirdValue =
      this.selectedMode === 'endless'
        ? `WAVE ${records.bestEndlessWave}`
        : formatDuration(bestForDiff);

    this.titleRecordsEl.innerHTML = `
      <div class="record-cell">
        <span class="record-label">승리 / 전투 · 처치</span>
        <strong class="record-value num">${records.victories}/${records.matchesPlayed} · ${records.totalKills}킬</strong>
      </div>
      <div class="record-cell">
        <span class="record-label">최고 시대 · 콤보</span>
        <strong class="record-value num">${getEra(records.highestEraReached - 1).roman} ${getEra(records.highestEraReached - 1).shortName} · ${records.bestCombo}콤보</strong>
      </div>
      <div class="record-cell">
        <span class="record-label">${thirdLabel}</span>
        <strong class="record-value num">${thirdValue}</strong>
      </div>
    `;
  }
}
