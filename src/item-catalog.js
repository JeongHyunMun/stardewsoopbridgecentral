import fs from 'node:fs';

// 아이템 지급용 목록 (config/stardew_item_codes.md). 파일을 고치면 재시작 없이 다음 요청부터 반영된다.
//
// 문서 형식:
//   # 1. 물건 (O)          ← 대카테고리. 괄호 안은 Player_add 접두어
//   ## 장식 / 울타리        ← 중카테고리 (없으면 대카테고리 이름을 그대로 씀)
//   | 한글 | English | ... | ID |   ← 마지막 칸이 ID
//
// ID가 "0, 1, 2"처럼 여러 개면 각각 따로, "79/1 ~ 79/27"처럼 범위면 건너뛴다.

export const ITEM_PREFIXES = ['O', 'BC', 'T', 'W', 'H', 'B', 'S', 'P', 'M', 'TR', 'F', 'WP', 'FL'];
const ID_TEXT = /^[A-Za-z0-9_.\-/]{1,80}$/;

export function parseItemCatalog(markdown) {
  const categories = [];
  let category = null, group = null, header = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    const top = line.match(/^#\s+(\d+\.\s*.+?)\s*\(([A-Z]{1,2})\)\s*$/);
    if (top) { category = { name: top[1].trim(), prefix: top[2], groups: [] }; categories.push(category); group = null; header = false; continue; }
    if (/^#\s/.test(line)) { category = null; group = null; continue; }   // 사용법 등 아이템 목록이 아닌 큰 제목
    const sub = line.match(/^##\s+(.+)$/);
    if (sub && category) { group = { name: sub[1].trim(), items: [] }; category.groups.push(group); header = false; continue; }
    if (!category || !line.startsWith('|')) continue;
    const cells = line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    if (cells[0] === '한글') { header = true; continue; }
    if (!header || /^-+$/.test(cells[0].replace(/:/g, ''))) continue;
    const name = cells[0], en = cells[1] || '';
    const idCell = (cells[cells.length - 1] || '').replace(/`/g, '').trim();
    if (!name || !idCell || idCell.includes('~')) continue;
    if (!group) { group = { name: category.name.replace(/^\d+\.\s*/, ''), items: [] }; category.groups.push(group); }
    const ids = idCell.split(',').map(s => s.trim()).filter(Boolean);
    for (const id of ids) {
      if (!ID_TEXT.test(id)) continue;
      group.items.push({ name: ids.length > 1 ? `${name} (${id})` : name, en, id: `(${category.prefix})${id}` });
    }
  }
  for (const c of categories) c.groups = c.groups.filter(g => g.items.length);
  return categories.filter(c => c.groups.length);
}

// 입력한 아이템 ID를 "(O)24" 형식으로 바꾼다. 접두어가 없으면 물건(O)으로 본다 (Player_add와 같음). 잘못되면 null.
export function normalizeItemId(input) {
  const text = String(input ?? '').trim();
  const m = text.match(/^\(([A-Za-z]{1,2})\)\s*(.+)$/);
  const prefix = m ? m[1].toUpperCase() : 'O';
  const id = (m ? m[2] : text).trim();
  if (!ITEM_PREFIXES.includes(prefix) || !ID_TEXT.test(id)) return null;
  return `(${prefix})${id}`;
}

export class ItemCatalog {
  #file; #mtimeMs = -1; #value = { categories: [], byId: new Map(), byName: new Map() };

  constructor(file) { this.#file = file; this.get(); }

  get() {
    try {
      const mtime = fs.statSync(this.#file).mtimeMs;
      if (mtime !== this.#mtimeMs) {
        this.#mtimeMs = mtime;
        const categories = parseItemCatalog(fs.readFileSync(this.#file, 'utf8').replace(/^\uFEFF/, ''));
        const byId = new Map(), byName = new Map();
        for (const c of categories) for (const g of c.groups) for (const it of g.items) {
          if (!byId.has(it.id)) byId.set(it.id, it);
          for (const key of [it.name, it.en]) {
            if (!key) continue;
            const k = key.toLowerCase();
            if (!byName.has(k)) byName.set(k, new Map());
            byName.get(k).set(it.id, it);
          }
        }
        this.#value = { categories, byId, byName };
        console.log(`[items] 아이템 목록 로드: ${byId.size}개 (${this.#file})`);
      }
    } catch (error) {
      console.error(`[items] 아이템 목록 오류, 이전 목록 유지: ${error.message}`);
    }
    return this.#value;
  }

  // 아이템명(한글 또는 영어, 대소문자 무시)으로 찾는다. 반환: 찾은 아이템 배열 (같은 이름이 여러 개일 수 있음)
  findByName(name) {
    const hit = this.get().byName.get(String(name ?? '').trim().toLowerCase());
    return hit ? [...hit.values()] : [];
  }
}
