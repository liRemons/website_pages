
import CryptoJS from 'crypto-js'

// 算法 - DES
// mode: CBC
// padding: PKCS5Padding
// charset: utf-8
// 输出: base64（默认）
export function encrypt({ DES_KEY, DES_IV, MSG }) {
  const encrypted = CryptoJS.DES.encrypt(MSG, CryptoJS.enc.Utf8.parse(DES_KEY), {
    iv: CryptoJS.enc.Utf8.parse(DES_IV),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
}

export function decrypt({ DES_KEY, DES_IV, MSG }) {
  const decrypted = CryptoJS.DES.decrypt(MSG, CryptoJS.enc.Utf8.parse(DES_KEY), {
    iv: CryptoJS.enc.Utf8.parse(DES_IV),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return CryptoJS.enc.Utf8.stringify(decrypted);
}

export const DES_KEY = 'remons';

export const DES_IV = 'lrq';