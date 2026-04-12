/**
 * 아바타 색상 생성 유틸리티 모듈
 *
 * 사용자 ID(account_id)를 기반으로 고유하고 일관된 배경색을 생성하고,
 * WCAG 2.1 접근성 표준을 준수하는 최적의 텍스트 색상(흰색 또는 검정색)을 자동으로 결정합니다.
 *
 * @module utils/avatarColor
 */

/**
 * 문자열을 32비트 정수 해시 값으로 변환
 *
 * @param {string} str - 해시할 문자열 (account_id)
 * @returns {number} 32비트 정수 해시 값
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 해시 값을 기반으로 HSL 색상을 생성
 *
 * @param {number} hash - 해시 값
 * @returns {{h: number, s: number, l: number}} HSL 색상 객체
 */
function hashToHSL(hash: number): { h: number; s: number; l: number } {
  // Hue: 0-360 범위에서 고르게 분포
  const h = hash % 360;

  // Saturation: 40-60% 범위 (부드러운 파스텔톤)
  const s = 40 + (hash % 21);

  // Lightness: 70-85% 범위 (밝은 파스텔 느낌)
  const l = 70 + (hash % 16);

  return { h, s, l };
}

/**
 * HSL 색상값을 RGB 색상값으로 변환
 *
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {{r: number, g: number, b: number}} RGB 객체 (0-255)
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * RGB 값을 Hex 색상 코드로 변환
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex 색상 코드 (예: "#ff5733")
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * 상대 휘도(Relative Luminance) 계산 (WCAG 2.1 기준)
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} 상대 휘도 (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 두 색상 간의 명도 대비 비율 계산 (WCAG 2.1 기준)
 *
 * @param {number} l1 - 첫 번째 색상의 상대 휘도
 * @param {number} l2 - 두 번째 색상의 상대 휘도
 * @returns {number} 명도 대비 비율 (1-21)
 */
function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 배경색에 적합한 텍스트 색상 결정 (WCAG AA 기준: 4.5:1 이상)
 *
 * @param {number} bgR - 배경색 Red (0-255)
 * @param {number} bgG - 배경색 Green (0-255)
 * @param {number} bgB - 배경색 Blue (0-255)
 * @returns {string} 텍스트 색상 ("#ffffff" 또는 "#000000")
 */
function getTextColor(bgR: number, bgG: number, bgB: number): string {
  const bgLuminance = getRelativeLuminance(bgR, bgG, bgB);

  // 흰색 텍스트의 대비
  const whiteLuminance = 1;
  const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance);

  // 검정색 텍스트의 대비
  const blackLuminance = 0;
  const blackContrast = getContrastRatio(bgLuminance, blackLuminance);

  // 대비가 더 높은 색상 선택 (WCAG AA 기준: 4.5:1)
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
}

/**
 * account_id 기반으로 일관된 아바타 배경색 및 텍스트 색상 생성
 *
 * @param {string} accountId - 사용자 계정 ID
 * @returns {{backgroundColor: string, textColor: string}} 배경색과 텍스트 색상 객체
 *
 * @example
 * ```typescript
 * const colors = getAvatarColors('user123');
 * // { backgroundColor: '#5a7fc4', textColor: '#ffffff' }
 *
 * // 동일한 ID는 항상 동일한 색상을 반환함
 * const colors2 = getAvatarColors('user123');
 * // { backgroundColor: '#5a7fc4', textColor: '#ffffff' }
 * ```
 */
export function getAvatarColors(accountId: string): {
  backgroundColor: string;
  textColor: string;
} {
  // 1. account_id를 해시로 변환
  const hash = hashString(accountId);

  // 2. 해시를 기반으로 HSL 색상 생성
  const { h, s, l } = hashToHSL(hash);

  // 3. HSL을 RGB로 변환
  const { r, g, b } = hslToRgb(h, s, l);

  // 4. RGB를 Hex로 변환
  const backgroundColor = rgbToHex(r, g, b);

  // 5. 배경색에 적합한 텍스트 색상 결정 (WCAG AA 4.5:1 기준)
  const textColor = getTextColor(r, g, b);

  return {
    backgroundColor,
    textColor,
  };
}
