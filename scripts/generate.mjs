// Generates the SVG cards used by README.md.
//   node scripts/generate.mjs          -> uses real data (needs GH_TOKEN)
//   node scripts/generate.mjs --demo   -> uses fake data (offline preview)
import { writeFileSync, mkdirSync } from 'node:fs';

/* ───────────────────────── EDIT ME ───────────────────────── */
const CONFIG = {
  username: 'vaibhavupadhyay001',
  name: 'Vaibhav',
  initial: 'V',
  tagline: 'A developer learning DSA & C++ and building projects, in public.',
  badge: 'vaibhavupadhyay001',
  tags: [
    ['C++ & DSA', '#2d4a8a'],
    ['web projects', '#8a5f1f'],
    ['AI / ML', '#4b3a8a'],
    ['build in public', '#7a2e3e'],
  ],
  links: [
    { id: 'github', label: 'GitHub', handle: '@vaibhavupadhyay001', color: '#262a45', url: 'https://github.com/vaibhavupadhyay001' },
    { id: 'linkedin', label: 'LinkedIn', handle: '', color: '#2d4a8a', url: 'https://linkedin.com/in/vaibhavupadhyay01' },
    { id: 'instagram', label: 'Instagram', handle: '@imvaiibhav', color: '#7a2e3e', url: 'https://instagram.com/imvaiibhav' },
  ],
  platforms: [
    { id: 'leetcode', name: 'LeetCode', mark: 'LC', handle: 'vaibhav_upadhya', url: 'https://leetcode.com/u/vaibhav_upadhyay', color: '#8a5b1d', big: 'Knight', sub: 'LeetCode badge' },
    { id: 'gfg', name: 'GeeksforGeeks', mark: 'GfG', handle: 'vaibhav_upadhyay', url: 'https://www.geeksforgeeks.org/user/vaibhav_upadhyay', color: '#2e5d3b', big: 'Top 1.3%', sub: 'in institute' },
    { id: 'hackerrank', name: 'HackerRank', mark: 'HR', handle: 'upadhyay_vaibhav', url: 'https://www.hackerrank.com/profile/upadhyay_vaibhav', color: '#2a5f68', big: '5\u2605', sub: 'stars on HackerRank' },
  ],
  timeZone: 'Asia/Kolkata',
  outDir: 'assets',
};
/* ──────────────────────────────────────────────────────────── */

const FONT = "'Fredoka','Baloo 2','Nunito','Trebuchet MS','Segoe UI',Verdana,sans-serif";
const MONO = "ui-monospace,'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";
const ORANGE = '#f2784b';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => Number(n).toLocaleString('en-US');
const SHRINK = 2; // every font is 2px smaller than the base design
const estW = (s, size, f = 0.56) => Math.round(String(s).length * (size - SHRINK) * f);
const text = (s, x, y, size, fill, { weight = 700, mono = false, anchor = 'start', tl = 0, op = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${mono ? MONO : FONT}" font-size="${size - SHRINK}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}" text-anchor="${anchor}"${
    tl ? ` textLength="${tl}" lengthAdjust="spacingAndGlyphs"` : ''
  }>${esc(s)}</text>`;

const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
<defs>
  <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.06"/></pattern>
</defs>
${body}
</svg>`;

const card = (w, h) =>
  `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="26" fill="#161a2e" stroke="#252a4a" stroke-width="2"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="26" fill="url(#dots)"/>`;

/* ───────────────────────── data ───────────────────────── */
const dayMs = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + 'T00:00:00Z');

function demoData() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const days = [];
  const end = parse(iso(new Date()));
  for (let i = 400; i >= 0; i--) {
    const d = new Date(end - i * dayMs);
    const r = rnd();
    days.push({ date: iso(d), count: r < 0.3 ? 0 : Math.floor(rnd() * rnd() * 120) });
  }
  return { days, createdYear: 2024, repos: 18, stars: 5, downloads: 0 };
}

async function gql(query, variables) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Set GH_TOKEN (or run with --demo).');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error('GitHub API error: ' + JSON.stringify(json.errors || json));
  return json.data;
}

async function realData() {
  const login = CONFIG.username;
  const first = await gql(`query($l:String!){user(login:$l){createdAt}}`, { l: login });
  const createdYear = new Date(first.user.createdAt).getUTCFullYear();
  const nowYear = new Date().getUTCFullYear();
  const map = new Map();
  for (let y = createdYear; y <= nowYear; y++) {
    const data = await gql(
      `query($l:String!,$f:DateTime!,$t:DateTime!){user(login:$l){contributionsCollection(from:$f,to:$t){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
      { l: login, f: `${y}-01-01T00:00:00Z`, t: `${y}-12-31T23:59:59Z` },
    );
    for (const w of data.user.contributionsCollection.contributionCalendar.weeks)
      for (const d of w.contributionDays) map.set(d.date, d.contributionCount);
  }
  const today = iso(new Date());
  const days = [...map.entries()].filter(([d]) => d <= today).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));

  let repos = 0, stars = 0, downloads = 0, cursor = null;
  for (;;) {
    const d = await gql(
      `query($l:String!,$c:String){user(login:$l){repositories(first:50,after:$c,privacy:PUBLIC,ownerAffiliations:OWNER){totalCount pageInfo{hasNextPage endCursor}
        nodes{stargazerCount releases(first:20){nodes{releaseAssets(first:20){nodes{downloadCount}}}}}}}}`,
      { l: login, c: cursor },
    );
    const r = d.user.repositories;
    repos = r.totalCount;
    for (const n of r.nodes) {
      stars += n.stargazerCount;
      for (const rel of n.releases.nodes) for (const a of rel.releaseAssets.nodes) downloads += a.downloadCount;
    }
    if (!r.pageInfo.hasNextPage) break;
    cursor = r.pageInfo.endCursor;
  }
  return { days, createdYear, repos, stars, downloads };
}

function computeStats(days) {
  const lastYear = days.slice(-365).reduce((s, d) => s + d.count, 0);
  const total = days.reduce((s, d) => s + d.count, 0);
  let longest = 0, run = 0;
  for (const d of days) { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  // current streak: today may still be empty, so start from yesterday in that case
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0, since = null;
  for (; i >= 0 && days[i].count > 0; i--) { current++; since = days[i].date; }
  return { lastYear, total, longest, current, since };
}

/* ───────────────────────── icons (20×20) ───────────────────────── */
const icons = {
  calendar: (bg) => `<rect x="1" y="3" width="18" height="16" rx="4" fill="${ORANGE}"/><rect x="5" y="0" width="2.4" height="5" rx="1.2" fill="${ORANGE}"/><rect x="12.6" y="0" width="2.4" height="5" rx="1.2" fill="${ORANGE}"/><rect x="4" y="9" width="12" height="7" rx="1.5" fill="${bg}"/>`,
  flame: () => `<path d="M10 0.5C10.5 6 16 8 16 13.5A6 6 0 0 1 4 13.5C4 10.5 6 9.5 6.5 6.5C8 7.5 9.5 6 10 0.5Z" fill="${ORANGE}"/>`,
  trophy: () => `<g fill="#f0b440"><path d="M5 1.5h10V8a5 5 0 0 1-10 0z"/><rect x="9" y="12.5" width="2" height="3.5"/><rect x="5.5" y="16" width="9" height="2.5" rx="1.2"/></g><path d="M5 3.5H2v2.5a3 3 0 0 0 3 3M15 3.5h3v2.5a3 3 0 0 1-3 3" fill="none" stroke="#f0b440" stroke-width="1.8" stroke-linecap="round"/>`,
  bars: () => `<g fill="${ORANGE}"><rect x="1.5" y="10" width="4.5" height="9" rx="1.2"/><rect x="7.8" y="2" width="4.5" height="17" rx="1.2"/><rect x="14" y="6.5" width="4.5" height="12.5" rx="1.2"/></g>`,
  folder: () => `<path d="M1 4.5A2.5 2.5 0 0 1 3.5 2H7l2 2.2h7.5A2.5 2.5 0 0 1 19 6.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 1 15.5z" fill="${ORANGE}"/>`,
  star: () => `<polygon points="10,1 12.6,7 19,7.6 14.1,11.9 15.6,18.4 10,15 4.4,18.4 5.9,11.9 1,7.6 7.4,7" fill="${ORANGE}" stroke="${ORANGE}" stroke-width="1" stroke-linejoin="round"/>`,
  download: () => `<path d="M10 1.5v10M5.8 8l4.2 4.2L14.2 8M2.5 17.5h15" fill="none" stroke="${ORANGE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
};
const icon = (name, x, y, s = 1, arg) => `<g transform="translate(${x} ${y}) scale(${s})">${icons[name](arg)}</g>`;

/* ───────────────────────── header ───────────────────────── */
function header() {
  const W = 820, H = 232;
  const t1 = 'Hi, I’m';
  const w1 = estW(t1, 46, 0.5), w2 = estW(CONFIG.name, 46, 0.53);
  const nameX = 152 + w1 + 24;
  let px = 152, pills = '';
  for (const [label, color] of CONFIG.tags) {
    const w = estW(label, 13, 0.58) + 30;
    pills += `<rect x="${px}" y="164" width="${w}" height="32" rx="10" fill="${color}" stroke="#ffffff" stroke-opacity=".12" stroke-width="1.5"/>${text(label, px + w / 2, 185, 13, '#ffffff', { anchor: 'middle' })}`;
    px += w + 14;
  }
  const bw = estW(CONFIG.badge, 15, 0.58) + 34, bx = W - 36 - bw;
  return wrap(W, H, `${card(W, H)}
<g transform="translate(40 52)">
  <rect x="9" y="9" width="84" height="84" rx="20" fill="${ORANGE}"/>
  <rect x="2.5" y="2.5" width="84" height="84" rx="20" fill="#f6f1e4" stroke="#0f1120" stroke-width="5"/>
  ${text(CONFIG.initial, 44.5, 66, 56, '#14162a', { weight: 800, anchor: 'middle' })}
</g>
${text(t1, 152, 100, 46, '#ffffff', { weight: 800, tl: w1 })}
<rect x="${nameX - 14}" y="52" width="${w2 + 28}" height="62" rx="14" fill="#7a2e3e"/>
${text(CONFIG.name, nameX, 100, 46, '#ffffff', { weight: 800, tl: w2 })}
${text(CONFIG.tagline, 152, 140, 17, '#aab0d0', { weight: 500 })}
${pills}
<g transform="translate(${bx} 36) rotate(4 ${bw / 2} 19)">
  <rect width="${bw}" height="38" rx="9" fill="${ORANGE}" stroke="#0f1120" stroke-width="2.5"/>
  ${text(CONFIG.badge, bw / 2, 25, 15, '#1a1020', { weight: 800, anchor: 'middle' })}
</g>`);
}

/* ───────────────────────── link pills ───────────────────────── */
const linkIcons = {
  github: `<g transform="scale(1.1)" fill="#fff"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></g>`,
  linkedin: `<rect x="0" y="0" width="17" height="17" rx="3.5" fill="#fff"/>${text('in', 8.5, 13.5, 12, '#2d4a8a', { weight: 800, anchor: 'middle' })}`,
  instagram: `<rect x="1" y="1" width="15" height="15" rx="4.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="3.4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12.7" cy="4.3" r="1" fill="#fff"/>`,
};
function linkPill(l) {
  const H = 38;
  const w1 = estW(l.label, 14, 0.58), w2 = l.handle ? estW(l.handle, 12.5, 0.6) + 8 : 0;
  const W = 14 + 18 + 8 + w1 + w2 + 16;
  return wrap(W, H, `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="11" fill="${l.color}" stroke="#ffffff" stroke-opacity=".14" stroke-width="1.5"/>
<g transform="translate(14 10)">${linkIcons[l.id]}</g>
${text(l.label, 14 + 18 + 8, 24, 14, '#ffffff', { tl: w1 })}
${l.handle ? text(l.handle, 14 + 18 + 8 + w1 + 8, 24, 12.5, '#ffffff', { weight: 500, mono: true, op: 0.65 }) : ''}`);
}

/* ───────────────────────── stats ───────────────────────── */
function statsCard(data, st, dateLabel) {
  const W = 820, H = 332;
  const gap = 14, tw = (W - 56 - gap * 3) / 4;
  const sinceLabel = st.since
    ? 'since ' + new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parse(st.since))
    : 'start one today';
  const dd = (n) => `${fmt(n)} ${n === 1 ? 'day' : 'days'}`;
  const tiles = [
    { c: '#2f4b82', ic: 'calendar', big: fmt(st.lastYear), l: ['contributions in', 'the last year'], rot: -1.6 },
    { c: '#2e5d3b', ic: 'flame', big: dd(st.current), l: ['current streak,', sinceLabel], rot: 1.2 },
    { c: '#8a5b1d', ic: 'trophy', big: dd(st.longest), l: ['longest streak', 'ever'], rot: -1 },
    { c: '#4a3b86', ic: 'bars', big: fmt(st.total), l: ['contributions', `since ${data.createdYear}`], rot: 1.5 },
  ];
  let body = '';
  tiles.forEach((t, i) => {
    const x = 28 + i * (tw + gap), y = 88, h = 128;
    const size = t.big.length > 7 ? 32 : 38;
    body += `<g transform="rotate(${t.rot} ${x + tw / 2} ${y + h / 2})">
  <rect x="${x}" y="${y}" width="${tw}" height="${h}" rx="20" fill="${t.c}" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
  ${icon(t.ic, x + tw - 38, y + 16, 1, t.c)}
  ${text(t.big, x + 18, y + 66, size, '#ffffff', { weight: 800 })}
  ${text(t.l[0], x + 18, y + 90, 15, '#ffffff', { weight: 500, op: 0.85 })}
  ${text(t.l[1], x + 18, y + 109, 15, '#ffffff', { weight: 500, op: 0.85 })}
</g>`;
  });
  const pills = [
    { c: '#2a5f68', ic: 'folder', n: fmt(data.repos), l: 'public repos', w: 228, rot: -0.6 },
    { c: '#7a2f3b', ic: 'star', n: fmt(data.stars), l: 'stars earned', w: 222, rot: 0.6 },
    { c: '#2f6040', ic: 'download', n: fmt(data.downloads), l: 'release downloads', w: 0, rot: -0.4 },
  ];
  const total = W - 56 - 14 * 2;
  pills[2].w = total - pills[0].w - pills[1].w;
  let px = 28;
  for (const p of pills) {
    const y = 238, h = 62, nw = estW(p.n, 26, 0.58);
    body += `<g transform="rotate(${p.rot} ${px + p.w / 2} ${y + h / 2})">
  <rect x="${px}" y="${y}" width="${p.w}" height="${h}" rx="18" fill="${p.c}" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
  ${icon(p.ic, px + 18, y + 20, 1.1)}
  ${text(p.n, px + 50, y + 40, 26, '#ffffff', { weight: 800 })}
  ${text(p.l, px + 50 + nw + 10, y + 39, 15, '#ffffff', { weight: 500, mono: true, op: 0.85 })}
</g>`;
    px += p.w + 14;
  }
  return wrap(W, H, `${card(W, H)}
${text('On GitHub', 30, 56, 28, '#ffffff', { weight: 800 })}
${text(`redrawn every night · ${dateLabel}`, W - 30, 54, 13, '#aab0d0', { mono: true, weight: 500, anchor: 'end' })}
${body}`);
}

/* ───────────────────────── heatmap ───────────────────────── */
function heatmap(days) {
  const W = 820;
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const end = parse(days[days.length - 1].date);
  const start0 = new Date(end - 181 * dayMs);
  const start = new Date(start0 - start0.getUTCDay() * dayMs); // back to Sunday
  const weeks = Math.ceil((end - start) / dayMs / 7 + 1 / 7);
  const px = 24, inner = W - px * 2;
  const pitch = Math.min(30, Math.floor((inner - 32) / weeks)), cell = pitch - 4;
  const gx = px + (inner - weeks * pitch + 4) / 2, gy = 118;

  const vals = [...byDate.values()].filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(vals.length * p))] ?? 1;
  const [q1, q2, q3] = [q(0.4), q(0.7), q(0.9)];
  const lvl = (v) => (v <= 0 ? 0 : v <= q1 ? 1 : v <= q2 ? 2 : v <= q3 ? 3 : 4);
  const pal = [['#2a2e52', '#6a6f99'], ['#2f5d3a', '#cfe8d4'], ['#3d7f4b', '#eaf7ec'], ['#58b266', '#0f2415'], ['#86e48f', '#0d2b14']];

  let cells = '', total = 0, months = '', lastLabelCol = -9;
  const mfmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  for (let c = 0; c < weeks; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(start.getTime() + (c * 7 + r) * dayMs);
      if (d > end) continue;
      const v = byDate.get(iso(d));
      if (v === undefined) continue;
      total += v;
      const [bg, fg] = pal[lvl(v)];
      const x = gx + c * pitch, y = gy + r * pitch;
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="5" fill="${bg}"/>${text(v, x + cell / 2, y + cell / 2 + 4, cell > 22 ? 11 : 9.5, fg, { mono: true, anchor: 'middle', weight: 700 })}`;
    }
    const firstOfMonth = [...Array(7)].map((_, r) => new Date(start.getTime() + (c * 7 + r) * dayMs)).find((d) => d.getUTCDate() === 1);
    const lab = c === 0 ? start0 : firstOfMonth;
    if (lab && c - lastLabelCol >= 3) { months += text(mfmt.format(lab), gx + c * pitch, gy - 14, 14, '#aab0d0', { mono: true, weight: 500 }); lastLabelCol = c; }
  }
  const gridBottom = gy + 7 * pitch;
  const H = gridBottom + 70;
  const legendX = px + inner - 24 - 5 * 18 - 48;
  let legend = text('Less', legendX - 8, gridBottom + 28, 14, '#aab0d0', { mono: true, weight: 500, anchor: 'end' });
  pal.forEach(([bg], i) => (legend += `<rect x="${legendX + i * 18}" y="${gridBottom + 14}" width="14" height="14" rx="3" fill="${bg}"/>`));
  legend += text('More', legendX + 5 * 18 + 8, gridBottom + 28, 14, '#aab0d0', { mono: true, weight: 500 });

  const head = fmt(total);
  return wrap(W, H, `${card(W, H)}
<rect x="${px}" y="22" width="${inner}" height="${H - 44}" rx="20" fill="#1c2040" stroke="#2d3262" stroke-width="2"/>
${text(head, px + 18, 66, 22, '#ffffff', { weight: 800 })}
${text(' contributions in the last 6 months', px + 18 + estW(head, 22, 0.6) + 4, 65, 16, '#c3c8e6', { mono: true, weight: 500 })}
${months}
${cells}
${text('contributions per day', px + 18, gridBottom + 28, 14, '#aab0d0', { mono: true, weight: 500 })}
${legend}`);
}

/* ───────────────────────── coding profiles ───────────────────────── */
function platformTitle() {
  return wrap(820, 52, text('Coding profiles', 30, 38, 28, '#ffffff', { weight: 800 }));
}
function platformTile(p) {
  const W = 262, H = 132;
  const bigSize = p.big.length > 6 ? 30 : 36;
  return wrap(W, H, `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="${p.color}" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
<rect x="16" y="16" width="38" height="38" rx="10" fill="#0f1120" fill-opacity=".45"/>
${text(p.mark, 35, 41, 15, '#ffffff', { weight: 800, anchor: 'middle' })}
${text(p.name, 64, 33, 20, '#ffffff', { weight: 800 })}
${text('@' + p.handle, 64, 51, 13, '#ffffff', { mono: true, weight: 500, op: 0.7 })}
${text(p.big, 18, 98, bigSize, '#ffffff', { weight: 800 })}
${text(p.sub, 18, 119, 14, '#ffffff', { weight: 500, op: 0.85 })}`);
}

/* ───────────────────────── main ───────────────────────── */
const demo = process.argv.includes('--demo');
const data = demo ? demoData() : await realData();
const st = computeStats(data.days);
const dateLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: CONFIG.timeZone }).format(new Date());

mkdirSync(CONFIG.outDir, { recursive: true });
const out = (f, s) => writeFileSync(`${CONFIG.outDir}/${f}`, s);
out('header.svg', header());
out('stats.svg', statsCard(data, st, dateLabel));
out('heatmap.svg', heatmap(data.days));
out('coding-title.svg', platformTitle());
for (const p of CONFIG.platforms) out(`coding-${p.id}.svg`, platformTile(p));
for (const l of CONFIG.links) out(`link-${l.id}.svg`, linkPill(l));
console.log(`${demo ? '[demo] ' : ''}wrote cards → ${CONFIG.outDir}/`, { ...st, repos: data.repos, stars: data.stars, downloads: data.downloads });
