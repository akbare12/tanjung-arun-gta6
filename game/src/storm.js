// storm.js — the identity hook: TOPAN ARUNIKA, a 7-day hurricane countdown
// that lives in every scene and changes gameplay: wind grounds the
// helicopter, the flood zone grows, curfew falls at night, and storm side
// jobs pay out. One job: the storm system.

import { STORM } from './config.js';

export function createStorm(sceneDay) {
  // sceneDay: which day of the 7-day countdown this scene shows (1-7).
  const day = sceneDay || 2;
  return {
    name: STORM.name,
    day,
    daysLeft: 7 - day,
    hoursLeft: (7 - day) * 24 + (day === 2 ? 14 : day === 3 ? 9 : 23),
    minutesLeft: day === 2 ? 32 : day === 3 ? 51 : 5,
    category: STORM.categories[Math.min(4, day - 1)],
    windKmh: 120 + day * 22,
    rainMm: 40 + day * 18,
    curfew: day >= 3,
    blackout: day >= 5,
  };
}

export function stormCountdownText(storm) {
  return storm.daysLeft + 'D ' + String(storm.hoursLeft % 24).padStart(2, '0') + 'H ' +
    String(storm.minutesLeft).padStart(2, '0') + 'M TO LANDFALL';
}

export function stormStatusLines(storm) {
  return [
    storm.name + ' — ' + storm.category,
    'LANDFALL ' + stormCountdownText(storm),
    'WIND ' + storm.windKmh + ' KM/H',
    'RAIN ' + storm.rainMm + ' MM/H',
    storm.curfew ? 'CURFEW 21:00–05:00 ACTIVE' : 'CURFEW LIFTS AT DAY 3',
    storm.blackout ? 'BLACKOUT: LIGHTS OFF' : 'POWER GRID STABLE',
    storm.windKmh >= 200 ? 'HELI GROUNDED: WIND' : 'HELI AIRBORNE',
  ];
}

export function drawStormRain(ctx, w, h, intensity, t) {
  ctx.strokeStyle = 'rgba(180,220,255,' + (0.25 + intensity * 0.3) + ')';
  ctx.lineWidth = 1;
  const n = 40 + Math.floor(intensity * 120);
  for (let i = 0; i < n; i++) {
    const x = ((i * 137.5 + t * 900) % (w + 40)) - 20;
    const y = ((i * 89.3 + t * 1400) % (h + 40)) - 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 16);
    ctx.stroke();
  }
}
