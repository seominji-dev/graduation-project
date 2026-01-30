/**
 * Global Jest Teardown
 * Ensures all async resources are properly cleaned up
 *
 * 이 teardown 함수는 테스트 실행 후 모든 비동기 리소스를 정리합니다.
 * BullMQ Worker 프로세스의 정상 종료를 보장하고,
 * 열려 있는 핸들과 타이머를 정리하여 경고를 방지합니다.
 */
module.exports = async () => {
  // Give workers time to close gracefully
  // Worker의 graceful shutdown을 위해 충분한 대기 시간 제공
  await new Promise(resolve => setTimeout(resolve, 500));

  // Force garbage collection if available
  // 메모리 누수 방지를 위해 가비지 컬렉션 실행
  if (global.gc) {
    global.gc();
  }

  // Clear any remaining intervals/timeouts
  // 남아있는 타이머 정리 (Worker의 내부 타이머 포함)
  const maxWait = 2000;
  const start = Date.now();

  // Wait for all async operations to complete
  // 또는 최대 대기 시간까지 기다림
  while (Date.now() - start < maxWait) {
    // Brief pause to allow event loop to process pending callbacks
    await new Promise(resolve => setImmediate(resolve));
  }
};
