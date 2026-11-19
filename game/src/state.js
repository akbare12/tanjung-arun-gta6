// state.js — canonical game data for TANJUNG ARUN — BADAI ARUNIKA.
// One timeline, one set of numbers: every screenshot and HUD panel reads from
// this file, so the storm countdown, money, REP and mission counts can never
// contradict each other across shots.
//
// Landfall: Day 6 · 18:00. Every countdown below is computed from that anchor.

export const LANDFALL = { day: 6, hour: 18, minute: 0 };

// Coherence sheet — canonical numbers per dossier shot. Money, REP, missions,
// countdown, CAT and wind rise monotonically shot 1 -> 4.
export const SHOTS = {
  1: { day: 2, time: '17:40', countdown: 'LANDFALL IN 4D 0H', cat: 2, wind: 150, money: 12000000, repLevel: 2, rep: 180, repMax: 400, missionsDone: 2, missionsTotal: 8, rank: 'RUNNER' },
  2: { day: 3, time: '19:20', countdown: 'LANDFALL IN 2D 23H', cat: 3, wind: 198, money: 24000000, repLevel: 3, rep: 420, repMax: 600, missionsDone: 3, missionsTotal: 8, rank: 'WHEELMAN' },
  3: { day: 4, time: '09:05', countdown: 'LANDFALL IN 2D 9H', cat: 4, wind: 239, money: 38420000, repLevel: 4, rep: 640, repMax: 900, missionsDone: 5, missionsTotal: 8, completion: 46, rank: 'ENFORCER' },
  4: { day: 4, time: '09:05', countdown: 'LANDFALL IN 2D 9H', cat: 4, wind: 239, money: 38420000, repLevel: 4, rep: 640, repMax: 900, missionsDone: 5, missionsTotal: 8, shells: 15, shellsTotal: 24, rank: 'ENFORCER' },
};

export const fmtRp = (n) => 'Rp ' + n.toLocaleString('id-ID');
export const fmtRpShort = (n) => n >= 1000000 ? 'Rp ' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }).replace(/,00$/, '') + 'jt' : 'Rp ' + (n / 1000) + 'rb';

// Story missions — 8 chapters, one arc: a crew racing a hurricane.
export const MISSIONS = [
  { n: 1, name: 'PASAR GELAP', chapter: 'Ch.1', status: 'DONE', reward: 1500000, desc: 'Ambil paket di Pasar Senja tanpa ketahuan.' },
  { n: 2, name: 'KABUR DARI PELABUHAN', chapter: 'Ch.2', status: 'DONE', reward: 3200000, desc: 'Lepas dari razia pelabuhan sebelum fajar.' },
  { n: 3, name: 'LOOTER DI DERMAGA', chapter: 'Ch.3', status: 'DONE', reward: 4800000, desc: 'Usir penjarah dari gudang dermaga.' },
  { n: 4, name: 'BALAPAN LIAR: SUNSET SPRINT', chapter: 'Ch.4', status: 'DONE', reward: 6500000, desc: 'Menang balapan jalanan di boulevard pantai.' },
  { n: 5, name: 'EVAKUASI BANJIR ROB', chapter: 'Ch.5', status: 'ACTIVE', reward: 8000000, desc: 'Evakuasi 12 warga Kampung Nelayan sebelum air naik.' },
  { n: 6, name: 'MATA-MATA PELABUHAN', chapter: 'Ch.6', status: 'LOCKED', reward: 9500000, desc: 'Foto dokumen kargo di kantor pelabuhan.' },
  { n: 7, name: 'BADAI ARUNIKA', chapter: 'Ch.7', status: 'LOCKED', reward: 12000000, desc: 'Selamatkan kru saat badai mencapai darat.' },
  { n: 8, name: 'LANDFALL', chapter: 'Ch.8', status: 'LOCKED', reward: 20000000, desc: 'Hadapi Det. Arya di tengah landfall.' },
];

// Repeatable disaster jobs — named differently from story missions on purpose.
export const DISASTER_JOBS = [
  { name: 'STORM CHASER (REPEATABLE)', pay: 750000, desc: 'Kejar mata badai, foto 3 titik.' },
  { name: 'EVAKUASI ROB', pay: 900000, desc: 'Angkut warga dari zona banjir.' },
  { name: 'PATROLI BANJIR', pay: 600000, desc: 'Jaga pompa air di Marina.' },
  { name: 'LOOTER HUNT', pay: 1200000, desc: 'Tangkap penjarah di gudang.' },
];

// Crew of five — each with one perk line and one active ability.
export const CREW = [
  { name: 'RAKA', role: 'YOU · DRIVER', perk: 'Wheelman — Drift +25%', ability: 'Q · DRIFT BOOST', color: '#E8443A', level: 4 },
  { name: 'SINTA', role: 'WHEELMAN', perk: 'Drift +25% · Nitro lasts longer', ability: 'Q · SINTA: DRIFT BOOST', color: '#F2A541', level: 3 },
  { name: 'DARMA', role: 'FIXER', perk: 'Repair 25% off · Respawn faster', ability: 'Z · DARMA: QUICK FIX', color: '#2FA8B5', level: 3 },
  { name: 'LESTARI', role: 'HACKER', perk: 'Police search 30% shorter', ability: 'X · LESTARI: EYES OUT', color: '#B565D8', level: 2 },
  { name: 'BAYU', role: 'MUSCLE', perk: 'Damage +20% · Armour +15', ability: 'C · BAYU: HEAVY HIT', color: '#3A9A5A', level: 2 },
  { name: 'KIRANA', role: 'MEDIC', perk: 'Armour refills free at safehouse', ability: 'V · KIRANA: FIELD KIT', color: '#E86A92', level: 2 },
];

// Districts — standing plus a gameplay effect each (shown on the map).
export const DISTRICTS = [
  { name: 'KOTA TUA', standing: 'DIHORMATI', seen: 92, effect: 'Cops search -30%', color: '#B565D8' },
  { name: 'PANTAI ARUNIKA', standing: 'NETRAL', seen: 78, effect: 'Nitro refills x2', color: '#F2A541' },
  { name: 'PELABUHAN', standing: 'WASPADA', seen: 64, effect: 'Bayside Arms -15%', color: '#2FA8B5' },
  { name: 'PASAR SENJA', standing: 'DIHORMATI', seen: 88, effect: 'Disguise shops -20%', color: '#D94F70' },
  { name: 'MARINA', standing: 'NETRAL', seen: 55, effect: 'Boats unlocked', color: '#4DA6FF' },
  { name: 'BANDARA ARUN', standing: 'WASPADA', seen: 41, effect: 'Wanted +1 star faster', color: '#8A93A6' },
  { name: 'PERBUKITAN', standing: 'NETRAL', seen: 37, effect: 'Off-road grip +15%', color: '#3A9A5A' },
  { name: 'KAMPUNG NELAYAN', standing: 'DIHORMATI', seen: 96, effect: 'Flood shelters free', color: '#E8D5A3' },
];

// Garage — prices the map shot shows.
export const GARAGE = [
  { service: 'REPAIR', price: 250000, note: 'Fix all damage', owned: false },
  { service: 'RESPRAY', price: 400000, note: 'New paint · clears 1 star', owned: false },
  { service: 'MESIN +12%', price: 4000000, note: 'Top speed +12%', owned: true },
  { service: 'ARMOR', price: 3600000, note: 'Damage taken -30%', owned: false },
  { service: 'NITRO', price: 3000000, note: 'LOCKED · REP LV 6', owned: false },
];

// Police units — name + tactic + distance, as the chase panel shows.
export const POLICE_UNITS = [
  { unit: 'ELANG-1', kind: 'HELI', tactic: 'SPOTLIGHT', dist: 42, color: '#B565D8' },
  { unit: 'PATROLI-7', kind: 'CAR', tactic: 'PURSUIT', dist: 18, color: '#4DA6FF' },
  { unit: 'PATROLI-12', kind: 'CAR', tactic: 'RAMMING', dist: 26, color: '#FF4D4D' },
  { unit: 'PATROLI-21', kind: 'CAR', tactic: 'ROADBLOCK', dist: 85, color: '#FFD23F' },
  { unit: 'PATROLI-33', kind: 'CAR', tactic: 'PURSUIT', dist: 61, color: '#4DA6FF' },
  { unit: 'PATROLI-40', kind: 'CAR', tactic: 'SEARCHLIGHT', dist: 120, color: '#FF8C42' },
];

// Weapons — wheel slots with ammo.
export const WEAPONS = [
  { name: 'TANGAN KOSONG', ammo: '∞', key: '1' },
  { name: 'PISTOL', ammo: '12/48', key: '2' },
  { name: 'SMG', ammo: '30/90', key: '3' },
  { name: 'SENAPAN', ammo: '6/18', key: '4' },
];

export const RADIOS = [
  { name: 'VELMARA FM 88.3', track: 'Sunset Bay — Lagu Senja' },
  { name: 'DANGDUT ARUN 91.7', track: 'Arunika — Goyang Pantai' },
  { name: 'SUNSET BAY 104.5', track: 'Badai Arunika — Instrumental' },
];

export const CAREER = {
  carsStolen: 38, copsLost: 13, nearMisses: 27, drifts: 41,
  shots: 214, hits: 171, playTime: '2h 3m', raceWins: 2, bestLap: '1:12',
  kmDriven: '48,2 km', properties: '1/4', shellsFound: 15, shellsTotal: 24,
};

// Live game state (play mode). Shot mode overrides the display numbers
// from SHOTS above, so the dossier numbers always match this file.
export function freshState() {
  return {
    mode: 'title', // title | driving | onfoot | map | paused | gameover
    day: 2, clock: '17:40', money: 12000000, rep: 180, repLevel: 2,
    missionsDone: 2, wanted: 3, health: 95, armour: 60,
    weapon: 1, speedKmh: 0, carCondition: 82,
    position: { x: 0, z: -6 }, heading: 0, onFoot: false,
    disguise: { face: 'MASKER', car: 'MERAH', clothes: 'JAKET' },
    radio: 0, muted: false, minimapNorth: true,
    stats: { ...CAREER },
  };
}

export const STREETS = [
  'JL. PANTAI ARUNIKA', 'JL. MERDEKA', 'JL. PELABUHAN', 'JL. PASAR SENJA',
  'JL. MARINA', 'JL. BANDARA', 'JL. KAMPUNG NELAYAN', 'JL. PERBUKITAN',
];

export const DIALOGUE = {
  chase: { name: 'SINTA', text: 'Polisi di belakang kita! Belok ke Marina — banjir rob nutupin jalan mereka.', color: '#F2A541' },
  combat: { name: 'DET. ARYA', text: 'Raka, serahkan diri. Badai ini tidak akan menunggumu.', color: '#4DA6FF' },
  title: { name: 'SINTA', text: 'Day 4. Badai makin dekat. Kita evakuasi Kampung Nelayan dulu.', color: '#F2A541' },
};
