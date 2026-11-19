// TANJUNG ARUN mission engine: story missions, stages, payouts,
// dialogue delivery, disaster side jobs, and the MISSION PASSED screen.
// One job: turn the mission tables into playable, trackable progress.

import { MISSIONS, SIDE_JOBS, formatRp } from './config.js';
import { BLOCK, WORLD_W, WORLD_H } from './config.js';

// Objective marker positions, one per mission stage, on the city grid.
// Each entry is [blockX, blockY] so markers land on roads.
const STAGE_SPOTS = [
  [[4, 3], [2, 2], [4, 5]],   // m1: Pasar Ikan -> Kota Tua -> Dermaga
  [[11, 5], [5, 1], [2, 3]],  // m2: Pelabuhan -> Merdeka -> safehouse
  [[8, 5], [8, 5], [8, 5]],   // m3: Pantai Karang -> shelter -> back
  [[6, 1], [1, 5], [1, 5]],   // m4: RS Arun -> Kampung -> escort
  [[11, 3], [11, 3], [5, 5]], // m5: storm cell -> Bukit Angin -> escape
  [[1, 3], [1, 3], [8, 5]],   // m6: Kota Tua looters -> crates -> shelter
  [[8, 1], [4, 5], [4, 5]],   // m7: power plant -> convoy -> vanish
  [[4, 5], [8, 5], [4, 5]],   // m8: Dermaga ferry -> flood zone -> ferry
];

export function stageSpot(missionIndex, stageIndex) {
  const spots = STAGE_SPOTS[missionIndex % STAGE_SPOTS.length];
  const s = spots[Math.min(stageIndex, spots.length - 1)];
  return { x: s[0] * BLOCK + BLOCK / 2, y: s[1] * BLOCK + BLOCK / 2 };
}

export function currentMission(state) {
  return MISSIONS[state.missionIndex % MISSIONS.length];
}

export function currentStage(state) {
  const m = currentMission(state);
  return m.stages[Math.min(state.missionStage, m.stages.length - 1)];
}

export function missionProgressLabel(state) {
  const m = currentMission(state);
  return `MISSION ${m.n}/8 · STAGE ${Math.min(state.missionStage + 1, m.stages.length)}/${m.stages.length}`;
}

export function startMission(state, index) {
  state.missionIndex = index % MISSIONS.length;
  state.missionStage = 0;
  const m = currentMission(state);
  state.objective = stageSpot(state.missionIndex, 0);
  state.dialogue = { who: m.dialogue.who, line: m.dialogue.line, ttl: 7 };
  state.chapter = {
    title: `CHAPTER ${m.n} OF 8`,
    name: m.name,
    dedication: m.n === 6 ? 'For Det. Arya Nugraha — he never saw it coming.' : 'For the crew of Tanjung Arun.',
    objective: m.stages[0].text,
  };
  state.screen = 'chapter';
}

// Advance one stage; returns 'stage' | 'done'.
export function advanceStage(state) {
  const m = currentMission(state);
  state.missionStage += 1;
  if (state.missionStage >= m.stages.length) {
    return completeMission(state);
  }
  state.objective = stageSpot(state.missionIndex, state.missionStage);
  return 'stage';
}

export function completeMission(state) {
  const m = currentMission(state);
  state.money += m.payout;
  if (!state.missionsDone.includes(state.missionIndex)) state.missionsDone.push(state.missionIndex);
  const unlocks = [];
  if (m.n === 2) unlocks.push('GARAGE UNLOCKED — Bengkel Dermaga');
  if (m.n === 4) unlocks.push('NEW WEAPON — Senapan Angin');
  if (m.n === 6) unlocks.push('SAFEHOUSE UNLOCKED — Kota Tua');
  if (m.n === 7) unlocks.push('NITRO UNLOCKED — Bengkel Dermaga');
  const next = MISSIONS[(state.missionIndex + 1) % MISSIONS.length];
  state.passedInfo = {
    mission: m, payout: m.payout, unlocks,
    next: next.name, nextPayout: next.payout,
    grade: gradeFor(state),
  };
  state.missionIndex = (state.missionIndex + 1) % MISSIONS.length;
  state.missionStage = 0;
  state.objective = stageSpot(state.missionIndex, 0);
  state.screen = 'passed';
  return 'done';
}

export function gradeFor(state) {
  // Grade from play: fewer cops lost + more near-miss/drift = better.
  const s = state.stats;
  const score = s.nearMiss * 2 + s.drifts - s.copsLost * 3;
  if (score >= 90) return 'S';
  if (score >= 60) return 'A';
  if (score >= 35) return 'B';
  return 'C';
}

// ---------------------------------------------------------------- side jobs
export function sideJobList(state) {
  return SIDE_JOBS.map((j) => ({
    ...j,
    status: state.missionsDone.length >= 3 ? 'OPEN' : 'LOCKED',
    payLabel: formatRp(j.pay),
  }));
}

export function missionListWithStatus(state) {
  return MISSIONS.map((m, i) => ({
    n: m.n, name: m.name, payout: formatRp(m.payout),
    status: state.missionsDone.includes(i) ? 'DONE' : i === state.missionIndex ? 'ACTIVE' : 'LOCKED',
    stages: m.stages.length,
  }));
}

// Dialogue queue for ambient barks while driving.
export const AMBIENT_BARKS = [
  { who: 'SINTA', line: 'Kiri! Kiri! Jalan tikus lewat gang pasar!' },
  { who: 'LESTARI', line: 'Kamera di Jalan Merdeka mati 40 detik. Gas!' },
  { who: 'DARMA', line: 'Jangan panik. Badai ini teman kita, bukan musuh.' },
  { who: 'BIMO', line: 'Polisi makin dekat. Gue siapin jalan keluar.' },
  { who: 'RADIO DARURAT', line: 'PERINGATAN: angin 210 km/jam. Semua warga ke shelter.' },
];
