import fs from 'node:fs';

// Central 운영 설정 (config/central.json). 파일을 고치면 재시작 없이 다음 요청부터 반영된다.
//
//   publicBaseUrl  스트리머 브라우저와 숨은 Edge가 접속하는 이 서버의 주소 (인증 도메인).
//                  SOOP 앱의 Redirect URL은 반드시 `${publicBaseUrl}/oauth/callback`이어야 한다.
//                  예: "https://bridge.example.kr"   (테스트: "http://127.0.0.1:3001")

function normalizeBaseUrl(value) {
  const text = String(value ?? '').trim().replace(/\/+$/, '');
  let url;
  try { url = new URL(text); } catch { throw new Error(`publicBaseUrl이 올바른 주소가 아닙니다: "${value}"`); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('publicBaseUrl은 http:// 또는 https://로 시작해야 합니다.');
  if (url.search || url.hash) throw new Error('publicBaseUrl에는 ? 나 # 를 넣을 수 없습니다.');
  return text;
}

export class CentralConfig {
  #file; #logger; #mtimeMs = -1; #value;

  constructor(file, defaults, logger = console) {
    this.#file = file;
    this.#logger = logger;
    this.#value = { publicBaseUrl: normalizeBaseUrl(defaults.publicBaseUrl) };
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(this.#value, null, 2) + '\n', 'utf8');
      this.#logger.log(`[config] ${file}이 없어 기본값으로 만들었습니다.`);
    }
    this.get();
  }

  get() {
    try {
      const mtime = fs.statSync(this.#file).mtimeMs;
      if (mtime !== this.#mtimeMs) {
        this.#mtimeMs = mtime;
        const raw = JSON.parse(fs.readFileSync(this.#file, 'utf8').replace(/^\uFEFF/, ''));
        const next = { publicBaseUrl: normalizeBaseUrl(raw.publicBaseUrl) };
        if (next.publicBaseUrl !== this.#value.publicBaseUrl) this.#logger.log(`[config] 인증 도메인 변경: ${next.publicBaseUrl}`);
        this.#value = next;
      }
    } catch (error) {
      this.#logger.error(`[config] central.json 오류, 이전 설정 유지: ${error.message}`);
    }
    return this.#value;
  }
}
