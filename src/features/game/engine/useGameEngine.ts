import { useEffect, useState } from 'react';
import { detectWebGLCapabilities } from '../performance/WebGLDetection';

export function useGameEngine() {
  const [isReady, setIsReady] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const caps = detectWebGLCapabilities();
    if (!caps.supported) {
      setHasWebGL(false);
    }
    setIsReady(true);
  }, []);

  return { isReady, hasWebGL };
}
