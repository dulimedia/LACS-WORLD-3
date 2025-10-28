const params = new URLSearchParams(window.location.search);

export const DEBUG = {
  VERBOSE: params.has('debug') || params.get('verbose') === 'true',
  GEOMETRY: params.get('debug') === 'geometry',
  MATERIALS: params.get('debug') === 'materials',
  PERFORMANCE: params.get('debug') === 'performance',
  MEMORY: params.get('debug') === 'memory',
};

export const log = {
  verbose: (...args: any[]) => {
    if (DEBUG.VERBOSE) console.log(...args);
  },
  geometry: (...args: any[]) => {
    if (DEBUG.GEOMETRY || DEBUG.VERBOSE) console.log(...args);
  },
  material: (...args: any[]) => {
    if (DEBUG.MATERIALS || DEBUG.VERBOSE) console.log(...args);
  },
  perf: (...args: any[]) => {
    if (DEBUG.PERFORMANCE || DEBUG.VERBOSE) console.log(...args);
  },
  memory: (...args: any[]) => {
    if (DEBUG.MEMORY || DEBUG.VERBOSE) console.log(...args);
  },
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.log.bind(console),
};
