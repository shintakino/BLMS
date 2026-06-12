"use client";

import { motion } from "framer-motion";

export const EmberParticles = () => {
	// Generate static random values for hydration consistency
	const particles = Array.from({ length: 32 }).map((_, i) => {
		const colors = [
			"bg-red-500",
			"bg-orange-500",
			"bg-amber-500",
			"bg-yellow-500",
		];
		const glowColors = [
			"rgba(239, 68, 68, 0.6)",
			"rgba(249, 115, 22, 0.6)",
			"rgba(245, 158, 11, 0.6)",
			"rgba(234, 179, 8, 0.6)",
		];
		return {
			id: i,
			left: `${(i * 3.1) % 100}%`,
			duration: 4 + (i % 5),
			delay: i * 0.12,
			size: 2 + (i % 3), // size from 2px to 5px
			color: colors[i % colors.length],
			glow: glowColors[i % glowColors.length],
			blur: i % 3 === 0 ? "blur-[1px]" : "blur-0",
		};
	});

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className={`absolute bottom-0 rounded-full opacity-0 ${particle.color} ${particle.blur}`}
					style={{
						left: particle.left,
						width: `${particle.size}px`,
						height: `${particle.size}px`,
						boxShadow: `0 0 ${particle.size * 3}px ${particle.glow}`,
					}}
					animate={{
						y: [0, -600],
						x: [0, particle.id % 2 === 0 ? 60 : -60],
						opacity: [0, 0.8, 0.4, 0],
						scale: [0.5, 1.2, 0.8, 0],
					}}
					transition={{
						duration: particle.duration,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeOut",
						delay: particle.delay,
					}}
				/>
			))}
		</div>
	);
};
