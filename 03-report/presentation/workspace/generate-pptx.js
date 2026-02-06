const PptxGenJS = require("pptxgenjs");

// ============================================
// LLM Scheduler Graduation Presentation
// 24 Slides - OS Scheduling for LLM API
// ============================================

const pptx = new PptxGenJS();

// Presentation settings
pptx.layout = "LAYOUT_16x9";
pptx.title = "OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러";
pptx.author = "서민지";
pptx.company = "홍익대학교";

// Color palette
const colors = {
	primary: "1e3a5f", // Deep Navy
	accent: "22d3ee", // Cyan
	bgDark: "0f172a", // Dark background
	bgLight: "1e293b", // Lighter background
	text: "ffffff", // White text
	textMuted: "94a3b8", // Muted text
	success: "22c55e", // Green
	warning: "f59e0b", // Orange
	danger: "ef4444", // Red
	purple: "8b5cf6", // Purple
};

// Common styles
const titleStyle = {
	fontSize: 32,
	fontFace: "Arial",
	color: colors.text,
	bold: true,
};
const subtitleStyle = { fontSize: 18, fontFace: "Arial", color: colors.accent };
const bodyStyle = { fontSize: 14, fontFace: "Arial", color: colors.text };
const bulletStyle = { fontSize: 13, fontFace: "Arial", color: colors.text };

// Helper: Add background
function addBg(slide) {
	slide.background = { color: colors.bgDark };
}

// Helper: Add header bar
function addHeader(slide, title, subtitle = null) {
	slide.addShape("rect", {
		x: 0,
		y: 0,
		w: "100%",
		h: 0.8,
		fill: { color: colors.primary },
	});
	slide.addText(title, {
		x: 0.5,
		y: 0.2,
		w: 9,
		h: 0.5,
		...titleStyle,
		fontSize: 24,
	});
	if (subtitle) {
		slide.addText(subtitle, {
			x: 0.5,
			y: 0.55,
			w: 9,
			h: 0.3,
			...subtitleStyle,
			fontSize: 12,
		});
	}
}

// Helper: Add footer
function addFooter(slide, pageNum) {
	slide.addText(`${pageNum} / 24`, {
		x: 9,
		y: 5.1,
		w: 0.8,
		h: 0.3,
		fontSize: 10,
		color: colors.textMuted,
		align: "right",
	});
}

// ============ SLIDE 1: Title ============
let slide1 = pptx.addSlide();
addBg(slide1);
slide1.addShape("rect", {
	x: 0,
	y: 0,
	w: "100%",
	h: "100%",
	fill: { type: "solid", color: colors.bgDark },
});
slide1.addShape("rect", {
	x: 0,
	y: 4.5,
	w: "100%",
	h: 1,
	fill: { color: colors.primary },
});
slide1.addText("OS 스케줄링 알고리즘을 활용한\nLLM API 요청 최적화 스케줄러", {
	x: 0.5,
	y: 1.5,
	w: 9,
	h: 1.5,
	fontSize: 36,
	fontFace: "Arial",
	color: colors.text,
	bold: true,
	align: "center",
	valign: "middle",
});
slide1.addText("운영체제 이론의 현대 AI 시스템 적용", {
	x: 0.5,
	y: 3.2,
	w: 9,
	h: 0.5,
	fontSize: 18,
	fontFace: "Arial",
	color: colors.accent,
	align: "center",
});
slide1.addText("홍익대학교 C235180 서민지", {
	x: 0.5,
	y: 4.65,
	w: 4,
	h: 0.35,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.text,
	valign: "middle",
});
slide1.addText("2026년 졸업프로젝트", {
	x: 5.5,
	y: 4.65,
	w: 4,
	h: 0.35,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.text,
	align: "right",
	valign: "middle",
});

// ============ SLIDE 2: Agenda ============
let slide2 = pptx.addSlide();
addBg(slide2);
addHeader(slide2, "목차", "Agenda");
const agenda = [
	"1. 문제 제기 및 연구 배경",
	"2. 해결 방안: OS 스케줄링 알고리즘 적용",
	"3. 시스템 설계 및 아키텍처",
	"4. 구현 상세",
	"5. 실험 결과 및 평가",
	"6. 데모",
	"7. 결론 및 향후 계획",
];
agenda.forEach((item, i) => {
	slide2.addText(item, {
		x: 1.5,
		y: 1.2 + i * 0.5,
		w: 7,
		h: 0.45,
		fontSize: 18,
		fontFace: "Arial",
		color: colors.text,
	});
});
addFooter(slide2, 2);

// ============ SLIDE 3: Problem Statement ============
let slide3 = pptx.addSlide();
addBg(slide3);
addHeader(slide3, "LLM API 사용 환경의 문제점");
slide3.addText("다중 사용자 LLM API 환경에서 발생하는 문제들", {
	x: 0.5,
	y: 1.0,
	w: 9,
	h: 0.4,
	fontSize: 16,
	fontFace: "Arial",
	color: colors.accent,
});
const problems = [
	{
		icon: "💰",
		title: "비용 폭증",
		desc: "무분별한 API 요청으로 예산 초과",
		color: colors.danger,
	},
	{
		icon: "⏱️",
		title: "응답 지연",
		desc: "대기열 관리 부재로 불규칙한 응답 시간",
		color: colors.warning,
	},
	{
		icon: "⚖️",
		title: "공정성 부재",
		desc: "긴급 요청도 대량 작업 뒤에서 대기",
		color: colors.purple,
	},
	{
		icon: "♻️",
		title: "자원 낭비",
		desc: "우선순위 없는 비효율적 처리",
		color: colors.textMuted,
	},
];
problems.forEach((p, i) => {
	const y = 1.6 + i * 0.85;
	slide3.addShape("rect", {
		x: 0.5,
		y: y,
		w: 9,
		h: 0.75,
		fill: { color: colors.bgLight },
		line: { color: p.color, width: 1 },
	});
	slide3.addText(p.title, {
		x: 0.7,
		y: y + 0.1,
		w: 2,
		h: 0.3,
		fontSize: 15,
		fontFace: "Arial",
		color: p.color,
		bold: true,
	});
	slide3.addText(p.desc, {
		x: 0.7,
		y: y + 0.4,
		w: 8.5,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	});
});
addFooter(slide3, 3);

// ============ SLIDE 4: Scenario ============
let slide4 = pptx.addSlide();
addBg(slide4);
addHeader(slide4, "실제 문제 시나리오");
slide4.addText("시나리오:", {
	x: 0.5,
	y: 1.0,
	w: 4,
	h: 0.35,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const scenarios = [
	{
		user: "사용자 A",
		task: "긴급 고객 문의 응답",
		priority: "URGENT",
		color: colors.danger,
	},
	{
		user: "사용자 B",
		task: "대량 데이터 분석 100건",
		priority: "LOW",
		color: colors.textMuted,
	},
	{
		user: "사용자 C",
		task: "일반 채팅",
		priority: "NORMAL",
		color: colors.accent,
	},
];
scenarios.forEach((s, i) => {
	slide4.addText(`• ${s.user}: ${s.task} (${s.priority})`, {
		x: 0.7,
		y: 1.4 + i * 0.4,
		w: 8,
		h: 0.35,
		fontSize: 13,
		fontFace: "Arial",
		color: s.color,
	});
});
slide4.addShape("rect", {
	x: 0.5,
	y: 2.8,
	w: 9,
	h: 1.2,
	fill: { color: colors.bgLight },
});
slide4.addText("기존 시스템 문제:", {
	x: 0.7,
	y: 2.9,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.danger,
	bold: true,
});
slide4.addText(
	"• 도착 순서대로 처리 → 긴급 요청 A가 대량 작업 B 뒤에서 장시간 대기\n• 결과: 고객 불만, 서비스 품질 저하, 비즈니스 손실",
	{
		x: 0.7,
		y: 3.2,
		w: 8.5,
		h: 0.7,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
slide4.addShape("rect", {
	x: 0.5,
	y: 4.1,
	w: 9,
	h: 0.8,
	fill: { color: "1a3d2e" },
});
slide4.addText("해결책: 스케줄링 알고리즘 적용으로 우선순위 기반 처리!", {
	x: 0.7,
	y: 4.3,
	w: 8.5,
	h: 0.4,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
addFooter(slide4, 4);

// ============ SLIDE 5: Research Question ============
let slide5 = pptx.addSlide();
addBg(slide5);
addHeader(slide5, "연구 질문");
slide5.addShape("rect", {
	x: 0.8,
	y: 1.3,
	w: 8.4,
	h: 1.2,
	fill: { color: colors.primary },
});
slide5.addText(
	'"운영체제의 검증된 스케줄링 알고리즘을\nLLM API 요청 관리에 적용하면\n효율성과 공정성을 동시에 달성할 수 있을까?"',
	{
		x: 1,
		y: 1.4,
		w: 8,
		h: 1,
		fontSize: 16,
		fontFace: "Arial",
		color: colors.text,
		align: "center",
		italic: true,
	},
);
slide5.addText("착안점:", {
	x: 0.5,
	y: 2.8,
	w: 2,
	h: 0.35,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const insights = [
	"OS에서 CPU는 한정된 자원 → LLM에서 API 호출 권한도 한정된 자원",
	"OS에서 프로세스 스케줄링 → LLM에서 요청 스케줄링",
	"수십 년간 검증된 알고리즘의 새로운 도메인 적용",
];
insights.forEach((ins, i) => {
	slide5.addText(`• ${ins}`, {
		x: 0.7,
		y: 3.2 + i * 0.45,
		w: 8.5,
		h: 0.4,
		fontSize: 13,
		fontFace: "Arial",
		color: colors.text,
	});
});
addFooter(slide5, 5);

// ============ SLIDE 6: Concept Mapping ============
let slide6 = pptx.addSlide();
addBg(slide6);
addHeader(slide6, "개념 매핑 - OS와 LLM");
const mappingData = [
	["OS 개념", "LLM 시스템 적용"],
	["프로세스", "LLM API 요청"],
	["CPU 시간", "API 호출 권한"],
	["우선순위", "사용자 등급, 요청 긴급도"],
	["스케줄링 알고리즘", "요청 처리 순서 결정"],
	["컨텍스트 스위칭", "요청 간 전환"],
];
mappingData.forEach((row, i) => {
	const y = 1.1 + i * 0.55;
	const isHeader = i === 0;
	slide6.addShape("rect", {
		x: 0.5,
		y: y,
		w: 4.2,
		h: 0.5,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide6.addShape("rect", {
		x: 4.8,
		y: y,
		w: 4.7,
		h: 0.5,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide6.addText(row[0], {
		x: 0.6,
		y: y + 0.1,
		w: 4,
		h: 0.3,
		fontSize: isHeader ? 13 : 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: isHeader,
	});
	slide6.addText(row[1], {
		x: 4.9,
		y: y + 0.1,
		w: 4.5,
		h: 0.3,
		fontSize: isHeader ? 13 : 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: isHeader,
	});
});
addFooter(slide6, 6);

// ============ SLIDE 7: 4 Algorithms ============
let slide7 = pptx.addSlide();
addBg(slide7);
addHeader(slide7, "4가지 스케줄링 알고리즘");
const algos = [
	{
		name: "FCFS",
		desc: "First-Come, First-Served\n도착 순서대로 처리 (베이스라인)",
		color: "3b82f6",
	},
	{
		name: "Priority",
		desc: "우선순위 기반 처리\nAging으로 기아 방지",
		color: "8b5cf6",
	},
	{
		name: "MLFQ",
		desc: "Multi-Level Feedback Queue\n4단계 큐, 응답성+처리량 동시 달성",
		color: colors.accent,
	},
	{
		name: "WFQ",
		desc: "Weighted Fair Queuing\n가중치 기반 공정 스케줄링",
		color: colors.success,
	},
];
algos.forEach((a, i) => {
	const x = 0.4 + (i % 2) * 4.8;
	const y = 1.1 + Math.floor(i / 2) * 1.9;
	slide7.addShape("rect", {
		x: x,
		y: y,
		w: 4.5,
		h: 1.7,
		fill: { color: colors.bgLight },
		line: { color: a.color, width: 2 },
	});
	slide7.addText(a.name, {
		x: x + 0.2,
		y: y + 0.15,
		w: 4,
		h: 0.4,
		fontSize: 18,
		fontFace: "Arial",
		color: a.color,
		bold: true,
	});
	slide7.addText(a.desc, {
		x: x + 0.2,
		y: y + 0.6,
		w: 4,
		h: 1,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	});
});
addFooter(slide7, 7);

// ============ SLIDE 8: MLFQ Detail ============
let slide8 = pptx.addSlide();
addBg(slide8);
addHeader(slide8, "MLFQ 상세 설명");
slide8.addText("5가지 규칙:", {
	x: 0.5,
	y: 1.0,
	w: 3,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const rules = [
	"Rule 1: 높은 우선순위 큐 먼저 실행",
	"Rule 2: 같은 우선순위는 Round-Robin",
	"Rule 3: 새 작업은 최고 우선순위(Q0)에서 시작",
	"Rule 4: 타임 슬라이스 초과 시 강등",
	"Rule 5: 주기적으로 모든 작업을 Q0로 Boost",
];
rules.forEach((r, i) => {
	slide8.addText(`• ${r}`, {
		x: 0.6,
		y: 1.35 + i * 0.35,
		w: 5,
		h: 0.3,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	});
});
// Queue table
const queueData = [
	["큐", "타임 퀀텀", "용도"],
	["Q0", "1초", "짧은 대화형 요청"],
	["Q1", "3초", "중간 길이 요청"],
	["Q2", "8초", "긴 요청"],
	["Q3", "무제한", "배치 작업"],
];
queueData.forEach((row, i) => {
	const y = 3.3 + i * 0.4;
	const isHeader = i === 0;
	slide8.addShape("rect", {
		x: 0.5,
		y: y,
		w: 1.5,
		h: 0.38,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide8.addShape("rect", {
		x: 2.1,
		y: y,
		w: 1.5,
		h: 0.38,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide8.addShape("rect", {
		x: 3.7,
		y: y,
		w: 2.5,
		h: 0.38,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide8.addText(row[0], {
		x: 0.6,
		y: y + 0.05,
		w: 1.3,
		h: 0.28,
		fontSize: 11,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: isHeader,
	});
	slide8.addText(row[1], {
		x: 2.2,
		y: y + 0.05,
		w: 1.3,
		h: 0.28,
		fontSize: 11,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		align: "center",
	});
	slide8.addText(row[2], {
		x: 3.8,
		y: y + 0.05,
		w: 2.3,
		h: 0.28,
		fontSize: 11,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
	});
});
// Queue diagram on right side
slide8.addShape("rect", {
	x: 6.5,
	y: 1.0,
	w: 3,
	h: 0.5,
	fill: { color: colors.danger },
	line: { color: colors.text, width: 1 },
});
slide8.addText("Q0 - 최고 우선순위", {
	x: 6.6,
	y: 1.1,
	w: 2.8,
	h: 0.3,
	fontSize: 11,
	fontFace: "Arial",
	color: colors.text,
	align: "center",
});
slide8.addShape("rect", {
	x: 6.5,
	y: 1.6,
	w: 3,
	h: 0.5,
	fill: { color: colors.warning },
	line: { color: colors.text, width: 1 },
});
slide8.addText("Q1", {
	x: 6.6,
	y: 1.7,
	w: 2.8,
	h: 0.3,
	fontSize: 11,
	fontFace: "Arial",
	color: colors.text,
	align: "center",
});
slide8.addShape("rect", {
	x: 6.5,
	y: 2.2,
	w: 3,
	h: 0.5,
	fill: { color: colors.accent },
	line: { color: colors.text, width: 1 },
});
slide8.addText("Q2", {
	x: 6.6,
	y: 2.3,
	w: 2.8,
	h: 0.3,
	fontSize: 11,
	fontFace: "Arial",
	color: colors.text,
	align: "center",
});
slide8.addShape("rect", {
	x: 6.5,
	y: 2.8,
	w: 3,
	h: 0.5,
	fill: { color: colors.success },
	line: { color: colors.text, width: 1 },
});
slide8.addText("Q3 - 최저 우선순위", {
	x: 6.6,
	y: 2.9,
	w: 2.8,
	h: 0.3,
	fontSize: 11,
	fontFace: "Arial",
	color: colors.text,
	align: "center",
});
slide8.addText("↓ 타임슬라이스 초과 시 강등", {
	x: 6.5,
	y: 3.4,
	w: 3,
	h: 0.3,
	fontSize: 10,
	fontFace: "Arial",
	color: colors.textMuted,
	align: "center",
});
slide8.addText("↑ Boost: 60초마다 Q0로", {
	x: 6.5,
	y: 3.7,
	w: 3,
	h: 0.3,
	fontSize: 10,
	fontFace: "Arial",
	color: colors.success,
	align: "center",
});
addFooter(slide8, 8);

// ============ SLIDE 9: WFQ ============
let slide9 = pptx.addSlide();
addBg(slide9);
addHeader(slide9, "WFQ와 공정성");
slide9.addShape("rect", {
	x: 0.5,
	y: 1.0,
	w: 9,
	h: 0.6,
	fill: { color: colors.primary },
});
slide9.addText(
	"Virtual Finish Time = Virtual Start Time + (Service Time / Weight)",
	{
		x: 0.6,
		y: 1.1,
		w: 8.8,
		h: 0.4,
		fontSize: 14,
		fontFace: "Courier New",
		color: colors.accent,
		align: "center",
	},
);
slide9.addText("테넌트 가중치:", {
	x: 0.5,
	y: 1.8,
	w: 3,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const tenants = [
	{ name: "Enterprise", weight: 100, color: colors.success },
	{ name: "Premium", weight: 50, color: colors.accent },
	{ name: "Standard", weight: 10, color: colors.warning },
	{ name: "Free", weight: 1, color: colors.textMuted },
];
tenants.forEach((t, i) => {
	slide9.addText(`${t.name}: ${t.weight}`, {
		x: 0.7,
		y: 2.15 + i * 0.35,
		w: 3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: t.color,
	});
});
slide9.addShape("rect", {
	x: 5,
	y: 1.8,
	w: 4.5,
	h: 2.2,
	fill: { color: colors.bgLight },
});
slide9.addText("Jain's Fairness Index", {
	x: 5.2,
	y: 1.9,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
slide9.addText(
	"J = 1.0 → 완벽한 공정성\n\n본 시스템: 0.95 이상 유지\n\n다양한 조건에서 높은\n공정성 보장",
	{
		x: 5.2,
		y: 2.3,
		w: 4,
		h: 1.5,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
addFooter(slide9, 9);

// ============ SLIDE 10: Architecture ============
let slide10 = pptx.addSlide();
addBg(slide10);
addHeader(slide10, "시스템 아키텍처");
// Layers
const layers = [
	{
		name: "API Layer",
		items: ["Request Controller", "Scheduler Factory", "Dashboard Service"],
		y: 1.0,
		color: "3b82f6",
	},
	{
		name: "Scheduler Engine",
		items: ["FCFS | Priority | MLFQ | WFQ"],
		y: 2.0,
		color: colors.accent,
	},
	{
		name: "Management Layer",
		items: ["Aging Manager", "Boost Manager", "Fairness Calculator"],
		y: 3.0,
		color: colors.purple,
	},
	{
		name: "Storage Layer",
		items: ["Memory Array (Queue)", "JSON File (Logs)", "LLM Service"],
		y: 4.0,
		color: colors.success,
	},
];
layers.forEach((layer, i) => {
	slide10.addShape("rect", {
		x: 1,
		y: layer.y,
		w: 8,
		h: 0.85,
		fill: { color: colors.bgLight },
		line: { color: layer.color, width: 2 },
	});
	slide10.addText(layer.name, {
		x: 1.2,
		y: layer.y + 0.05,
		w: 2.5,
		h: 0.35,
		fontSize: 13,
		fontFace: "Arial",
		color: layer.color,
		bold: true,
	});
	slide10.addText(layer.items.join("  •  "), {
		x: 1.2,
		y: layer.y + 0.45,
		w: 7.5,
		h: 0.3,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	});
	if (i < 3) {
		slide10.addText("▼", {
			x: 4.8,
			y: layer.y + 0.85,
			w: 0.4,
			h: 0.25,
			fontSize: 14,
			fontFace: "Arial",
			color: colors.textMuted,
			align: "center",
		});
	}
});
addFooter(slide10, 10);

// ============ SLIDE 11: Tech Stack ============
let slide11 = pptx.addSlide();
addBg(slide11);
addHeader(slide11, "기술 스택");
const techStack = [
	["분류", "기술", "버전"],
	["런타임", "Node.js", "20 LTS"],
	["언어", "JavaScript", "ES2024"],
	["웹 프레임워크", "Express.js", "4.18"],
	["큐 시스템", "Memory Array", "-"],
	["데이터 저장", "JSON File", "-"],
	["테스트", "Jest", "29.7"],
];
techStack.forEach((row, i) => {
	const y = 1.0 + i * 0.5;
	const isHeader = i === 0;
	slide11.addShape("rect", {
		x: 0.5,
		y: y,
		w: 2.5,
		h: 0.45,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide11.addShape("rect", {
		x: 3.1,
		y: y,
		w: 2.5,
		h: 0.45,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide11.addShape("rect", {
		x: 5.7,
		y: y,
		w: 1.5,
		h: 0.45,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide11.addText(row[0], {
		x: 0.6,
		y: y + 0.08,
		w: 2.3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.textMuted,
	});
	slide11.addText(row[1], {
		x: 3.2,
		y: y + 0.08,
		w: 2.3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: !isHeader,
	});
	slide11.addText(row[2], {
		x: 5.8,
		y: y + 0.08,
		w: 1.3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.accent,
		align: "center",
	});
});
addFooter(slide11, 11);

// ============ SLIDE 12: Domain Model ============
let slide12 = pptx.addSlide();
addBg(slide12);
addHeader(slide12, "도메인 모델");
slide12.addShape("rect", {
	x: 0.5,
	y: 1.0,
	w: 4.3,
	h: 2.3,
	fill: { color: colors.bgLight },
	line: { color: colors.accent, width: 1 },
});
slide12.addText("LLMRequest 모델", {
	x: 0.7,
	y: 1.1,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const baseFields = [
	"id: 고유 식별자",
	"prompt: 사용자 입력",
	"provider: ollama, openai",
	"priority: LOW(0) ~ URGENT(3)",
	"status: pending → completed",
];
baseFields.forEach((f, i) => {
	slide12.addText(`• ${f}`, {
		x: 0.7,
		y: 1.45 + i * 0.35,
		w: 4,
		h: 0.3,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	});
});
slide12.addShape("rect", {
	x: 5,
	y: 1.0,
	w: 4.5,
	h: 1.1,
	fill: { color: colors.bgLight },
	line: { color: colors.purple, width: 1 },
});
slide12.addText("MLFQ 확장 필드", {
	x: 5.2,
	y: 1.1,
	w: 4,
	h: 0.25,
	fontSize: 12,
	fontFace: "Arial",
	color: colors.purple,
	bold: true,
});
slide12.addText("queueLevel, timeSliceUsed, totalCPUTime", {
	x: 5.2,
	y: 1.4,
	w: 4,
	h: 0.6,
	fontSize: 10,
	fontFace: "Arial",
	color: colors.text,
});
slide12.addShape("rect", {
	x: 5,
	y: 2.2,
	w: 4.5,
	h: 1.1,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 1 },
});
slide12.addText("WFQ 확장 필드", {
	x: 5.2,
	y: 2.3,
	w: 4,
	h: 0.25,
	fontSize: 12,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide12.addText("virtualStartTime, virtualFinishTime\nweight, tenantId", {
	x: 5.2,
	y: 2.6,
	w: 4,
	h: 0.6,
	fontSize: 10,
	fontFace: "Arial",
	color: colors.text,
});
addFooter(slide12, 12);

// ============ SLIDE 13: Interface ============
let slide13 = pptx.addSlide();
addBg(slide13);
addHeader(slide13, "스케줄러 인터페이스");
slide13.addText("통일된 인터페이스로 알고리즘 교체 가능", {
	x: 0.5,
	y: 1.0,
	w: 9,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
});
slide13.addShape("rect", {
	x: 0.5,
	y: 1.4,
	w: 5.5,
	h: 3,
	fill: { color: colors.bgLight },
});
const methods = [
	"initialize()",
	"submit(request)",
	"getStatus(requestId)",
	"cancel(requestId)",
	"getStats()",
	"pause()",
	"resume()",
	"shutdown()",
];
methods.forEach((m, i) => {
	slide13.addText(`• ${m}`, {
		x: 0.7,
		y: 1.5 + i * 0.35,
		w: 5,
		h: 0.3,
		fontSize: 12,
		fontFace: "Courier New",
		color: colors.text,
	});
});
slide13.addShape("rect", {
	x: 6.2,
	y: 1.4,
	w: 3.3,
	h: 1.8,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 1 },
});
slide13.addText("장점", {
	x: 6.4,
	y: 1.5,
	w: 3,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide13.addText("✓ 런타임 알고리즘 교체\n✓ 테스트 용이성\n✓ 확장성", {
	x: 6.4,
	y: 1.9,
	w: 3,
	h: 1.2,
	fontSize: 12,
	fontFace: "Arial",
	color: colors.text,
});
addFooter(slide13, 13);

// ============ SLIDE 14: Managers ============
let slide14 = pptx.addSlide();
addBg(slide14);
addHeader(slide14, "관리자 컴포넌트");
const managers = [
	{
		name: "AgingManager",
		desc: "Priority Scheduler용\n기아 방지 우선순위 동적 조정\n30초 대기 시 우선순위 상향",
		color: colors.warning,
	},
	{
		name: "BoostManager",
		desc: "MLFQ용\n60초 주기로 모든 작업을 Q0로\nRule 5 구현",
		color: colors.accent,
	},
	{
		name: "FairnessCalculator",
		desc: "WFQ용\nJain's Fairness Index 계산\n공정성 리포트 생성",
		color: colors.success,
	},
	{
		name: "TenantRegistry",
		desc: "WFQ용\n테넌트별 가중치 관리\n동적 가중치 조정",
		color: colors.purple,
	},
];
managers.forEach((m, i) => {
	const x = 0.4 + (i % 2) * 4.8;
	const y = 1.0 + Math.floor(i / 2) * 1.9;
	slide14.addShape("rect", {
		x: x,
		y: y,
		w: 4.5,
		h: 1.7,
		fill: { color: colors.bgLight },
		line: { color: m.color, width: 2 },
	});
	slide14.addText(m.name, {
		x: x + 0.15,
		y: y + 0.1,
		w: 4.2,
		h: 0.35,
		fontSize: 14,
		fontFace: "Arial",
		color: m.color,
		bold: true,
	});
	slide14.addText(m.desc, {
		x: x + 0.15,
		y: y + 0.5,
		w: 4.2,
		h: 1.1,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	});
});
addFooter(slide14, 14);

// ============ SLIDE 15: FCFS & Priority ============
let slide15 = pptx.addSlide();
addBg(slide15);
addHeader(slide15, "FCFS & Priority 구현");
slide15.addShape("rect", {
	x: 0.5,
	y: 1.0,
	w: 4.3,
	h: 2.0,
	fill: { color: colors.bgLight },
	line: { color: "3b82f6", width: 2 },
});
slide15.addText("FCFS 구현", {
	x: 0.7,
	y: 1.1,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: "3b82f6",
	bold: true,
});
slide15.addText(
	"• 메모리 배열 큐의 FIFO 특성 활용\n• 모든 작업에 동일 우선순위\n• 시간 복잡도: O(1)",
	{
		x: 0.7,
		y: 1.5,
		w: 4,
		h: 1.4,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
slide15.addShape("rect", {
	x: 5,
	y: 1.0,
	w: 4.5,
	h: 2.0,
	fill: { color: colors.bgLight },
	line: { color: colors.purple, width: 2 },
});
slide15.addText("Priority 구현", {
	x: 5.2,
	y: 1.1,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.purple,
	bold: true,
});
slide15.addText(
	"• 메모리 배열 정렬 활용\n• 우선순위 변환 적용\n• AgingManager 연동",
	{
		x: 5.2,
		y: 1.5,
		w: 4,
		h: 1.4,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
slide15.addShape("rect", {
	x: 0.5,
	y: 3.2,
	w: 9,
	h: 1.5,
	fill: { color: colors.bgLight },
});
slide15.addText("Priority 변환 로직:", {
	x: 0.7,
	y: 3.3,
	w: 8,
	h: 0.3,
	fontSize: 12,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
slide15.addText("URGENT(3) → 0    HIGH(2) → 2    NORMAL(1) → 4    LOW(0) → 6", {
	x: 0.7,
	y: 3.7,
	w: 8.5,
	h: 0.4,
	fontSize: 14,
	fontFace: "Courier New",
	color: colors.text,
	align: "center",
});
slide15.addText("(MAX_PRIORITY - priority) * 2 = Queue Priority", {
	x: 0.7,
	y: 4.2,
	w: 8.5,
	h: 0.3,
	fontSize: 11,
	fontFace: "Arial",
	color: colors.textMuted,
	align: "center",
});
addFooter(slide15, 15);

// ============ SLIDE 16: MLFQ Implementation ============
let slide16 = pptx.addSlide();
addBg(slide16);
addHeader(slide16, "MLFQ 구현");
slide16.addText("핵심 구현 포인트:", {
	x: 0.5,
	y: 1.0,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const mlfqPoints = [
	"1. 4개 독립 큐: mlfq-q0, mlfq-q1, mlfq-q2, mlfq-q3",
	"2. 타임 슬라이스 추적: 각 작업의 CPU 사용량 기록",
	"3. 큐 강등 로직: 타임 슬라이스 초과 시 다음 레벨로 이동",
	"4. Boost 구현: 60초마다 모든 작업을 Q0로 이동",
];
mlfqPoints.forEach((p, i) => {
	slide16.addText(p, {
		x: 0.6,
		y: 1.4 + i * 0.4,
		w: 9,
		h: 0.35,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	});
});
slide16.addShape("rect", {
	x: 0.5,
	y: 3.0,
	w: 9,
	h: 1.7,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 1 },
});
slide16.addText("성능 특성", {
	x: 0.7,
	y: 3.1,
	w: 8,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide16.addText(
	"• 대화형 요청: Q0에서 빠르게 처리\n• 배치 작업: 점진적 강등 후 Q3에서 안정적 처리\n• 공정성: Boost로 장기 대기 방지",
	{
		x: 0.7,
		y: 3.5,
		w: 8.5,
		h: 1.1,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
addFooter(slide16, 16);

// ============ SLIDE 17: WFQ Implementation ============
let slide17 = pptx.addSlide();
addBg(slide17);
addHeader(slide17, "WFQ 구현");
slide17.addShape("rect", {
	x: 0.5,
	y: 1.0,
	w: 9,
	h: 0.5,
	fill: { color: colors.primary },
});
slide17.addText(
	"Virtual Finish Time = Virtual Start Time + (Service Time / Weight)",
	{
		x: 0.6,
		y: 1.1,
		w: 8.8,
		h: 0.3,
		fontSize: 13,
		fontFace: "Courier New",
		color: colors.accent,
		align: "center",
	},
);
slide17.addText("구현 컴포넌트:", {
	x: 0.5,
	y: 1.7,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const wfqComponents = [
	"1. VirtualTimeTracker: 전역 가상 시간 관리",
	"2. TenantRegistry: 테넌트 가중치 관리",
	"3. FairnessCalculator: 공정성 지표 계산",
];
wfqComponents.forEach((c, i) => {
	slide17.addText(c, {
		x: 0.6,
		y: 2.05 + i * 0.35,
		w: 9,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	});
});
slide17.addShape("rect", {
	x: 0.5,
	y: 3.2,
	w: 9,
	h: 1.5,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 1 },
});
slide17.addText("공정성 보장 원리", {
	x: 0.7,
	y: 3.3,
	w: 8,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide17.addText(
	"• 가중치가 높은 테넌트 → 낮은 Virtual Finish Time → 우선 처리\n• 가중치가 낮은 테넌트 → 높은 Virtual Finish Time → 지연 처리\n• 결과: 가중치 비율에 맞는 자원 분배",
	{
		x: 0.7,
		y: 3.65,
		w: 8.5,
		h: 1,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
addFooter(slide17, 17);

// ============ SLIDE 18: Code Quality ============
let slide18 = pptx.addSlide();
addBg(slide18);
addHeader(slide18, "코드 품질");
// Test results
slide18.addShape("rect", {
	x: 0.5,
	y: 1.0,
	w: 4.3,
	h: 1.6,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 2 },
});
slide18.addText("테스트 현황", {
	x: 0.7,
	y: 1.1,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide18.addText("총 테스트: 69개\n통과율: 100%\n실행 시간: 0.234초", {
	x: 0.7,
	y: 1.5,
	w: 4,
	h: 1,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.text,
});
// Coverage
slide18.addShape("rect", {
	x: 5,
	y: 1.0,
	w: 4.5,
	h: 1.6,
	fill: { color: colors.bgLight },
	line: { color: colors.accent, width: 2 },
});
slide18.addText("커버리지", {
	x: 5.2,
	y: 1.1,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
slide18.addText(
	"Statements: 98.65%\nBranches: 85.43%\nFunctions: 95.94%\nLines: 98.55%",
	{
		x: 5.2,
		y: 1.5,
		w: 4,
		h: 1,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	},
);
// 코드 품질 요약
slide18.addShape("rect", {
	x: 0.5,
	y: 2.8,
	w: 9,
	h: 2,
	fill: { color: colors.bgLight },
});
slide18.addText("코드 품질 요약", {
	x: 0.7,
	y: 2.9,
	w: 8,
	h: 0.35,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const qualityItems = [
	{ name: "테스트", desc: "69개 작성", color: colors.success },
	{ name: "커버리지", desc: "98.65%", color: colors.accent },
	{ name: "코드 스타일", desc: "ESLint", color: colors.purple },
	{ name: "JSDoc", desc: "타입 주석", color: colors.warning },
];
qualityItems.forEach((item, i) => {
	const x = 0.7 + i * 2.2;
	slide18.addShape("rect", {
		x: x,
		y: 3.4,
		w: 2,
		h: 1.2,
		fill: { color: colors.bgDark },
		line: { color: item.color, width: 2 },
	});
	slide18.addText(item.name, {
		x: x + 0.05,
		y: 3.5,
		w: 1.9,
		h: 0.3,
		fontSize: 11,
		fontFace: "Arial",
		color: item.color,
		align: "center",
	});
	slide18.addText(item.desc, {
		x: x + 0.05,
		y: 3.9,
		w: 1.9,
		h: 0.5,
		fontSize: 14,
		fontFace: "Arial",
		color: colors.text,
		bold: true,
		align: "center",
	});
});
addFooter(slide18, 18);

// ============ SLIDE 19: Performance Comparison ============
let slide19 = pptx.addSlide();
addBg(slide19);
addHeader(slide19, "성능 비교");
// Performance table
const perfData = [
	["알고리즘", "평균 대기시간", "처리량", "공정성"],
	["FCFS", "기준", "기준", "낮음"],
	["Priority", "30% 개선", "유지", "낮음"],
	["MLFQ", "40% 개선", "20% 증가", "높음"],
	["WFQ", "35% 개선", "유지", "매우 높음"],
];
perfData.forEach((row, i) => {
	const y = 1.0 + i * 0.55;
	const isHeader = i === 0;
	[0, 1, 2, 3].forEach((col) => {
		const x = 0.5 + col * 2.35;
		const w = col === 0 ? 2 : col === 3 ? 2.3 : 2.2;
		slide19.addShape("rect", {
			x: x,
			y: y,
			w: w,
			h: 0.5,
			fill: { color: isHeader ? colors.primary : colors.bgLight },
		});
		let textColor = isHeader ? colors.accent : colors.text;
		if (!isHeader && col === 1 && row[1].includes("개선"))
			textColor = colors.success;
		if (!isHeader && col === 2 && row[2].includes("증가"))
			textColor = colors.success;
		if (!isHeader && col === 3 && (row[3] === "높음" || row[3] === "매우 높음"))
			textColor = colors.success;
		slide19.addText(row[col], {
			x: x + 0.1,
			y: y + 0.1,
			w: w - 0.2,
			h: 0.3,
			fontSize: 12,
			fontFace: "Arial",
			color: textColor,
			align: col === 0 ? "left" : "center",
			bold: isHeader || col === 0,
		});
	});
});
slide19.addShape("rect", {
	x: 0.5,
	y: 3.8,
	w: 9,
	h: 1,
	fill: { color: colors.bgLight },
});
slide19.addText("핵심 인사이트", {
	x: 0.7,
	y: 3.9,
	w: 8,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
slide19.addText(
	"• Priority: 긴급 요청 대기시간 효과적 단축  • MLFQ: 대화형 + 배치 모두 효과적 처리  • WFQ: 멀티테넌트 환경 최적",
	{
		x: 0.7,
		y: 4.25,
		w: 8.5,
		h: 0.5,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	},
);
addFooter(slide19, 19);

// ============ SLIDE 20: Fairness Analysis ============
let slide20 = pptx.addSlide();
addBg(slide20);
addHeader(slide20, "공정성 분석");
slide20.addText("Jain's Fairness Index 결과:", {
	x: 0.5,
	y: 1.0,
	w: 5,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const fairnessData = [
	["시나리오", "Fairness Index"],
	["초기 상태", "1.0 (완벽)"],
	["일반 부하", "0.98"],
	["고부하 상태", "0.95"],
	["편향 시나리오", "0.92"],
];
fairnessData.forEach((row, i) => {
	const y = 1.4 + i * 0.5;
	const isHeader = i === 0;
	slide20.addShape("rect", {
		x: 0.5,
		y: y,
		w: 3.5,
		h: 0.45,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide20.addShape("rect", {
		x: 4.1,
		y: y,
		w: 2.5,
		h: 0.45,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide20.addText(row[0], {
		x: 0.6,
		y: y + 0.08,
		w: 3.3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: isHeader,
	});
	slide20.addText(row[1], {
		x: 4.2,
		y: y + 0.08,
		w: 2.3,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.success,
		align: "center",
		bold: !isHeader,
	});
});
slide20.addShape("rect", {
	x: 0.5,
	y: 4.0,
	w: 9,
	h: 0.8,
	fill: { color: "1a3d2e" },
});
slide20.addText("결론: WFQ는 다양한 조건에서 0.95 이상의 공정성 유지", {
	x: 0.7,
	y: 4.2,
	w: 8.5,
	h: 0.4,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
addFooter(slide20, 20);

// ============ SLIDE 21: Algorithm Selection Guide ============
let slide21 = pptx.addSlide();
addBg(slide21);
addHeader(slide21, "알고리즘 선택 가이드");
const guideData = [
	["시나리오", "권장 알고리즘", "이유"],
	["단순 환경", "FCFS", "오버헤드 최소"],
	["우선순위 필요", "Priority", "긴급 요청 우선 처리"],
	["혼합 워크로드", "MLFQ", "응답성 + 처리량 균형"],
	["멀티테넌트", "WFQ", "공정성 보장"],
];
guideData.forEach((row, i) => {
	const y = 1.0 + i * 0.65;
	const isHeader = i === 0;
	slide21.addShape("rect", {
		x: 0.5,
		y: y,
		w: 3,
		h: 0.6,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide21.addShape("rect", {
		x: 3.6,
		y: y,
		w: 2,
		h: 0.6,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide21.addShape("rect", {
		x: 5.7,
		y: y,
		w: 3.8,
		h: 0.6,
		fill: { color: isHeader ? colors.primary : colors.bgLight },
	});
	slide21.addText(row[0], {
		x: 0.6,
		y: y + 0.15,
		w: 2.8,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
		bold: isHeader,
	});
	slide21.addText(row[1], {
		x: 3.7,
		y: y + 0.15,
		w: 1.8,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.accent,
		bold: true,
		align: "center",
	});
	slide21.addText(row[2], {
		x: 5.8,
		y: y + 0.15,
		w: 3.6,
		h: 0.3,
		fontSize: 12,
		fontFace: "Arial",
		color: isHeader ? colors.accent : colors.text,
	});
});
addFooter(slide21, 21);

// ============ SLIDE 22: Demo ============
let slide22 = pptx.addSlide();
addBg(slide22);
addHeader(slide22, "라이브 데모");
slide22.addText("데모 시나리오:", {
	x: 0.5,
	y: 1.0,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const demoSteps = [
	"1. 시스템 시작: 서버 구동",
	"2. FCFS 테스트: 순차 처리 확인",
	"3. Priority 테스트: 우선순위별 처리 순서 확인",
	"4. MLFQ 테스트: 큐 강등 및 Boost 동작 확인",
	"5. WFQ 테스트: 가중치별 처리량, Fairness Index 확인",
];
demoSteps.forEach((step, i) => {
	slide22.addText(step, {
		x: 0.6,
		y: 1.4 + i * 0.4,
		w: 9,
		h: 0.35,
		fontSize: 13,
		fontFace: "Arial",
		color: colors.text,
	});
});
slide22.addShape("rect", {
	x: 0.5,
	y: 3.5,
	w: 9,
	h: 1.3,
	fill: { color: colors.bgLight },
	line: { color: colors.accent, width: 2 },
});
slide22.addText("http://localhost:3000", {
	x: 0.7,
	y: 3.7,
	w: 8,
	h: 0.4,
	fontSize: 20,
	fontFace: "Courier New",
	color: colors.accent,
	bold: true,
	align: "center",
});
slide22.addText("대시보드: 실시간 큐 상태, 처리 통계, 공정성 지표", {
	x: 0.7,
	y: 4.2,
	w: 8.5,
	h: 0.4,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.text,
	align: "center",
});
addFooter(slide22, 22);

// ============ SLIDE 23: Conclusion ============
let slide23 = pptx.addSlide();
addBg(slide23);
addHeader(slide23, "결론");
slide23.addText("연구 성과:", {
	x: 0.5,
	y: 1.0,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const achievements = [
	"OS 스케줄링 알고리즘의 LLM 환경 성공적 적용",
	"4가지 알고리즘 완벽 구현 (FCFS, Priority, MLFQ, WFQ)",
	"기아 방지 (Aging, Boost) 및 공정성 보장 (WFQ)",
	"69개 테스트 100% 통과, 98.65% 커버리지",
];
achievements.forEach((a, i) => {
	slide23.addText(`✓ ${a}`, {
		x: 0.6,
		y: 1.35 + i * 0.4,
		w: 9,
		h: 0.35,
		fontSize: 13,
		fontFace: "Arial",
		color: colors.success,
	});
});
slide23.addShape("rect", {
	x: 0.5,
	y: 3.0,
	w: 4.3,
	h: 1.4,
	fill: { color: colors.bgLight },
	line: { color: colors.accent, width: 1 },
});
slide23.addText("학술적 기여", {
	x: 0.7,
	y: 3.1,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
slide23.addText(
	"• OS 이론의 AI 시스템 최초 적용\n• 정량적 성능 비교 분석 제공",
	{
		x: 0.7,
		y: 3.45,
		w: 4,
		h: 0.85,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	},
);
slide23.addShape("rect", {
	x: 5,
	y: 3.0,
	w: 4.5,
	h: 1.4,
	fill: { color: colors.bgLight },
	line: { color: colors.success, width: 1 },
});
slide23.addText("실용적 가치", {
	x: 5.2,
	y: 3.1,
	w: 4,
	h: 0.3,
	fontSize: 13,
	fontFace: "Arial",
	color: colors.success,
	bold: true,
});
slide23.addText(
	"• 멀티테넌트 환경 지원\n• REST API 및 대시보드 제공\n• 오픈소스 공개 (MIT 라이선스)",
	{
		x: 5.2,
		y: 3.45,
		w: 4,
		h: 0.85,
		fontSize: 11,
		fontFace: "Arial",
		color: colors.text,
	},
);
addFooter(slide23, 23);

// ============ SLIDE 24: Future & Q&A ============
let slide24 = pptx.addSlide();
addBg(slide24);
addHeader(slide24, "향후 계획 및 Q&A");
slide24.addText("향후 연구 방향:", {
	x: 0.5,
	y: 1.0,
	w: 4,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	bold: true,
});
const futureWork = [
	{ num: "1", title: "분산 스케줄링", desc: "수평 확장 지원" },
	{
		num: "2",
		title: "적응형 스케줄링",
		desc: "워크로드 기반 자동 알고리즘 선택",
	},
	{
		num: "3",
		title: "ML 기반 예측",
		desc: "처리 시간 예측으로 스케줄링 최적화",
	},
	{ num: "4", title: "추가 LLM 통합", desc: "Claude, Gemini, Azure OpenAI" },
];
futureWork.forEach((fw, i) => {
	slide24.addShape("rect", {
		x: 0.6,
		y: 1.4 + i * 0.5,
		w: 0.4,
		h: 0.4,
		fill: { color: colors.accent },
	});
	slide24.addText(fw.num, {
		x: 0.6,
		y: 1.45 + i * 0.5,
		w: 0.4,
		h: 0.3,
		fontSize: 14,
		fontFace: "Arial",
		color: colors.text,
		bold: true,
		align: "center",
	});
	slide24.addText(`${fw.title}: ${fw.desc}`, {
		x: 1.1,
		y: 1.45 + i * 0.5,
		w: 8,
		h: 0.35,
		fontSize: 12,
		fontFace: "Arial",
		color: colors.text,
	});
});
slide24.addShape("rect", {
	x: 1,
	y: 3.8,
	w: 8,
	h: 1.0,
	fill: { color: colors.primary },
});
slide24.addText("감사합니다", {
	x: 1.2,
	y: 3.95,
	w: 7.6,
	h: 0.4,
	fontSize: 24,
	fontFace: "Arial",
	color: colors.text,
	bold: true,
	align: "center",
});
slide24.addText("질의응답 (Q&A)", {
	x: 1.2,
	y: 4.4,
	w: 7.6,
	h: 0.3,
	fontSize: 14,
	fontFace: "Arial",
	color: colors.accent,
	align: "center",
});
addFooter(slide24, 24);

// Save presentation
const outputPath =
	"/Users/truestone/Dropbox/repo/mj/졸업프로젝트/03-report/presentation/graduation-presentation.pptx";
pptx
	.writeFile({ fileName: outputPath })
	.then(() => console.log(`✅ PPTX saved: ${outputPath}`))
	.catch((err) => console.error("Error:", err));
