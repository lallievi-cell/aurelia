import confetti from "canvas-confetti";

export function fireConfetti(big = false) {
  try {
    if (big) {
      // Big milestone celebration (e.g. IPO, Big Pharma, Drug approval)
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ["#1b7a64", "#c88812", "#ffffff"],
      });
      fire(0.2, {
        spread: 60,
        colors: ["#1b7a64", "#c88812", "#12262c"],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ["#1b7a64", "#eef3f0", "#c88812"],
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } else {
      // Standard celebration (e.g. achievement unlocked, milestone)
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        zIndex: 9999,
        colors: ["#1b7a64", "#c88812", "#12262c"],
      });
    }
  } catch {
    // Graceful fallback if canvas is not supported
  }
}
