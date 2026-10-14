export interface WebGLCapabilities {
  supported: boolean;
  webgl2: boolean;
  renderer: string;
}

export function detectWebGLCapabilities(): WebGLCapabilities {
  if (typeof window === 'undefined') {
    return { supported: true, webgl2: true, renderer: 'server' };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      const dbg = gl2.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'WebGL2';
      return { supported: true, webgl2: true, renderer };
    }

    const gl1 = canvas.getContext('webgl');
    if (gl1) {
      return { supported: true, webgl2: false, renderer: 'WebGL1' };
    }
  } catch (e) {}

  return { supported: false, webgl2: false, renderer: 'None' };
}
