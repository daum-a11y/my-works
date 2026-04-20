import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const sourceExtensions = new Set(['.css', '.scss', '.sass', '.less', '.ts', '.tsx', '.js', '.jsx']);
const ignoredDirectories = new Set([
  '.git',
  'dist',
  'build',
  'coverage',
  'node_modules',
  'scripts/__pycache__',
]);
const tokenFile = path.join('src', 'styles', 'theme-tokens.css');
const allowedMediaQueries = ['prefers-color-scheme', 'prefers-reduced-motion', 'forced-colors'];

const violations = [];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name) || ignoredDirectories.has(relativePath)) {
        continue;
      }

      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

function addViolation(file, lineNumber, message, line) {
  violations.push({
    file,
    lineNumber,
    message,
    line: line.trim(),
  });
}

function checkFile(file, contents) {
  const normalizedFile = file.split(path.sep).join(path.posix.sep);
  const isTokenFile = normalizedFile === tokenFile;
  const lines = contents.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/\b-?\d*\.?\d+rem\b/.test(line)) {
      addViolation(
        normalizedFile,
        lineNumber,
        'rem 단위 금지. px 또는 기존 토큰을 사용해야 합니다.',
        line,
      );
    }

    const mediaMatch = line.match(/@media\s*\(([^)]+)\)/);
    if (mediaMatch && !allowedMediaQueries.some((query) => mediaMatch[1].includes(query))) {
      addViolation(
        normalizedFile,
        lineNumber,
        '뷰포트 기반 반응형 미디어 쿼리 금지. 데스크탑 전용 레이아웃을 유지해야 합니다.',
        line,
      );
    }

    if (/\b(auto-fit|auto-fill)\b/.test(line)) {
      addViolation(
        normalizedFile,
        lineNumber,
        '자동 반응형 그리드 금지. 데스크탑 고정 그리드를 사용해야 합니다.',
        line,
      );
    }

    if (!isTokenFile && /^\s*--[A-Za-z0-9_-]+\s*:/.test(line)) {
      addViolation(
        normalizedFile,
        lineNumber,
        '토큰 선언 위치 위반. 새 CSS custom property는 src/styles/theme-tokens.css에만 둡니다.',
        line,
      );
    }

    if (!isTokenFile && /mobile-|__mobile|is-mobile/.test(line)) {
      addViolation(
        normalizedFile,
        lineNumber,
        '모바일 전용 네이밍 금지. 이 서비스는 데스크탑 전용입니다.',
        line,
      );
    }
  });
}

const files = await collectFiles(root);

for (const file of files) {
  const contents = await readFile(path.join(root, file), 'utf8');
  checkFile(file, contents);
}

if (violations.length > 0) {
  console.error('Style constraint check failed.');
  for (const violation of violations.slice(0, 80)) {
    console.error(
      `${violation.file}:${violation.lineNumber} ${violation.message}\n  ${violation.line}`,
    );
  }

  if (violations.length > 80) {
    console.error(`...and ${violations.length - 80} more violation(s).`);
  }

  process.exit(1);
}

console.log('Style constraint check passed.');
