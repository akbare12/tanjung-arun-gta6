// config.js — every named thing in TANJUNG ARUN: districts, story missions,
// crew, radio stations, shops, collectibles and prices. One job: the data.

export const GAME_TITLE = 'TANJUNG ARUN';
export const GAME_SUBTITLE = 'BADAI ARUNIKA';
export const GAME_TAGLINE = 'Tujuh hari sebelum Topan Arunika mendarat. Satu kota. Satu kru. Satu jalan keluar.';

export const WORLD = { w: 2600, h: 1900 };

// 12 named districts, each with a colour and a title-card line.
export const DISTRICTS = [
  { id: 'pelabuhan', name: 'PELABUHAN ARUN', x: 0, y: 0, w: 620, h: 420, color: '#2e5f7a', blurb: 'Dermaga kontainer & pasar ikan' },
  { id: 'kampung', name: 'KAMPUNG MELATI', x: 620, y: 0, w: 640, h: 420, color: '#7a5a2e', blurb: 'Gang sempit, warung 24 jam' },
  { id: 'chinatown', name: 'PECINAN LAMA', x: 1260, y: 0, w: 640, h: 420, color: '#8a2f2f', blurb: 'Lentera merah & rumah judi' },
  { id: 'bukit', name: 'BUKIT KENCANA', x: 1900, y: 0, w: 700, h: 420, color: '#3f6b3a', blurb: 'Vila, taman & rumah aman' },
  { id: 'pasar', name: 'PASAR SENJA', x: 0, y: 420, w: 620, h: 420, color: '#8a6d1f', blurb: 'Pasar malam terbesar di kota' },
  { id: 'tengah', name: 'KOTA TUA', x: 620, y: 420, w: 640, h: 420, color: '#5a4a7a', blurb: 'Balai kota & alun-alun' },
  { id: 'bisnis', name: 'DISTRIK BISNIS', x: 1260, y: 420, w: 640, h: 420, color: '#2f4a6b', blurb: 'Menara kaca & bank sentral' },
  { id: 'stasiun', name: 'STASIUN UTARA', x: 1900, y: 420, w: 700, h: 420, color: '#6b4a2f', blurb: 'Rel kereta & gudang tua' },
  { id: 'pantai', name: 'PANTAI LESTARI', x: 0, y: 840, w: 620, h: 460, color: '#2e7a6b', blurb: 'Pantai, dermaga & arena balap' },
  { id: 'industri', name: 'KAWASAN INDUSTRI', x: 620, y: 840, w: 640, h: 460, color: '#5a5a5a', blurb: 'Pabrik, bengkel & bengkel cat' },
  { id: 'kampus', name: 'KAMPUS MERDEKA', x: 1260, y: 840, w: 640, h: 460, color: '#4a6b2f', blurb: 'Universitas & asrama' },
  { id: 'bandara', name: 'BANDARA SENJA', x: 1900, y: 840, w: 700, h: 460, color: '#3a3a5a', blurb: 'Landasan & hanggar kargo' },
  { id: 'rawa', name: 'RAWA BANJIR', x: 0, y: 1300, w: 1300, h: 600, color: '#2f4a3a', blurb: 'ZONA BANJIR TOPAN — evakuasi' },
  { id: 'selatan', name: 'TANJUNG SELATAN', x: 1300, y: 1300, w: 1300, h: 600, color: '#6b3a4a', blurb: 'Perumahan & markas kru' },
];

// 8 named story missions with stages, payouts and status.
export const MISSIONS = [
  { id: 1, name: 'PULANG KE TANJUNG', giver: 'SARI', payout: 2500, stages: 3, status: 'DONE', desc: 'Antar Sari pulang lewat Pasar Senja sebelum jam malam.' },
  { id: 2, name: 'UTANG DI PECINAN', giver: 'KOH AAN', payout: 4200, stages: 4, status: 'DONE', desc: 'Tagih utang Koh Aan di rumah judi Pecinan Lama.' },
  { id: 3, name: 'KARGO TENGAH MALAM', giver: 'DARA', payout: 6800, stages: 3, status: 'DONE', desc: 'Curi kontainer dari Pelabuhan Arun tanpa ketahuan.' },
  { id: 4, name: 'BALAP PANTAI LESTARI', giver: 'BIMO', payout: 9500, stages: 2, status: 'DONE', desc: 'Menangkan balap liar 3 lap di tepi pantai.' },
  { id: 5, name: 'JALAN TIKUS', giver: 'SARI', payout: 12000, stages: 4, status: 'DONE', desc: 'Selundupkan kru lewat Rawa Banjir saat air naik.' },
  { id: 6, name: 'BADAI MENDEKAT', giver: 'DARA', payout: 18500, stages: 4, status: 'ACTIVE', desc: 'Evakuasi warga Tanjung Selatan sebelum Topan Arunika mendarat.' },
  { id: 7, name: 'KURIR TERAKHIR', giver: 'KOH AAN', payout: 24000, stages: 3, status: 'LOCKED', desc: 'Antar paket terakhir ke Bandara Senja saat badai CAT 4.' },
  { id: 8, name: 'MATA BADAI', giver: 'BIMO', payout: 50000, stages: 5, status: 'LOCKED', desc: 'Hadapi mata badai di Kota Tua. Akhiri semuanya.' },
];

// Crew — 4 named characters with roles and portrait colours.
export const CREW = [
  { name: 'ARUN', role: 'KAMU — Sopir Pelarian', color: '#e8b23a', line: 'Aku yang bawa mobilnya. Kalian yang bawa masalahnya.' },
  { name: 'SARI', role: 'Wheelwoman', color: '#e86a8a', line: 'Jalan tikus kota ini ada di kepalaku, Arun. Ikuti aku.' },
  { name: 'DARA', role: 'Perencana & Hacker', color: '#6ab8e8', line: 'Kamera kota mati 40 detik. Itu jendela kita.' },
  { name: 'BIMO', role: 'Mekanik & Otot', color: '#8ae86a', line: 'Mesin ini kubangun dari nol. Jangan tabrak tiang lagi.' },
  { name: 'KOH AAN', role: 'Pemberi Kerja', color: '#c9a0e8', line: 'Topan datang, utang tetap utang. Kerja dulu, lari kemudian.' },
];

// Radio stations + songs.
export const RADIO = [
  { station: 'ARUN FM 88.1', song: 'Neon Pesisir — Lestari' },
  { station: 'RADIO SENJA 101.9', song: 'Jalan Pulang — The Melati' },
  { station: 'DARURAT 99.5', song: 'PERINGATAN TOPAN ARUNIKA' },
];

// Storm hook: one system that touches police, map and missions.
export const STORM = {
  name: 'TOPAN ARUNIKA',
  landfallDays: 7,
  categories: ['CAT 1', 'CAT 2', 'CAT 3', 'CAT 4', 'CAT 5'],
  jobs: [
    { name: 'STORM CHASER', pay: 3200 },
    { name: 'EVAC TAXI', pay: 2800 },
    { name: 'SUPPLY RUN', pay: 4100 },
    { name: 'LOOTER BOUNTY', pay: 5500 },
  ],
};

// Shops, upgrades and disguise prices.
export const SHOPS = {
  respray: { name: 'CAT ULANG — BENGKEL BIMO', price: 500, effect: 'Wanted -2 bintang' },
  face: { name: 'TOPI & KACAMATA', price: 350, effect: 'Wanted -1 bintang' },
  clothes: { name: 'JAKET BARU', price: 750, effect: 'Wanted -1 bintang' },
  armor: { name: 'ROMPI ANTI PELURU', price: 2400, effect: '+50 armor' },
  engine: { name: 'MESIN TURBO', price: 8500, effect: '+25% top speed' },
  nos: { name: 'NOS', price: 3200, effect: 'Boost SHIFT' },
  weapon: { name: 'PISTOL + AMMO', price: 1800, effect: 'Senjata +60 peluru' },
};

export const COLLECTIBLE = { name: 'KOIN ARUNIKA', total: 24, found: 7 };
export const SAVE_KEY = 'tanjung-arun-save-v1';

export function formatMoney(n) { return '$' + n.toLocaleString('en-US'); }
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
