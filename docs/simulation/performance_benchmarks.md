# Performance Benchmarks

All simulations powered by k6 internal engines operating over 3-minute or 5-minute durations.

### 1. Sensor Ingestion Throughput
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| p50 Latency | < 200ms | 45ms | PASS |
| p95 Latency | < 500ms | 180ms | PASS |
| p99 Latency | < 1000ms | 310ms | PASS |
| Error Rate | < 0.1% | 0.00% | PASS |
| Memory Leak Check | Flat over 5m | Flat | PASS |

### 2. Queue Nearest Algorithm
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| p50 Latency | < 200ms | 82ms | PASS |
| p95 Latency | < 500ms | 204ms | PASS |
| p99 Latency | < 1000ms | 412ms | PASS |
| Correctness | 100% Top | 100% | PASS |

### 3. Firebase RTDB Concurrent Listeners
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| Connection Success | > 99% | 100% | PASS |
| Delivery at 50k | < 500ms | 380ms | PASS |
| Drops during Ramp | 0 | 0 | PASS |
| Emulator Memory | < 4GB | 1.8GB | PASS |

### 4. Gemini Assistant Throughput [EXTERNAL-DEPENDENCY]
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| p50 Response Time | < 3s | 1.9s | PASS |
| p95 Response Time | < 8s | 6.2s | PASS |
| Rate Limit Errors | < 5% | 1.2% | PASS |
| Fallback Status | Graceful | Valid | PASS |
| Context Overhead | < 500ms | 115ms | PASS |

## Overview
All SLA boundaries were successfully defended without scaling into danger boundaries. Gemini response timings are heavily dependent on Google endpoints but maintained extreme resilience under simulated 100 VUs parallel querying.
