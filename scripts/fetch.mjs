/**
 * fetch.mjs: the only script that touches the network.
 *
 * Writes data/stats.json with everything the dynamic plates draw:
 *   - every day of the last year            (heat)
 *   - monthly totals since the account began (pulse)
 *   - followers, public repos, stars, the most recent push (pulse, heat)
 *
 * Two routes, tried in order:
 *   1. GraphQL with PROFILE_TOKEN or GITHUB_TOKEN (what the workflow uses)
 *   2. The public contribution calendar and profile pages (works locally,
 *      no token needed)
 *
 * It fails soft. If both routes break, the previous stats.json is kept and
 * the process still exits 0: yesterday's numbers beat a broken image.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DATA = (f) => new URL(`../data/${f}`, import.meta.url);
const { handle } = JSON.parse(readFileSync(DATA('profile.json'), 'utf8'));
const TOKEN = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN || '';
const THIS_YEAR = new Date().getUTCFullYear();

/* ── route 1: GraphQL ── */

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'user-agent': `${handle}-profile`, authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data.user;
}

async function viaGraphQL() {
  if (!TOKEN) throw new Error('no token in the environment');
  const u = await gql(`query($login:String!){
    user(login:$login){
      createdAt
      followers{ totalCount }
      repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC,
                   orderBy:{field:PUSHED_AT, direction:DESC}){
        totalCount
        nodes{ name stargazerCount pushedAt }
      }
      contributionsCollection{ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } }
    }
  }`, { login: handle });

  // contributionsCollection spans at most a year, so the all-time view is
  // one query per calendar year since the account was created.
  const years = {};
  for (let y = new Date(u.createdAt).getUTCFullYear(); y <= THIS_YEAR; y++) {
    const yu = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){
      user(login:$login){ contributionsCollection(from:$from,to:$to){
        contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`,
      { login: handle, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    years[y] = yu.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, n: d.contributionCount }));
  }

  // The profile repo is pushed by this very workflow, so it never counts.
  const pushed = u.repositories.nodes.find((r) => r.name.toLowerCase() !== handle.toLowerCase());
  return {
    source: 'graphql',
    joined: u.createdAt.slice(0, 10),
    followers: u.followers.totalCount,
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0),
    lastPush: pushed ? { repo: pushed.name, at: pushed.pushedAt } : null,
    days: u.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, n: d.contributionCount })),
    years,
  };
}

/* ── route 2: public pages ── */

async function page(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

/** Parse a contribution calendar page: each cell has a date, its tooltip the count. */
function parseCalendar(html) {
  const dateById = new Map();
  for (const m of html.matchAll(/data-date="([\d-]+)" id="(contribution-day-component-[\d-]+)"/g)) dateById.set(m[2], m[1]);
  const days = [];
  for (const m of html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)/g)) {
    const date = dateById.get(m[1]);
    if (date) days.push({ date, n: /^No /.test(m[2]) ? 0 : parseInt(m[2], 10) || 0 });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function viaHTML() {
  const days = parseCalendar(await page(`https://github.com/users/${handle}/contributions`));
  if (days.length < 300) throw new Error(`calendar parse found only ${days.length} days`);

  // Walk back a year at a time until we pass the first year with any activity.
  const years = {};
  let seen = false;
  for (let y = THIS_YEAR; y >= 2008; y--) {
    const yd = parseCalendar(await page(`https://github.com/users/${handle}/contributions?from=${y}-01-01&to=${y}-12-31`))
      .filter((d) => d.date.startsWith(String(y)));
    const total = yd.reduce((s, d) => s + d.n, 0);
    if (total > 0) { seen = true; years[y] = yd; }
    else if (seen) break;
  }

  // Extras are nice-to-have on this route; never fatal.
  let followers = null, repos = null, stars = null, lastPush = null;
  try {
    const prof = await page(`https://github.com/${handle}`);
    followers = parseInt((prof.match(/([\d,]+)<\/span>\s*followers/) || prof.match(/([\d,]+) followers/) || [])[1]?.replace(/,/g, ''), 10) || null;
    repos = parseInt((prof.match(/Repositories\s*<span[^>]*>([\d,]+)/) || [])[1]?.replace(/,/g, ''), 10) || null;
    stars = 0;
    for (let p = 1; p <= 5; p++) {
      const html = await page(`https://github.com/${handle}?tab=repositories&type=source&page=${p}`);
      const items = html.split('<li class="col-12 d-flex').slice(1);
      if (!items.length) break;
      for (const li of items) {
        const s = li.match(/\/stargazers"[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/);
        if (s) stars += parseInt(s[1].replace(/,/g, ''), 10);
        const name = li.match(/itemprop="name codeRepository"[^>]*>\s*([^<\s]+)/)?.[1];
        const at = li.match(/datetime="([^"]+)"/)?.[1];
        if (!lastPush && name && at && name.toLowerCase() !== handle.toLowerCase()) lastPush = { repo: name, at };
      }
    }
  } catch (e) { console.warn(`  profile extras skipped: ${e.message}`); }
  return { source: 'html', joined: null, followers, repos, stars, lastPush, days, years };
}

/* ── derive ── */

function derive(raw) {
  const days = raw.days;
  let run = 0, longest = 0;
  for (const d of days) { run = d.n > 0 ? run + 1 : 0; if (run > longest) longest = run; }
  // "Current" reaches today or yesterday: the morning run often sees an empty today.
  let current = 0, i = days.length - 1;
  if (i >= 0 && days[i].n === 0) i--;
  for (; i >= 0 && days[i].n > 0; i--) current++;
  const hottest = days.reduce((a, b) => (b.n > a.n ? b : a), { date: null, n: 0 });

  const monthly = {};
  for (const yd of Object.values(raw.years || {})) for (const d of yd) {
    const k = d.date.slice(0, 7);
    monthly[k] = (monthly[k] || 0) + d.n;
  }
  const thisMonth = new Date().toISOString().slice(0, 7);
  for (const k of Object.keys(monthly)) if (k > thisMonth) delete monthly[k];   // calendars pad with future days
  const months = Object.keys(monthly).sort();
  // Trim the empty run before the first active month so the chart starts on something.
  while (months.length && monthly[months[0]] === 0) delete monthly[months.shift()];

  return {
    generated: new Date().toISOString(),
    source: raw.source,
    joined: raw.joined,
    followers: raw.followers, repos: raw.repos, stars: raw.stars, lastPush: raw.lastPush,
    total: days.reduce((s, d) => s + d.n, 0),
    active: days.filter((d) => d.n > 0).length,
    longest, current,
    hottest: { date: hottest.date, n: hottest.n },
    allTime: Object.values(monthly).reduce((s, n) => s + n, 0),
    monthly,
    days,
  };
}

let raw = null;
for (const route of [viaGraphQL, viaHTML]) {
  try { raw = await route(); break; }
  catch (e) { console.warn(`${route.name}: ${e.message}`); }
}

const prev = existsSync(DATA('stats.json')) ? JSON.parse(readFileSync(DATA('stats.json'), 'utf8')) : null;
if (!raw) {
  if (prev) { console.warn('keeping the previous data/stats.json'); process.exit(0); }
  console.warn('no data and no cache: plates will draw empty');
  writeFileSync(DATA('stats.json'), JSON.stringify(derive({ source: 'empty', days: [], years: {} })) + '\n');
  process.exit(0);
}
// Keep whatever this route couldn't see from the last good run.
for (const k of ['followers', 'repos', 'stars', 'lastPush', 'joined']) if (raw[k] == null && prev) raw[k] = prev[k] ?? null;
if (!Object.keys(raw.years || {}).length && prev?.monthly) raw.years = null;

const out = derive(raw);
if (raw.years === null) { out.monthly = prev.monthly; out.allTime = prev.allTime; }
writeFileSync(DATA('stats.json'), JSON.stringify(out) + '\n');
console.log(`stats via ${out.source}: ${out.total} this year, ${out.allTime} all-time over ${Object.keys(out.monthly).length} months, ` +
  `longest ${out.longest}d, current ${out.current}d, ★${out.stars}, ${out.followers} followers, last push ${out.lastPush?.repo ?? '—'}`);
