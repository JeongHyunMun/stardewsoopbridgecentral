import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
// 저장 파일 구성
//  - db.json                     : 스트리머/토큰/서버/사용자/세션/감사 로그 (정리하지 않음)
//  - pending.json                : 아직 끝나지 않은 작업 (PENDING/RETRY/LEASED/REVIEW). 완료될 때까지 계속 남는다.
//  - history-YYYY-MM-DD.json     : 완료된 작업과 후원 기록. 보관 기간이 지난 날짜 파일은 삭제한다.
// 메모리에서는 예전처럼 data.jobs / data.donations 로 그대로 쓴다 (미완료 작업 + 보관 기간 내 기록).
const initial = () => ({ version: 1, users: [], gameServers: [], streamers: [], jobs: [], donations: [], audit: [], sessions: [] });
const ARCHIVED_KEYS = ['jobs', 'donations'];
const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_RE = /^history-(\d{4}-\d{2}-\d{2})\.json$/;
const dayOf = iso => { const t = Date.parse(iso); return new Date(Number.isNaN(t) ? Date.now() : t).toISOString().slice(0, 10); };
const byNewest = (a, b) => String(b.createdAt || b.receivedAt || '').localeCompare(String(a.createdAt || a.receivedAt || ''));

export class Store {
  constructor(dir, { retentionDays = 7 } = {}) {
    this.dir = path.resolve(dir);
    this.file = path.join(this.dir, 'db.json');
    this.pendingFile = path.join(this.dir, 'pending.json');
    this.retentionDays = retentionDays;
    this.data = initial();
    this.chain = Promise.resolve();
    this.written = new Map(); // 파일명 -> 마지막으로 쓴 내용 (바뀐 파일만 다시 쓰기 위함)
    this.lastPruneDay = '';
  }
  historyFile(day) { return path.join(this.dir, `history-${day}.json`); }
  isDone(job) { return job.status === 'COMPLETED'; }
  cutoffDay() { return new Date(Date.now() - this.retentionDays * DAY_MS).toISOString().slice(0, 10); }

  async readJson(file) {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    const main = await this.readJson(this.file);
    if (main) {
      this.data = main;
      // 예전 단일 파일 형식(jobs/donations가 db.json 안에 있음)이면 분리하기 전에 백업을 남긴다.
      if (ARCHIVED_KEYS.some(k => Array.isArray(main[k]) && main[k].length)) {
        const backup = `${this.file}.bak-before-split-${Date.now()}`;
        await fs.copyFile(this.file, backup);
        console.log(`[저장소] jobs/donations를 별도 파일로 분리합니다. 백업: ${path.basename(backup)}`);
      }
    }
    for (const key of Object.keys(initial())) if (!Array.isArray(this.data[key])) this.data[key] = [];

    // 미완료 작업 + 보관 기간 내 완료 기록을 합쳐 메모리에 올린다. (같은 id가 둘이면 완료된 쪽을 쓴다)
    const jobs = new Map(), donations = new Map();
    const addJob = j => { const old = jobs.get(j.id); if (!old || (!this.isDone(old) && this.isDone(j))) jobs.set(j.id, j); };
    for (const j of this.data.jobs) addJob(j);
    for (const d of this.data.donations) donations.set(d.id, d);
    for (const j of (await this.readJson(this.pendingFile))?.jobs || []) addJob(j);
    const cutoff = this.cutoffDay();
    for (const name of await fs.readdir(this.dir)) {
      const m = HISTORY_RE.exec(name); if (!m || m[1] < cutoff) continue;
      const h = await this.readJson(path.join(this.dir, name));
      for (const j of h?.jobs || []) addJob(j);
      for (const d of h?.donations || []) donations.set(d.id, d);
    }
    this.data.jobs = [...jobs.values()].sort(byNewest);
    this.data.donations = [...donations.values()].sort(byNewest);
    await this.prune();
    await this.save();
    return this;
  }

  // 보관 기간이 지난 완료 기록은 메모리와 날짜 파일에서 지운다. 미완료 작업은 나이와 상관없이 남긴다.
  async prune() {
    const cutoff = this.cutoffDay();
    this.lastPruneDay = new Date().toISOString().slice(0, 10);
    this.data.jobs = this.data.jobs.filter(j => !this.isDone(j) || dayOf(j.completedAt || j.updatedAt || j.createdAt) >= cutoff);
    this.data.donations = this.data.donations.filter(d => dayOf(d.receivedAt) >= cutoff);
    for (const name of await fs.readdir(this.dir)) {
      const m = HISTORY_RE.exec(name);
      if (m && m[1] < cutoff) { await fs.rm(path.join(this.dir, name), { force: true }); this.written.delete(name); }
    }
  }

  async writeIfChanged(file, content) {
    const name = path.basename(file);
    if (this.written.get(name) === content) return;
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, content, { mode: 0o600 });
    await fs.rename(tmp, file);
    this.written.set(name, content);
  }
  async writeAll() {
    if (this.lastPruneDay !== new Date().toISOString().slice(0, 10)) await this.prune();
    const { jobs, donations, ...core } = this.data;
    // 완료 기록을 날짜별로 나눈다. 작업은 완료된 날, 후원은 받은 날 기준.
    const days = new Map();
    const bucket = day => { if (!days.has(day)) days.set(day, { version: 1, jobs: [], donations: [] }); return days.get(day); };
    const pending = [];
    for (const j of jobs) { if (this.isDone(j)) bucket(dayOf(j.completedAt || j.updatedAt || j.createdAt)).jobs.push(j); else pending.push(j); }
    for (const d of donations) bucket(dayOf(d.receivedAt)).donations.push(d);
    // 순서: 완료 기록 → pending → db.json. 중간에 꺼져도 작업이 사라지지 않고 최악의 경우 양쪽에 중복으로 남을 뿐이다 (읽을 때 합친다).
    for (const [day, body] of days) await this.writeIfChanged(this.historyFile(day), JSON.stringify(body, null, 2));
    await this.writeIfChanged(this.pendingFile, JSON.stringify({ version: 1, jobs: pending }, null, 2));
    await this.writeIfChanged(this.file, JSON.stringify(core, null, 2));
  }
  async save() {
    this.chain = this.chain.catch(() => {}).then(() => this.writeAll());
    return this.chain;
  }
  async audit(actor, action, details = {}) {
    this.data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor, action, details });
    this.data.audit = this.data.audit.slice(0, 10000);
    await this.save();
  }
}
