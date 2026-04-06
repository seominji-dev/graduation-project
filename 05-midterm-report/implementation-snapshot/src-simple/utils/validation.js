/**
 * 입력 유효성 검증 유틸리티
 *
 * LLM Scheduler API의 입력 데이터를 검증하고,
 * 안전한 기본값을 제공합니다.
 */

/**
 * 요청 우선순위 열거형
 */
const PRIORITIES = {
  URGENT: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

/**
 * 테넌트 등급 열거형
 */
const TIERS = {
  ENTERPRISE: 'enterprise',
  PREMIUM: 'premium',
  STANDARD: 'standard',
  FREE: 'free'
};

/**
 * 기본 가중치 (WFQ용)
 */
const DEFAULT_WEIGHTS = {
  [TIERS.ENTERPRISE]: 100,
  [TIERS.PREMIUM]: 50,
  [TIERS.STANDARD]: 10,
  [TIERS.FREE]: 1
};

/**
 * 요청 스키마 검증
 *
 * @param {Object} request - 검증할 요청 객체
 * @returns {Object} {valid: boolean, errors: string[], sanitized: Object}
 */
function validateRequest(request) {
  const errors = [];
  const sanitized = { ...request };

  // 필수 필드 검증
  if (!sanitized.prompt || typeof sanitized.prompt !== 'string') {
    errors.push('prompt must be a non-empty string');
  } else {
    // 프롬프트 길이 제한 (최대 10,000자)
    if (sanitized.prompt.length > 10000) {
      errors.push('prompt must be 10,000 characters or less');
      sanitized.prompt = sanitized.prompt.substring(0, 10000);
    }
    // 프롬프트 트림
    sanitized.prompt = sanitized.prompt.trim();
  }

  // tenantId 검증
  if (!sanitized.tenantId || typeof sanitized.tenantId !== 'string') {
    errors.push('tenantId must be a non-empty string');
  } else {
    // tenantId 알파벳/숫자/하이픈/언더스코어만 허용
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized.tenantId)) {
      errors.push('tenantId must contain only alphanumeric characters, hyphens, and underscores');
    }
  }

  // tier 검증
  if (sanitized.tier) {
    const validTiers = Object.values(TIERS);
    if (!validTiers.includes(sanitized.tier.toLowerCase())) {
      errors.push(`tier must be one of: ${validTiers.join(', ')}`);
    } else {
      sanitized.tier = sanitized.tier.toLowerCase();
    }
  } else {
    // 기본값: standard
    sanitized.tier = TIERS.STANDARD;
  }

  // priority 검증
  if (sanitized.priority) {
    const validPriorities = Object.keys(PRIORITIES);
    if (!validPriorities.includes(sanitized.priority.toUpperCase())) {
      errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
    } else {
      sanitized.priority = sanitized.priority.toUpperCase();
    }
  } else {
    // 기본값: NORMAL
    sanitized.priority = 'NORMAL';
  }

  // estimatedTokens 검증 (선택적)
  if (sanitized.estimatedTokens !== undefined) {
    const tokens = parseInt(sanitized.estimatedTokens, 10);
    if (isNaN(tokens) || tokens < 1 || tokens > 128000) {
      errors.push('estimatedTokens must be a number between 1 and 128000');
      delete sanitized.estimatedTokens;
    } else {
      sanitized.estimatedTokens = tokens;
    }
  }

  // metadata 검증 (선택적, 객체여야 함)
  if (sanitized.metadata !== undefined) {
    if (typeof sanitized.metadata !== 'object' || Array.isArray(sanitized.metadata)) {
      errors.push('metadata must be an object');
      delete sanitized.metadata;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * 테넌트 정보 검증
 *
 * @param {Object} tenant - 검증할 테넌트 객체
 * @returns {Object} {valid: boolean, errors: string[], sanitized: Object}
 */
function validateTenant(tenant) {
  const errors = [];
  const sanitized = { ...tenant };

  // tenantId 필수
  if (!sanitized.tenantId || typeof sanitized.tenantId !== 'string') {
    errors.push('tenantId must be a non-empty string');
  }

  // tier 검증
  if (sanitized.tier) {
    const validTiers = Object.values(TIERS);
    if (!validTiers.includes(sanitized.tier.toLowerCase())) {
      errors.push(`tier must be one of: ${validTiers.join(', ')}`);
    } else {
      sanitized.tier = sanitized.tier.toLowerCase();
    }
  } else {
    sanitized.tier = TIERS.STANDARD;
  }

  // weight 검증 (선택적)
  if (sanitized.weight !== undefined) {
    const weight = parseInt(sanitized.weight, 10);
    if (isNaN(weight) || weight < 1 || weight > 1000) {
      errors.push('weight must be a number between 1 and 1000');
      delete sanitized.weight;
    } else {
      sanitized.weight = weight;
    }
  } else {
    // 기본 가중치 할당
    sanitized.weight = DEFAULT_WEIGHTS[sanitized.tier] || DEFAULT_WEIGHTS[TIERS.STANDARD];
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * 쿼리 파라미터 검증
 *
 * @param {Object} query - 검증할 쿼리 파라미터 객체
 * @returns {Object} 검증된 파라미터
 */
function validateQueryParams(query) {
  const sanitized = {};

  // limit 파라미터 (최대 1000)
  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    if (!isNaN(limit) && limit > 0 && limit <= 1000) {
      sanitized.limit = limit;
    } else {
      sanitized.limit = 100; // 기본값
    }
  } else {
    sanitized.limit = 100;
  }

  // offset 파라미터
  if (query.offset) {
    const offset = parseInt(query.offset, 10);
    if (!isNaN(offset) && offset >= 0) {
      sanitized.offset = offset;
    } else {
      sanitized.offset = 0; // 기본값
    }
  } else {
    sanitized.offset = 0;
  }

  // status 파라미터
  if (query.status) {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (validStatuses.includes(query.status.toLowerCase())) {
      sanitized.status = query.status.toLowerCase();
    }
  }

  // tenantId 파라미터
  if (query.tenantId && typeof query.tenantId === 'string') {
    sanitized.tenantId = query.tenantId;
  }

  return sanitized;
}

/**
 * 에러 응답 포맷팅
 *
 * @param {Array<string>} errors - 에러 메시지 배열
 * @returns {Object} API 에러 응답 객체
 */
function formatValidationErrors(errors) {
  return {
    error: 'Validation failed',
    message: 'Invalid input data',
    details: errors
  };
}

/**
 * 안전한 숫자 파싱
 *
 * @param {any} value - 파싱할 값
 * @param {number} defaultValue - 기본값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 파싱된 숫자 또는 기본값
 */
function safeParseInt(value, defaultValue = 0, min = -Infinity, max = Infinity) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
}

/**
 * 안전한 부동소수점 파싱
 *
 * @param {any} value - 파싱할 값
 * @param {number} defaultValue - 기본값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 파싱된 숫자 또는 기본값
 */
function safeParseFloat(value, defaultValue = 0.0, min = -Infinity, max = Infinity) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
}

/**
 * 문자열 이스케이프 (XSS 방지)
 *
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQL 인젝션 방지 (NoSQL용)
 *
 * @param {string} str - 검증할 문자열
 * @returns {boolean} 안전하면 true, 위험하면 false
 */
function isSafeString(str) {
  if (typeof str !== 'string') {
    return false;
  }
  // NoSQL 인젝션 패턴 검사
  const dangerousPatterns = [
    /\$where/,
    /\$ne/,
    /\$gt/,
    /\$lt/,
    /\$in/,
    /\$or/,
    /\$and/,
    /javascript:/i,
    /<script>/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * 요청 크기 제한 검사
 *
 * @param {Object} request - 검증할 요청 객체
 * @param {number} maxSizeKB - 최대 크기 (KB)
 * @returns {boolean} 크기 제한 내이면 true
 */
function isRequestSizeValid(request, maxSizeKB = 100) {
  const size = JSON.stringify(request).length;
  const maxSizeBytes = maxSizeKB * 1024;
  return size <= maxSizeBytes;
}

module.exports = {
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
};
