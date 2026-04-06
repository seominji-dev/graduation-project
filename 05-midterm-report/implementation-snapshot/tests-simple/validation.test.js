/**
 * 입력 유효성 검증 테스트
 *
 * Edge case handling과 입력 검증 로직을 테스트합니다.
 */

const {
  PRIORITIES,
  TIERS,
  DEFAULT_WEIGHTS,
  validateRequest,
  validateTenant,
  validateQueryParams,
  formatValidationErrors,
  safeParseInt,
  safeParseFloat,
  escapeString,
  isSafeString,
  isRequestSizeValid
} = require('../src-simple/utils/validation');

describe('Validation Utils', () => {
  describe('PRIORITIES and TIERS', () => {
    test('PRIORITIES has correct values', () => {
      expect(PRIORITIES.URGENT).toBe(4);
      expect(PRIORITIES.HIGH).toBe(3);
      expect(PRIORITIES.NORMAL).toBe(2);
      expect(PRIORITIES.LOW).toBe(1);
    });

    test('TIERS has correct values', () => {
      expect(TIERS.ENTERPRISE).toBe('enterprise');
      expect(TIERS.PREMIUM).toBe('premium');
      expect(TIERS.STANDARD).toBe('standard');
      expect(TIERS.FREE).toBe('free');
    });

    test('DEFAULT_WEIGHTS has correct values', () => {
      expect(DEFAULT_WEIGHTS.enterprise).toBe(100);
      expect(DEFAULT_WEIGHTS.premium).toBe(50);
      expect(DEFAULT_WEIGHTS.standard).toBe(10);
      expect(DEFAULT_WEIGHTS.free).toBe(1);
    });
  });

  describe('validateRequest', () => {
    test('유효한 요청 검증', () => {
      const request = {
        prompt: 'Hello, LLM!',
        tenantId: 'test-tenant',
        tier: 'premium',
        priority: 'HIGH'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.prompt).toBe('Hello, LLM!');
      expect(result.sanitized.tier).toBe('premium');
      expect(result.sanitized.priority).toBe('HIGH');
    });

    test('필수 필드 누락 시 에러', () => {
      const request = {};

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('prompt must be a non-empty string');
      expect(result.errors).toContain('tenantId must be a non-empty string');
    });

    test('프롬프트 길이 제한 (10,000자)', () => {
      const request = {
        prompt: 'a'.repeat(10001),
        tenantId: 'test-tenant'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('prompt must be 10,000 characters or less');
      expect(result.sanitized.prompt.length).toBe(10000);
    });

    test('프롬프트 트림', () => {
      const request = {
        prompt: '  Hello, LLM!  ',
        tenantId: 'test-tenant'
      };

      const result = validateRequest(request);

      expect(result.sanitized.prompt).toBe('Hello, LLM!');
    });

    test('잘못된 tenantId 형식', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'invalid@tenant#id'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('tenantId must contain only alphanumeric characters, hyphens, and underscores');
    });

    test('잘못된 tier 값', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        tier: 'invalid_tier'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('tier must be one of: enterprise, premium, standard, free');
    });

    test('tier 대소문자 구분 없이 처리', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        tier: 'ENTERPRISE'
      };

      const result = validateRequest(request);

      expect(result.sanitized.tier).toBe('enterprise');
    });

    test('tier 기본값: standard', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant'
      };

      const result = validateRequest(request);

      expect(result.sanitized.tier).toBe('standard');
    });

    test('잘못된 priority 값', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        priority: 'INVALID_PRIORITY'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('priority must be one of: URGENT, HIGH, NORMAL, LOW');
    });

    test('priority 대소문자 구분 없이 처리', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        priority: 'urgent'
      };

      const result = validateRequest(request);

      expect(result.sanitized.priority).toBe('URGENT');
    });

    test('priority 기본값: NORMAL', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant'
      };

      const result = validateRequest(request);

      expect(result.sanitized.priority).toBe('NORMAL');
    });

    test('잘못된 estimatedTokens 값', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        estimatedTokens: 'invalid'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('estimatedTokens must be a number between 1 and 128000');
    });

    test('estimatedTokens 범위 검증 (1-128000)', () => {
      const request1 = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        estimatedTokens: 0
      };

      const result1 = validateRequest(request1);
      expect(result1.valid).toBe(false);

      const request2 = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        estimatedTokens: 128001
      };

      const result2 = validateRequest(request2);
      expect(result2.valid).toBe(false);
    });

    test('잘못된 metadata 형식', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        metadata: 'not an object'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('metadata must be an object');
    });

    test('metadata 배열인 경우 에러', () => {
      const request = {
        prompt: 'Hello!',
        tenantId: 'test-tenant',
        metadata: ['item1', 'item2']
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('metadata must be an object');
    });
  });

  describe('validateTenant', () => {
    test('유효한 테넌트 검증', () => {
      const tenant = {
        tenantId: 'enterprise-tenant',
        tier: 'enterprise'
      };

      const result = validateTenant(tenant);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.weight).toBe(100);
    });

    test('tenantId 누락 시 에러', () => {
      const tenant = {
        tier: 'premium'
      };

      const result = validateTenant(tenant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('tenantId must be a non-empty string');
    });

    test('tier 기본값 및 weight 자동 할당', () => {
      const tenant = {
        tenantId: 'new-tenant'
      };

      const result = validateTenant(tenant);

      expect(result.sanitized.tier).toBe('standard');
      expect(result.sanitized.weight).toBe(10);
    });

    test('weight 유효 범위 (1-1000)', () => {
      const tenant = {
        tenantId: 'test-tenant',
        weight: 1500
      };

      const result = validateTenant(tenant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('weight must be a number between 1 and 1000');
    });
  });

  describe('validateQueryParams', () => {
    test('유효한 쿼리 파라미터', () => {
      const query = {
        limit: '50',
        offset: '10',
        status: 'completed',
        tenantId: 'test-tenant'
      };

      const result = validateQueryParams(query);

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
      expect(result.status).toBe('completed');
      expect(result.tenantId).toBe('test-tenant');
    });

    test('limit 기본값: 100', () => {
      const query = {};

      const result = validateQueryParams(query);

      expect(result.limit).toBe(100);
    });

    test('limit 최대값: 1000', () => {
      const query = { limit: '2000' };

      const result = validateQueryParams(query);

      expect(result.limit).toBe(100);
    });

    test('offset 기본값: 0', () => {
      const query = {};

      const result = validateQueryParams(query);

      expect(result.offset).toBe(0);
    });

    test('잘못된 status 값은 무시', () => {
      const query = { status: 'invalid_status' };

      const result = validateQueryParams(query);

      expect(result.status).toBeUndefined();
    });
  });

  describe('formatValidationErrors', () => {
    test('에러 메시지 포맷팅', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const formatted = formatValidationErrors(errors);

      expect(formatted).toEqual({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: errors
      });
    });
  });

  describe('safeParseInt', () => {
    test('유효한 정수 파싱', () => {
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('456', 0)).toBe(456);
    });

    test('잘못된 값은 기본값 반환', () => {
      expect(safeParseInt('abc', 10)).toBe(10);
      expect(safeParseInt(null, 5)).toBe(5);
      expect(safeParseInt(undefined, 0)).toBe(0);
    });

    test('min/max 제한', () => {
      expect(safeParseInt('50', 0, 0, 100)).toBe(50);
      expect(safeParseInt('150', 0, 0, 100)).toBe(100);
      expect(safeParseInt('-10', 0, 0, 100)).toBe(0);
    });
  });

  describe('safeParseFloat', () => {
    test('유효한 부동소수점 파싱', () => {
      expect(safeParseFloat('12.34')).toBe(12.34);
      expect(safeParseFloat('56.78', 0.0)).toBe(56.78);
    });

    test('잘못된 값은 기본값 반환', () => {
      expect(safeParseFloat('abc', 10.0)).toBe(10.0);
      expect(safeParseFloat(null, 5.0)).toBe(5.0);
    });

    test('min/max 제한', () => {
      expect(safeParseFloat('50.5', 0.0, 0.0, 100.0)).toBe(50.5);
      expect(safeParseFloat('150.5', 0.0, 0.0, 100.0)).toBe(100.0);
      expect(safeParseFloat('-10.5', 0.0, 0.0, 100.0)).toBe(0.0);
    });
  });

  describe('escapeString', () => {
    test('HTML 특수 문자 이스케이프', () => {
      expect(escapeString('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(escapeString('Hello & goodbye')).toBe('Hello &amp; goodbye');
      expect(escapeString("It's \"quoted\"")).toBe('It&#x27;s &quot;quoted&quot;');
    });

    test('문자열이 아닌 경우 빈 문자열 반환', () => {
      expect(escapeString(123)).toBe('');
      expect(escapeString(null)).toBe('');
      expect(escapeString(undefined)).toBe('');
      expect(escapeString({})).toBe('');
    });
  });

  describe('isSafeString', () => {
    test('안전한 문자열', () => {
      expect(isSafeString('Hello, World!')).toBe(true);
      expect(isSafeString('tenant-123')).toBe(true);
      expect(isSafeString('user@example')).toBe(true);
    });

    test('위험한 NoSQL 인젝션 패턴', () => {
      expect(isSafeString('{$where: "this.password == \'123\'"}')).toBe(false);
      expect(isSafeString('{$ne: null}')).toBe(false);
      expect(isSafeString('javascript:alert(1)')).toBe(false);
      expect(isSafeString('<script>alert("XSS")</script>')).toBe(false);
    });

    test('문자열이 아닌 경우', () => {
      expect(isSafeString(123)).toBe(false);
      expect(isSafeString(null)).toBe(false);
      expect(isSafeString({})).toBe(false);
    });
  });

  describe('isRequestSizeValid', () => {
    test('크기 제한 내 요청', () => {
      const smallRequest = {
        prompt: 'Hello!',
        tenantId: 'test'
      };

      expect(isRequestSizeValid(smallRequest, 100)).toBe(true);
    });

    test('크기 제한 초과 요청', () => {
      const largeRequest = {
        prompt: 'a'.repeat(102400), // 100KB+
        tenantId: 'test'
      };

      expect(isRequestSizeValid(largeRequest, 100)).toBe(false);
    });

    test('기본 크기 제한: 100KB', () => {
      const request = {
        prompt: 'a'.repeat(50000), // 50KB
        tenantId: 'test'
      };

      expect(isRequestSizeValid(request)).toBe(true);
    });
  });
});
