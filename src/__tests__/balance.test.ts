import { describe, expect, it } from 'vitest';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID } from '../data/eras';

describe('7-Era Balance & Catalog Integrity', () => {
  it('defines exactly 7 eras with all 22 requested units, 14 turrets, and 7 ultimates', () => {
    expect(ERAS).toHaveLength(7);

    const expectedUnitCounts = [3, 3, 4, 3, 3, 3, 3];
    ERAS.forEach((era, i) => {
      expect(era.index).toBe(i);
      expect(era.eraNumber).toBe(i + 1);
      expect(era.units).toHaveLength(expectedUnitCounts[i]);
      expect(era.turrets).toHaveLength(2);
      expect(era.ultimate.eraIndex).toBe(i);
    });

    expect(Object.keys(UNIT_BY_ID)).toHaveLength(22);
    expect(Object.keys(TURRET_BY_ID)).toHaveLength(14);
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

  it('matches every required Korean unit and ultimate name per era', () => {
    expect(ERAS[0].units.map((u) => u.name)).toEqual(['몽둥이 전사', '투석병', '공룡 기병']);
    expect(ERAS[0].ultimate.name).toBe('운석 낙하');

    expect(ERAS[1].units.map((u) => u.name)).toEqual(['방패 창병', '궁수', '전차']);
    expect(ERAS[1].ultimate.name).toBe('신의 번개');

    expect(ERAS[2].units.map((u) => u.name)).toEqual(['기사', '석궁병', '중장기병', '투석기']);
    expect(ERAS[2].ultimate.name).toBe('불화살 비');

    expect(ERAS[3].units.map((u) => u.name)).toEqual(['장창병', '머스킷 총병', '야포']);
    expect(ERAS[3].ultimate.name).toBe('함포 일제사격');

    expect(ERAS[4].units.map((u) => u.name)).toEqual(['소총병', '화염방사병', '초기 탱크']);
    expect(ERAS[4].ultimate.name).toBe('폭격기 융단폭격');

    expect(ERAS[5].units.map((u) => u.name)).toEqual(['특수부대', '대전차 로켓병', '주력 전차']);
    expect(ERAS[5].ultimate.name).toBe('전술 미사일 공습');

    expect(ERAS[6].units.map((u) => u.name)).toEqual(['사이보그', '레일건 저격수', '거대 메카']);
    expect(ERAS[6].ultimate.name).toBe('궤도 레이저 포격');
  });
});
