// TANJUNG ARUN game state: money, REP, wanted, storm clock, save/load.
// One job: hold everything the game remembers and tick the systems that
// run on their own (storm countdown, clock, heat decay).

import { STORM, COLLECTIBLE, MISSIONS, SAVE_KEY, ECONOMY } from './config.js';

export function freshState() {
  return {
    // progression
    money: 38420000,
    rep: 640, repNext: 900, repLevel: 4, repTitle: 'JALANAN',
    missionIndex: 5,          // MISSION 6/12 in HUD terms (index 5 = mission 6 of 8 story + jobs)
    missionStage: 2,          // STAGE 3/4 of the current mission
    missionsDone: [0, 1, 2, 3, 4], // missions 1-5 DONE
    shells: COLLECTIBLE.start, shellsTotal: COLLECTIBLE.total,
    completion: 46,
    stats: { carsStolen: 38, copsLost: 13, nearMiss: 27, drifts: 41, playMinutes: 123, shotsFired: 214, hits: 171 },
    // wanted / heat
    wanted: 0,
    heat: 0,                  // 0-100, decays when hidden
    wantedStatus: 'CLEAR',    // CLEAR | IN SIGHT | SEARCHING | HIDDEN
    // storm — the hook that ticks in every scene
    stormDay: STORM.startDay,
    stormHoursLeft: STORM.startHoursLeft,
    stormCat: STORM.startCat,
    windKmh: STORM.startWindKmh,
    curfew: false,
    blackout: false,
    // clock: minutes since midnight, Day 3 starts at sunset 18:52
    day: 3,
    clockMin: 18 * 60 + 52,
    // disguise / heat-dump system
    disguise: { face: 'RAKA', car: 'ORANYE', clothes: 'JAKET', camera: 'ON' },
    garage: { armor: 1, engine: 2, nitro: false, tires: 1 },
    // player / world (filled by main.js)
    player: null,
    cars: [],
    traffic: [],
    peds: [],
    police: [],
    bullets: [],
    enemies: [],
    popups: [],               // floating +$ scores
    dialogue: null,           // { who, line, portrait } or null
    objective: null,
    screen: 'title',          // title | playing | map | phone | chapter | passed | paused | gameover
    chapter: null,
    passedInfo: null,
    radioIndex: 0,
    radioOn: true,
    muted: false,
    gameTime: 0,              // seconds since boot
    lastSaveLabel: 'Ch.5 · Rp 31.420.000 · Day 3',
  };
}

export function stormCategory(windKmh) {
  if (windKmh >= 252) return 5;
  if (windKmh >= 210) return 4;
  if (windKmh >= 178) return 3;
  if (windKmh >= 154) return 2;
  return 1;
}

// Tick the storm + clock. gameHours is in-game hours elapsed (1 real second
// = 1 game minute at normal speed, faster during chases).
export function tickStorm(state, gameHours) {
  state.stormHoursLeft = Math.max(0, state.stormHoursLeft - gameHours);
  state.windKmh = Math.round(STORM.startWindKmh + (STORM.startHoursLeft - state.stormHoursLeft) * STORM.windPerHour);
  state.stormCat = stormCategory(state.windKmh);
  state.clockMin = (state.clockMin + gameHours * 60) % (24 * 60);
  const daysPassed = Math.floor((state.clockMin + gameHours * 60) / (24 * 60));
  if (daysPassed > 0) {
    state.day = Math.min(7, state.day + daysPassed);
  }
  // Curfew + blackout kick in on Day 6 evening (mission 7's chapter).
  state.curfew = state.day >= 6 && (state.clockMin >= 20 * 60 || state.clockMin < 5 * 60);
  state.blackout = state.day >= 6 && state.missionIndex >= 6;
  // The helicopter is grounded once the wind passes 220 km/h.
  state.heliGrounded = state.windKmh >= 220;
}

export function wantedStars(state) { return state.wanted; }

export function addMoney(state, n) { state.money += n; }
export function addRep(state, n) {
  state.rep += n;
  while (state.rep >= state.repNext) {
    state.rep -= state.repNext;
    state.repLevel += 1;
    state.repNext = Math.round(state.repNext * 1.35);
  }
  state.completion = Math.min(100, 46 + state.missionsDone.length * 5 + Math.floor(state.shells / 2));
}

export function raiseWanted(state, stars) {
  state.wanted = Math.min(5, Math.max(state.wanted, stars));
  state.wantedStatus = state.wanted > 0 ? 'IN SIGHT' : 'CLEAR';
  state.heat = Math.min(100, state.heat + stars * 18);
}

export function clearWanted(state, how) {
  state.wanted = 0;
  state.heat = 0;
  state.wantedStatus = 'CLEAR';
  state.lastClearHow = how;
}

// ---------------------------------------------------------------- save/load
export function saveGame(state) {
  try {
    const s = {
      money: state.money, rep: state.rep, repLevel: state.repLevel, repNext: state.repNext,
      missionIndex: state.missionIndex, missionStage: state.missionStage,
      missionsDone: state.missionsDone, shells: state.shells,
      stats: state.stats, day: state.day, clockMin: state.clockMin,
      stormHoursLeft: state.stormHoursLeft, windKmh: state.windKmh,
      disguise: state.disguise, garage: state.garage,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    state.lastSaveLabel = `Ch.${state.missionIndex + 1} · Rp ${(state.money / 1000000).toFixed(2).replace('.', ',')} jt · Day ${state.day}`;
    return true;
  } catch { return false; }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function applySave(state, s) {
  if (!s) return;
  state.money = s.money ?? state.money;
  state.rep = s.rep ?? state.rep;
  state.repLevel = s.repLevel ?? state.repLevel;
  state.repNext = s.repNext ?? state.repNext;
  state.missionIndex = s.missionIndex ?? state.missionIndex;
  state.missionStage = s.missionStage ?? state.missionStage;
  state.missionsDone = s.missionsDone ?? state.missionsDone;
  state.shells = s.shells ?? state.shells;
  state.stats = { ...state.stats, ...(s.stats || {}) };
  state.day = s.day ?? state.day;
  state.clockMin = s.clockMin ?? state.clockMin;
  state.stormHoursLeft = s.stormHoursLeft ?? state.stormHoursLeft;
  state.windKmh = s.windKmh ?? state.windKmh;
  state.stormCat = stormCategory(state.windKmh);
  state.disguise = { ...state.disguise, ...(s.disguise || {}) };
  state.garage = { ...state.garage, ...(s.garage || {}) };
}

export function missionList(state) {
  return MISSIONS.map((m, i) => ({
    ...m,
    status: state.missionsDone.includes(i) ? 'DONE' : i === state.missionIndex ? 'ACTIVE' : i < state.missionIndex ? 'DONE' : 'LOCKED',
  }));
}

export function economyPrices() { return ECONOMY; }
