// 설정 파일(config/*.json)에 // 한 줄 주석과 /* */ 주석을 쓸 수 있게, 주석을 지운 뒤 JSON으로 읽는다.
// 문자열 안의 // (예: "https://...")는 지우지 않는다.
export function stripJsonComments(text) {
  let out = '', inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inString) {
      out += c;
      if (c === '\\') { out += next ?? ''; i++; }
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && next === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && next === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return out;
}

export function parseJsonc(text) {
  return JSON.parse(stripJsonComments(String(text).replace(/^\uFEFF/, '')));
}
