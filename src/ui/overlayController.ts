import { DIFFICULTIES, DIFFICULTY_LIST } from '../data/difficulty';
import { getEra } from '../data/eras';
import type { DifficultyId, GameSnapshot } from '../data/types';
import { formatDuration, type PlayerRecords } from '../storage/records';
import { bindButtonTap } from './tap';

export class OverlayController {
  public selectedDifficulty: DifficultyId = 'normal';

  private titleOverlay = document.getElementById('overlay-title')!;
  private pauseOverlay = document.getElementById('overlay-pause')!;
  private resultOverlay = document.getElementById('overlay-result')!;
  private rotateOverlay = document.getElementById('overlay-rotate')!;

  private diffSelector = document.getElementById('difficulty-selector')!;
  private diffDescEl = document.getElementById('difficulty-desc');
  private titleRecordsEl = document.getElementById('title-records')!;
  private latestRecords: PlayerRecords | null = null;

  private resultBadge = document.getElementById('result-badge')!;
  private resultTitle = document.getElementById('result-title')!;
  private resultSub = document.getElementById('result-subtitle')!;
  private resultStats = document.getElementById('result-stats')!;

  constructor(callbacks: {
    onStart: (difficulty: DifficultyId) => void;
    onResume: () => void;
    onRestart: () => void;
    onReturnTitle: () => void;
  }) {
    this.buildDifficultyButtons();

    bindButtonTap(document.getElementById('btn-start-game') as HTMLButtonElement, () => {
      callbacks.onStart(this.selectedDifficulty);
    });
    bindButtonTap(document.getElementById('btn-resume') as HTMLButtonElement, callbacks.onResume);
    bindButtonTap(document.getElementById('btn-pause-restart') as HTMLButtonElement, callbacks.onRestart);
    bindButtonTap(document.getElementById('btn-pause-title') as HTMLButtonElement, callbacks.onReturnTitle);
    bindButtonTap(document.getElementById('btn-result-retry') as HTMLButtonElement, callbacks.onRestart);
    bindButtonTap(document.getElementById('btn-result-title') as HTMLButtonElement, callbacks.onReturnTitle);
  }

  public showTitle(records: PlayerRecords): void {
    this.latestRecords = records;
    this.renderTitleRecords(records);
    this.updateDifficultyDescription();
    this.titleOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.resultOverlay.classList.add('hidden');
  }

  public hideAllGameOverlays(): void {
    this.titleOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.resultOverlay.classList.add('hidden');
  }

  public showPause(): void {
    this.pauseOverlay.classList.remove('hidden');
  }

  public hidePause(): void {
    this.pauseOverlay.classList.add('hidden');
  }

  public showResult(
    snapshot: GameSnapshot,
    records: PlayerRecords,
    isNewBestTime: boolean,
  ): void {
    const won = snapshot.status === 'victory';
    const diff = DIFFICULTIES[snapshot.difficulty];
    const reachedEra = getEra(snapshot.player.eraIndex);
    const bestTime = records.bestVictoryTimeSec[snapshot.difficulty];

    this.resultBadge.textContent = won ? (isNewBestTime ? 'NEW RECORD · VICTORY' : 'VICTORY') : 'DEFEAT';
    this.resultBadge.classList.toggle('defeat', !won);
    this.resultTitle.textContent = won ? '적 기지 파괴!' : '기지 함락';
    this.resultSub.textContent = won
      ? `${diff.name} 난이도를 ${formatDuration(snapshot.elapsed)} 만에 제패했습니다.`
      : `${reachedEra.name}에서 적의 공세에 기지가 무너졌습니다.`;

    this.resultStats.innerHTML = `
      <div class="result-stat-item">
        <span>전투 시간</span>
        <strong class="num">${formatDuration(snapshot.elapsed)}</strong>
      </div>
      <div class="result-stat-item">
        <span>도달 시대</span>
        <strong>${reachedEra.roman} ${reachedEra.name}</strong>
      </div>
      <div class="result-stat-item">
        <span>처치 적군 / 생산 유닛</span>
        <strong class="num">${snapshot.player.kills} / ${snapshot.player.unitsSpawned}</strong>
      </div>
      <div class="result-stat-item">
        <span>${diff.name} 최고 기록</span>
        <strong class="num">${formatDuration(bestTime)}</strong>
      </div>
    `;

    this.resultOverlay.classList.remove('hidden');
  }

  public setPortraitWarning(isPortrait: boolean): void {
    this.rotateOverlay.classList.toggle('hidden', !isPortrait);
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
        this.selectedDifficulty = diff.id;
        for (const el of this.diffSelector.querySelectorAll<HTMLButtonElement>('.diff-btn')) {
          const active = el.dataset.diff === diff.id;
          el.classList.toggle('selected', active);
          el.setAttribute('aria-checked', String(active));
        }
        this.updateDifficultyDescription();
        if (this.latestRecords) {
          this.renderTitleRecords(this.latestRecords);
        }
      });

      this.diffSelector.appendChild(btn);
    }
    this.updateDifficultyDescription();
  }

  private updateDifficultyDescription(): void {
    if (!this.diffDescEl) return;
    const diff = DIFFICULTIES[this.selectedDifficulty];
    this.diffDescEl.textContent = diff.description;
    this.diffDescEl.style.borderColor = diff.accentColor;
  }

  private renderTitleRecords(records: PlayerRecords): void {
    const diff = DIFFICULTIES[this.selectedDifficulty];
    const bestForDiff = records.bestVictoryTimeSec[this.selectedDifficulty];
    this.titleRecordsEl.innerHTML = `
      <div class="record-cell">
        <span class="record-label">승리 / 전투</span>
        <strong class="record-value num">${records.victories} / ${records.matchesPlayed}</strong>
      </div>
      <div class="record-cell">
        <span class="record-label">최고 도달 시대</span>
        <strong class="record-value">${getEra(records.highestEraReached - 1).roman} ${getEra(records.highestEraReached - 1).shortName}</strong>
      </div>
      <div class="record-cell">
        <span class="record-label">최단 승리 (${diff.name})</span>
        <strong class="record-value num">${formatDuration(bestForDiff)}</strong>
      </div>
    `;
  }
}
