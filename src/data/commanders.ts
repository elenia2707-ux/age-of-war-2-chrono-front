import type { CommanderDef, CommanderId } from './types';

export const COMMANDERS: Record<CommanderId, CommanderDef> = {
  vanguard: {
    id: 'vanguard',
    name: '시공 선봉장',
    title: '돌격 기동 교리',
    accentColor: '#38bdf8',
    passiveDesc: '아군 이동속도 +8% · 선봉 보호막 +12%',
    skillName: '전군 돌격 함성',
    skillShort: '돌격 함성',
    skillDesc: '6초간 전 아군 공속 +35%·이속 +30% + 최대체력 15% 보호막 부여',
    cooldown: 18,
  },
  ordnance: {
    id: 'ordnance',
    name: '강철 포격사령관',
    title: '화력 제압 교리',
    accentColor: '#fb923c',
    passiveDesc: '포탑·공성 피해 +15% · 포탑 건설비 -10%',
    skillName: '전선 지원 포격',
    skillShort: '지원 포격',
    skillDesc: '최전선 적 밀집 구역에 5발의 정밀 유탄 포격 및 넉백 충격파 투하',
    cooldown: 20,
  },
  archon: {
    id: 'archon',
    name: '황금 재정관',
    title: '제국 보급 교리',
    accentColor: '#facc15',
    passiveDesc: '초당 골드 +15% · 보급상자 보상 +25%',
    skillName: '황금 긴급 보급',
    skillShort: '긴급 보급',
    skillDesc: '시대 비례 군자금 즉시 지급 + 중앙 보급상자 투하 + 생산 대기열 3초 단축',
    cooldown: 22,
  },
  aegis: {
    id: 'aegis',
    name: '성운 수호성녀',
    title: '불멸 성역 교리',
    accentColor: '#4ade80',
    passiveDesc: '아군 초당 체력재생 +1.2% · 성채 체력 +15%',
    skillName: '성운 치유 결계',
    skillShort: '치유 결계',
    skillDesc: '전 아군 잃은 체력 42% 즉시 치유 + 성채 8% 수리 + 5초간 피격 피해 -28%',
    cooldown: 20,
  },
};

export const COMMANDER_LIST: CommanderDef[] = [
  COMMANDERS.vanguard,
  COMMANDERS.ordnance,
  COMMANDERS.archon,
  COMMANDERS.aegis,
];
