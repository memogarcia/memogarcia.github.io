// Globals provided by other scripts on the page (/tools/analytics.js) and older Safari.
interface MemoToolTelemetry {
  begin(): void;
  converted(): void;
}

interface Window {
  memoToolTelemetry?: MemoToolTelemetry;
  webkitAudioContext?: typeof AudioContext;
  __cutPerf?: Record<string, number>;
}
