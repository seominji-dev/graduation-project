# Technical Evaluation Module

기술적 완성도 평가 모듈 - 구현의 기술적 수준을 평가합니다.

## 평가 차원: 기술적 완성도 (25점)

### 1. 아키텍처 설계 (5점)

**평가 항목:**
- **모듈화 (Modularity):** 모듈 간 결합도가 낮고 응집도가 높은가?
  - 모듈이 독립적으로 테스트 가능한가?
  - 인터페이스가 명확한가?

- **계층화 (Layering):** 계층 구조가 명확한가?
  - presentation, business, data layer가 분리되어 있는가?
  - 의존성 방향이 올바른가?

- **확장성 (Extensibility):** 변경에 유연한가?
  - 새로운 기능 추가가 용이한가?
  - 디자인 패턴이 적절히 활용되었는가?

**AI 분석 프롬프트:**
```
다음 프로젝트의 아키텍처를 분석하세요:

1. README, 아키텍처 문서, 코드 구조를 확인하세요.
2. 모듈 간 의존성을 분석하세요.
3. 디자인 패턴 사용 여부를 확인하세요.
4. 변경 용이성을 평가하세요.

각 항목에 1-5점을 부과하고 근거를 제시하세요.
```

### 2. 코드 품질 - TRUST 5 (10점)

**Tested (3점):**
- 테스트 커버리지: 85% 이상인가?
- 테스트 품질: 의미 있는 assertion이 있는가?
- Characterization tests: 리팩토링된 코드에 있는가?

**Readable (2점):**
- 주석: 코드의 의도를 설명하는가?
- 명명 규칙: 명확하고 일관된가?
- 함수 길이: 적절한가 (20-30줄 이하)?

**Unified (2점):**
- 포맷팅: 일관된 포맷인가?
- Lint: lint 에러가 없는가?
- 스타일: 언어의 모범 사례를 따르는가?

**Secured (2점):**
- OWASP: 주요 취약점이 없는가?
- 입력 검증: 사용자 입력을 검증하는가?
- Secrets: 하드코딩된 비밀이 없는가?

**Trackable (1점):**
- 커밋 메시지: conventional commit인가?
- 브랜치: 적절한 브랜치 전략을 따르는가?

### 3. 기술 스택 선택 (5점)

**평가 항목:**
- **적절성 (Appropriateness):** 프로젝트 요구사항에 적합한가?
  - 선택한 기술이 문제에 적절한가?
  - 대안과 비교한 근거가 있는가?

- **최신성 (Modernity):** 최신 버전을 사용하는가?
  - LTS 또는 안정적인 최신 버전인가?
  - deprecation 경고가 없는가?

- **생태계 (Ecosystem):** 라이브러리와 도구가 충분한가?
  - 필요한 라이브러리가 있는가?
  - 커뮤니티 지원이 충분한가?

**AI 분석 프롬프트:**
```
다음 프로젝트의 기술 스택을 평가하세요:

1. 사용된 기술(언어, 프레임워크, 라이브러리)을 식별하세요.
2. 프로젝트 요구사항과의 적합성을 평가하세요.
3. 버전 확인 및 deprecation을 확인하세요.
4. 대안과 비교한 근거가 있는지 확인하세요.
```

### 4. 성능 및 보안 (5점)

**성능 (3점):**
- **효율성 (Efficiency):** 알고리즘 효율이 적절한가?
  - 시간 복잡도가 최적화되었는가?
  - 공간 복잡도가 최적화되었는가?

- **최적화 (Optimization):** 성능 최적화가 고려되었는가?
  - 캐싱이 적절히 사용되었는가?
  - 지연 로딩이 사용되었는가?
  - 병렬 처리가 고려되었는가?

- **모니터링 (Monitoring):** 성능 모니터링이 있는가?
  - 로깅이 충분한가?
  - 성능 지표를 수집하는가?

**보안 (2점):**
- **입入 검증 (Input Validation):** 사용자 입력을 검증하는가?
  - SQL Injection 방어가 있는가?
  - XSS 방어가 있는가?

- **인증/인가 (Auth):** 적절한 인증/인가가 있는가?
  - 비밀번호 안전하게 저장하는가?
  - 권한 검사가 있는가?

## 출력 형식

```yaml
technical_evaluation:
  architecture_design:
    modularity: X/5
    layering: X/5
    extensibility: X/5
    total: X/5
    feedback: "[구체적 피드백]"

  code_quality_trust5:
    tested: X/3
    readable: X/2
    unified: X/2
    secured: X/2
    trackable: X/1
    total: X/10
    feedback: "[구체적 피드백]"

  tech_stack_selection:
    appropriateness: X/2
    modernity: X/1
    ecosystem: X/2
    total: X/5
    feedback: "[구체적 피드백]"

  performance_security:
    efficiency: X/1
    optimization: X/1
    monitoring: X/1
    input_validation: X/1
    auth: X/1
    total: X/5
    feedback: "[구체적 피드백]"

  overall_score: X/25
  grade: "[A-F]"
```
