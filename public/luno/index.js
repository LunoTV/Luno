import { SourceManager } from './source-manager.js';
import { z01Source } from './sources/z01.js';

export const sourceManager = new SourceManager();

sourceManager.register(z01Source);

if (typeof window !== 'undefined') {
  window.LUNO = window.LUNO || {};
  window.LUNO.sources = sourceManager;
  window.LUNO.sourceAdapters = Object.freeze({
    z01: z01Source
  });
}

export default sourceManager;

// Load the standalone runtime after source registration is complete.\nimport('./source-runtime.js');

import('./full-bridge.js');
