import '../../setupTests';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useActiveAlerts, useAlertStore, useP0Alerts } from '../../store/alert.store';
import type { SystemAlert } from '../../types/alert.types';

const makeAlert = (overrides: Partial<SystemAlert> = {}): SystemAlert => ({
  alertId: 'alert-1',
  venueId: 'venue-1',
  zoneId: 'zone-1',
  severity: 'HIGH',
  type: 'CROWD_DENSITY',
  message: 'Zone is getting crowded.',
  triggeredAt: '2026-04-12T12:00:00.000Z',
  ...overrides,
});

describe('alert.store', () => {
  beforeEach(() => {
    useAlertStore.setState({
      alerts: {},
      unreadCount: 0,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    useAlertStore.setState({
      alerts: {},
      unreadCount: 0,
      isLoading: false,
    });
  });

  it('should increase unread count when an unresolved alert is added', () => {
    useAlertStore.getState().addAlert(makeAlert());

    expect(useAlertStore.getState().unreadCount).toBe(1);
    expect(useAlertStore.getState().alerts['alert-1']).toEqual(expect.objectContaining({ message: 'Zone is getting crowded.' }));
  });

  it('should resolve an alert and reduce unread count', () => {
    useAlertStore.getState().addAlert(makeAlert());

    useAlertStore.getState().resolveAlert('alert-1', 'Shift Lead', '2026-04-12T12:05:00.000Z');

    expect(useAlertStore.getState().alerts['alert-1']).toEqual(
      expect.objectContaining({
        resolvedBy: 'Shift Lead',
        resolvedAt: '2026-04-12T12:05:00.000Z',
      }),
    );
    expect(useAlertStore.getState().unreadCount).toBe(0);
  });

  it('should return only unresolved critical alerts from useP0Alerts', () => {
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-critical', severity: 'CRITICAL' }));
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-high', severity: 'HIGH' }));
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-resolved', severity: 'CRITICAL', resolvedAt: '2026-04-12T12:01:00.000Z' }));

    const { result } = renderHook(() => useP0Alerts());

    expect(result.current.map((alert) => alert.alertId)).toEqual(['alert-critical']);
  });

  it('should sort active alerts by severity and most recent timestamp', () => {
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-medium', severity: 'MEDIUM', triggeredAt: '2026-04-12T12:00:00.000Z' }));
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-critical', severity: 'CRITICAL', triggeredAt: '2026-04-12T11:59:00.000Z' }));
    useAlertStore.getState().addAlert(makeAlert({ alertId: 'alert-high-recent', severity: 'HIGH', triggeredAt: '2026-04-12T12:10:00.000Z' }));

    const { result } = renderHook(() => useActiveAlerts());

    expect(result.current.map((alert) => alert.alertId)).toEqual(['alert-critical', 'alert-high-recent', 'alert-medium']);
  });
});
