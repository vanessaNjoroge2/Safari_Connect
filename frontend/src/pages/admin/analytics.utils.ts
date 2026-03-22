import type { AdminAnalyticsEnvelope } from '../../lib/api';

type AnalyticsData = AdminAnalyticsEnvelope['data'];

export function formatKes(value: number) {
  return `KES ${Math.round(value).toLocaleString()}`;
}

export function buildAnalyticsCsv(data: AnalyticsData) {
  const lines: string[] = [];

  lines.push(`Period,${data.periodLabel}`);
  lines.push(`Generated At,${new Date(data.generatedAt).toISOString()}`);
  lines.push('');

  lines.push('KPIs');
  lines.push('Metric,Value');
  lines.push(`Gross Revenue,${data.kpis.grossRevenue.toFixed(2)}`);
  lines.push(`Total Bookings,${data.kpis.totalBookings}`);
  lines.push(`Active SACCOs,${data.kpis.activeSaccos}`);
  lines.push(`Platform Commission,${data.kpis.platformCommission.toFixed(2)}`);
  lines.push(`Average Fare,${data.kpis.avgFare.toFixed(2)}`);
  lines.push(`Refund Rate,${data.kpis.refundRate.toFixed(1)}%`);
  lines.push(`New Users,${data.kpis.newUsers}`);
  lines.push(`Repeat Booking Rate,${data.kpis.repeatBookingRate.toFixed(1)}%`);
  lines.push('');

  lines.push('Revenue Trend');
  lines.push('Bucket,Revenue (KES M),Bookings');
  for (const month of data.months) {
    lines.push(`${escapeCsv(month.month)},${month.revenue.toFixed(2)},${month.bookings}`);
  }
  lines.push('');

  lines.push('Top Routes');
  lines.push('Route,Bookings,Revenue');
  for (const row of data.topRoutes) {
    lines.push(`${escapeCsv(row.route)},${row.bookings},${row.revenue.toFixed(2)}`);
  }
  lines.push('');

  lines.push('Top SACCOs');
  lines.push('Sacco,Bookings,Revenue');
  for (const row of data.topSaccos) {
    lines.push(`${escapeCsv(row.name)},${row.bookings},${row.revenue.toFixed(2)}`);
  }

  return lines.join('\n');
}

function escapeCsv(value: string) {
  if (!value.includes(',') && !value.includes('"') && !value.includes('\n')) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function getRangeLabel(range: AnalyticsData['range']) {
  if (range === '30d') return 'Last 30 days';
  if (range === 'ytd') return 'This year';
  return 'Last 6 months';
}
