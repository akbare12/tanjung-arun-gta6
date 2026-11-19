// TANJUNG ARUN — BADAI ARUNIKA: canonical game data.
// ONE source of truth for every number the four screenshots show.
// Landfall is Day 6 at 18:00. Every countdown below is computed from that
// anchor, so the dossier can never contradict itself across shots.
export const LANDFALL = { day: 6, hour: 18, minute: 0 };

export const SHOTS = {
  chase: {
    id: 'chase', label: 'CHASE', day: 2, time: '17:40', countdown: '4D 0H',
    cat: 2, wind: 150, money: 12000000, repLevel: 2, rep: 180, repMax: 400,
    missionsDone: 1, missionsTotal: 8, missionActive: 2,
    missionName: 'BALAPAN LIAR: SPRINT SENJA', missionStage: 'STAGE 2/3',
    progress: 0.62, wanted: 3, speed: 142, carName: 'ARUNIKA GT · MERAH',
    condition: 82, fuel: 78, health: 100, armour: 60,
  },
  combat: {
    id: 'combat', label: 'COMBAT', day: 3, time: '19:20', countdown: '2D 23H',
    cat: 3, wind: 198, money: 24000000, repLevel: 3, rep: 420, repMax: 600,
    missionsDone: 2, missionsTotal: 8, missionActive: 3,
    missionName: 'PASAR GELAP: LOOTER DI PASAR IKAN', missionStage: 'STAGE 1/3',
    progress: 0.33, wanted: 4, health: 81, armour: 60,
    weapon: 'SMG', ammo: 30, ammoReserve: 90,
  },
  title: {
    id: 'title', label: 'TITLE', day: 4, time: '09:05', countdown: '2D 9H',
    cat: 4, wind: 239, money: 38420000, repLevel: 4, rep: 640, repMax: 900,
    missionsDone: 5, missionsTotal: 8, completion: 46,
  },
  map: {
    id: 'map', label: 'MAP', day: 4, time: '09:05', countdown: '2D 9H',
    cat: 4, wind: 239, money: 38420000, repLevel: 4, rep: 640, repMax: 900,
    missionsDone: 5, missionsTotal: 8, shells: 15, shellsTotal: 24, completion: 46,
  },
};

export const MISSIONS = [
  { n: 1, name: 'PELABUHAN PERTAMA', status: 'DONE', reward: 'Rp 4.000.000' },
  { n: 2, name: 'BALAPAN LIAR: SPRINT SENJA', status: 'DONE', reward: 'Rp 6.500.000' },
  { n: 3, name: 'PASAR GELAP: LOOTER DI PASAR IKAN', status: 'DONE', reward: 'Rp 8.000.000' },
  { n: 4, name: 'JEMBATAN MERAH: KABUR DARI RAZIA', status: 'DONE', reward: 'Rp 9.200.000' },
  { n: 5, name: 'GUDANG GARAM: SERBUAN SUBUH', status: 'DONE', reward: 'Rp 10.720.000' },
  { n: 6, name: 'EVAKUASI BANJIR ROB: KAMPUNG NELAYAN', status: 'ACTIVE', reward: 'Rp 12.000.000' },
  { n: 7, name: 'BADAI DATANG: SELAMATKAN SINTA', status: 'LOCKED', reward: 'Rp 15.000.000' },
  { n: 8, name: 'LANDFALL: PELARIAN TERAKHIR', status: 'LOCKED', reward: 'Rp 25.000.000' },
];

export const DISASTER_JOBS = [
  { name: 'EVAKUASI ROB — PELABUHAN', pay: 'Rp 2.400.000', status: 'OPEN' },
  { name: 'STORM CHASER (REPEATABLE)', pay: 'Rp 1.800.000', status: 'OPEN' },
  { name: 'PENYELAMATAN PASAR IKAN', pay: 'Rp 3.100.000', status: 'OPEN' },
  { name: 'PENGAMANAN GUDANG GARAM', pay: 'Rp 2.000.000', status: 'DONE' },
];

export const CREW = [
  { name: 'RAKA', role: 'KAMU · DRIVER', perk: 'Pemimpin — Semua misi +10% uang', color: '#E8443A', you: true },
  { name: 'SINTA', role: 'WHEELMAN', perk: 'Wheelman — Drift +25%', color: '#D94F70' },
  { name: 'DARMA', role: 'FIXER', perk: 'Fixer — Repair 25% off', color: '#F2A541' },
  { name: 'LESTARI', role: 'HACKER', perk: 'Hacker — Police search 20% shorter', color: '#2FA8B5' },
  { name: 'BIMO', role: 'MUSCLE', perk: 'Muscle — Damage +15%', color: '#3A9A5A' },
];

export const DISTRICTS = [
  { name: 'KOTA TUA', seen: 92, standing: 'DIHORMATI', effect: 'Cops search 30% less long', color: '#F2C9A0' },
  { name: 'PANTAI ARUNIKA', seen: 88, standing: 'DIHORMATI', effect: 'Nitro refills twice as fast', color: '#E8D5A3' },
  { name: 'PELABUHAN', seen: 74, standing: 'NETRAL', effect: 'Fences pay +10% more', color: '#9FC8E8' },
  { name: 'PASAR IKAN', seen: 81, standing: 'DIHORMATI', effect: 'Bayside Arms 15% off', color: '#A8D8C8' },
  { name: 'MARINA', seen: 65, standing: 'NETRAL', effect: 'Boats unlocked at night', color: '#2FA8B5' },
  { name: 'KAMPUNG NELAYAN', seen: 58, standing: 'WASPADA', effect: 'Flood rescue pays double', color: '#4A7A6A' },
  { name: 'CBD ARUN', seen: 70, standing: 'NETRAL', effect: 'High-value cars spawn here', color: '#E8A0A0' },
  { name: 'TAMAN SENJA', seen: 47, standing: 'WASPADA', effect: 'Fewer patrols after dark', color: '#3A9A5A' },
  { name: 'BANDARA ARUNIKA', seen: 39, standing: 'NETRAL', effect: 'Runway sprint unlocked', color: '#B8B0A0' },
  { name: 'PERUMAHAN BUKIT', seen: 52, standing: 'NETRAL', effect: 'Safehouse rent 20% off', color: '#C9A0E8' },
  { name: 'STASIUN ARUN', seen: 44, standing: 'WASPADA', effect: 'Trains hide you from police', color: '#E8C85A' },
  { name: 'PULAU KECIL', seen: 21, standing: 'WASPADA', effect: 'Smuggler boats 25% off', color: '#7FB5D5' },
];

export const GARAGE = [
  { name: 'REPAIR', desc: 'Full body + engine fix', price: 'Rp 250rb', owned: true },
  { name: 'RESPRAY', desc: 'New paint, clears wanted', price: 'Rp 400rb', owned: true },
  { name: 'MESIN +12%', desc: 'Top speed +12%', price: 'Rp 4jt', owned: false },
  { name: 'ARMOR', desc: 'Bulletproof panels', price: 'Rp 3,6jt', owned: false },
];

export const WEAPONS = [
  { name: 'PISTOL', ammo: 12, reserve: 48, key: '1' },
  { name: 'SMG', ammo: 30, reserve: 90, key: '2', active: true },
  { name: 'SENAPAN', ammo: 6, reserve: 18, key: '3' },
  { name: 'TANGAN KOSONG', ammo: Infinity, reserve: Infinity, key: '4' },
];

export const POLICE_CHASE = [
  { unit: 'ELANG-1', kind: 'HELI', tactic: 'SPOTLIGHT', dist: 42 },
  { unit: 'PATROLI-7', kind: 'CAR', tactic: 'RAMMING', dist: 18 },
  { unit: 'PATROLI-12', kind: 'CAR', tactic: 'PURSUIT', dist: 26 },
  { unit: 'PATROLI-21', kind: 'CAR', tactic: 'BOXING IN', dist: 31 },
  { unit: 'PATROLI-33', kind: 'CAR', tactic: 'ROADBLOCK', dist: 54 },
  { unit: 'PATROLI-44', kind: 'FOOT', tactic: 'SEARCHLIGHT', dist: 63 },
];

export const POLICE_COMBAT = [
  { unit: 'ELANG-1', kind: 'HELI', tactic: 'SPOTLIGHT', dist: 38 },
  { unit: 'GENG OMBAK-1', kind: 'FOOT', tactic: 'FLANKING', dist: 12 },
  { unit: 'GENG OMBAK-2', kind: 'FOOT', tactic: 'SUPPRESSING', dist: 19 },
  { unit: 'GENG OMBAK-3', kind: 'FOOT', tactic: 'PURSUIT', dist: 24 },
  { unit: 'PATROLI-12', kind: 'CAR', tactic: 'ROADBLOCK', dist: 47 },
];

export const RADIOS = [
  { name: 'VELMARA FM 88.3', song: 'Senja di Tanjung — Lestari Band' },
  { name: 'DANGDUT ARUN 91.7', song: 'Goyang Rob — Bang Jali' },
  { name: 'SENJA FM 104.5', song: 'Badai Arunika — Aruna' },
];

export const CAREER = {
  carsStolen: 38, copsLost: 13, nearMisses: 27, drifts: 41,
  shots: 214, hits: 171, playTime: '2h 3m', raceWins: 2, bestLap: '1:12',
  kmDriven: 48.2, completion: 46,
};

export const SAVE_SLOT = {
  chapter: 5, money: 38420000, day: 4, time: '09:05', completion: 46,
  story: '5/8', shells: '15/24', savedAt: '09:05',
};

export function formatRupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function formatMoneyShort(n) {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'jt';
  return formatRupiah(n);
}
