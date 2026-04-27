/**
 * Ollama LLM 클라이언트
 * 로컬 Ollama 서버와 통신
 *
 * 사용법:
 * 1. Ollama 설치: https://ollama.ai
 * 2. 모델 다운로드: ollama pull gemma4:e4b
 * 3. 서버 실행: ollama serve
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';

class OllamaClient {
  constructor(baseUrl = OLLAMA_BASE_URL, model = DEFAULT_MODEL) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * LLM에 프롬프트 전송 및 응답 받기
   * @param {string} prompt - 사용자 프롬프트
   * @param {Object} options - 추가 옵션
   * @param {number} options.timeout - 타임아웃 (밀리초, 기본 30초)
   * @returns {Promise<string>} LLM 응답 텍스트
   */
  async generate(prompt, options = {}) {
    const url = `${this.baseUrl}/api/generate`;
    const timeoutMs = options.timeout || 30000;

    const body = {
      model: options.model || this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 512
      }
    };

    // AbortController로 타임아웃 구현 (FR-1.2.1)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama API 에러: ${response.status}`);
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      // 타임아웃 처리
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${timeoutMs}ms 이내에 응답이 없습니다`);
      }
      // Ollama 서버가 실행 중이 아닌 경우 Mock 응답 반환
      if (error.cause?.code === 'ECONNREFUSED') {
        console.warn('Ollama 서버에 연결할 수 없습니다. Mock 응답을 반환합니다.');
        return this.mockResponse(prompt);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Ollama 서버 상태 확인
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   * @returns {Promise<Array>}
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  /**
   * Mock 응답 생성 (테스트/데모용)
   * @param {string} prompt
   * @returns {string}
   */
  mockResponse(prompt) {
    const responses = [
      '이것은 테스트 응답입니다.',
      '요청이 성공적으로 처리되었습니다.',
      `입력하신 "${prompt.slice(0, 20)}..."에 대한 응답입니다.`,
      'LLM 스케줄러 데모 응답입니다.'
    ];
    // 간단한 랜덤 선택
    const idx = Math.floor(Math.random() * responses.length);
    return responses[idx];
  }
}

module.exports = OllamaClient;
