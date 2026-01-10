"use client";

import { motion } from "framer-motion";

export const EmberParticles = () => {
	// Generate static random values for hydration consistency
	const particles = Array.from({ length: 20 }).map((_, i) => ({
		id: i,
		left: `${(i * 5) % 100}%`,
		duration: 3 + (i % 5),
		delay: i * 0.2,
	}));

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className="absolute bottom-0 h-1 w-1 rounded-full bg-red-500 opacity-0"
					style={{ left: particle.left }}
					animate={{
						y: [0, -400],
						x: [0, particle.id % 2 === 0 ? 50 : -50],
						opacity: [0, 1, 0],
						scale: [0, 1.5, 0],
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
