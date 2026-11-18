import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { Store } from './store.js';
import { randomToken, hashToken, safeEqual, hashPassword, verifyPassword, createSecretBox } from './security.js';
import { RulesProvider, computeRewards, REWARD_TYPES } from './rewards.js';
import { soopConfig, isSoopConfigured, authorizeUrl, exchangeCode, refreshTokens } from './soop.js';
import { CentralConfig } from './central-config.js';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const dataDir = process.env.DATA_DIR || path.resolve(root, '../data');
const sessionSecret = process.env.SESSION_SECRET || '';
const ingestToken = process.env.DONATION_INGEST_TOKEN || '';
// 인증 도메인(스트리머 브라우저와 숨은 Edge가 접속할 이 서버의 주소)은 config/central.json의 publicBaseUrl.
// 파일을 고치면 재시작 없이 반영된다. SOOP 앱의 Redirect URL은 `${publicBaseUrl}/oauth/callback`이어야 한다.
const centralConfig = new CentralConfig(process.env.CENTRAL_CONFIG_FILE || path.resolve(root, '../config/central.json'),
  { publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${port}` });
const publicBaseUrl = () => centralConfig.get().publicBaseUrl;
const linkCookieSecure = () => publicBaseUrl().startsWith('https://');
const secure = process.env.TRUST_PROXY === 'true';
const store = await new Store(dataDir).init();
const tokenBox = createSecretBox(sessionSecret);
// 보상 규칙(config/rules.json). 파일을 수정하면 재시작 없이 다음 후원부터 반영된다.
const rules = new RulesProvider(process.env.RULES_FILE || path.resolve(root, '../config/rules.json'));
if (secure) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'DENY');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.path.startsWith('/api') || req.path.startsWith('/link') || req.path.startsWith('/oauth')) res.set('Cache-Control', 'no-store');
  next();
});
// HTML은 캐시하지 않는다. 캐시되면 배포 후에도 옛 화면 코드가 남아 새 데이터 형식을 잘못 읽는다.
app.use(express.static(path.resolve(root, '../public'), {
  index: 'index.html', etag: true, maxAge: '5m',
  setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-store'); }
}));
// 열려 있는 관리자 탭이 화면 코드가 바뀐 것을 알고 스스로 새로고침하도록 버전(파일 수정 시각)을 알려 준다.
const adminHtmlPath = path.resolve(root, '../public/admin.html');
const linkPagePath = path.resolve(root, '../public/link.html');
const adminUiVersion = () => { try { return String(Math.floor(fs.statSync(adminHtmlPath).mtimeMs)); } catch { return null; } };

const cookieName = 'ssb_session';
const cookieOptions = `Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`;
const linkCookieName = 'ssb_link';
const sessionHash = token => crypto.createHmac('sha256', sessionSecret).update(String(token)).digest('hex');
const fail = (res, status, message) => res.status(status).json({ ok: false, error: message });
const nowIso = () => new Date().toISOString();
const readCookie = (req, name) => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1) || null;
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function getSession(req) {
  const raw = readCookie(req, cookieName);
  if (!raw) return null;
  const hash = sessionHash(decodeURIComponent(raw));
  const s = store.data.sessions.find(x => x.tokenHash === hash && Date.parse(x.expiresAt) > Date.now());
  if (!s) return null;
  const user = store.data.users.find(x => x.id === s.userId && x.active);
  return user ? { session: s, user } : null;
}
function auth(req, res, next) {
  const found = getSession(req);
  if (!found) return fail(res, 401, '로그인이 필요합니다.');
  req.auth = found;
  const csrf = req.headers['x-csrf-token'];
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !safeEqual(csrf, found.session.csrf)) return fail(res, 403, '요청 보안 토큰이 올바르지 않습니다. 새로고침 후 다시 시도하세요.');
  next();
}
function adminOnly(req, res, next) { if (!req.auth || !['owner', 'operator'].includes(req.auth.user.role)) return fail(res, 403, '관리자 권한이 필요합니다.'); next(); }
function ownerOnly(req, res, next) { if (!req.auth || req.auth.user.role !== 'owner') return fail(res, 403, '최고 관리자만 사용할 수 있습니다.'); next(); }
function publicUser(u) { return { id: u.id, username: u.username, displayName: u.displayName, role: u.role, active: u.active, createdAt: u.createdAt }; }

// ── 게임 서버와 스트리머 ────────────────────────────────────────────────
// 게임 서버 하나에 스트리머 여러 명이 접속한다. 게임 서버 모드는 서버 토큰(AgentToken) 하나로
// 그 서버에 속한 모든 스트리머의 보상 작업을 가져가고, 스트리머마다 FarmerId로 지급한다.
// 스트리머는 게임 안에서 /숲로그인 하면 자동으로 등록되고, 이름은 SOOP 닉네임을 쓴다.

const ONLINE_WINDOW_MS = 60 * 1000;       // 게임 서버가 이 시간 안에 "접속 중"이라고 알린 플레이어만 연결 유지
const LINK_TICKET_MS = 15 * 60 * 1000;    // /숲로그인 후 SOOP 로그인을 끝내야 하는 시간
const SDK_ALIVE_MS = 60 * 1000;           // 숨은 Edge 페이지의 마지막 신호가 이 시간 안이면 "연결 중"

const displayName = s => s.nickname || s.soopId || s.farmerName || '(SOOP 로그인 전)';
const streamerDisplayName = (streamerId, fallback) => { const s = store.data.streamers.find(x => x.id === streamerId); return s ? displayName(s) : fallback; };
const serverOf = s => store.data.gameServers.find(g => g.id === s.serverId) || null;
const isFarmerOnline = (server, farmerId) => Boolean(server && farmerId && server.onlineFarmers?.[farmerId] && Date.now() - Date.parse(server.onlineFarmers[farmerId]) < ONLINE_WINDOW_MS);

// 연동 결과를 게임에 알리기 위한 대기열. 게임 서버가 다음 폴링 때 가져가서 해당 플레이어 화면에 표시한다.
function pushLinkEvent(s, kind, message) {
  const server = serverOf(s);
  if (!server || !s.farmerId) return;
  server.linkEvents = (server.linkEvents || []).filter(e => Date.now() - Date.parse(e.at) < 10 * 60 * 1000).slice(-50);
  server.linkEvents.push({ id: crypto.randomUUID(), farmerId: s.farmerId, kind, message: String(message).slice(0, 200), at: nowIso() });
}

function linkState(s) {
  if (s.sdkSeenAt && Date.now() - Date.parse(s.sdkSeenAt) < SDK_ALIVE_MS && s.sdkState === 'connected') return 'connected';
  if (s.soopAuth?.access) return 'loggedIn';
  if (s.loginTicketHash) return 'waitingLogin';
  return s.soopId ? 'legacy' : 'none';
}

function publicStreamer(s) {
  return {
    id: s.id, serverId: s.serverId || null, serverLabel: serverOf(s)?.label || null,
    soopId: s.soopId || null, nickname: s.nickname || null, displayName: displayName(s),
    farmerId: s.farmerId || null, farmerName: s.farmerName || null, active: s.active,
    pairedAt: s.pairedAt, linkedAt: s.linkedAt || null, linkState: linkState(s),
    sdkSeenAt: s.sdkSeenAt || null, sdkError: s.sdkError || null,
    online: isFarmerOnline(serverOf(s), s.farmerId), lastSeenAt: serverOf(s)?.lastSeenAt || s.lastSeenAt || null
  };
}
function publicServer(g) {
  const online = Object.entries(g.onlineFarmers || {}).filter(([, t]) => Date.now() - Date.parse(t) < ONLINE_WINDOW_MS).length;
  return { id: g.id, label: g.label, active: g.active !== false, createdAt: g.createdAt, lastSeenAt: g.lastSeenAt || null, onlinePlayers: online, streamers: store.data.streamers.filter(s => s.serverId === g.id && s.active).length };
}
function publicJob(j) { return { id: j.id, streamerId: j.streamerId, streamerLabel: streamerDisplayName(j.streamerId, j.soopId), soopId: j.soopId, farmerName: j.farmerName, rewardType: j.rewardType, amount: j.amount, reason: j.reason, source: j.source, status: j.status, createdAt: j.createdAt, updatedAt: j.updatedAt, completedAt: j.completedAt || null, attempts: j.attempts, lastError: j.lastError || null, createdBy: j.createdBy }; }

// 예전 구조(방송마다 토큰)를 게임 서버 구조로 옮긴다. 한 번만 실행되며, 실행 전에 db.json을 백업한다.
async function migrateToGameServers() {
  const legacy = store.data.streamers.filter(s => s.tokenHash);
  if (!legacy.length) return;
  const dbFile = path.join(path.resolve(dataDir), 'db.json');
  const backup = `${dbFile}.bak-before-game-servers-${Date.now()}`;
  if (fs.existsSync(dbFile)) fs.copyFileSync(dbFile, backup);
  for (const s of legacy) {
    const server = { id: crypto.randomUUID(), label: legacy.length === 1 ? '기본 게임 서버' : `게임 서버 (${s.soopId})`, tokenHash: s.tokenHash, active: s.active !== false, createdAt: s.pairedAt || nowIso(), lastSeenAt: s.lastSeenAt || null, onlineFarmers: {} };
    store.data.gameServers.push(server);
    s.serverId = server.id;
    delete s.tokenHash;
  }
  await store.save();
  await store.audit('system', 'migrated_to_game_servers', { servers: legacy.length, backup: path.basename(backup) });
  console.log(`[이전] 방송별 토큰 ${legacy.length}개를 게임 서버로 옮겼습니다. 백업: ${backup}`);
}

async function ensureOwner() {
  const username = process.env.ADMIN_USERNAME || '';
  const password = process.env.ADMIN_PASSWORD || '';
  if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET을 32자 이상의 무작위 비밀값으로 설정하세요.');
  if (!username || !password || password.startsWith('CHANGE_ME')) throw new Error('ADMIN_USERNAME과 강력한 ADMIN_PASSWORD를 .env에 설정하세요.');
  if (!store.data.users.some(u => u.role === 'owner')) {
    const p = await hashPassword(password);
    store.data.users.push({ id: crypto.randomUUID(), username, displayName: '최고 관리자', role: 'owner', active: true, password: p, createdAt: nowIso() });
    await store.audit('system', 'owner_bootstrapped', { username });
    console.log(`[보안] 최초 최고 관리자 계정을 만들었습니다: ${username}`);
  }
}
await ensureOwner();
await migrateToGameServers();
if (!isSoopConfigured()) console.warn('[경고] .env에 SOOP_CLIENT_ID / SOOP_CLIENT_SECRET이 없어 게임 내 /숲로그인을 쓸 수 없습니다.');

// ── 관리자 ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true, service: 'StardewSOOPBridge-Central', time: nowIso(), queuedJobs: store.data.jobs.filter(j => ['PENDING','RETRY','LEASED','REVIEW'].includes(j.status)).length }));
app.get('/api/session', (req, res) => { const found = getSession(req); res.json({ ok: true, authenticated: !!found, user: found ? publicUser(found.user) : null, csrf: found?.session.csrf || null }); });
const loginAttempts = new Map();
app.post('/api/login', async (req, res) => {
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const prior = loginAttempts.get(ip) || { count: 0, until: now + 60000 };
  if (prior.until > now && prior.count >= 10) return fail(res, 429, '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.');
  const username = String(req.body?.username || '').trim(); const password = String(req.body?.password || '');
  const user = store.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.active);
  if (!user || !(await verifyPassword(password, user.password))) {
    prior.count++; if (prior.until <= now) { prior.count = 1; prior.until = now + 60000; } loginAttempts.set(ip, prior);
    return fail(res, 401, '아이디 또는 비밀번호가 올바르지 않습니다.');
  }
  loginAttempts.delete(ip);
  const raw = randomToken(); const csrf = randomToken(24);
  store.data.sessions = store.data.sessions.filter(s => Date.parse(s.expiresAt) > now && s.userId !== user.id);
  store.data.sessions.push({ tokenHash: sessionHash(raw), csrf, userId: user.id, createdAt: nowIso(), expiresAt: new Date(now + 12 * 60 * 60 * 1000).toISOString() });
  await store.save(); await store.audit(user.username, 'login');
  res.set('Set-Cookie', `${cookieName}=${encodeURIComponent(raw)}; ${cookieOptions}`);
  res.json({ ok: true, user: publicUser(user), csrf });
});
app.post('/api/logout', auth, async (req, res) => { store.data.sessions = store.data.sessions.filter(s => s.tokenHash !== req.auth.session.tokenHash); await store.save(); await store.audit(req.auth.user.username, 'logout'); res.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`); res.json({ ok: true }); });
app.get('/api/admin/overview', auth, adminOnly, (req, res) => {
  const jobs = store.data.jobs;
  res.json({ ok: true, uiVersion: adminUiVersion(), soopConfigured: isSoopConfigured(), redirectUrl: `${publicBaseUrl()}/oauth/callback`,
    counts: { streamers: store.data.streamers.filter(s => s.active).length, pending: jobs.filter(j => ['PENDING','RETRY'].includes(j.status)).length, leased: jobs.filter(j => j.status === 'LEASED').length, review: jobs.filter(j => j.status === 'REVIEW').length, completed: jobs.filter(j => j.status === 'COMPLETED').length, donations: store.data.donations.length },
    jobs: jobs.slice(0, 100).map(publicJob), streamers: store.data.streamers.filter(s => !s.deleted).map(publicStreamer), servers: store.data.gameServers.map(publicServer),
    audit: store.data.audit.slice(0, 50), users: req.auth.user.role === 'owner' ? store.data.users.map(publicUser) : [] });
});
// 게임 서버 등록: 게임 서버 모드 config.json의 AgentToken을 발급한다 (생성 직후 한 번만 표시).
app.post('/api/admin/servers', auth, ownerOnly, async (req, res) => {
  const label = String(req.body?.label || '').trim().slice(0, 80);
  if (!label) return fail(res, 400, '게임 서버 이름을 입력하세요.');
  const token = randomToken(32);
  const server = { id: crypto.randomUUID(), label, tokenHash: hashToken(token), active: true, createdAt: nowIso(), lastSeenAt: null, onlineFarmers: {} };
  store.data.gameServers.push(server); await store.save(); await store.audit(req.auth.user.username, 'game_server_created', { serverId: server.id, label });
  res.status(201).json({ ok: true, server: publicServer(server), agentToken: token, warning: '이 토큰은 지금 한 번만 표시됩니다. 게임 서버 모드 config.json의 AgentToken에 넣으세요.' });
});
app.patch('/api/admin/servers/:id', auth, ownerOnly, async (req, res) => {
  const g = store.data.gameServers.find(x => x.id === req.params.id); if (!g) return fail(res, 404, '게임 서버를 찾을 수 없습니다.');
  if (req.body?.active !== undefined) g.active = Boolean(req.body.active);
  if (req.body?.label !== undefined) { const label = String(req.body.label).trim().slice(0, 80); if (label) g.label = label; }
  await store.save(); await store.audit(req.auth.user.username, 'game_server_updated', { serverId: g.id, active: g.active, label: g.label }); res.json({ ok: true, server: publicServer(g) });
});
app.patch('/api/admin/streamers/:id', auth, ownerOnly, async (req, res) => {
  const s = store.data.streamers.find(x => x.id === req.params.id && !x.deleted); if (!s) return fail(res, 404, '스트리머를 찾을 수 없습니다.');
  if (req.body?.active !== undefined) {
    s.active = Boolean(req.body.active);
    if (!s.active) for (const j of store.data.jobs) if (j.streamerId === s.id && ['PENDING','RETRY','LEASED'].includes(j.status)) { j.status = 'REVIEW'; j.lastError = '방송 연결이 관리자에 의해 비활성화됨'; j.updatedAt = nowIso(); }
  }
  if (req.body?.farmerId !== undefined) {
    const farmerId = String(req.body.farmerId).trim();
    if (farmerId !== '' && !/^\d+$/.test(farmerId)) return fail(res, 400, 'FarmerId는 숫자여야 합니다.');
    s.farmerId = farmerId ? BigInt(farmerId).toString() : null;
    await store.audit(req.auth.user.username, 'streamer_farmerid_updated', { streamerId: s.id, farmerId: s.farmerId });
  }
  await store.save(); await store.audit(req.auth.user.username, 'streamer_updated', { streamerId: s.id, active: s.active }); res.json({ ok: true, streamer: publicStreamer(s) });
});
// 연결 해제: 토큰과 개인정보(SOOP ID, 닉네임)를 지운다 (Developers 이용약관 제11조 14·17항).
app.delete('/api/admin/streamers/:id', auth, ownerOnly, async (req, res) => {
  const s = store.data.streamers.find(x => x.id === req.params.id && !x.deleted); if (!s) return fail(res, 404, '스트리머를 찾을 수 없습니다.');
  await unlinkStreamer(s, req.auth.user.username, '관리자가 연결을 해제함');
  res.json({ ok: true });
});
app.post('/api/admin/operators', auth, ownerOnly, async (req, res) => {
  const username = String(req.body?.username || '').trim(); const password = String(req.body?.password || ''); const displayNameText = String(req.body?.displayName || username).trim().slice(0, 80);
  if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username) || password.length < 14) return fail(res, 400, '아이디는 3~40자의 영문/숫자/._- 조합, 비밀번호는 14자 이상이어야 합니다.');
  if (store.data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return fail(res, 409, '이미 존재하는 계정입니다.');
  const p = await hashPassword(password); const user = { id: crypto.randomUUID(), username, displayName: displayNameText, role: 'operator', active: true, password: p, createdAt: nowIso() };
  store.data.users.push(user); await store.save(); await store.audit(req.auth.user.username, 'operator_created', { username }); res.status(201).json({ ok: true, user: publicUser(user) });
});
app.patch('/api/admin/operators/:id', auth, ownerOnly, async (req, res) => {
  const u = store.data.users.find(x => x.id === req.params.id && x.role === 'operator'); if (!u) return fail(res, 404, '운영진 계정을 찾을 수 없습니다.');
  u.active = Boolean(req.body?.active); if (!u.active) store.data.sessions = store.data.sessions.filter(s => s.userId !== u.id);
  await store.save(); await store.audit(req.auth.user.username, 'operator_active_changed', { username: u.username, active: u.active }); res.json({ ok: true, user: publicUser(u) });
});
app.post('/api/admin/jobs', auth, adminOnly, async (req, res) => {
  const streamer = store.data.streamers.find(s => s.id === req.body?.streamerId && s.active && !s.deleted);
  const rewardType = req.body?.rewardType; const amount = Number(req.body?.amount); const farmerName = String(req.body?.farmerName || '').trim().slice(0, 80); const reason = String(req.body?.reason || '').trim().slice(0, 240);
  if (!streamer) return fail(res, 400, '활성화된 대상 방송을 선택하세요.');
  if (!REWARD_TYPES.includes(rewardType)) return fail(res, 400, '보상 종류가 올바르지 않습니다.');
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000) return fail(res, 400, '수량은 1~1000 사이 정수여야 합니다.');
  if (!reason) return fail(res, 400, '지급 사유를 입력하세요.');
  const job = { id: crypto.randomUUID(), streamerId: streamer.id, soopId: streamer.soopId, farmerName, rewardType, amount, reason, source: 'manual', status: 'PENDING', createdAt: nowIso(), updatedAt: nowIso(), attempts: 0, createdBy: req.auth.user.username };
  store.data.jobs.unshift(job); await store.save(); await store.audit(req.auth.user.username, 'manual_reward_created', { jobId: job.id, streamerId: streamer.id, rewardType, amount, reason }); res.status(201).json({ ok: true, job: publicJob(job) });
});
app.post('/api/admin/jobs/:id/retry', auth, adminOnly, async (req, res) => {
  const job = store.data.jobs.find(j => j.id === req.params.id); if (!job) return fail(res, 404, '작업을 찾을 수 없습니다.');
  if (!['RETRY','REVIEW','PENDING'].includes(job.status)) return fail(res, 409, '완료 또는 처리 중인 작업은 직접 재시도할 수 없습니다.');
  job.status = 'PENDING'; job.lastError = null; job.updatedAt = nowIso(); job.leaseUntil = null; await store.save(); await store.audit(req.auth.user.username, 'job_retry_requested', { jobId: job.id }); res.json({ ok: true, job: publicJob(job) });
});
app.post('/api/admin/jobs/:id/review', auth, adminOnly, async (req, res) => {
  const job = store.data.jobs.find(j => j.id === req.params.id); if (!job) return fail(res, 404, '작업을 찾을 수 없습니다.');
  if (!['REVIEW','RETRY','PENDING','LEASED'].includes(job.status)) return fail(res, 409, '이 상태는 확인 필요로 변경할 수 없습니다.');
  job.status = 'REVIEW'; job.lastError = String(req.body?.note || '운영진 확인 필요').slice(0, 240); job.updatedAt = nowIso(); await store.save(); await store.audit(req.auth.user.username, 'job_marked_review', { jobId: job.id, note: job.lastError }); res.json({ ok: true, job: publicJob(job) });
});

// ── 후원 기록 ───────────────────────────────────────────────────────────

// 후원 1건을 기록하고 config/rules.json 기준으로 보상 작업을 만든다 (규칙 파일을 고치면 재시작 없이 반영).
// 반환: { status, body } — 같은 방송의 같은 eventId는 한 번만 처리한다.
async function recordDonation({ eventId, soopId, balloons, actor }) {
  if (!eventId || eventId.length > 200 || !/^[A-Za-z0-9_.-]{2,100}$/.test(soopId) || !Number.isSafeInteger(balloons) || balloons <= 0 || balloons > 1000000) {
    return { status: 400, body: { ok: false, error: '후원 이벤트 데이터가 올바르지 않습니다.' } };
  }
  if (store.data.donations.some(d => d.eventId === eventId && d.soopId.toLowerCase() === soopId.toLowerCase())) return { status: 200, body: { ok: true, duplicate: true } };
  const streamer = store.data.streamers.find(s => s.active && !s.deleted && s.soopId && s.soopId.toLowerCase() === soopId.toLowerCase());
  const donation = { id: crypto.randomUUID(), eventId, soopId, balloons, receivedAt: nowIso(), status: streamer ? 'RECORDED' : 'UNLINKED' };
  store.data.donations.unshift(donation);
  const rewards = streamer ? computeRewards(rules.get(), balloons) : [];
  for (const { rewardType, amount } of rewards) {
    store.data.jobs.unshift({ id: crypto.randomUUID(), streamerId: streamer.id, soopId: streamer.soopId, farmerName: '', rewardType, amount, reason: `후원 자동 보상: 별풍선 ${balloons}개 (event ${eventId})`, source: 'donation', donationId: donation.id, status: 'PENDING', createdAt: nowIso(), updatedAt: nowIso(), attempts: 0, createdBy: actor });
  }
  await store.save(); await store.audit(actor, 'donation_received', { eventId, soopId, balloons, status: donation.status, rewards });
  return { status: 201, body: { ok: true, donationId: donation.id, status: donation.status, rewards } };
}

// 서버 간 연동용 (공용 DONATION_INGEST_TOKEN).
app.post('/api/ingest/donation', async (req, res) => {
  if (!ingestToken || !safeEqual(req.get('X-Donation-Token'), ingestToken)) return fail(res, 401, '후원 수신 인증 실패');
  const r = await recordDonation({ eventId: String(req.body?.eventId || '').trim(), soopId: String(req.body?.soopId || '').trim(), balloons: Number(req.body?.balloons), actor: 'soop-ingest' });
  res.status(r.status).json(r.body);
});

// 토큰과 개인정보를 지우고 대기 중인 작업은 확인 필요로 돌린다.
async function unlinkStreamer(s, actor, reason) {
  const removedSoopId = s.soopId || null;
  for (const j of store.data.jobs) {
    if (j.streamerId !== s.id) continue;
    if (['PENDING','RETRY','LEASED'].includes(j.status)) { j.status = 'REVIEW'; j.lastError = `연결 해제: ${reason}`; j.updatedAt = nowIso(); }
    j.soopId = '(삭제됨)';
  }
  if (removedSoopId) for (const d of store.data.donations) if (d.soopId.toLowerCase() === removedSoopId.toLowerCase()) d.soopId = '(삭제됨)';
  Object.assign(s, { deleted: true, active: false, soopId: null, nickname: null, farmerName: null, soopAuth: null, linkKeyHash: null, linkInstance: null, loginTicketHash: null, sdkState: null, sdkError: null, unlinkedAt: nowIso() });
  await store.save(); await store.audit(actor, 'streamer_unlinked', { streamerId: s.id, reason });
}

// ── 게임 서버 모드 (AgentToken) ─────────────────────────────────────────

function agentServer(req) {
  const token = String(req.get('X-Agent-Token') || '');
  if (!token) return null;
  const hash = hashToken(token);
  return store.data.gameServers.find(g => g.active !== false && safeEqual(g.tokenHash, hash)) || null;
}
const serverStreamers = server => store.data.streamers.filter(s => s.serverId === server.id && s.active && !s.deleted);

// 게임 서버가 8초마다 작업을 가져간다. 접속 중인 플레이어 목록도 같이 보내서, 게임이 꺼진 스트리머의 연결을 끊는 데 쓴다.
app.post('/api/agent/poll', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  const now = Date.now();
  server.lastSeenAt = nowIso();
  server.onlineFarmers = Object.fromEntries(Object.entries(server.onlineFarmers || {}).filter(([, t]) => now - Date.parse(t) < ONLINE_WINDOW_MS));
  const online = Array.isArray(req.body?.onlineFarmerIds) ? req.body.onlineFarmerIds.map(String).filter(x => /^-?\d+$/.test(x)).slice(0, 200) : [];
  for (const id of online) server.onlineFarmers[id] = server.lastSeenAt;

  const mine = new Map(serverStreamers(server).map(s => [s.id, s]));
  for (const j of store.data.jobs) if (mine.has(j.streamerId) && j.status === 'LEASED' && j.leaseUntil && Date.parse(j.leaseUntil) < now) { j.status = 'RETRY'; j.lastError = '게임 연결 응답 시간 초과. 지급 여부 확인 필요'; j.updatedAt = nowIso(); }
  // FarmerId가 정해진 스트리머의 작업만 내보낸다 (없으면 지급할 대상을 모름).
  // 연동 결과 알림은 한 번만 내려보낸다.
  const linkEvents = (server.linkEvents || []).map(({ farmerId, kind, message }) => ({ farmerId, kind, message }));
  server.linkEvents = [];
  // 게임 모드가 저장해 둔 연결 페이지 주소 대신 현재 인증 도메인을 쓰도록 같이 알려 준다 (도메인을 바꿔도 다음 접속부터 따라감).
  const publicBase = publicBaseUrl();
  const job = store.data.jobs.slice().reverse().find(j => j.status === 'PENDING' && mine.get(j.streamerId)?.farmerId);
  if (!job) { await store.save(); return res.json({ ok: true, job: null, linkEvents, publicBaseUrl: publicBase, serverTime: nowIso() }); }
  const streamer = mine.get(job.streamerId);
  job.status = 'LEASED'; job.attempts += 1; job.leaseUntil = new Date(now + 120000).toISOString(); job.updatedAt = nowIso(); await store.save();
  res.json({ ok: true, job: { id: job.id, soopId: job.soopId, farmerName: job.farmerName, farmerId: streamer.farmerId, rewardType: job.rewardType, amount: job.amount, reason: job.reason }, linkEvents, publicBaseUrl: publicBase, serverTime: nowIso() });
});
app.post('/api/agent/ack', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않습니다.');
  const mine = new Set(serverStreamers(server).map(s => s.id));
  const job = store.data.jobs.find(j => j.id === req.body?.jobId && mine.has(j.streamerId)); if (!job) return fail(res, 404, '이 게임 서버의 작업을 찾을 수 없습니다.');
  const result = req.body?.status;
  if (!['COMPLETED','RETRY','REVIEW'].includes(result)) return fail(res, 400, '상태가 올바르지 않습니다.');
  if (job.status === 'COMPLETED') return res.json({ ok: true, duplicate: true });
  job.status = result; job.updatedAt = nowIso(); job.completedAt = result === 'COMPLETED' ? nowIso() : null; job.lastError = result === 'COMPLETED' ? null : String(req.body?.message || '게임 측에서 완료 확인 불가').slice(0, 240); job.leaseUntil = null;
  await store.save(); await store.audit(`server:${server.label}`, 'job_acknowledged', { jobId: job.id, status: result, message: job.lastError }); res.json({ ok: true });
});

// 게임에서 /숲로그인: 그 플레이어(FarmerId)의 스트리머 자리를 만들거나 찾고, 일회용 로그인 주소와 연결용 세션 키를 발급한다.
app.post('/api/agent/link/start', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  if (!isSoopConfigured()) return fail(res, 503, '관리자 서버에 SOOP 앱 정보(SOOP_CLIENT_ID/SECRET)가 설정되지 않았습니다.');
  const farmerId = String(req.body?.farmerId ?? '').trim();
  const farmerName = String(req.body?.farmerName || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  if (!/^-?\d{1,20}$/.test(farmerId)) return fail(res, 400, 'FarmerId가 올바르지 않습니다.');

  let s = store.data.streamers.find(x => x.serverId === server.id && x.farmerId === farmerId && !x.deleted);
  if (!s) {
    s = { id: crypto.randomUUID(), serverId: server.id, farmerId, farmerName, soopId: null, nickname: null, active: true, pairedAt: nowIso(), createdBy: 'link' };
    store.data.streamers.push(s);
  }
  if (!s.active) return fail(res, 403, '관리자가 이 스트리머의 연결을 중지했습니다.');
  const sessionKey = randomToken(32);
  const ticket = randomToken(24);
  Object.assign(s, { farmerName: farmerName || s.farmerName, linkKeyHash: hashToken(sessionKey), linkInstance: null, loginTicketHash: hashToken(ticket), loginTicketExpiresAt: new Date(Date.now() + LINK_TICKET_MS).toISOString() });
  await store.save(); await store.audit(`server:${server.label}`, 'link_started', { streamerId: s.id, farmerId, farmerName });
  const base = publicBaseUrl();
  res.json({ ok: true, loginUrl: `${base}/link/login?t=${ticket}`, pageUrl: `${base}/link/page`, sessionKey });
});

// 게임에서 /숲로그아웃: 토큰과 개인정보를 지운다.
app.post('/api/agent/link/remove', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  const farmerId = String(req.body?.farmerId ?? '').trim();
  const s = store.data.streamers.find(x => x.serverId === server.id && x.farmerId === farmerId && !x.deleted);
  if (!s) return res.json({ ok: true, removed: false });
  await unlinkStreamer(s, `server:${server.label}`, '스트리머가 /숲로그아웃 함');
  res.json({ ok: true, removed: true });
});

// 예전 로컬 브리지 경로 (서버 토큰 + SOOP ID). 숨은 Edge 방식으로 넘어가기 전까지 유지한다.
function legacyStreamer(server, soopId) {
  return serverStreamers(server).find(s => s.soopId && s.soopId.toLowerCase() === String(soopId || '').trim().toLowerCase()) || null;
}
app.post('/api/agent/donation', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  const streamer = legacyStreamer(server, req.body?.soopId);
  if (!streamer) return fail(res, 403, `이 게임 서버에 등록되지 않은 방송입니다: ${req.body?.soopId || '없음'}`);
  // 숨은 Edge가 이미 같은 방송을 받고 있으면 예전 브리지가 보낸 후원은 무시한다 (같은 후원이 두 번 지급되지 않게).
  if (linkState(streamer) === 'connected') return res.json({ ok: true, ignored: true, rewards: [], message: '게임 내 SOOP 연결이 동작 중이라 브리지 후원은 무시했습니다.' });
  const r = await recordDonation({ eventId: String(req.body?.eventId || '').trim(), soopId: streamer.soopId, balloons: Number(req.body?.balloons), actor: `bridge:${streamer.soopId}` });
  res.status(r.status).json(r.body);
});
app.post('/api/agent/profile', async (req, res) => {
  const server = agentServer(req);
  if (!server) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  const streamer = legacyStreamer(server, req.body?.soopId);
  if (!streamer) return fail(res, 403, `이 게임 서버에 등록되지 않은 방송입니다: ${req.body?.soopId || '없음'}`);
  const nickname = String(req.body?.nickname || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!nickname || nickname.length > 60) return fail(res, 400, '닉네임이 비어 있거나 너무 깁니다.');
  if (streamer.nickname !== nickname) {
    const previous = streamer.nickname || null;
    streamer.nickname = nickname; streamer.nicknameUpdatedAt = nowIso();
    await store.save(); await store.audit(`bridge:${streamer.soopId}`, 'streamer_nickname_updated', { streamerId: streamer.id, from: previous, to: nickname });
  }
  res.json({ ok: true, soopId: streamer.soopId, nickname });
});

// ── 스트리머 브라우저: SOOP 로그인 ───────────────────────────────────────

function page(title, body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,"Segoe UI",sans-serif;background:#0e131b;color:#edf3fa;max-width:560px;margin:10vh auto;padding:0 20px;line-height:1.6}main{background:#171f2b;border:1px solid #2b3a4f;border-radius:14px;padding:26px}h1{font-size:20px;margin:0 0 12px}.muted{color:#9aaec4;font-size:14px}a.btn{display:inline-block;margin-top:14px;background:#9bd5b2;color:#102219;padding:12px 18px;border-radius:9px;font-weight:700;text-decoration:none}ul{padding-left:20px}</style></head><body><main>${body}</main></body></html>`;
}
const findByTicket = ticket => {
  if (!ticket) return null;
  const hash = hashToken(ticket);
  return store.data.streamers.find(s => !s.deleted && s.loginTicketHash && safeEqual(s.loginTicketHash, hash) && Date.parse(s.loginTicketExpiresAt) > Date.now()) || null;
};

// 연결 이유를 먼저 보여 준 뒤 SOOP 로그인으로 보낸다 (이용약관 제11조 5항: ID 연결 이유 명시).
app.get('/link/login', (req, res) => {
  const ticket = String(req.query.t || '');
  const s = findByTicket(ticket);
  if (!s) return res.status(410).send(failPage());
  res.set('Set-Cookie', `${linkCookieName}=${encodeURIComponent(ticket)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${LINK_TICKET_MS / 1000}${linkCookieSecure() ? '; Secure' : ''}`);
  res.send(page('SOOP 계정 연결', `<h1>SOOP 계정 연결</h1>
<p>별풍선 후원 보상을 게임 캐릭터에 지급하기 위해 SOOP 계정을 연결합니다.</p>
<p class="muted">연결 해제: 게임 채팅에 /숲로그아웃</p>
<a class="btn" href="${escapeHtml(authorizeUrl())}">SOOP으로 로그인</a>`));
});

// 스트리머 화면에는 결과만 보여 준다. 실패 이유는 게임 채팅(연동 실패 알림)과 관리자 감사 로그에만 남긴다.
const successPage = () => page('인증 성공', '<h1>인증 성공</h1><p>이 창을 닫아도 됩니다.</p>');
const failPage = () => page('인증 실패', '<h1>인증 실패</h1><p>게임 채팅에서 /숲로그인을 다시 해 주세요.</p>');

app.get('/oauth/callback', async (req, res) => {
  const ticket = decodeURIComponent(readCookie(req, linkCookieName) || '');
  const code = String(req.query.code || req.query.authCode || '');
  const s = findByTicket(ticket);
  res.set('Set-Cookie', `${linkCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${linkCookieSecure() ? '; Secure' : ''}`);
  if (!s) return res.status(410).send(failPage());
  if (!code) {
    pushLinkEvent(s, 'error', 'SOOP 연동 실패: SOOP 로그인이 취소되었습니다. 다시 하려면 /숲로그인을 입력하세요.');
    await store.save();
    return res.status(400).send(failPage());
  }
  try {
    const t = await exchangeCode(code);
    s.soopAuth = { access: tokenBox.seal(t.accessToken), refresh: tokenBox.seal(t.refreshToken), expiresAt: t.expiresAt };
    s.loginTicketHash = null; s.loginTicketExpiresAt = null; s.linkedAt = nowIso();
    pushLinkEvent(s, 'info', 'SOOP 로그인 완료. 방송 채팅에 연결하는 중입니다...');
    await store.save(); await store.audit('soop', 'soop_login_completed', { streamerId: s.id, farmerId: s.farmerId });
    res.send(successPage());
  } catch (error) {
    console.error('[SOOP 로그인]', error.message);
    pushLinkEvent(s, 'error', `SOOP 연동 실패: 로그인 처리 중 오류가 났습니다 (${error.message}). /숲로그인을 다시 해 주세요.`);
    await store.save(); await store.audit('soop', 'soop_login_failed', { streamerId: s.id, error: error.message });
    res.status(502).send(failPage());
  }
});

// ── 숨은 Edge 연결 페이지 ───────────────────────────────────────────────
// 게임 모드가 스트리머 PC에서 숨은 Edge로 이 페이지를 연다. 세션 키는 주소의 # 뒤에 있어서 서버 로그나 Referer로 새지 않는다.

app.get('/link/page', (_req, res) => { res.set('Cache-Control', 'no-store'); res.sendFile(linkPagePath); });

function linkFromKey(key) {
  if (!key || typeof key !== 'string' || key.length > 200) return null;
  const hash = hashToken(key);
  return store.data.streamers.find(s => !s.deleted && s.linkKeyHash && safeEqual(s.linkKeyHash, hash)) || null;
}
// 숨은 Edge가 둘 이상 떠 있어도(게임이 튕긴 뒤 남은 것 등) 가장 최근에 연결을 요청한 하나만 인정한다.
const isCurrentInstance = (s, instanceId) => Boolean(instanceId && s.linkInstance === instanceId);

async function accessTokenFor(s) {
  if (!s.soopAuth?.access) return null;
  if (Date.parse(s.soopAuth.expiresAt) - Date.now() > 10 * 60 * 1000) return tokenBox.open(s.soopAuth.access);
  const refresh = tokenBox.open(s.soopAuth.refresh);
  if (!refresh) return Date.parse(s.soopAuth.expiresAt) > Date.now() ? tokenBox.open(s.soopAuth.access) : null;
  try {
    const t = await refreshTokens(refresh);
    s.soopAuth = { access: tokenBox.seal(t.accessToken), refresh: tokenBox.seal(t.refreshToken || refresh), expiresAt: t.expiresAt };
    await store.save(); await store.audit('soop', 'soop_token_refreshed', { streamerId: s.id });
    return t.accessToken;
  } catch (error) {
    // 갱신이 안 되면(동의 철회 등) 토큰을 지우고 다시 로그인하게 한다 (이용약관 제11조 17항).
    s.soopAuth = null;
    pushLinkEvent(s, 'error', 'SOOP 로그인이 만료되었습니다. 후원을 계속 받으려면 /숲로그인을 다시 해 주세요.');
    await store.save(); await store.audit('soop', 'soop_token_refresh_failed', { streamerId: s.id, error: error.message });
    return null;
  }
}

app.post('/api/link/session', async (req, res) => {
  const s = linkFromKey(req.body?.key);
  if (!s) return res.status(401).json({ ok: false, status: 'invalid', message: '연결 정보가 없거나 해제되었습니다. 게임에서 /숲로그인을 다시 하세요.' });
  const instanceId = String(req.body?.instanceId || '').slice(0, 64);
  const claim = req.body?.claim === true;
  const server = serverOf(s);

  if (claim) { s.linkInstance = instanceId; s.linkClaimedAt = nowIso(); }
  else if (!isCurrentInstance(s, instanceId)) return res.json({ ok: true, status: 'stop', message: '다른 연결이 대신 동작 중이라 이 연결은 종료합니다.' });

  s.sdkSeenAt = nowIso();
  s.sdkState = ['connected', 'connecting', 'idle', 'error'].includes(req.body?.state) ? req.body.state : 'idle';
  s.sdkError = req.body?.lastError ? String(req.body.lastError).slice(0, 200) : null;
  // 방송 연결 실패는 연결(숨은 Edge)마다 한 번만 알린다.
  if (s.sdkState === 'error' && s.sdkError && s.errorAnnouncedInstance !== instanceId) {
    s.errorAnnouncedInstance = instanceId;
    pushLinkEvent(s, 'error', `SOOP 연동 실패: 방송 채팅에 연결하지 못했습니다 (${s.sdkError}). 계속 실패하면 관리자에게 알려 주세요.`);
  }

  const answer = async (body) => { await store.save(); return res.json({ ok: true, ...body }); };
  if (!s.active) return answer({ status: 'stop', message: '관리자가 이 스트리머의 연결을 중지했습니다.' });
  if (!server || server.active === false) return answer({ status: 'stop', message: '게임 서버가 비활성화되었습니다.' });
  if (!isFarmerOnline(server, s.farmerId)) {
    const sinceClaim = Date.now() - Date.parse(s.linkClaimedAt || 0);
    if (sinceClaim > 45 * 1000) return answer({ status: 'stop', message: '게임 서버에 접속해 있지 않아 연결을 종료합니다.' });
    return answer({ status: 'waiting', message: '게임 서버 접속을 확인하는 중입니다.' });
  }
  if (!s.soopAuth?.access) return answer({ status: 'waiting', message: s.loginTicketHash ? 'SOOP 로그인을 기다리는 중입니다.' : 'SOOP 로그인이 필요합니다. 게임에서 /숲로그인을 하세요.' });
  const body = { status: 'ready', clientId: soopConfig().clientId, soopId: s.soopId || null };
  if (req.body?.wantToken === true) {
    const token = await accessTokenFor(s);
    if (!token) return answer({ status: 'waiting', message: 'SOOP 로그인이 만료되었습니다. 게임에서 /숲로그인을 다시 하세요.' });
    body.accessToken = token;
  }
  return answer(body);
});

// SDK의 JOIN 이벤트로 받은 본인 SOOP ID와 닉네임을 저장한다 (자동 등록).
app.post('/api/link/profile', async (req, res) => {
  const s = linkFromKey(req.body?.key);
  if (!s) return fail(res, 401, '연결 정보가 없습니다.');
  if (!isCurrentInstance(s, req.body?.instanceId)) return fail(res, 409, '현재 연결이 아닙니다.');
  const soopId = String(req.body?.userId || '').trim();
  const nickname = String(req.body?.nickname || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60);
  if (!/^[A-Za-z0-9_.-]{2,100}$/.test(soopId)) return fail(res, 400, 'SOOP ID가 올바르지 않습니다.');
  const taken = store.data.streamers.find(x => x.id !== s.id && !x.deleted && x.soopId && x.soopId.toLowerCase() === soopId.toLowerCase());
  if (taken) {
    pushLinkEvent(s, 'error', `SOOP 연동 실패: 이 SOOP 계정(${soopId})은 이미 다른 게임 캐릭터에 연결되어 있습니다. 관리자에게 문의하세요.`);
    await store.save();
    return fail(res, 409, `이 SOOP 계정(${soopId})은 이미 다른 게임 캐릭터에 연결되어 있습니다. 관리자에게 문의하세요.`);
  }
  const changed = s.soopId !== soopId || (nickname && s.nickname !== nickname);
  if (changed) {
    const previous = { soopId: s.soopId || null, nickname: s.nickname || null };
    s.soopId = soopId; if (nickname) { s.nickname = nickname; s.nicknameUpdatedAt = nowIso(); }
    s.verifiedAt = nowIso();
    for (const j of store.data.jobs) if (j.streamerId === s.id && j.status === 'PENDING') j.soopId = soopId;
    await store.audit(`link:${soopId}`, 'streamer_profile_linked', { streamerId: s.id, farmerId: s.farmerId, from: previous, to: { soopId, nickname } });
  }
  // 연동 성공은 연결(숨은 Edge)마다 한 번만 알린다. 다음 접속 때 자동 재연결돼도 다시 알린다.
  if (s.successAnnouncedInstance !== req.body.instanceId) {
    s.successAnnouncedInstance = req.body.instanceId;
    pushLinkEvent(s, 'success', `SOOP 연동 성공! ${s.nickname || soopId}(${soopId}) 방송의 별풍선 후원을 받습니다.`);
  }
  await store.save();
  res.json({ ok: true, soopId, nickname: s.nickname });
});

app.post('/api/link/donation', async (req, res) => {
  const s = linkFromKey(req.body?.key);
  if (!s) return fail(res, 401, '연결 정보가 없습니다.');
  if (!isCurrentInstance(s, req.body?.instanceId)) return fail(res, 409, '현재 연결이 아니라서 후원을 기록하지 않았습니다.');
  if (!s.soopId) return fail(res, 409, '아직 방송 정보(SOOP ID)를 받지 못했습니다.');
  const bjId = String(req.body?.bjId || '').trim();
  if (bjId && bjId.toLowerCase() !== s.soopId.toLowerCase()) return fail(res, 403, `다른 방송(${bjId})의 후원입니다.`);
  const r = await recordDonation({ eventId: String(req.body?.eventId || '').trim(), soopId: s.soopId, balloons: Number(req.body?.balloons), actor: `link:${s.soopId}` });
  res.status(r.status).json(r.body);
});

app.get('/admin', (_req, res) => { res.set('Cache-Control', 'no-store'); res.sendFile(adminHtmlPath); });
app.get('/api/admin/users', auth, ownerOnly, (_req, res) => res.json({ ok: true, users: store.data.users.map(publicUser) }));
app.use((err, _req, res, _next) => { console.error('[server error]', err?.stack || err); fail(res, 500, '서버 내부 오류가 발생했습니다. 서버 로그를 확인하세요.'); });
app.listen(port, host, () => console.log(`[StardewSOOPBridge Central] listening on http://${host}:${port}; 인증 도메인: ${publicBaseUrl()} (config/central.json); admin page: /admin; health: /health`));
