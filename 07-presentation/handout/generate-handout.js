/*
 * 7-presentation / handout / generate-handout.js
 *
 * 발표용 PPTX를 인쇄용 PDF로 변환하는 자동 스크립트.
 *
 * 우선순위:
 *   1. slides/presentation-final.pptx (Claude in PowerPoint 후처리본) — 존재 시 우선
 *   2. slides/presentation.pptx (Claude Code 생성 듀얼채널본) — fallback
 *
 * 동작:
 *   - soffice (LibreOffice CLI) 가용 시: 자동 변환 → handout/presentation.pdf
 *   - soffice 미설치 시: PowerPoint 수동 경로 상세 안내 + exit 1 (작업 필요 신호)
 *
 * 사용법:
 *   cd /path/to/졸업프로젝트
 *   node 07-presentation/handout/generate-handout.js
 *
 * SPEC: SPEC-PIPELINE-FINAL-001 REQ-HANDOUT-001..005
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const PRESENTATION_DIR = path.resolve(SCRIPT_DIR, '..');
const SLIDES_DIR = path.join(PRESENTATION_DIR, 'slides');
const HANDOUT_DIR = path.join(PRESENTATION_DIR, 'handout');

const MIN_PDF_SIZE_BYTES = 10 * 1024; // 10 KB 미만 PDF는 silent soffice 실패로 간주

function hasCommand(cmd) {
    try {
        execSync(`command -v ${cmd}`, { stdio: 'pipe' });
        return true;
    } catch (_) {
        return false;
    }
}

function pickSource() {
    const finalPath = path.join(SLIDES_DIR, 'presentation-final.pptx');
    const dualPath = path.join(SLIDES_DIR, 'presentation.pptx');
    if (fs.existsSync(finalPath)) {
        console.log('[handout] Source: presentation-final.pptx (Claude in PowerPoint 후처리본)');
        return { file: finalPath, name: 'presentation-final.pptx', isPostProcessed: true };
    }
    if (fs.existsSync(dualPath)) {
        console.log('[handout] Source: presentation.pptx (Claude Code 듀얼채널본)');
        console.log('[handout] NOTE: presentation-final.pptx이 없음 — 발표 D-5까지 후처리 권장.');
        return { file: dualPath, name: 'presentation.pptx', isPostProcessed: false };
    }
    console.error('[handout] FAIL: slides/ 디렉터리에 변환 가능한 PPTX가 없습니다.');
    console.error('[handout]       기대 경로: 07-presentation/slides/presentation.pptx');
    console.error('[handout]       먼저 7-presentation 스킬을 실행하여 PPTX를 생성하세요.');
    process.exit(2);
}

function convertWithSoffice(sourceFile) {
    console.log(`[handout] soffice 변환 시작: ${path.basename(sourceFile)} → handout/presentation.pdf`);

    // soffice 변환 결과는 <source-basename>.pdf 로 저장됨 (예: presentation-final.pdf)
    // 최종 이름 `presentation.pdf`로 rename 필요
    try {
        execSync(
            `soffice --headless --convert-to pdf --outdir "${HANDOUT_DIR}" "${sourceFile}"`,
            { stdio: 'pipe' }
        );
    } catch (err) {
        console.error('[handout] FAIL: soffice 변환 실패');
        console.error(`[handout]       stderr: ${err.message.split('\n')[0]}`);
        return false;
    }

    const sourceBasename = path.basename(sourceFile, '.pptx');
    const generatedPath = path.join(HANDOUT_DIR, `${sourceBasename}.pdf`);
    const finalPath = path.join(HANDOUT_DIR, 'presentation.pdf');

    if (!fs.existsSync(generatedPath)) {
        console.error('[handout] FAIL: soffice는 종료했으나 출력 PDF를 찾을 수 없습니다.');
        console.error(`[handout]       기대 경로: ${generatedPath}`);
        return false;
    }

    // 파일 크기 검증 (SPEC REQ-HANDOUT-005)
    const stat = fs.statSync(generatedPath);
    if (stat.size < MIN_PDF_SIZE_BYTES) {
        console.error(`[handout] FAIL: 생성된 PDF 크기가 비정상적으로 작습니다 (${stat.size} bytes < ${MIN_PDF_SIZE_BYTES}).`);
        console.error('[handout]       soffice silent 실패 가능성. PPTX 원본을 확인하세요.');
        try { fs.unlinkSync(generatedPath); } catch (_) { /* ignore */ }
        return false;
    }

    // 최종 이름으로 rename (presentation-final.pdf → presentation.pdf)
    if (generatedPath !== finalPath) {
        if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
        }
        fs.renameSync(generatedPath, finalPath);
    }

    console.log(`[handout] PASS: ${finalPath}`);
    console.log(`[handout]       크기: ${Math.round(stat.size / 1024)} KB`);
    return true;
}

function printManualGuide(sourceName) {
    console.log('');
    console.log('='.repeat(70));
    console.log('[handout] soffice (LibreOffice CLI) 미설치 — PowerPoint 수동 변환 필요');
    console.log('='.repeat(70));
    console.log('');
    console.log('다음 중 하나의 경로로 handout/presentation.pdf를 만들어 주세요:');
    console.log('');
    console.log('[경로 A — PowerPoint (Windows/macOS)]');
    console.log(`  1. Microsoft PowerPoint에서 07-presentation/slides/${sourceName}를 엽니다.`);
    console.log('  2. 상단 메뉴: 파일 → 내보내기 → PDF/XPS 문서 만들기');
    console.log('     (macOS: 파일 → 내보내기 → 파일 형식 "PDF")');
    console.log('  3. 최적화 옵션: "표준(온라인 게시 및 인쇄)" 선택');
    console.log('  4. 저장 경로: 07-presentation/handout/presentation.pdf');
    console.log('');
    console.log('[경로 B — Keynote (macOS)]');
    console.log(`  1. Keynote에서 07-presentation/slides/${sourceName}를 엽니다.`);
    console.log('  2. 상단 메뉴: 파일 → 내보내기 → PDF');
    console.log('  3. 이미지 품질: "좋음" 이상, 각 스테이지 포함 안 함');
    console.log('  4. 저장 경로: 07-presentation/handout/presentation.pdf');
    console.log('');
    console.log('[경로 C — LibreOffice 설치 후 재실행 (macOS 권장)]');
    console.log('  brew install --cask libreoffice');
    console.log('  node 07-presentation/handout/generate-handout.js');
    console.log('');
    console.log('저장 완료 후 아래 순서로 다음 단계를 진행하세요:');
    console.log('  1. ls -la 07-presentation/handout/presentation.pdf   (파일 존재 확인)');
    console.log('  2. cd 08-final-submission/.sync && node sync-submission.js');
    console.log('  3. node verify-submission.js   (strict 모드 통과 확인)');
    console.log('');
    console.log('='.repeat(70));
}

function main() {
    console.log(`[handout] SLIDES_DIR = ${SLIDES_DIR}`);
    console.log(`[handout] HANDOUT_DIR = ${HANDOUT_DIR}`);
    console.log('');

    if (!fs.existsSync(HANDOUT_DIR)) {
        fs.mkdirSync(HANDOUT_DIR, { recursive: true });
    }

    const source = pickSource();

    if (hasCommand('soffice')) {
        const ok = convertWithSoffice(source.file);
        if (!ok) {
            console.log('');
            console.log('[handout] 자동 변환 실패. PowerPoint 수동 변환으로 복구하세요.');
            printManualGuide(source.name);
            process.exit(1);
        }
        if (!source.isPostProcessed) {
            console.log('[handout] 권장: Claude in PowerPoint 후처리 후 presentation-final.pptx 저장 → 재실행');
        }
        process.exit(0);
    } else {
        printManualGuide(source.name);
        process.exit(1);
    }
}

main();
