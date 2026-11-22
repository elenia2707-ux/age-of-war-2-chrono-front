import { describe, expect, it } from 'vitest';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID } from '../data/eras';
import { MAX_UPGRADE_LEVEL, UPGRADES, getUpgradesByCategory } from '../data/upgrades';

describe('10-Era Balance & Catalog Integrity', () => {
  it('defines exactly 10 eras with 4 units each (40 units), 20 turrets, and 10 ultimates', () => {
    expect(ERAS).toHaveLength(10);

    ERAS.forEach((era, i) => {
      expect(era.index).toBe(i);
      expect(era.eraNumber).toBe(i + 1);
      expect(era.units).toHaveLength(4);
      expect(era.turrets).toHaveLength(2);
      expect(era.ultimate.eraIndex).toBe(i);
      // Verify units inside each era are cleanly sorted by ascending gold cost
      for (let u = 1; u < era.units.length; u++) {
        expect(era.units[u].cost).toBeGreaterThan(era.units[u - 1].cost);
      }
    });

    expect(Object.keys(UNIT_BY_ID)).toHaveLength(40);
    expect(Object.keys(TURRET_BY_ID)).toHaveLength(20);
  });

  it('scales base HP, passive gold, unit costs, and evolve XP monotonically across eras', () => {
    for (let i = 1; i < ERAS.length; i++) {
      const prev = ERAS[i - 1];
      const curr = ERAS[i];

      expect(curr.baseMaxHp).toBeGreaterThan(prev.baseMaxHp);
      expect(curr.passiveGoldPerSec).toBeGreaterThan(prev.passiveGoldPerSec);
      expect(curr.units[0].cost).toBeGreaterThan(prev.units[0].cost);
      expect(curr.turrets[0].cost).toBeGreaterThan(prev.turrets[0].cost);
      expect(curr.ultimate.damagePerStrike).toBeGreaterThan(prev.ultimate.damagePerStrike * 0.5);

      if (i < ERAS.length - 1) {
        expect(curr.evolveXp).toBeGreaterThan(prev.evolveXp);
      } else {
        expect(curr.evolveXp).toBe(0);
      }
    }
  });

  it('matches every required Korean unit and ultimate name across all 10 eras (40 units)', () => {
    expect(ERAS[0].name).toBe('원시 시대');
    expect(ERAS[0].units.map((u) => u.name)).toEqual(['몽둥이 전사', '투석병', '부족 주술사', '공룡 기병']);
    expect(ERAS[0].ultimate.name).toBe('운석 낙하');

    expect(ERAS[1].name).toBe('고대 이집트');
    expect(ERAS[1].units.map((u) => u.name)).toEqual(['아누비스 전사', '태양 사제', '전갈 암살병', '스핑크스 전차']);
    expect(ERAS[1].ultimate.name).toBe('태양광선 심판');

    expect(ERAS[2].name).toBe('고대 문명');
    expect(ERAS[2].units.map((u) => u.name)).toEqual(['방패 창병', '궁수', '백인대장', '전차']);
    expect(ERAS[2].ultimate.name).toBe('신의 번개');

    expect(ERAS[3].name).toBe('중세 시대');
    expect(ERAS[3].units.map((u) => u.name)).toEqual(['기사', '석궁병', '중장기병', '투석기']);
    expect(ERAS[3].ultimate.name).toBe('불화살 비');

    expect(ERAS[4].name).toBe('화약·근세');
    expect(ERAS[4].units.map((u) => u.name)).toEqual(['장창병', '머스킷 총병', '척탄병', '야포']);
    expect(ERAS[4].ultimate.name).toBe('함포 일제사격');

    expect(ERAS[5].name).toBe('산업·증기 시대');
    expect(ERAS[5].units.map((u) => u.name)).toEqual(['증기 철갑병', '개틀링 포수', '테슬라 공병', '증기 워커']);
    expect(ERAS[5].ultimate.name).toBe('비행선 공습');

    expect(ERAS[6].name).toBe('세계대전');
    expect(ERAS[6].units.map((u) => u.name)).toEqual(['소총병', '화염방사병', '박격포병', '초기 탱크']);
    expect(ERAS[6].ultimate.name).toBe('폭격기 융단폭격');

    expect(ERAS[7].name).toBe('현대 시대');
    expect(ERAS[7].units.map((u) => u.name)).toEqual(['특수부대', '대전차 로켓병', '중장 저거너트', '주력 전차']);
    expect(ERAS[7].ultimate.name).toBe('전술 미사일 공습');

    expect(ERAS[8].name).toBe('미래 시대');
    expect(ERAS[8].units.map((u) => u.name)).toEqual(['사이보그', '플라즈마 드론', '레일건 저격수', '거대 메카']);
    expect(ERAS[8].ultimate.name).toBe('궤도 레이저 포격');

    expect(ERAS[9].name).toBe('성간 문명');
    expect(ERAS[9].units.map((u) => u.name)).toEqual(['성간 기사', '중력포 저격수', '성운 집정관', '오메가 타이탄']);
    expect(ERAS[9].ultimate.name).toBe('블랙홀 붕괴');
  });

  it('defines 16 gold spec upgrades (4 categories x 4) with strictly increasing gold costs up to Lv.10', () => {
    expect(UPGRADES).toHaveLength(16);
    expect(MAX_UPGRADE_LEVEL).toBe(10);
    expect(getUpgradesByCategory('offense')).toHaveLength(4);
    expect(getUpgradesByCategory('defense')).toHaveLength(4);
    expect(getUpgradesByCategory('tactics')).toHaveLength(4);
    expect(getUpgradesByCategory('empire')).toHaveLength(4);
    for (const upg of UPGRADES) {
      expect(upg.maxLevel).toBe(MAX_UPGRADE_LEVEL);
      expect(upg.costs).toHaveLength(MAX_UPGRADE_LEVEL);
      for (let i = 1; i < upg.costs.length; i++) {
        expect(upg.costs[i]).toBeGreaterThan(upg.costs[i - 1]);
      }
    }
  });

  it('uses an extended civilization XP progression curve so each era lasts meaningfully longer', () => {
    expect(ERAS[0].evolveXp).toBeGreaterThanOrEqual(1500);
    expect(ERAS[3].evolveXp).toBeGreaterThanOrEqual(9000);
    expect(ERAS[8].evolveXp).toBeGreaterThanOrEqual(120000);
    expect(ERAS[9].evolveXp).toBe(0);
  });
});
