# 즉시 수정 항목 체크리스트
## Immediate Actions Checklist

---

**작성일:** 2026년 2월 7일
**목적:** 졸업 작품 심사 제출 전 필수 수정 항목 점검

---

## 1. 지도교수 정보 기재 (Advisor Information)

### 기재 필요 위치

| 문서 | 경로 | 현재 상태 |
|------|------|------------|
| 수강신청서 | `01-plan/수강신청서-내용-최종본.md` | ⚠️ `(교수님 성함 기재 필요)` |
| 논문 | `03-report/paper/final-report.md` (라인 11) | ⚠️ `지도교수:` (빈침) |
| 발표자료 | `03-report/presentation/graduation-presentation.md` (라인 930) | ⚠️ `[professor-name]` (플레이스홀더) |

### 기재 항목

- **지도교수 성함:** (직접 입력)
- **연락처:** (직접 입력 - 이메일 또는 전화번호)

### 수정 예시

```markdown
## 기본 정보

| 항목 | 내용 |
|------|------|
| 학번 | C235180 |
| 성명 | 서민지 |
| 학과 | 컴퓨터공학과 |
| 지도교수 | ◯◯◯ 교수님 |
| 연락처 | ◯◯◯@hongik.ac.kr |
```

---

## 2. 맞춤법 검사 (Spell Check)

### 자주 검사 항목

#### 한국어 맞춤법
- [ ] **띄어쓰기 검사:** "OS 스케줄링" vs "OS스케줄링" 통일
- [ ] **외래어 표기:** "스케줄러" (scheduler), "큐잉" (queuing), "테넌트" (tenant)
- [ ] **문장 부호:** 따옴표(```)와 작은따옴표(`'`) 구분
- [ ] **줄임표(-):** "멀티-테넌트" vs "멀티테넌트" 통일

#### 영어 맞춤법
- [ ] **전문 용어:**
  - Scheduling (스케줄링)
  - Fairness Index (공정성 지수)
  - Multi-tenant (멀티테넌트)
  - Generalized Processor Sharing (일반화된 프로세서 공유)

#### 기술 용어 통일
- [ ] **FCFS** vs "First-Come, First-Served" 통일
- [ ] **WFQ** vs "Weighted Fair Queuing" 통일
- [ ] **Jain's Fairness Index** vs "제인 공정성 지수" 통일

### 자주 검사 방법

1. **VS Code 확장 프로그램:**
   - Korean Proofreading (한국어 맞춤법 검사기)
   - Code Spell Checker (영어 맞춤법 검사)

2. **한글 맞춤법 검사기:**
   - https://speller.cs.pusan.ac.kr/
   - 한국어 맞춤법 검사기

3. **주요 문서 확인:**
   - `01-plan/수강신청서-내용-최종본.md`
   - `03-report/paper/final-report.md`
   - `03-report/presentation/graduation-presentation.md`

---

## 3. 참고문헌 형식 확인 (Reference Format)

### 현재 형식 상태

**참고문헌 위치:** `03-report/paper/final-report.md` (라인 852-881)

#### 교과서 및 참고서 ✅
```
[1] Silberschatz, A., Galvin, P. B., & Gagne, G. (2022). Operating System Concepts (10th ed.). Wiley. ISBN: 978-1119456339

[2] Tanenbaum, A. S., & Bos, H. (2014). Modern Operating Systems (4th ed.). Pearson. ISBN: 978-0133591620
```
**평가:** IEEE/ACM 형식 준수 ✅

#### 학술 논문 ✅
```
[3] Parekh, A. K., & Gallager, R. G. (1993). "A Generalized Processor Sharing Approach to Flow Control in Integrated Services Networks: The Single-Node Case". IEEE/ACM Transactions on Networking, 1(3), 344-357.

[4] Jain, R., Chiu, D. M., & Hawe, W. R. (1984). "A Quantitative Measure of Fairness and Discrimination for Resource Allocation in Shared Computer Systems". DEC Research Report TR-301. Eastern Research Laboratory, Digital Equipment Corporation.

[5] Demers, A., Keshav, S., & Shenker, S. (1989). "Analysis and Simulation of a Fair Queueing Algorithm". Proceedings of the ACM SIGCOMM '89 Conference on Data Communication. 19(4): 1-12.
```
**평가:** 학술 논문 형식 준수 ✅

#### 기술 문서 ✅
```
[10] Node.js Documentation. (2024). "Node.js Documentation". Retrieved from https://nodejs.org/docs/

[11] MDN JavaScript Documentation. (2024). "JavaScript". Retrieved from https://developer.mozilla.org/ko/docs/Web/JavaScript

[12] Express.js Documentation. (2024). "Express - Node.js web application framework". Retrieved from https://expressjs.com/
```
**평가:** 기술 문서 형식 준수 ✅

### 확인 완료 항목

- [x] **저자명 형식:** 성, 이니셜 형식 준수
- [x] **출판 연도:** 괄호 포함
- [x] **논문/저널명:** 이탤릭체 적용
- [x] **권호:** 쪽 번호 또는 URL 명시
- [x] **ISBN/DOI:** 포함 (가능한 경우)

---

## 4. 제출 전 최종 점검 (Final Pre-Submission Checklist)

### 필수 항목 (Must Do)

- [ ] **지도교수 성명/연락처 기재**
  - [ ] `01-plan/수강신청서-내용-최종본.md`
  - [ ] `03-report/paper/final-report.md`
  - [ ] `03-report/presentation/graduation-presentation.md`

- [ ] **맞춤법 검사 완료**
  - [ ] 한국어 맞춤법 검사
  - [ ] 영어 맞춤법 검사
  - [ ] 기술 용어 통일

- [ ] **참고문헌 형식 확인** ✅ (완료됨)

### 권장 항목 (Should Do)

- [ ] **PDF 변환 확인**
  - 논문 PDF (154KB)
  - 발표 PPT (457KB)

- [ ] **발표 연습**
  - 15-20분 타이밍 확인
  - Q&A 준비

- [ ] **데모 영상 확인**
  - 5.2MB 영상 재생 확인
  - 실시간 데모 시나리오 점검

---

## 5. 수정 완료 보고

**수정 완료 후 아래 내용을 확인하세요:**

- [ ] 지도교수 정보 기재 완료
- [ ] 맞춤법 검사 완료
- [ ] 참고문헌 형식 확인 완료

**모든 항목 완료 시:** 졸업 작품 심사 **준비 완료 (Ready)**

---

**작성자:** MoAI Project Review System
**버전:** 2026-02-07-v1.0
