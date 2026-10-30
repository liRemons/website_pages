// 会话密钥传输加密（v2）：从 token 用 HKDF-SHA256 派生 AES-256-GCM 会话密钥，逐叶子加解密。
// 与服务端 utils/crypto.js 严格对齐（三端共用同一协议常量）：
//   HKDF: algo=sha256, salt='remons-enc-v2', info='api-payload', 输出 32 字节
//   AES-256-GCM: 每条消息随机 12 字节 IV（绝不复用），密文布局 base64(iv[12] || ct || tag[16])
//   —— @noble/ciphers 的 gcm.encrypt 直接返回 ct||tag，前置拼上 iv 即与服务端一致
// 密钥不落盘、不下发，只从 token 派生；token 生命周期即密钥生命周期（登录 7 天）。
import { gcm } from '@noble/ciphers/aes.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';

const HKDF_SALT = 'remons-enc-v2';
const HKDF_INFO = 'api-payload';
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

const utf8enc = new TextEncoder();
const utf8dec = new TextDecoder();

// Uint8Array <-> base64（浏览器、5+App WebView、Node18+ 均提供 btoa/atob）
function bytesToB64(bytes) {
  let bin = '';
  const chunk = 0x8000; // 分块避免 String.fromCharCode 展开超长参数爆栈
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// 会话密钥缓存：同一 token 只派生一次；登出/换票时清空
const keyCache = new Map();

/** 从 token 派生 32 字节会话密钥（Uint8Array）；token 空返回 null */
export function deriveSessionKey(token) {
  if (!token) return null;
  const cached = keyCache.get(token);
  if (cached) return cached;
  const key = hkdf(
    sha256,
    utf8enc.encode(String(token)),
    utf8enc.encode(HKDF_SALT),
    utf8enc.encode(HKDF_INFO),
    KEY_LEN
  );
  keyCache.set(token, key);
  return key;
}

/** 清空派生密钥缓存（token 变化 / 登出时调用，确保用新票重新派生） */
export function clearSessionKeyCache() {
  keyCache.clear();
}

function randomIV() {
  // @noble 的 randomBytes 内部用 Web Crypto（浏览器/WebView）或 node crypto，避免 globalThis 触网 no-undef
  return randomBytes(IV_LEN);
}

/** 单值加密：随机 IV，输出 base64(iv || ct || tag) */
export function aesEncryptStr(msg, key) {
  const iv = randomIV();
  const cttag = gcm(key, iv).encrypt(utf8enc.encode(String(msg))); // ct||tag
  const out = new Uint8Array(iv.length + cttag.length);
  out.set(iv, 0);
  out.set(cttag, iv.length);
  return bytesToB64(out);
}

/** 单值解密：拆 iv 与 (ct||tag)，认证失败/格式错误抛错（调用方决定如何处理） */
export function aesDecryptStr(payload, key) {
  const raw = b64ToBytes(String(payload));
  if (raw.length < IV_LEN + TAG_LEN) throw new Error('cipher too short');
  const iv = raw.slice(0, IV_LEN);
  const cttag = raw.slice(IV_LEN); // ct||tag
  return utf8dec.decode(gcm(key, iv).decrypt(cttag));
}

/** 入参深加密：key 不变，叶子值转字符串后逐条加密；数组/对象递归；FormData/Date 整体透传 */
export function deepEncrypt(value, key) {
  if (value === null || value === undefined) return value;
  if (value instanceof FormData || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => deepEncrypt(item, key));
  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach((k) => {
      result[k] = deepEncrypt(value[k], key);
    });
    return result;
  }
  return aesEncryptStr(String(value), key);
}

/** 出参深解密：字符串叶子尝试解密，失败保持原值（明文透传）；其它类型原样 */
export function deepDecrypt(value, key) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => deepDecrypt(item, key));
  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach((k) => {
      result[k] = deepDecrypt(value[k], key);
    });
    return result;
  }
  if (typeof value === 'string') {
    try {
      return aesDecryptStr(value, key);
    } catch (e) {
      return value;
    }
  }
  return value;
}
