import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { Store } from './store.js';
import { randomToken, hashToken, safeEqual, hashPassword, verifyPassword } from './security.js';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const dataDir = process.env.DATA_DIR || path.resolve(root, '../data');
const sessionSecret = process.env.SESSION_SECRET || '';
const ingestToken = process.env.DONATION_INGEST_TOKEN || '';
const store = await new Store(dataDir).init();
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'DENY');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.resolve(root, '../public'), { index: 'index.html', etag: true, maxAge: '5m' }));

const cookieName = 'ssb_session';
const cookieOptions = `Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${process.env.TRUST_PROXY === 'true' ? '; Secure' : ''}`;
const sessionHash = token => crypto.createHmac('sha256', sessionSecret).update(String(token)).digest('hex');
const fail = (res, status, message) => res.status(status).json({ ok: false, error: message });
function getSession(req) {
  const raw = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
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
function publicStreamer(s) { return { id: s.id, label: s.label, soopId: s.soopId, farmerId: s.farmerId || null, active: s.active, pairedAt: s.pairedAt, lastSeenAt: s.lastSeenAt || null }; }
function publicJob(j) { return { id: j.id, streamerId: j.streamerId, streamerLabel: j.streamerLabel, soopId: j.soopId, farmerName: j.farmerName, rewardType: j.rewardType, amount: j.amount, reason: j.reason, source: j.source, status: j.status, createdAt: j.createdAt, updatedAt: j.updatedAt, completedAt: j.completedAt || null, attempts: j.attempts, lastError: j.lastError || null, createdBy: j.createdBy }; }

async function ensureOwner() {
  const username = process.env.ADMIN_USERNAME || '';
  const password = process.env.ADMIN_PASSWORD || '';
  if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET을 32자 이상의 무작위 비밀값으로 설정하세요.');
  if (!username || !password || password.startsWith('CHANGE_ME')) throw new Error('ADMIN_USERNAME과 강력한 ADMIN_PASSWORD를 .env에 설정하세요.');
  if (!store.data.users.some(u => u.role === 'owner')) {
    const p = await hashPassword(password);
    store.data.users.push({ id: crypto.randomUUID(), username, displayName: '최고 관리자', role: 'owner', active: true, password: p, createdAt: new Date().toISOString() });
    await store.audit('system', 'owner_bootstrapped', { username });
    console.log(`[보안] 최초 최고 관리자 계정을 만들었습니다: ${username}`);
  }
}
await ensureOwner();

app.get('/health', (_req, res) => res.json({ ok: true, service: 'StardewSOOPBridge-Central', time: new Date().toISOString(), queuedJobs: store.data.jobs.filter(j => ['PENDING','RETRY','LEASED','REVIEW'].includes(j.status)).length }));
app.get('/api/session', (req, res) => { const found = getSession(req); res.json({ ok: true, authenticated: !!found, user: found ? publicUser(found.user) : null, csrf: found?.session.csrf || null }); });
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
  store.data.sessions.push({ tokenHash: sessionHash(raw), csrf, userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(now + 12 * 60 * 60 * 1000).toISOString() });
  await store.save(); await store.audit(user.username, 'login');
  res.set('Set-Cookie', `${cookieName}=${encodeURIComponent(raw)}; ${cookieOptions}`);
  res.json({ ok: true, user: publicUser(user), csrf });
});
const loginAttempts = new Map();
app.post('/api/logout', auth, async (req, res) => { store.data.sessions = store.data.sessions.filter(s => s.tokenHash !== req.auth.session.tokenHash); await store.save(); await store.audit(req.auth.user.username, 'logout'); res.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.TRUST_PROXY === 'true' ? '; Secure' : ''}`); res.json({ ok: true }); });
app.get('/api/admin/overview', auth, adminOnly, (req, res) => {
  const jobs = store.data.jobs;
  res.json({ ok: true, counts: { streamers: store.data.streamers.filter(s => s.active).length, pending: jobs.filter(j => ['PENDING','RETRY'].includes(j.status)).length, leased: jobs.filter(j => j.status === 'LEASED').length, review: jobs.filter(j => j.status === 'REVIEW').length, completed: jobs.filter(j => j.status === 'COMPLETED').length, donations: store.data.donations.length }, jobs: jobs.slice(0, 100).map(publicJob), streamers: store.data.streamers.map(publicStreamer), audit: store.data.audit.slice(0, 50), users: req.auth.user.role === 'owner' ? store.data.users.map(publicUser) : [] });
});
app.post('/api/admin/streamers', auth, ownerOnly, async (req, res) => {
  const label = String(req.body?.label || '').trim().slice(0, 80); const soopId = String(req.body?.soopId || '').trim().slice(0, 100);
  const farmerId = req.body?.farmerId !== undefined && req.body?.farmerId !== '' ? String(req.body.farmerId).trim() : null;
  if (!label || !/^[A-Za-z0-9_.-]{2,100}$/.test(soopId)) return fail(res, 400, '표시 이름과 올바른 SOOP 방송 ID가 필요합니다.');
  if (farmerId !== null && !/^\d+$/.test(farmerId)) return fail(res, 400, 'FarmerId는 숫자여야 합니다.');
  if (store.data.streamers.some(s => s.soopId.toLowerCase() === soopId.toLowerCase())) return fail(res, 409, '이미 등록된 SOOP 방송 ID입니다.');
  const token = randomToken(32); const streamer = { id: crypto.randomUUID(), label, soopId, farmerId: farmerId || null, tokenHash: hashToken(token), active: true, pairedAt: new Date().toISOString(), createdBy: req.auth.user.username };
  store.data.streamers.push(streamer); await store.save(); await store.audit(req.auth.user.username, 'streamer_paired', { streamerId: streamer.id, soopId, farmerId });
  res.status(201).json({ ok: true, streamer: publicStreamer(streamer), agentToken: token, warning: '이 토큰은 지금 한 번만 표시됩니다. 스트리머 SMAPI 모드의 config.json에 안전하게 입력하세요.' });
});
app.patch('/api/admin/streamers/:id', auth, ownerOnly, async (req, res) => {
  const s = store.data.streamers.find(x => x.id === req.params.id); if (!s) return fail(res, 404, '방송을 찾을 수 없습니다.');
  if (req.body?.active !== undefined) {
    s.active = Boolean(req.body.active);
    if (!s.active) for (const j of store.data.jobs) if (j.streamerId === s.id && ['PENDING','RETRY','LEASED'].includes(j.status)) { j.status = 'REVIEW'; j.lastError = '방송 연결이 관리자에 의해 비활성화됨'; j.updatedAt = new Date().toISOString(); }
  }
  if (req.body?.farmerId !== undefined) {
    const farmerId = String(req.body.farmerId).trim();
    if (farmerId !== '' && !/^\d+$/.test(farmerId)) return fail(res, 400, 'FarmerId는 숫자여야 합니다.');
    s.farmerId = farmerId || null;
    await store.audit(req.auth.user.username, 'streamer_farmerid_updated', { streamerId: s.id, farmerId: s.farmerId });
  }
  await store.save(); await store.audit(req.auth.user.username, 'streamer_updated', { streamerId: s.id, active: s.active }); res.json({ ok: true, streamer: publicStreamer(s) });
});
app.post('/api/admin/operators', auth, ownerOnly, async (req, res) => {
  const username = String(req.body?.username || '').trim(); const password = String(req.body?.password || ''); const displayName = String(req.body?.displayName || username).trim().slice(0, 80);
  if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username) || password.length < 14) return fail(res, 400, '아이디는 3~40자의 영문/숫자/._- 조합, 비밀번호는 14자 이상이어야 합니다.');
  if (store.data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return fail(res, 409, '이미 존재하는 계정입니다.');
  const p = await hashPassword(password); const user = { id: crypto.randomUUID(), username, displayName, role: 'operator', active: true, password: p, createdAt: new Date().toISOString() };
  store.data.users.push(user); await store.save(); await store.audit(req.auth.user.username, 'operator_created', { username }); res.status(201).json({ ok: true, user: publicUser(user) });
});
app.patch('/api/admin/operators/:id', auth, ownerOnly, async (req, res) => {
  const u = store.data.users.find(x => x.id === req.params.id && x.role === 'operator'); if (!u) return fail(res, 404, '운영진 계정을 찾을 수 없습니다.');
  u.active = Boolean(req.body?.active); if (!u.active) store.data.sessions = store.data.sessions.filter(s => s.userId !== u.id);
  await store.save(); await store.audit(req.auth.user.username, 'operator_active_changed', { username: u.username, active: u.active }); res.json({ ok: true, user: publicUser(u) });
});
app.post('/api/admin/jobs', auth, adminOnly, async (req, res) => {
  const streamer = store.data.streamers.find(s => s.id === req.body?.streamerId && s.active);
  const rewardType = req.body?.rewardType; const amount = Number(req.body?.amount); const farmerName = String(req.body?.farmerName || '').trim().slice(0, 80); const reason = String(req.body?.reason || '').trim().slice(0, 240);
  if (!streamer) return fail(res, 400, '활성화된 대상 방송을 선택하세요.');
  if (!['chest','monster'].includes(rewardType)) return fail(res, 400, '보상 종류가 올바르지 않습니다.');
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000) return fail(res, 400, '수량은 1~1000 사이 정수여야 합니다.');
  if (!reason) return fail(res, 400, '지급 사유를 입력하세요.');
  const job = { id: crypto.randomUUID(), streamerId: streamer.id, streamerLabel: streamer.label, soopId: streamer.soopId, farmerName, rewardType, amount, reason, source: 'manual', status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 0, createdBy: req.auth.user.username };
  store.data.jobs.unshift(job); await store.save(); await store.audit(req.auth.user.username, 'manual_reward_created', { jobId: job.id, streamerId: streamer.id, rewardType, amount, reason }); res.status(201).json({ ok: true, job: publicJob(job) });
});
app.post('/api/admin/jobs/:id/retry', auth, adminOnly, async (req, res) => {
  const job = store.data.jobs.find(j => j.id === req.params.id); if (!job) return fail(res, 404, '작업을 찾을 수 없습니다.');
  if (!['RETRY','REVIEW','PENDING'].includes(job.status)) return fail(res, 409, '완료 또는 처리 중인 작업은 직접 재시도할 수 없습니다.');
  job.status = 'PENDING'; job.lastError = null; job.updatedAt = new Date().toISOString(); job.leaseUntil = null; await store.save(); await store.audit(req.auth.user.username, 'job_retry_requested', { jobId: job.id }); res.json({ ok: true, job: publicJob(job) });
});
app.post('/api/admin/jobs/:id/review', auth, adminOnly, async (req, res) => {
  const job = store.data.jobs.find(j => j.id === req.params.id); if (!job) return fail(res, 404, '작업을 찾을 수 없습니다.');
  if (!['REVIEW','RETRY','PENDING','LEASED'].includes(job.status)) return fail(res, 409, '이 상태는 확인 필요로 변경할 수 없습니다.');
  job.status = 'REVIEW'; job.lastError = String(req.body?.note || '운영진 확인 필요').slice(0, 240); job.updatedAt = new Date().toISOString(); await store.save(); await store.audit(req.auth.user.username, 'job_marked_review', { jobId: job.id, note: job.lastError }); res.json({ ok: true, job: publicJob(job) });
});

// Trusted ingestion endpoint for the SOOP SDK adapter. Store event before scheduling reward jobs.
app.post('/api/ingest/donation', async (req, res) => {
  if (!ingestToken || !safeEqual(req.get('X-Donation-Token'), ingestToken)) return fail(res, 401, '후원 수신 인증 실패');
  const eventId = String(req.body?.eventId || '').trim(); const soopId = String(req.body?.soopId || '').trim(); const balloons = Number(req.body?.balloons);
  if (!eventId || eventId.length > 200 || !/^[A-Za-z0-9_.-]{2,100}$/.test(soopId) || !Number.isSafeInteger(balloons) || balloons <= 0 || balloons > 1000000) return fail(res, 400, '후원 이벤트 데이터가 올바르지 않습니다.');
  if (store.data.donations.some(d => d.eventId === eventId && d.soopId.toLowerCase() === soopId.toLowerCase())) return res.json({ ok: true, duplicate: true });
  const streamer = store.data.streamers.find(s => s.active && s.soopId.toLowerCase() === soopId.toLowerCase());
  const donation = { id: crypto.randomUUID(), eventId, soopId, balloons, receivedAt: new Date().toISOString(), status: streamer ? 'RECORDED' : 'UNLINKED' };
  store.data.donations.unshift(donation);
  if (streamer) {
    let rewardType = null, amount = 0;
    // Production thresholds: 33 -> one monster; 100 -> one chest; exactly 1000 -> eleven chests.
    if (balloons === 1000) { rewardType = 'chest'; amount = 11; }
    else if (balloons >= 100 && balloons < 1000) { rewardType = 'chest'; amount = Math.floor(balloons / 100); }
    if (rewardType) store.data.jobs.unshift({ id: crypto.randomUUID(), streamerId: streamer.id, streamerLabel: streamer.label, soopId: streamer.soopId, farmerName: '', rewardType, amount, reason: `후원 자동 보상: ${balloons}개 (event ${eventId})`, source: 'donation', donationId: donation.id, status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 0, createdBy: 'soop-ingest' });
    if (balloons >= 33) store.data.jobs.unshift({ id: crypto.randomUUID(), streamerId: streamer.id, streamerLabel: streamer.label, soopId: streamer.soopId, farmerName: '', rewardType: 'monster', amount: 1, reason: `후원 자동 보상: ${balloons}개 (event ${eventId})`, source: 'donation', donationId: donation.id, status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 0, createdBy: 'soop-ingest' });
  }
  await store.save(); await store.audit('soop-ingest', 'donation_received', { eventId, soopId, balloons, status: donation.status }); res.status(201).json({ ok: true, donationId: donation.id, status: donation.status });
});

// SMAPI connector polls from the game PC outbound; no inbound game-port forwarding is required.
app.post('/api/agent/poll', async (req, res) => {
  const token = String(req.get('X-Agent-Token') || ''); const streamer = store.data.streamers.find(s => s.active && safeEqual(s.tokenHash, hashToken(token)));
  if (!streamer) return fail(res, 401, '게임 연결 토큰이 올바르지 않거나 비활성화되었습니다.');
  streamer.lastSeenAt = new Date().toISOString();
  const now = Date.now();
  for (const j of store.data.jobs) if (j.streamerId === streamer.id && j.status === 'LEASED' && j.leaseUntil && Date.parse(j.leaseUntil) < now) { j.status = 'RETRY'; j.lastError = '게임 연결 응답 시간 초과. 지급 여부 확인 필요'; j.updatedAt = new Date().toISOString(); }
  const job = store.data.jobs.find(j => j.streamerId === streamer.id && j.status === 'PENDING');
  if (!job) { await store.save(); return res.json({ ok: true, job: null, serverTime: new Date().toISOString() }); }
  job.status = 'LEASED'; job.attempts += 1; job.leaseUntil = new Date(now + 120000).toISOString(); job.updatedAt = new Date().toISOString(); await store.save();
  res.json({ ok: true, job: { id: job.id, soopId: job.soopId, farmerName: job.farmerName, farmerId: streamer.farmerId || null, rewardType: job.rewardType, amount: job.amount, reason: job.reason }, serverTime: new Date().toISOString() });
});
app.post('/api/agent/ack', async (req, res) => {
  const token = String(req.get('X-Agent-Token') || ''); const streamer = store.data.streamers.find(s => s.active && safeEqual(s.tokenHash, hashToken(token)));
  if (!streamer) return fail(res, 401, '게임 연결 토큰이 올바르지 않습니다.');
  const job = store.data.jobs.find(j => j.id === req.body?.jobId && j.streamerId === streamer.id); if (!job) return fail(res, 404, '해당 방송의 작업을 찾을 수 없습니다.');
  const result = req.body?.status;
  if (!['COMPLETED','RETRY','REVIEW'].includes(result)) return fail(res, 400, '상태가 올바르지 않습니다.');
  if (job.status === 'COMPLETED') return res.json({ ok: true, duplicate: true });
  job.status = result; job.updatedAt = new Date().toISOString(); job.completedAt = result === 'COMPLETED' ? new Date().toISOString() : null; job.lastError = result === 'COMPLETED' ? null : String(req.body?.message || '게임 측에서 완료 확인 불가').slice(0, 240); job.leaseUntil = null;
  await store.save(); await store.audit(`agent:${streamer.soopId}`, 'job_acknowledged', { jobId: job.id, status: result, message: job.lastError }); res.json({ ok: true });
});

app.get('/admin', (_req, res) => res.sendFile(path.resolve(root, '../public/admin.html')));
app.get('/api/admin/users', auth, ownerOnly, (_req, res) => res.json({ ok: true, users: store.data.users.map(publicUser) }));
app.use((err, _req, res, _next) => { console.error('[server error]', err?.stack || err); fail(res, 500, '서버 내부 오류가 발생했습니다. 서버 로그를 확인하세요.'); });
app.listen(port, host, () => console.log(`[StardewSOOPBridge Central] listening on http://${host}:${port}; admin page: /admin; health: /health`));
