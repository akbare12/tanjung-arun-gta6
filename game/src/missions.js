// missions.js — the story: 8 named missions with stages, objectives,
// payouts and status, plus the storm side jobs and the MISSION PASSED flow.
// One job: missions and progression.

import { MISSIONS, STORM, formatMoney } from './config.js';

export function activeMission() {
  return MISSIONS.find((m) => m.status === 'ACTIVE') || MISSIONS[0];
}

export function missionProgress() {
  const done = MISSIONS.filter((m) => m.status === 'DONE').length;
  return { done, total: MISSIONS.length, next: activeMission() };
}

export function missionObjectives(mission, stage) {
  const objectives = {
    1: ['Jemput Sari di Pasar Senja', 'Hindari patroli polisi', 'Antar Sari ke markas kru'],
    2: ['Masuk rumah judi Pecinan Lama', 'Tagih utang dari Bos Judi', 'Kabur sebelum polisi datang'],
    3: ['Curi kontainer 7 di Pelabuhan Arun', 'Bawa ke gudang Stasiun Utara', 'Jangan rusak muatannya'],
    4: ['Daftar balap di Pantai Lestari', 'Menangkan 3 lap', 'Kalahkan Raka si Raja Balap'],
    5: ['Bawa perahu lewat Rawa Banjir', 'Hindari zona banjir naik', 'Selamatkan 4 warga'],
    6: ['Evakuasi Tanjung Selatan', 'Angkut 12 warga ke shelter', 'Kalahkan geng Looter di jalan'],
    7: ['Ambil paket di Bandara Senja', 'Lewati roadblock CAT 4', 'Serahkan ke Koh Aan'],
    8: ['Masuk Kota Tua saat mata badai', 'Hadapi geng Undertow', 'Selamatkan kota — akhiri semuanya'],
  };
  return objectives[mission.id] || ['Selesaikan objektif'];
}

export function missionStageText(mission, stage) {
  return 'MISSION ' + mission.id + '/' + MISSIONS.length + '  ·  STAGE ' + stage + '/' + mission.stages;
}

export function nextMissionAfter(mission) {
  return MISSIONS.find((m) => m.id === mission.id + 1) || null;
}

export function stormJobs() {
  return STORM.jobs.map((j) => j.name + ' — ' + formatMoney(j.pay));
}

export function missionListLines() {
  return MISSIONS.map((m) => ({
    id: m.id,
    text: (m.id < 10 ? '0' + m.id : m.id) + '  ' + m.name + '  ' + formatMoney(m.payout) + '  ' + (m.status === 'DONE' ? '✓' : m.status === 'ACTIVE' ? '▶' : '·'),
    status: m.status,
  }));
}

// Dialogue lines shown during play, keyed by scene.
export const DIALOGUE = {
  chase: [
    { who: 'SARI', color: '#e86a8a', text: 'Arun, helikopter di atas kita! Belok ke gang Kampung Melati — mereka tidak bisa ikut!' },
    { who: 'ARUN', color: '#e8b23a', text: 'Pegang erat. Topan makin dekat, polisi makin nekat. Kita sampai ke shelter sebelum CAT 4.' },
  ],
  combat: [
    { who: 'DARA', color: '#6ab8e8', text: 'Geng Looter masuk dari Rawa Banjir. Mereka jarah shelter evakuasi. Hentikan mereka, Arun.' },
    { who: 'BIMO', color: '#8ae86a', text: 'Aku sudah kunci pintu shelter. Kamu yang bersihkan jalan. Peluru di tas biru — ambil!' },
  ],
  passed: [
    { who: 'KOH AAN', color: '#c9a0e8', text: 'Bagus. Evakuasi selesai sebelum badai mendarat. Garasi baru di Bukit Kencana sekarang milikmu.' },
  ],
};
