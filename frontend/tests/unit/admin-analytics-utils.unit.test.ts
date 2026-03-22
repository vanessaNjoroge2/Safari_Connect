import { describe, expect, it } from 'vitest';
import { buildAnalyticsCsv, formatKes, getRangeLabel } from '../../src/pages/admin/analytics.utils';

describe('admin analytics utils', () => {
  it('formats KES values consistently', () => {
    expect(formatKes(15400.2)).toBe('KES 15,400');
    expect(formatKes(0)).toBe('KES 0');
  });

  it('returns human readable range labels', () => {
    expect(getRangeLabel('6m')).toBe('Last 6 months');
    expect(getRangeLabel('30d')).toBe('Last 30 days');
    expect(getRangeLabel('ytd')).toBe('This year');
  });

  it('builds csv output from live analytics payload', () => {
    const csv = buildAnalyticsCsv({
      range: '6m',
      periodLabel: 'Last 6 months',
      generatedAt: '2026-03-22T12:00:00.000Z',
      windowStart: '2025-10-01T00:00:00.000Z',
      windowEnd: '2026-03-22T12:00:00.000Z',
      kpis: {
        grossRevenue: 125000,
        totalBookings: 880,
        activeSaccos: 7,
        platformCommission: 6250,
        avgFare: 142,
        refundRate: 1.5,
        newUsers: 64,
        repeatBookingRate: 31.8,
      },
      months: [{ month: 'Oct 2025', revenue: 2.5, bookings: 18 }],
      topRoutes: [{ route: 'Nairobi -> Kisumu', bookings: 220, revenue: 42000 }],
      topSaccos: [{ name: 'Swiftline', bookings: 180, revenue: 38000 }],
    });

    expect(csv).toContain('KPIs');
    expect(csv).toContain('Gross Revenue,125000.00');
    expect(csv).toContain('Nairobi -> Kisumu,220,42000.00');
    expect(csv).toContain('Swiftline,180,38000.00');
  });
});
