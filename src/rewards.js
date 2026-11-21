import fs from 'node:fs';
import { parseJsonc } from './jsonc.js';

// 보상 규칙 로더. config/rules.json을 읽고, 파일이 바뀌면 재시작 없이 다시 읽는다.
//
// 규칙 하나의 형식:
//   type          "chest"(일반 상자) | "premiumChest"(고급 상자) | "monster" | "tax"(세금 징수) | "priceShift"(시세 변동) | "food"(뼈고기)   (필수)
//   minBalloons   이 개수 이상일 때 적용 (기본 1)
//   maxBalloons   이 개수 이하일 때 적용 (기본 제한 없음)
//   exactBalloons 정확히 이 개수일 때만 적용 (min/max와 함께 쓸 수 없음)
//   amount        지급 수량 (기본 1)
//   perBalloons   N개당 1단위로 지급: floor(별풍선 / N) (amount와 함께 쓸 수 없음)
// 조건에 맞는 모든 규칙의 수량은 type별로 합산된다.

export const REWARD_TYPES = ['chest', 'premiumChest', 'monster', 'tax', 'priceShift', 'food'];
const TYPES = new Set(REWARD_TYPES);
const OPTIONAL_INT_KEYS = ['minBalloons', 'maxBalloons', 'exactBalloons', 'perBalloons', 'amount'];
export const MAX_AMOUNT = 1000;

const isPositiveInt = (v) => Number.isSafeInteger(v) && v >= 1;

export function validateRules(doc) {
  if (!doc || !Array.isArray(doc.rules) || doc.rules.length === 0) {
    throw new Error('rules 배열이 비어 있거나 없습니다.');
  }
  return doc.rules.map((raw, i) => {
    const at = `rules[${i}]`;
    if (!raw || typeof raw !== 'object') throw new Error(`${at}: 객체여야 합니다.`);
    if (!TYPES.has(raw.type)) throw new Error(`${at}: type은 chest, premiumChest, monster, tax, priceShift, food 중 하나여야 합니다.`);
    const rule = { name: String(raw.name ?? `rule-${i}`), type: raw.type };
    for (const key of OPTIONAL_INT_KEYS) {
      const value = raw[key] ?? undefined;
      if (value !== undefined && !isPositiveInt(value)) throw new Error(`${at}: ${key}는 1 이상의 정수여야 합니다.`);
      if (value !== undefined) rule[key] = value;
    }
    if (rule.exactBalloons !== undefined && (rule.minBalloons !== undefined || rule.maxBalloons !== undefined)) {
      throw new Error(`${at}: exactBalloons는 minBalloons/maxBalloons와 함께 쓸 수 없습니다.`);
    }
    if (rule.minBalloons !== undefined && rule.maxBalloons !== undefined && rule.maxBalloons < rule.minBalloons) {
      throw new Error(`${at}: maxBalloons는 minBalloons보다 작을 수 없습니다.`);
    }
    if (rule.perBalloons !== undefined && rule.amount !== undefined) {
      throw new Error(`${at}: perBalloons와 amount는 함께 쓸 수 없습니다.`);
    }
    return rule;
  });
}

/** 별풍선 개수에 해당하는 보상 목록을 돌려준다. 예: [{ rewardType: 'chest', amount: 2 }] */
export function computeRewards(rules, balloons) {
  const totals = Object.fromEntries(REWARD_TYPES.map(t => [t, 0]));
  for (const rule of rules) {
    const matches = rule.exactBalloons !== undefined
      ? balloons === rule.exactBalloons
      : balloons >= (rule.minBalloons ?? 1) && balloons <= (rule.maxBalloons ?? Infinity);
    if (!matches) continue;
    const amount = rule.perBalloons !== undefined ? Math.floor(balloons / rule.perBalloons) : (rule.amount ?? 1);
    if (amount >= 1) totals[rule.type] += amount;
  }
  return Object.entries(totals)
    .filter(([, amount]) => amount >= 1)
    .map(([rewardType, amount]) => ({ rewardType, amount: Math.min(amount, MAX_AMOUNT) }));
}

export class RulesProvider {
  #file;
  #logger;
  #mtimeMs = 0;
  #rules = null;

  constructor(file, logger = console) {
    this.#file = file;
    this.#logger = logger;
    this.#load(true); // 시작할 때 규칙 파일이 잘못되어 있으면 바로 실패시킨다.
  }

  /** 현재 규칙. 호출할 때마다 파일 수정 시각을 확인해서 바뀌었으면 다시 읽는다. */
  get() {
    try {
      if (fs.statSync(this.#file).mtimeMs !== this.#mtimeMs) this.#load(false);
    } catch (error) {
      if (error.code !== 'ENOENT') this.#logger.error(`[rules] 규칙 파일 확인 실패, 이전 규칙 유지: ${error.message}`);
    }
    return this.#rules;
  }

  #load(strict) {
    this.#mtimeMs = fs.statSync(this.#file).mtimeMs; // 깨진 파일을 호출마다 다시 읽지 않도록 먼저 기록
    try {
      const text = fs.readFileSync(this.#file, 'utf8').replace(/^\uFEFF/, '');
      this.#rules = validateRules(parseJsonc(text));
      this.#logger.log(`[rules] 보상 규칙 로드: ${this.#rules.length}개 (${this.#file})`);
    } catch (error) {
      if (strict || !this.#rules) throw new Error(`보상 규칙 파일을 읽을 수 없습니다: ${error.message}`);
      this.#logger.error(`[rules] 규칙 파일 오류, 이전 규칙 유지: ${error.message}`);
    }
  }
}
