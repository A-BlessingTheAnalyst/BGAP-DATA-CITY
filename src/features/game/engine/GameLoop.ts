import { useRef, useEffect } from 'react';

export type FrameCallback = (delta: number, elapsed: number) => void;

export function useGameLoop(callback: FrameCallback, isEnabled = true) {
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) return;

    const loop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const delta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      callback(delta, currentTime / 1000);
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [callback, isEnabled]);
}
