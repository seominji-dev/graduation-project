/**
 * 통계 유틸리티 함수 모듈
 *
 * 외부 라이브러리 없이 순수 JavaScript로 구현
 * - 기술통계: 평균, 표준편차, 최솟값, 최댓값
 * - 95% 신뢰구간 (t분포 근사)
 * - 대응표본 t-검정 (paired t-test)
 * - Cohen's d 효과크기
 */

// t분포 임계값 (양측 검정 95% 신뢰수준)
// 자유도별 t(0.025) 값 (df = 1~30, 40, 60, 120, Infinity)
const T_CRITICAL_TABLE = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
  40: 2.021, 60: 2.000, 120: 1.980,
  Infinity: 1.960
};

/**
 * 자유도에 해당하는 t 임계값 반환
 * @param {number} df - 자유도
 * @returns {number} t 임계값 (양측 0.05)
 */
function getTCritical(df) {
  if (T_CRITICAL_TABLE[df]) return T_CRITICAL_TABLE[df];
  // 테이블에 없는 df는 가장 가까운 값 보간
  const keys = Object.keys(T_CRITICAL_TABLE).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (df > keys[i] && df < keys[i + 1]) {
      // 선형 보간
      const ratio = (df - keys[i]) / (keys[i + 1] - keys[i]);
      return T_CRITICAL_TABLE[keys[i]] * (1 - ratio) + T_CRITICAL_TABLE[keys[i + 1]] * ratio;
    }
  }
  return 1.960; // df가 매우 클 때 정규분포 근사
}

/**
 * 평균 계산
 * @param {number[]} arr - 수치 배열
 * @returns {number}
 */
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * 표준편차 계산 (표본 표준편차, n-1 보정)
 * @param {number[]} arr - 수치 배열
 * @returns {number}
 */
function stddev(arr) {
  if (arr.length <= 1) return 0;
  const avg = mean(arr);
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * 95% 신뢰구간 계산 (t분포 기반)
 * @param {number[]} arr - 수치 배열
 * @returns {{ lower: number, upper: number, mean: number, se: number }}
 */
function confidenceInterval95(arr) {
  const n = arr.length;
  if (n <= 1) return { lower: 0, upper: 0, mean: 0, se: 0 };
  const avg = mean(arr);
  const se = stddev(arr) / Math.sqrt(n);
  const df = n - 1;
  const tCrit = getTCritical(df);
  return {
    lower: parseFloat((avg - tCrit * se).toFixed(2)),
    upper: parseFloat((avg + tCrit * se).toFixed(2)),
    mean: parseFloat(avg.toFixed(2)),
    se: parseFloat(se.toFixed(2))
  };
}

/**
 * 대응표본 t-검정 (paired t-test)
 *
 * 동일 조건(같은 시드로 생성된 요청 셋)에서 두 스케줄러의 성능 차이 비교
 *
 * @param {number[]} arr1 - 스케줄러 A의 시드별 평균 대기시간
 * @param {number[]} arr2 - 스케줄러 B의 시드별 평균 대기시간
 * @returns {{ tValue: number, df: number, pValue: number, significant: boolean }}
 */
function pairedTTest(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    throw new Error('대응표본 t-검정은 동일 크기의 배열이 필요합니다');
  }
  const n = arr1.length;
  if (n <= 1) return { tValue: 0, df: 0, pValue: 1, significant: false };

  // 차이 계산
  const diffs = arr1.map((val, i) => val - arr2[i]);
  const dMean = mean(diffs);
  const dStddev = stddev(diffs);
  const se = dStddev / Math.sqrt(n);

  if (se === 0) return { tValue: 0, df: n - 1, pValue: 1, significant: false };

  const tValue = dMean / se;
  const df = n - 1;
  const absT = Math.abs(tValue);

  // p-value 근사 (t분포에서의 양측 검정)
  // 자유도별 임계값으로 구간 판정
  let pValue;
  const tCrit005 = getTCritical(df); // 약 2.262 (df=9)

  // 더 세밀한 p-value 근사를 위한 추가 임계값
  // df=9: t(0.05)=1.833, t(0.025)=2.262, t(0.01)=2.821, t(0.005)=3.250
  const pValueThresholds = getPValueThresholds(df);

  if (absT < pValueThresholds.t10) {
    pValue = 0.5; // p > 0.10
  } else if (absT < pValueThresholds.t05) {
    pValue = 0.10;
  } else if (absT < pValueThresholds.t025) {
    pValue = 0.05;
  } else if (absT < pValueThresholds.t01) {
    pValue = 0.025;
  } else if (absT < pValueThresholds.t005) {
    pValue = 0.01;
  } else {
    pValue = 0.001;
  }

  return {
    tValue: parseFloat(tValue.toFixed(4)),
    df,
    pValue,
    significant: pValue < 0.05
  };
}

/**
 * 자유도별 p-value 판정용 임계값 반환
 */
function getPValueThresholds(df) {
  // t분포 임계값 테이블 (양측 검정)
  // 각 p-value에 해당하는 |t| 임계값
  const tables = {
    // df: { t10: p=0.10, t05: p=0.05, t025: p=0.025, t01: p=0.01, t005: p=0.005 }
    1: { t10: 3.078, t05: 6.314, t025: 12.706, t01: 31.821, t005: 63.657 },
    2: { t10: 1.886, t05: 2.920, t025: 4.303, t01: 6.965, t005: 9.925 },
    3: { t10: 1.638, t05: 2.353, t025: 3.182, t01: 4.541, t005: 5.841 },
    4: { t10: 1.533, t05: 2.132, t025: 2.776, t01: 3.747, t005: 4.604 },
    5: { t10: 1.476, t05: 2.015, t025: 2.571, t01: 3.365, t005: 4.032 },
    6: { t10: 1.440, t05: 1.943, t025: 2.447, t01: 3.143, t005: 3.707 },
    7: { t10: 1.415, t05: 1.895, t025: 2.365, t01: 2.998, t005: 3.499 },
    8: { t10: 1.397, t05: 1.860, t025: 2.306, t01: 2.896, t005: 3.355 },
    9: { t10: 1.383, t05: 1.833, t025: 2.262, t01: 2.821, t005: 3.250 },
    10: { t10: 1.372, t05: 1.812, t025: 2.228, t01: 2.764, t005: 3.169 },
    15: { t10: 1.341, t05: 1.753, t025: 2.131, t01: 2.602, t005: 2.947 },
    20: { t10: 1.325, t05: 1.725, t025: 2.086, t01: 2.528, t005: 2.845 },
    30: { t10: 1.310, t05: 1.697, t025: 2.042, t01: 2.457, t005: 2.750 }
  };

  if (tables[df]) return tables[df];

  // 가장 가까운 df의 값 사용
  const keys = Object.keys(tables).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - df) < Math.abs(closest - df)) {
      closest = k;
    }
  }
  return tables[closest];
}

/**
 * Cohen's d 효과크기 계산
 *
 * 해석 기준:
 * - |d| < 0.2: 무시할 수 있는 효과
 * - 0.2 ≤ |d| < 0.5: 작은 효과
 * - 0.5 ≤ |d| < 0.8: 중간 효과
 * - |d| ≥ 0.8: 큰 효과
 *
 * @param {number[]} arr1 - 그룹 1 데이터
 * @param {number[]} arr2 - 그룹 2 데이터
 * @returns {{ d: number, interpretation: string }}
 */
function cohensD(arr1, arr2) {
  const n1 = arr1.length;
  const n2 = arr2.length;
  if (n1 <= 1 || n2 <= 1) return { d: 0, interpretation: '계산 불가' };

  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  const sd1 = stddev(arr1);
  const sd2 = stddev(arr2);

  // Pooled standard deviation
  const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));

  if (pooledSD === 0) return { d: 0, interpretation: '분산 없음' };

  const d = (mean1 - mean2) / pooledSD;
  const absD = Math.abs(d);

  let interpretation;
  if (absD < 0.2) interpretation = '무시할 수 있는 효과 (negligible)';
  else if (absD < 0.5) interpretation = '작은 효과 (small)';
  else if (absD < 0.8) interpretation = '중간 효과 (medium)';
  else interpretation = '큰 효과 (large)';

  return {
    d: parseFloat(d.toFixed(4)),
    interpretation
  };
}

/**
 * 기술통계 요약 생성
 * @param {number[]} arr - 수치 배열
 * @returns {{ mean, stddev, min, max, ci95 }}
 */
function descriptiveStats(arr) {
  return {
    mean: parseFloat(mean(arr).toFixed(2)),
    stddev: parseFloat(stddev(arr).toFixed(2)),
    min: parseFloat(Math.min(...arr).toFixed(2)),
    max: parseFloat(Math.max(...arr).toFixed(2)),
    n: arr.length,
    ci95: confidenceInterval95(arr)
  };
}

module.exports = {
  mean,
  stddev,
  confidenceInterval95,
  pairedTTest,
  cohensD,
  descriptiveStats,
  getTCritical
};
