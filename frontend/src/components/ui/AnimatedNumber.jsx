import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function AnimatedNumber({ value = 0, duration = 450 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const previous = useRef(target);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (reduceMotion || from === target) {
      setShown(target);
      return undefined;
    }
    let frame = 0;
    let start;
    const tick = (time) => {
      if (start === undefined) start = time;
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduceMotion]);

  return <>{shown.toLocaleString()}</>;
}
