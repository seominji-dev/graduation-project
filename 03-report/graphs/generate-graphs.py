#!/usr/bin/env python3
"""
실험 결과 시각화 스크립트
Generate visualization graphs for experiment results
"""

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import json
import os

# 한글 폰트 설정 (macOS 기본 폰트)
plt.rcParams['font.family'] = ['AppleGothic', 'Malgun Gothic', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 그래프 스타일 설정
plt.style.use('seaborn-v0_8-whitegrid')
FIGURE_SIZE = (10, 6)
DPI = 150

# 데이터 로드
def load_experiment_data():
    """실험 결과 데이터 로드"""
    data_path = os.path.join(os.path.dirname(__file__), '../../02-implementation/experiments-simple/comprehensive-results.json')
    with open(data_path, 'r') as f:
        return json.load(f)

# 1. 대기 시간 비교 막대 그래프
def plot_wait_time_comparison(data):
    """기본 실험 대기 시간 비교"""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)

    basic = data['experiments']['basic']
    schedulers = ['FCFS', 'Priority', 'MLFQ', 'WFQ']
    wait_times = [
        float(basic['fcfs']['avgWaitTime']),
        float(basic['priority']['avgWaitTime']),
        float(basic['mlfq']['avgWaitTime']),
        float(basic['wfq']['avgWaitTime'])
    ]

    colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
    bars = ax.bar(schedulers, wait_times, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)

    # 값 라벨 추가
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.1f}ms',
                ha='center', va='bottom', fontsize=11, fontweight='bold')

    ax.set_ylabel('평균 대기 시간 (ms)', fontsize=13, fontweight='bold')
    ax.set_xlabel('스케줄러', fontsize=13, fontweight='bold')
    ax.set_title('스케줄러별 평균 대기 시간 비교 (기본 실험, 100개 요청)', fontsize=14, fontweight='bold', pad=20)
    ax.set_ylim(0, max(wait_times) * 1.15)
    ax.grid(axis='y', alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'wait-time-comparison.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: wait-time-comparison.png")

# 2. 처리량 비교 막대 그래프
def plot_throughput_comparison(data):
    """처리량 비교"""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)

    basic = data['experiments']['basic']
    schedulers = ['FCFS', 'Priority', 'MLFQ', 'WFQ']
    throughputs = [
        float(basic['fcfs']['throughput']),
        float(basic['priority']['throughput']),
        float(basic['mlfq']['throughput']),
        float(basic['wfq']['throughput'])
    ]

    colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
    bars = ax.bar(schedulers, throughputs, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)

    # 값 라벨 추가
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f} req/s',
                ha='center', va='bottom', fontsize=11, fontweight='bold')

    ax.set_ylabel('처리량 (requests/second)', fontsize=13, fontweight='bold')
    ax.set_xlabel('스케줄러', fontsize=13, fontweight='bold')
    ax.set_title('스케줄러별 처리량 비교 (기본 실험, 100개 요청)', fontsize=14, fontweight='bold', pad=20)
    ax.set_ylim(0, max(throughputs) * 1.15)
    ax.grid(axis='y', alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'throughput-comparison.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: throughput-comparison.png")

# 3. WFQ 공정성 지수 막대 그래프
def plot_fairness_index(data):
    """WFQ 공정성 지수"""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)

    basic = data['experiments']['basic']
    fairness = float(basic['wfq']['fairnessIndex'])

    # 목표치 비교 막대
    categories = ['본 시스템\nWFQ', '목표치\n(Target)']
    values = [fairness, 0.95]
    colors = ['#f39c12', '#27ae60']

    bars = ax.bar(categories, values, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)

    # 값 라벨 추가
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.4f}',
                ha='center', va='bottom', fontsize=12, fontweight='bold')

    # 목표치 선 추가
    ax.axhline(y=0.95, color='green', linestyle='--', linewidth=2, alpha=0.5)
    ax.text(0.5, 0.96, '목표 달성', color='green', fontsize=10, fontweight='bold', ha='center')

    ax.set_ylabel("Jain's Fairness Index", fontsize=13, fontweight='bold')
    ax.set_xlabel('범주', fontsize=13, fontweight='bold')
    ax.set_title("WFQ 공정성 지수 (Jain's Fairness Index)", fontsize=14, fontweight='bold', pad=20)
    ax.set_ylim(0, 1.0)
    ax.grid(axis='y', alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'wfq-fairness-index.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: wfq-fairness-index.png")

# 4. 혼합 작업 부하 대기 시간 비교
def plot_mixed_workload_comparison(data):
    """혼합 작업 부하 대기 시간 비교"""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)

    mixed = data['experiments']['mixedWorkload']
    fcfs_wait = float(mixed['fcfs']['avgWaitTime'])
    mlfq_wait = float(mixed['mlfq']['avgWaitTime'])

    categories = ['FCFS', 'MLFQ']
    wait_times = [fcfs_wait, mlfq_wait]
    colors = ['#3498db', '#2ecc71']

    bars = ax.bar(categories, wait_times, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)

    # 값 라벨 추가
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.1f}ms',
                ha='center', va='bottom', fontsize=11, fontweight='bold')

    # 개선율 표시
    improvement = 0.0  # MLFQ와 FCFS가 동일함
    ax.text(0.5, max(wait_times) * 0.9,
            f'개선율: {improvement:.1f}%',
            ha='center', fontsize=12, fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    ax.set_ylabel('평균 대기 시간 (ms)', fontsize=13, fontweight='bold')
    ax.set_xlabel('스케줄러', fontsize=13, fontweight='bold')
    ax.set_title('혼합 작업 부하 대기 시간 비교\n(Short: 33개, Medium: 44개, Long: 23개)',
                 fontsize=14, fontweight='bold', pad=20)
    ax.set_ylim(0, max(wait_times) * 1.15)
    ax.grid(axis='y', alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'mixed-workload-comparison.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: mixed-workload-comparison.png")

# 5. 혼합 작업 부하 카테고리별 분석
def plot_mixed_workload_category_analysis(data):
    """혼합 작업 부하 카테고리별 분석"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    mixed = data['experiments']['mixedWorkload']['fcfs']['categoryWaitTimes']

    categories = ['Short\n(50-300ms)', 'Medium\n(500-1500ms)', 'Long\n(2000-5000ms)']
    avg_wait = [
        mixed['short']['avgWaitTime'],
        mixed['medium']['avgWaitTime'],
        mixed['long']['avgWaitTime']
    ]
    avg_process = [
        mixed['short']['avgProcessingTime'],
        mixed['medium']['avgProcessingTime'],
        mixed['long']['avgProcessingTime']
    ]

    # 왼쪽: 평균 대기 시간
    colors1 = ['#2ecc71', '#f39c12', '#e74c3c']
    bars1 = ax1.bar(categories, avg_wait, color=colors1, alpha=0.8, edgecolor='black', linewidth=1.5)

    for bar in bars1:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                 f'{height:.0f}ms', ha='center', va='bottom', fontsize=10, fontweight='bold')

    ax1.set_ylabel('평균 대기 시간 (ms)', fontsize=12, fontweight='bold')
    ax1.set_title('카테고리별 평균 대기 시간', fontsize=13, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3, linestyle='--')

    # 오른쪽: 평균 처리 시간
    colors2 = ['#27ae60', '#f39c12', '#c0392b']
    bars2 = ax2.bar(categories, avg_process, color=colors2, alpha=0.8, edgecolor='black', linewidth=1.5)

    for bar in bars2:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                 f'{height:.0f}ms', ha='center', va='bottom', fontsize=10, fontweight='bold')

    ax2.set_ylabel('평균 처리 시간 (ms)', fontsize=12, fontweight='bold')
    ax2.set_title('카테고리별 평균 처리 시간', fontsize=13, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3, linestyle='--')

    plt.suptitle('혼합 작업 부하 카테고리별 분석', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'mixed-workload-category-analysis.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: mixed-workload-category-analysis.png")

# 6. 코드 커버리지 막대 그래프
def plot_code_coverage():
    """코드 커버리지"""
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)

    categories = ['Statements\n(문장)', 'Branches\n(분기)', 'Functions\n(함수)', 'Lines\n(라인)']
    coverage = [98.65, 85.43, 95.94, 98.29]
    target = [85, 85, 90, 85]

    x = np.arange(len(categories))
    width = 0.35

    bars1 = ax.bar(x - width/2, coverage, width, label='실제 커버리지', color='#2ecc71', alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, target, width, label='목표 커버리지', color='#95a5a6', alpha=0.6, edgecolor='black', linewidth=1.5)

    # 값 라벨 추가
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}%', ha='center', va='bottom', fontsize=10, fontweight='bold')

    ax.set_ylabel('커버리지 (%)', fontsize=13, fontweight='bold')
    ax.set_title('테스트 코드 커버리지 (69개 테스트, 100% 통과)', fontsize=14, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend(fontsize=11)
    ax.set_ylim(0, 100)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.axhline(y=85, color='red', linestyle='--', linewidth=1, alpha=0.5)
    ax.text(3.5, 86, '최소 목표 (85%)', color='red', fontsize=9, ha='right')

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'code-coverage.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: code-coverage.png")

# 7. 스케줄러 특성 비교 레이더 차트
def plot_scheduler_radar_chart(data):
    """스케줄러 특성 비교 레이더 차트"""
    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))

    categories = ['공정성\n(Fairness)', '응답성\n(Responsiveness)', '처리량\n(Throughput)', '기아 방지\n(Starvation)', '구현 복잡도\n(Simplicity)']

    # 각 스케줄러의 특성 점수 (1-5)
    schedulers = {
        'FCFS': [2, 1, 4, 1, 5],
        'Priority': [2, 4, 4, 2, 4],
        'MLFQ': [3, 5, 4, 4, 2],
        'WFQ': [5, 3, 4, 5, 2]
    }

    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]
    categories_closed = categories + categories[:1]

    colors = {'FCFS': '#3498db', 'Priority': '#e74c3c', 'MLFQ': '#2ecc71', 'WFQ': '#f39c12'}

    for scheduler, values in schedulers.items():
        values_closed = values + values[:1]
        ax.plot(angles, values_closed, 'o-', linewidth=2, label=scheduler, color=colors[scheduler])
        ax.fill(angles, values_closed, alpha=0.15, color=colors[scheduler])

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11)
    ax.set_ylim(0, 5)
    ax.set_yticks([1, 2, 3, 4, 5])
    ax.set_yticklabels(['1', '2', '3', '4', '5'], fontsize=9)
    ax.grid(True, linestyle='--', alpha=0.7)
    ax.set_title('4가지 스케줄러 특성 비교 (점수: 1-5)', fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=11)

    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(__file__), 'scheduler-radar-comparison.png'), dpi=DPI, bbox_inches='tight')
    plt.close()
    print("✓ 생성 완료: scheduler-radar-comparison.png")

# 메인 실행 함수
def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("LLM Request Scheduler - 실험 결과 시각화")
    print("=" * 60)
    print()

    try:
        # 데이터 로드
        print("1. 실험 데이터 로드 중...")
        data = load_experiment_data()
        print(f"   ✓ {len(data['experiments'])}개 실험 데이터 로드 완료")
        print()

        # 그래프 생성
        print("2. 그래프 생성 중...")
        plot_wait_time_comparison(data)
        plot_throughput_comparison(data)
        plot_fairness_index(data)
        plot_mixed_workload_comparison(data)
        plot_mixed_workload_category_analysis(data)
        plot_code_coverage()
        plot_scheduler_radar_chart(data)
        print()

        print("=" * 60)
        print("✓ 모든 그래프 생성 완료!")
        print(f"  저장 위치: {os.path.dirname(__file__)}")
        print("=" * 60)

    except FileNotFoundError as e:
        print(f"  ✗ 오류: 실험 데이터 파일을 찾을 수 없습니다.")
        print(f"    경로: {e.filename}")
    except Exception as e:
        print(f"  ✗ 오류: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
