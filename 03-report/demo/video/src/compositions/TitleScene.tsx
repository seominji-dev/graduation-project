import React from "react";
import {
	useCurrentFrame,
	interpolate,
	spring,
	useVideoConfig,
	Sequence,
} from "remotion";

// 타이틀 Scene (0:00 - 0:08, 240 frames @30fps)
export const TitleScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// 애니메이션 값들 (fps 기반 타이밍)
	const titleOpacity = interpolate(frame, [0, Math.round(0.53 * fps)], [0, 1], {
		extrapolateRight: "clamp",
	});

	const titleY = interpolate(frame, [0, Math.round(0.53 * fps)], [50, 0], {
		extrapolateRight: "clamp",
	});

	const subtitleOpacity = interpolate(
		frame,
		[Math.round(0.53 * fps), Math.round(1.07 * fps)],
		[0, 1],
		{
			extrapolateRight: "clamp",
		},
	);

	const universityOpacity = interpolate(
		frame,
		[Math.round(1.07 * fps), Math.round(1.6 * fps)],
		[0, 1],
		{
			extrapolateRight: "clamp",
		},
	);

	const yearScale = spring({
		frame: frame - Math.round(1.6 * fps),
		fps,
		config: { damping: 12 },
	});

	// 배경 그라데이션 애니메이션
	const gradientAngle = interpolate(frame, [0, 8 * fps], [135, 180], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background:
					"linear-gradient(" +
					gradientAngle +
					"deg, #0a0a0a 0%, #1a1a2e 50%, #0f172a 100%)",
				position: "relative",
				overflow: "hidden",
				padding: "48px",
			}}
		>
			{/* 배경 장식 요소 */}
			<div
				style={{
					position: "absolute",
					top: "20%",
					left: "10%",
					width: "200px",
					height: "200px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
					filter: "blur(40px)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "20%",
					right: "15%",
					width: "300px",
					height: "300px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)",
					filter: "blur(60px)",
				}}
			/>

			{/* 메인 타이틀 */}
			<h1
				style={{
					fontSize: "64px",
					fontWeight: 800,
					textAlign: "center",
					color: "#ffffff",
					marginBottom: "24px",
					opacity: titleOpacity,
					transform: "translateY(" + titleY + "px)",
					textShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
					lineHeight: 1.2,
				}}
			>
				<span style={{ display: "block" }}>OS 스케줄링 알고리즘을 활용한</span>
				<span
					style={{
						display: "block",
						background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
					}}
				>
					LLM API 요청 최적화 스케줄러
				</span>
			</h1>

			{/* 부제목 */}
			<p
				style={{
					fontSize: "24px",
					color: "#a1a1aa",
					marginBottom: "48px",
					opacity: subtitleOpacity,
					fontWeight: 400,
				}}
			>
				FCFS | Priority | MLFQ | WFQ
			</p>

			{/* 학교 정보 */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "12px",
					opacity: universityOpacity,
				}}
			>
				<div
					style={{
						padding: "12px 32px",
						backgroundColor: "rgba(99, 102, 241, 0.1)",
						borderRadius: "9999px",
						border: "1px solid rgba(99, 102, 241, 0.3)",
					}}
				>
					<span style={{ fontSize: "18px", color: "#e4e4e7", fontWeight: 500 }}>
						홍익대학교 C235180 서민지
					</span>
				</div>
				<span
					style={{
						fontSize: "32px",
						fontWeight: 700,
						color: "#6366f1",
						transform: "scale(" + Math.max(0, yearScale) + ")",
					}}
				>
					2026 졸업프로젝트
				</span>
			</div>
		</div>
	);
};
