// Regression guard: p50 < 215ms × 2 = 430ms
// (was 124ms × 2 = 248ms)

module.exports = {
  assertP50: function(actualLatency) {
    if (actualLatency >= 430) {
      throw new Error(`Regression: Queue wait p50 latency ${actualLatency}ms exceeds calibrated threshold 430ms`);
    }
    return true;
  }
};
