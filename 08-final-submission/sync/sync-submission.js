/*
 * 8-final-submission / sync-submission.js
 *
 * 최종 제출 통합 패키지 동기화 스크립트
 *
 * 역할:
 * - 06-final-report, 07-presentation, 02-implementation의 최신 산출물을
 *   08-final-submission/ 하위로 복사한다.
 * - 복사 전 기존 08 콘텐츠가 있으면 snapshot_YYYYMMDD_HHmmss/로 보존한다.
 * - 각 파일의 sha256 · 크기 · 수정시각을 manifest.yaml에 기록한다.
 * - 08-final-submission/minji/README.md 최상단에 자동 생성 경고를 삽입한다.
 *
 * 사용법:
 *   cd 08-final-submission/sync
 *   node sync-submission.js
 *
 * 의존성: Node 표준 모듈(fs, path, crypto)만 사용. 외부 패키지 없음.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 경로 상수
const SCRIPT_DIR = __dirname; // .../08-final-submission/sync
const SUBMISSION_DIR = path.resolve(SCRIPT_DIR, '..'); // .../08-final-submission
const PROJECT_ROOT = path.resolve(SUBMISSION_DIR, '..'); // 프로젝트 루트

// 단일 파일 복사 대상 (source → destination)
// destination은 SUBMISSION_DIR 기준 상대 경로
const FILE_TASKS = [
    {
        src: '06-final-report/final/final-report.docx',
        dest: 'final-report/final-report.docx',
        label: '최종보고서 DOCX',
    },
    {
        src: '07-presentation/slides/presentation.pptx',
        dest: 'presentation/presentation.pptx',
        label: '발표 슬라이드 PPTX',
    },
    {
        src: '07-presentation/slides/presentation-final.pptx',
        dest: 'presentation/presentation-final.pptx',
        label: '발표 슬라이드 후처리본',
        optional: true,
    },
    {
        src: '07-presentation/handout/presentation.pdf',
        dest: 'presentation/handout.pdf',
        label: '인쇄 핸드아웃 PDF',
        optional: true,
    },
    {
        src: '07-presentation/demo/demo-scenario.md',
        dest: 'demo/demo-scenario.md',
        label: '데모 시나리오',
    },
    {
        src: '07-presentation/demo/script.md',
        dest: 'demo/script.md',
        label: '발표 스크립트 원본',
    },
    {
        src: '07-presentation/demo/script-v2.md',
        dest: 'demo/script-v2.md',
        label: '발표 스크립트 v2 (서민지 입말)',
        optional: true,
    },
    {
        src: '07-presentation/demo/study-plan.md',
        dest: 'demo/study-plan.md',
        label: '발표 학습 계획서',
    },
];

// 디렉토리 복사 대상
const DIR_TASKS = [
    {
        src: '02-implementation/src-simple',
        dest: 'final-report/source-code',
        label: '소스코드',
        // 제외 항목: 개발 산출물, 환경 비밀, 대용량 아티팩트
        exclude: ['node_modules', 'coverage', 'coverage-simple', '.env', 'data'],
    },
    {
        src: '02-implementation/experiments-simple',
        dest: 'final-report/experiments',
        label: '실험 스크립트 및 결과',
        // 제외: 개발 메타 전용
        exclude: ['.moai', '.claude'],
    },
    {
        src: '07-presentation/minji',
        dest: 'minji',
        label: '서민지 전달 문서',
        exclude: [],
    },
];

/* ===== 유틸리티 ===== */

function nowKST() {
    // YYYYMMDD_HHmmss (로컬 타임존 기준)
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        '_' +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    );
}

function sha256(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDir(src, dest, excludes) {
    ensureDir(dest);
    let count = 0;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (excludes && excludes.includes(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            count += copyDir(srcPath, destPath, excludes);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
            count += 1;
        }
    }
    return count;
}

function listAllFiles(dir) {
    const results = [];
    function walk(cur) {
        const entries = fs.readdirSync(cur, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(cur, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile()) results.push(full);
        }
    }
    if (fs.existsSync(dir)) walk(dir);
    return results;
}

function fileStatEntry(absPath, srcRel, destRel, label) {
    const stat = fs.statSync(absPath);
    return {
        label,
        source: srcRel,
        destination: destRel,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        sha256: sha256(absPath),
    };
}

/* ===== 스냅샷 ===== */

function createSnapshotIfNeeded() {
    // SUBMISSION_DIR 안에 sync/와 snapshot_*/ 외의 파일/폴더가 있으면 스냅샷 생성
    const entries = fs.readdirSync(SUBMISSION_DIR, { withFileTypes: true });
    const meaningful = entries.filter(
        (e) => e.name !== 'sync' && !e.name.startsWith('snapshot_')
    );
    if (meaningful.length === 0) return null;

    const snapDir = path.join(SUBMISSION_DIR, `snapshot_${nowKST()}`);
    ensureDir(snapDir);
    for (const entry of meaningful) {
        const srcPath = path.join(SUBMISSION_DIR, entry.name);
        const destPath = path.join(snapDir, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, []);
        } else if (entry.isFile()) {
            copyFile(srcPath, destPath);
        }
    }
    return path.relative(PROJECT_ROOT, snapDir);
}

/* ===== minji/README.md 경고 삽입 ===== */

const MINJI_WARNING =
    '> [자동 생성되는 폴더] 이 디렉토리는 `node sync-submission.js` 실행 시 ' +
    '`07-presentation/minji/` 내용으로 자동 덮어씌워집니다. 편집은 반드시 ' +
    '`07-presentation/minji/`에서 하세요. 이 폴더의 수정 사항은 다음 동기화 시 사라집니다.\n\n---\n\n';

function injectMinjiWarning() {
    const readmePath = path.join(SUBMISSION_DIR, 'minji', 'README.md');
    if (!fs.existsSync(readmePath)) return false;
    let content = fs.readFileSync(readmePath, 'utf8');
    // 이미 경고가 있으면 재삽입하지 않는다
    if (content.startsWith('> [자동 생성되는 폴더]')) return true;
    fs.writeFileSync(readmePath, MINJI_WARNING + content, 'utf8');
    return true;
}

/* ===== manifest.yaml ===== */

function yamlEscape(s) {
    // 안전한 YAML 문자열 이스케이프 (따옴표 내부용)
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function writeManifest(entries, snapshotPath) {
    const manifestPath = path.join(SUBMISSION_DIR, 'manifest.yaml');
    const lines = [];
    lines.push('# 8-final-submission / manifest.yaml');
    lines.push('# 자동 생성: node sync-submission.js 실행 시 갱신됨. 수동 편집 금지.');
    lines.push(`generated_at: "${new Date().toISOString()}"`);
    lines.push('generator: "sync-submission.js v1.0.0"');
    if (snapshotPath) {
        lines.push(`previous_snapshot: "${yamlEscape(snapshotPath)}"`);
    } else {
        lines.push('previous_snapshot: null');
    }
    lines.push('verification_status: "pending"');
    lines.push('# verify-submission.js 실행 후 verification_status가 갱신될 수 있음');
    lines.push(`file_count: ${entries.length}`);
    lines.push('');
    lines.push('files:');
    for (const entry of entries) {
        lines.push(`  - label: "${yamlEscape(entry.label)}"`);
        lines.push(`    source: "${yamlEscape(entry.source)}"`);
        lines.push(`    destination: "${yamlEscape(entry.destination)}"`);
        lines.push(`    size: ${entry.size}`);
        lines.push(`    mtime: "${yamlEscape(entry.mtime)}"`);
        lines.push(`    sha256: "${entry.sha256}"`);
        lines.push('');
    }
    fs.writeFileSync(manifestPath, lines.join('\n'), 'utf8');
}

/* ===== 메인 ===== */

function main() {
    console.log(`[sync] PROJECT_ROOT = ${PROJECT_ROOT}`);
    console.log(`[sync] SUBMISSION_DIR = ${SUBMISSION_DIR}`);

    const snapshotPath = createSnapshotIfNeeded();
    if (snapshotPath) {
        console.log(`[sync] Snapshot created: ${snapshotPath}`);
    } else {
        console.log('[sync] No prior content to snapshot');
    }

    const manifestEntries = [];

    // 단일 파일 복사
    for (const task of FILE_TASKS) {
        const srcAbs = path.join(PROJECT_ROOT, task.src);
        const destAbs = path.join(SUBMISSION_DIR, task.dest);
        if (!fs.existsSync(srcAbs)) {
            if (task.optional) {
                console.log(`[sync] Skipped (optional, not present): ${task.src}`);
                continue;
            }
            console.error(`[sync] ERROR: Required source missing: ${srcAbs}`);
            process.exit(1);
        }
        copyFile(srcAbs, destAbs);
        manifestEntries.push(fileStatEntry(destAbs, task.src, task.dest, task.label));
        console.log(`[sync] Copied: ${task.src} -> ${task.dest}`);
    }

    // 디렉토리 복사 (기존 destination 내용은 전부 지우고 새로 복사한다 -- 읽기 전용 정책)
    for (const task of DIR_TASKS) {
        const srcAbs = path.join(PROJECT_ROOT, task.src);
        const destAbs = path.join(SUBMISSION_DIR, task.dest);
        if (!fs.existsSync(srcAbs)) {
            console.error(`[sync] ERROR: Required source dir missing: ${srcAbs}`);
            process.exit(1);
        }
        if (fs.existsSync(destAbs)) {
            fs.rmSync(destAbs, { recursive: true, force: true });
        }
        const count = copyDir(srcAbs, destAbs, task.exclude);
        console.log(`[sync] Copied: ${task.src}/ -> ${task.dest}/ (${count} files)`);

        const files = listAllFiles(destAbs);
        for (const f of files) {
            const relDest = path.relative(SUBMISSION_DIR, f);
            const relSrc = path.join(task.src, path.relative(destAbs, f));
            manifestEntries.push(fileStatEntry(f, relSrc, relDest, task.label));
        }
    }

    // minji 경고 삽입
    if (injectMinjiWarning()) {
        console.log('[sync] minji/README.md: WARNING header inserted');
    }

    // manifest
    writeManifest(manifestEntries, snapshotPath);
    console.log(
        `[sync] manifest.yaml written (${manifestEntries.length} entries, sha256 computed)`
    );

    console.log('[sync] Done. Run verify-submission.js to validate.');
}

main();
