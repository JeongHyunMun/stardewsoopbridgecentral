import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const initial = () => ({ version: 1, users: [], gameServers: [], streamers: [], jobs: [], donations: [], audit: [], sessions: [] });
export class Store {
  constructor(dir) { this.dir = path.resolve(dir); this.file = path.join(this.dir, 'db.json'); this.data = initial(); this.chain = Promise.resolve(); }
  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    try { this.data = JSON.parse(await fs.readFile(this.file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; await this.save(); }
    for (const key of Object.keys(initial())) if (!Array.isArray(this.data[key])) this.data[key] = [];
    return this;
  }
  async save() {
    this.chain = this.chain.then(async () => {
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
      await fs.rename(tmp, this.file);
    });
    return this.chain;
  }
  async audit(actor, action, details = {}) {
    this.data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor, action, details });
    this.data.audit = this.data.audit.slice(0, 10000);
    await this.save();
  }
}
