/**
 * 입력 유효성 검증 테스트
 */
const {
  validateRequest,
  validateTenant,
} = require('../src-simple/utils/validation');

describe('validateRequest', () => {
  test('유효한 요청 검증 통과', () => {
    const request = {
      prompt: 'Hello, LLM!',
      tenantId: 'test-tenant',
      tier: 'premium',
      priority: 'HIGH'
    };

    const result = validateRequest(request);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('필수 필드 누락 시 에러', () => {
    const request = {};

    const result = validateRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('잘못된 priority 값은 에러', () => {
    const request = {
      prompt: 'Hello!',
      tenantId: 'test-tenant',
      priority: 'INVALID_PRIORITY'
    };

    const result = validateRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('priority must be one of: URGENT, HIGH, NORMAL, LOW');
  });

  test('잘못된 tier 값은 에러', () => {
    const request = {
      prompt: 'Hello!',
      tenantId: 'test-tenant',
      tier: 'invalid_tier'
    };

    const result = validateRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tier must be one of: enterprise, premium, standard, free');
  });

  test('프롬프트 길이 제한 (10,000자)', () => {
    const request = {
      prompt: 'a'.repeat(10001),
      tenantId: 'test-tenant'
    };

    const result = validateRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('prompt must be 10,000 characters or less');
  });
});

describe('validateTenant', () => {
  test('유효한 테넌트 검증 통과', () => {
    const tenant = {
      tenantId: 'enterprise-tenant',
      tier: 'enterprise'
    };

    const result = validateTenant(tenant);

    expect(result.valid).toBe(true);
    expect(result.sanitized.weight).toBe(100);
  });
});
