// SOOP Open API 인증 (가이드 3.3 인증 코드 발급, 3.4 토큰 발급/재발급).
// Client Secret은 이 서버에서만 쓰고 브라우저나 게임으로 보내지 않는다.

const API_BASE = (process.env.SOOP_API_BASE || 'https://openapi.sooplive.com').replace(/\/+$/, '');
export const SOOP_SCOPE = 'broad_access_chatinfo';

export function soopConfig() {
  return {
    clientId: (process.env.SOOP_CLIENT_ID || '').trim(),
    clientSecret: (process.env.SOOP_CLIENT_SECRET || '').trim()
  };
}

export const isSoopConfigured = () => { const c = soopConfig(); return Boolean(c.clientId && c.clientSecret); };

/** 스트리머 브라우저를 보낼 SOOP 로그인/동의 주소. 로그인돼 있으면 바로 Redirect URL로 code가 전달된다. */
export function authorizeUrl() {
  const { clientId } = soopConfig();
  return `${API_BASE}/auth/code?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(SOOP_SCOPE)}`;
}

async function tokenRequest(params) {
  const { clientId, clientSecret } = soopConfig();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params });
  const response = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* 아래에서 처리 */ }
  if (!response.ok || !data.access_token) {
    const detail = data.error_description || data.error || data.msg || text.slice(0, 200) || `HTTP ${response.status}`;
    const error = new Error(`SOOP 토큰 발급 실패: ${detail}`);
    // rejected = SOOP이 요청을 거절함 (동의 철회, 토큰 폐기 등). 네트워크 오류나 SOOP 서버 오류(5xx)는 rejected가 아니다.
    error.status = response.status;
    error.rejected = (response.status >= 400 && response.status < 500) || (response.ok && Boolean(data.error || (Number(data.result) < 0)));
    throw error;
  }
  const expiresIn = Number(data.expires_in) > 0 ? Number(data.expires_in) : 28800;
  return {
    accessToken: String(data.access_token),
    refreshToken: data.refresh_token ? String(data.refresh_token) : null,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
  };
}

export const exchangeCode = code => tokenRequest({ grant_type: 'authorization_code', code });
export const refreshTokens = refreshToken => tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
