// TANJUNG ARUN — BADAI ARUNIKA: all static game data.
// One job: the numbers, names and tables the rest of the game reads.
// Nothing here is copied from any other game: every name, district,
// mission, crew member and radio station is original to Tanjung Arun.

export const GAME_TITLE = 'TANJUNG ARUN';
export const GAME_SUBTITLE = 'BADAI ARUNIKA';
export const GAME_TAGLINE = 'Seven days to the storm. One driver. No way out but through it.';

// Seeded RNG (mulberry32) so the city, traffic and screenshots are stable.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// ---------------------------------------------------------------- city data
export const WORLD_W = 3360;
export const WORLD_H = 2640;
export const BLOCK = 240;      // block pitch (road centre to road centre)
export const ROAD_W = 44;      // road width

// 12 named districts, in a 4 x 3 grid over the city. The coast runs along
// the south edge (beach + port) and the west edge (fishing kampung).
export const DISTRICTS = [
  { id: 'kampus',   name: 'KAMPUS ARUN',      x: 0, y: 0, w: 3, h: 2, color: '#7a6fb0', blurb: 'Universitas & kos-kosan' },
  { id: 'pusat',    name: 'PUSAT KOTA',       x: 3, y: 0, w: 4, h: 2, color: '#c98a3d', blurb: 'Menara & kantor walikota' },
  { id: 'industri', name: 'KAWASAN INDUSTRI', x: 7, y: 0, w: 3, h: 2, color: '#8a8f98', blurb: 'Gudang & kontainer' },
  { id: 'bandara',  name: 'BANDARA ARUN',     x: 10, y: 0, w: 3, h: 2, color: '#5d7f95', blurb: 'Runway & hanggar' },
  { id: 'kotatua',  name: 'KOTA TUA',         x: 0, y: 2, w: 3, h: 2, color: '#a8694f', blurb: 'Gedung kolonial & alun-alun' },
  { id: 'pasar',    name: 'PASAR IKAN',       x: 3, y: 2, w: 4, h: 2, color: '#4f9a7a', blurb: 'Pelelangan ikan 04:00' },
  { id: 'pelangi',  name: 'PERUMAHAN PELANGI',x: 7, y: 2, w: 3, h: 2, color: '#c65f7e', blurb: 'Rumah warna-warni' },
  { id: 'bukit',    name: 'BUKIT ANGIN',      x: 10, y: 2, w: 3, h: 2, color: '#6b8e4e', blurb: 'Vila & turbin angin' },
  { id: 'kampung',  name: 'KAMPUNG NELAYAN',  x: 0, y: 4, w: 3, h: 2, color: '#3f7f8c', blurb: 'Perahu & jaring' },
  { id: 'dermaga',  name: 'DERMAGA SELATAN',  x: 3, y: 4, w: 4, h: 2, color: '#7a5a9e', blurb: 'Pelabuhan & feri' },
  { id: 'pantai',   name: 'PANTAI KARANG',    x: 7, y: 4, w: 3, h: 2, color: '#d9a441', blurb: 'Pasir & warung' },
  { id: 'pelabuhan',name: 'PELABUHAN ARUN',   x: 10, y: 4, w: 3, h: 2, color: '#4a6b8a', blurb: 'Petikemas & kapal' },
];

// POI legend: 14 icon kinds shown on the full map.
export const POI_KINDS = [
  { icon: 'H', label: 'Safehouse', color: '#58d68d' },
  { icon: 'G', label: 'Garage / Bengkel', color: '#f5b041' },
  { icon: 'W', label: 'Weapon shop', color: '#e74c3c' },
  { icon: 'R', label: 'Respray / Cuci', color: '#5dade2' },
  { icon: 'P', label: 'Police station', color: '#2e86c1' },
  { icon: '$', label: 'Job / Misi', color: '#f1c40f' },
  { icon: 'S', label: 'Storm shelter', color: '#af7ac5' },
  { icon: 'C', label: 'Collectible', color: '#48c9b0' },
  { icon: 'T', label: 'Taxi stand', color: '#f39c12' },
  { icon: 'F', label: 'Ferry terminal', color: '#45b39d' },
  { icon: 'M', label: 'Market', color: '#ec7063' },
  { icon: 'A', label: 'Airport', color: '#85c1e9' },
  { icon: 'B', label: 'Beach', color: '#f7dc6f' },
  { icon: '!', label: 'Disaster job', color: '#ff6b35' },
];

// ---------------------------------------------------------------- storm hook
// BADAI ARUNIKA: a 7-day hurricane countdown that is a SYSTEM, not a theme.
// It ticks in every scene and changes gameplay: helicopter grounding,
// blackout chapter, curfew, flood zones, disaster side jobs, emergency radio.
export const STORM = {
  name: 'BADAI ARUNIKA',
  totalDays: 7,
  // storm state at the start of the save (Day 3). The countdown ticks live.
  startDay: 3,
  startHoursLeft: 66,          // 2D 18H at Day 3 06:00
  startCat: 3,
  startWindKmh: 198,
  landfallDay: 7,
  // wind rises ~3 km/h per game hour; CAT 4 at 210 km/h, CAT 5 at 252.
  windPerHour: 3,
};

// ---------------------------------------------------------------- crew
export const CREW = [
  { id: 'raka',  name: 'RAKA "ARUN" PRASETYO', role: 'GETAWAY DRIVER — YOU', color: '#e67e22', initials: 'RA', skill: 'Driving 92', bio: 'Ex-ojek racer. Never lost a tail — yet.' },
  { id: 'sinta', name: 'SINTA MARLINA',       role: 'WHEELWOMAN',          color: '#e84393', initials: 'SM', skill: 'Driving 88', bio: 'Drift queen of Pantai Karang.' },
  { id: 'darma', name: 'DARMA "OMBAK" WIBOWO',role: 'FIXER',               color: '#00b894', initials: 'DW', skill: 'Negotiation 95', bio: 'Knows every cop on the take.' },
  { id: 'lestari', name: 'LESTARI "PETIR" KUSUMA', role: 'HACKER',         color: '#6c5ce7', initials: 'LK', skill: 'Hacking 97', bio: 'Turns traffic lights green. And cameras off.' },
  { id: 'bimo',  name: 'BIMO "JANGKAR" SANTOSO', role: 'MUSCLE',            color: '#d63031', initials: 'BS', skill: 'Combat 90', bio: 'Carries the heavy things. And the plan B.' },
];
export const ANTAGONIST = { name: 'DET. ARYA NUGRAHA', role: 'POLISI TANJUNG ARUN — PEMBURU', color: '#0984e3', initials: 'AN' };

// ---------------------------------------------------------------- missions
// 8 named story missions, each with stages, a payout and a dialogue line.
export const MISSIONS = [
  { id: 'm1', n: 1, name: 'PELARIAN PERTAMA', payout: 2500000, stages: [
    { text: 'Steal the orange sedan at Pasar Ikan', hint: 'Press E near a parked car' },
    { text: 'Lose the 2-star tail through Kota Tua', hint: 'Break line of sight, then hide' },
    { text: 'Deliver the car to Darma at Dermaga', hint: 'Follow the GPS line' } ],
    dialogue: { who: 'DARMA', line: 'Mobilnya oranye, plat B 1188 AR. Jangan baret — itu uang kita.' } },
  { id: 'm2', n: 2, name: 'KARGO BADAI', payout: 4200000, stages: [
    { text: 'Pick up the sealed crate at Pelabuhan', hint: 'Drive to the $ marker' },
    { text: 'Outrun the roadblock on Jalan Merdeka', hint: 'Roadblocks: ram the gap, not the truck' },
    { text: 'Drop the crate at the safehouse', hint: 'Safehouse H on the map' } ],
    dialogue: { who: 'LESTARI', line: 'Kamera pelabuhan sudah kumatiin 90 detik. Jangan telat.' } },
  { id: 'm3', n: 3, name: 'EVAKUASI PANTAI', payout: 3800000, stages: [
    { text: 'Pick up 3 families at Pantai Karang', hint: 'EVAC TAXI: stop at each T marker' },
    { text: 'Drive them to the storm shelter', hint: 'Shelter S — flood zone is rising' },
    { text: 'Return for the last family', hint: 'Wind is up. Drive smooth.' } ],
    dialogue: { who: 'SINTA', line: 'Mereka cuma bawa satu tas, Raka. Jangan kebut-kebut.' } },
  { id: 'm4', n: 4, name: 'SUPPLY RUN: OBAT', payout: 5100000, stages: [
    { text: 'Collect medicine at Rumah Sakit Arun', hint: 'Park at the + marker' },
    { text: 'Deliver to Kampung Nelayan clinic', hint: 'Avoid the flooded underpass' },
    { text: 'Escort the ambulance through the storm', hint: 'Stay ahead of the ambulance' } ],
    dialogue: { who: 'BIMO', line: 'Obatnya buat anak-anak kampung. Kalau hilang, urusannya sama gue.' } },
  { id: 'm5', n: 5, name: 'STORM CHASER', payout: 6800000, stages: [
    { text: 'Chase the storm cell for Lestari', hint: 'Follow the storm cone — stay inside it' },
    { text: 'Photograph the eye wall at Bukit Angin', hint: 'Hold still 5 seconds at the marker' },
    { text: 'Escape before the cell collapses', hint: 'Wind 240+ — the heli is grounded' } ],
    dialogue: { who: 'LESTARI', line: 'Foto dinding mata badai ini bakal bayar utang kita semua.' } },
  { id: 'm6', n: 6, name: 'LOOTER BOUNTY', payout: 7500000, stages: [
    { text: 'Hunt 4 looter crews in Kota Tua', hint: 'On foot: aim with mouse, click to fire' },
    { text: 'Recover the stolen aid crates', hint: 'Crates glow gold on the minimap' },
    { text: 'Bring the crates to the shelter', hint: 'Det. Arya is closing in — move' } ],
    dialogue: { who: 'DET. ARYA', line: 'Prasetyo! Kau pikir badai ini tamengmu? Aku yang memburumu.' } },
  { id: 'm7', n: 7, name: 'BLACKOUT: JAM MALAM', payout: 9200000, stages: [
    { text: 'Cut the grid at the power plant', hint: 'Curfew is live. No lights, no cameras' },
    { text: 'Rob the blackout convoy on Jalan Pelabuhan', hint: '3 trucks, 2 escorts — hit the middle one' },
    { text: 'Vanish before the grid comes back', hint: 'Power returns in 04:00. Be gone.' } ],
    dialogue: { who: 'DARMA', line: 'Jam malam, gelap total, konvoi tanpa pengawalan. Ini malam kita.' } },
  { id: 'm8', n: 8, name: 'BADAI ARUNIKA', payout: 15000000, stages: [
    { text: 'Reach the evacuation ferry at Dermaga', hint: 'Final run. The storm makes landfall at dawn' },
    { text: 'Outrun the storm surge through the flood zone', hint: 'Water rises behind you — do not stop' },
    { text: 'Board the ferry with the crew', hint: 'Everybody gets out. Everybody.' } ],
    dialogue: { who: 'SINTA', line: 'Tujuh hari kita lari dari badai ini. Hari ini kita yang menang.' } },
];

// Disaster side jobs — always on the map, pay cash, raise REP.
export const SIDE_JOBS = [
  { id: 'sj1', name: 'STORM CHASER', pay: 850000, desc: 'Photo the storm cell' },
  { id: 'sj2', name: 'EVAC TAXI', pay: 600000, desc: 'Ferry families to shelter' },
  { id: 'sj3', name: 'SUPPLY RUN', pay: 700000, desc: 'Medicine to the kampung' },
  { id: 'sj4', name: 'LOOTER BOUNTY', pay: 950000, desc: 'Recover stolen aid crates' },
];

// ---------------------------------------------------------------- radio
export const RADIO = [
  { id: 'r1', freq: '101.9', name: 'RADIO ARUN', song: 'Dangdut Malam — Orkes Pantai', color: '#e84393' },
  { id: 'r2', freq: '88.1', name: 'WAVE ARUN', song: 'Neon Drive — Midnight Ferry', color: '#00cec9' },
  { id: 'r3', freq: '99.5', name: 'DARURAT FM', song: 'EMERGENCY BROADCAST — Storm warnings', color: '#ff6b35' },
];

// ---------------------------------------------------------------- police
export const POLICE_UNITS = [
  { id: 'PATROLI-07', kind: 'car', tactic: 'PURSUIT' },
  { id: 'PATROLI-12', kind: 'car', tactic: 'RAMMING' },
  { id: 'PATROLI-23', kind: 'car', tactic: 'ROADBLOCK' },
  { id: 'INTERCEPTOR-31', kind: 'car', tactic: 'BOXING IN' },
  { id: 'PATROLI-44', kind: 'car', tactic: 'ON FOOT' },
  { id: 'ELANG-1', kind: 'heli', tactic: 'SEARCHLIGHT' },
];
export const TACTICS = ['PURSIT', 'RAMMING', 'ROADBLOCK', 'SEARCHLIGHT', 'BOXING IN', 'ON FOOT', 'GROUNDED: WIND'];

// ---------------------------------------------------------------- cars
export const CAR_MODELS = [
  { name: 'Sedan Kota', color: '#e67e22', top: 118, accel: 1.0 },
  { name: 'Taksi Arun', color: '#f1c40f', top: 112, accel: 0.95 },
  { name: 'Pickup Nelayan', color: '#3498db', top: 104, accel: 0.9 },
  { name: 'Sport Karang', color: '#e74c3c', top: 142, accel: 1.25 },
  { name: 'Van Roti', color: '#ecf0f1', top: 96, accel: 0.85 },
  { name: 'Truk Kontainer', color: '#7f8c8d', top: 88, accel: 0.7 },
];
export const PLAYER_CAR_COLOR = '#e67e22';

// ---------------------------------------------------------------- economy
export const ECONOMY = {
  respray: 150000,      // clears wanted
  newFace: 250000,      // disguise: lowers heat
  newClothes: 120000,
  cameraJam: 400000,    // 10 min no camera wanted
  armor: 1800000,
  engine2: 2400000,
  engine3: 5200000,
  nitro: 1500000,
  tires: 900000,
};

// ---------------------------------------------------------------- collectibles / stats
export const COLLECTIBLE = { name: 'KERANG BADAI', total: 24, start: 7 };
export const SAVE_KEY = 'tanjung-arun-save-v1';

export function formatRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('en-US').replace(/,/g, '.');
}
export function formatClock(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
export function formatHoursLeft(hours) {
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  const m = Math.floor((hours % 1) * 60);
  return d > 0 ? `${d}D ${h}H ${String(m).padStart(2, '0')}M` : `${h}H ${String(m).padStart(2, '0')}M`;
}
