#!/usr/bin/env python3
"""
발표용 차트 이미지 생성 스크립트
matplotlib을 사용하여 시각화 차트를 PNG 이미지로 생성
"""

import json
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
from pathlib import Path

# 한글 폰트 설정 (macOS)
plt.rcParams['font.family'] = ['AppleGothic', 'Malgun Gothic', 'NanumGothic']
plt.rcParams['axes.unicode_minus'] = False

# 색상 팔레트 (Professional Presentation Theme)
COLORS = {
    'FCFS': '#3498db',      # Blue
    'Priority': '#e74c3c',  # Red
    'MLFQ': '#2ecc71',      # Green
    'WFQ': '#9b59b6',       # Purple
    'Enterprise': '#2c3e50',
    'Premium': '#3498db',
    'Standard': '#95a5a6',
    'Free': '#bdc3c7'
}

# 출력 디렉토리
OUTPUT_DIR = Path(__file__).parent / 'images'
OUTPUT_DIR.mkdir(exist_ok=True)

def load_json(filename):
    """JSON 데이터 로드"""
    data_path = Path(__file__).parent / 'data' / filename
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_performance_comparison_chart(data):
    """성능 비교 차트 생성 (평균 대기 시간 & 처리량)"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    schedulers = [d['scheduler'] for d in data]
    avg_wait = [d['avgWaitTime'] for d in data]
    throughput = [d['throughput'] for d in data]

    # 왼쪽: 평균 대기 시간
    bars1 = ax1.bar(schedulers, avg_wait, color=[COLORS[s] for s in schedulers])
    ax1.set_ylabel('Average Wait Time (ms)', fontsize=12, fontweight='bold')
    ax1.set_title('Average Wait Time Comparison', fontsize=14, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3)

    # 값 라벨 추가
    for bar in bars1:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.0f}', ha='center', va='bottom', fontsize=10)

    # 오른쪽: 처리량
    bars2 = ax2.bar(schedulers, throughput, color=[COLORS[s] for s in schedulers])
    ax2.set_ylabel('Throughput (requests/sec)', fontsize=12, fontweight='bold')
    ax2.set_title('Throughput Comparison', fontsize=14, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3)

    for bar in bars2:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}', ha='center', va='bottom', fontsize=10)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'performance_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: performance_comparison.png")

def create_fairness_index_chart(data):
    """Jain's Fairness Index 차트 생성"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # 왼쪽: 테넌트별 JFI
    tenants = [t['tier'] for t in data['individual_tenants']]
    jfi_values = [t['jfi'] for t in data['individual_tenants']]
    target = data['individual_tenants'][0]['target']

    x_pos = np.arange(len(tenants))
    bars1 = ax1.bar(x_pos, jfi_values, color=[COLORS[t] for t in tenants])

    ax1.axhline(y=target, color='red', linestyle='--', label=f'Target: {target}')
    ax1.set_xlabel('Tenant Tier', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Jain\'s Fairness Index', fontsize=12, fontweight='bold')
    ax1.set_title('Tenant-level Fairness Index', fontsize=14, fontweight='bold')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(tenants)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    ax1.set_ylim(0.85, 1.0)

    for bar in bars1:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}', ha='center', va='bottom', fontsize=10)

    # 오른쪽: 시스템 수준 JFI
    system_jfi = data['system_level']['overall_jfi']
    normalized_jfi = data['system_level']['normalized_jfi']
    system_target = data['system_level']['target']

    metrics = ['Overall\nJFI', 'Normalized\nJFI']
    values = [system_jfi, normalized_jfi]

    bars2 = ax2.bar(metrics, values, color=['#e74c3c', '#2ecc71'])
    ax2.axhline(y=system_target, color='blue', linestyle='--', label=f'Target: {system_target}')
    ax2.set_ylabel('Jain\'s Fairness Index', fontsize=12, fontweight='bold')
    ax2.set_title('System-level Fairness Index', fontsize=14, fontweight='bold')
    ax2.legend()
    ax2.grid(axis='y', alpha=0.3)
    ax2.set_ylim(0.8, 1.0)

    for bar in bars2:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}', ha='center', va='bottom', fontsize=10)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'fairness_index.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: fairness_index.png")

def create_throughput_distribution_chart(data):
    """테넌트별 처리량 분포 차트 생성"""
    fig, ax = plt.subplots(figsize=(10, 6))

    tiers = [d['tier'] for d in data]
    weights = [d['weight'] for d in data]
    throughput = [d['throughput'] for d in data]

    x_pos = np.arange(len(tiers))

    # 이중 Y축: 가중치와 처리량
    ax1 = ax
    ax2 = ax.twinx()

    bars1 = ax1.bar(x_pos - 0.2, weights, 0.4, label='Weight',
                    color=[COLORS[t] for t in tiers], alpha=0.7)
    bars2 = ax2.bar(x_pos + 0.2, throughput, 0.4, label='Throughput',
                    color=[COLORS[t] for t in tiers], alpha=0.9)

    ax1.set_xlabel('Tenant Tier', fontsize=12, fontweight='bold')
    ax1.set_ylabel('WFQ Weight', fontsize=12, fontweight='bold', color='#2c3e50')
    ax2.set_ylabel('Actual Throughput', fontsize=12, fontweight='bold', color='#2c3e50')
    ax1.set_title('Tenant Throughput Distribution by Weight', fontsize=14, fontweight='bold')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(tiers)

    # 범례
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')

    ax1.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'throughput_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: throughput_distribution.png")

def create_wait_time_comparison_chart(data):
    """FCFS vs WFQ 대기 시간 비교 차트"""
    fig, ax = plt.subplots(figsize=(12, 6))

    tiers = [d['tier'] for d in data]
    fcfs_wait = [d['fcfs_wait_time'] for d in data]
    wfq_wait = [d['wfq_wait_time'] for d in data]

    x_pos = np.arange(len(tiers))
    width = 0.35

    bars1 = ax.bar(x_pos - width/2, fcfs_wait, width, label='FCFS',
                   color=COLORS['FCFS'], alpha=0.8)
    bars2 = ax.bar(x_pos + width/2, wfq_wait, width, label='WFQ',
                   color=COLORS['WFQ'], alpha=0.8)

    ax.set_xlabel('Tenant Tier', fontsize=12, fontweight='bold')
    ax.set_ylabel('Average Wait Time (ms)', fontsize=12, fontweight='bold')
    ax.set_title('Wait Time Comparison: FCFS vs WFQ', fontsize=14, fontweight='bold')
    ax.set_xticks(x_pos)
    ax.set_xticklabels(tiers)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    # 개선 퍼센트 표시
    for i, (fcfs, wfq) in enumerate(zip(fcfs_wait, wfq_wait)):
        improvement = ((fcfs - wfq) / fcfs) * 100
        ax.annotate(f'{improvement:+.1f}%',
                    xy=(i + width/2, wfq),
                    xytext=(i + width/2, wfq + 100),
                    ha='center', fontsize=9, fontweight='bold',
                    color='green' if improvement > 0 else 'red',
                    arrowprops=dict(arrowstyle='->', color='green' if improvement > 0 else 'red'))

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'wait_time_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: wait_time_comparison.png")

def create_starvation_prevention_chart(data):
    """기아 방지 검증 차트"""
    fig, ax = plt.subplots(figsize=(12, 6))

    algorithms = [d['algorithm'] for d in data]
    max_wait = []
    for d in data:
        if d['max_wait_time'] == float('inf'):
            max_wait.append(3000)  # 무한대를 시각화를 위해 3000으로 설정
        else:
            max_wait.append(d['max_wait_time'])

    served = [1 if d['free_served'] else 0 for d in data]
    colors = ['green' if s == 1 else 'red' for s in served]

    x_pos = np.arange(len(algorithms))
    bars = ax.barh(x_pos, max_wait, color=colors, alpha=0.7)

    ax.set_yticks(x_pos)
    ax.set_yticklabels(algorithms)
    ax.set_xlabel('Maximum Wait Time (ms)', fontsize=12, fontweight='bold')
    ax.set_title('Starvation Prevention Verification', fontsize=14, fontweight='bold')
    ax.grid(axis='x', alpha=0.3)

    # 기아 방지 상태 표시
    for i, (bar, d) in enumerate(zip(bars, data)):
        status = "✓ Prevented" if d['free_served'] else "✗ Starvation"
        ax.text(max_wait[i] + 100, i, status, va='center', fontsize=10, fontweight='bold')

    # 범례
    from matplotlib.patches import Patch
    legend_elements = [Patch(facecolor='green', alpha=0.7, label='Free Tier Served'),
                       Patch(facecolor='red', alpha=0.7, label='Free Tier Starved')]
    ax.legend(handles=legend_elements, loc='lower right')

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'starvation_prevention.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: starvation_prevention.png")

def create_mixed_workload_chart(data):
    """혼합 워크로드 분석 차트"""
    fig, ax = plt.subplots(figsize=(12, 6))

    categories = [d['category'] for d in data]
    fcfs_wait = [d['fcfs_avg_wait'] for d in data]
    mlfq_wait = [d['mlfq_avg_wait'] for d in data]

    x_pos = np.arange(len(categories))
    width = 0.35

    bars1 = ax.bar(x_pos - width/2, fcfs_wait, width, label='FCFS',
                   color=COLORS['FCFS'], alpha=0.8)
    bars2 = ax.bar(x_pos + width/2, mlfq_wait, width, label='MLFQ',
                   color=COLORS['MLFQ'], alpha=0.8)

    ax.set_xlabel('Job Category (by Processing Time)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Average Wait Time (ms)', fontsize=12, fontweight='bold')
    ax.set_title('Mixed Workload Analysis: FCFS vs MLFQ', fontsize=14, fontweight='bold')
    ax.set_xticks(x_pos)
    ax.set_xticklabels(categories)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    # 값 라벨
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.0f}', ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'mixed_workload_analysis.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: mixed_workload_analysis.png")

def create_comprehensive_summary_chart():
    """종합 요약 차트: 모든 알고리즘의 핵심 지표"""
    # 데이터 로드
    perf_data = load_json('performance_comparison.json')
    wait_data = load_json('wait_time_comparison.json')

    fig = plt.figure(figsize=(16, 10))
    gs = fig.add_gridspec(2, 2, hspace=0.3, wspace=0.3)

    # 1. 평균 대기 시간 비교
    ax1 = fig.add_subplot(gs[0, 0])
    schedulers = [d['scheduler'] for d in perf_data]
    avg_wait = [d['avgWaitTime'] for d in perf_data]
    bars = ax1.bar(schedulers, avg_wait, color=[COLORS[s] for s in schedulers])
    ax1.set_ylabel('Average Wait Time (ms)', fontweight='bold')
    ax1.set_title('Average Wait Time by Scheduler', fontweight='bold', fontsize=12)
    ax1.grid(axis='y', alpha=0.3)

    # 2. 처리량 비교
    ax2 = fig.add_subplot(gs[0, 1])
    throughput = [d['throughput'] for d in perf_data]
    bars = ax2.bar(schedulers, throughput, color=[COLORS[s] for s in schedulers])
    ax2.set_ylabel('Throughput (req/sec)', fontweight='bold')
    ax2.set_title('Throughput by Scheduler', fontweight='bold', fontsize=12)
    ax2.grid(axis='y', alpha=0.3)

    # 3. 테넌트별 대기 시간 개선 (WFQ vs FCFS)
    ax3 = fig.add_subplot(gs[1, :])
    tiers = [d['tier'] for d in wait_data]
    fcfs_wait = [d['fcfs_wait_time'] for d in wait_data]
    wfq_wait = [d['wfq_wait_time'] for d in wait_data]

    x_pos = np.arange(len(tiers))
    width = 0.35

    bars1 = ax3.bar(x_pos - width/2, fcfs_wait, width, label='FCFS',
                    color=COLORS['FCFS'], alpha=0.8)
    bars2 = ax3.bar(x_pos + width/2, wfq_wait, width, label='WFQ',
                    color=COLORS['WFQ'], alpha=0.8)

    ax3.set_xlabel('Tenant Tier', fontweight='bold')
    ax3.set_ylabel('Average Wait Time (ms)', fontweight='bold')
    ax3.set_title('Wait Time by Tenant Tier: FCFS vs WFQ', fontweight='bold', fontsize=12)
    ax3.set_xticks(x_pos)
    ax3.set_xticklabels(tiers)
    ax3.legend()
    ax3.grid(axis='y', alpha=0.3)

    # 개선 퍼센트 표시
    for i, (fcfs, wfq) in enumerate(zip(fcfs_wait, wfq_wait)):
        improvement = ((fcfs - wfq) / fcfs) * 100
        ax3.text(i + width/2, wfq + 150, f'{improvement:+.1f}%',
                ha='center', fontsize=9, fontweight='bold',
                color='green' if improvement > 0 else 'red')

    plt.savefig(OUTPUT_DIR / 'comprehensive_summary.png', dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: comprehensive_summary.png")

def generate_all_charts():
    """모든 차트 이미지 생성"""
    print("차트 이미지 생성 시작...")

    # 데이터 로드
    perf_data = load_json('performance_comparison.json')
    fairness_data = load_json('jains_fairness_index.json')
    throughput_data = load_json('tenant_throughput_distribution.json')
    wait_data = load_json('wait_time_comparison.json')
    starvation_data = load_json('starvation_prevention.json')
    workload_data = load_json('mixed_workload_analysis.json')

    # 차트 생성
    create_performance_comparison_chart(perf_data)
    create_fairness_index_chart(fairness_data)
    create_throughput_distribution_chart(throughput_data)
    create_wait_time_comparison_chart(wait_data)
    create_starvation_prevention_chart(starvation_data)
    create_mixed_workload_chart(workload_data)
    create_comprehensive_summary_chart()

    print(f"\n모든 차트가 {OUTPUT_DIR} 디렉토리에 저장되었습니다!")

if __name__ == '__main__':
    generate_all_charts()
