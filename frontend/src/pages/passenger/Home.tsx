import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { AiBanner, AiAgentPanel } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { aiAssistApi, aiContextApi, type AiContextEnvelope } from '../../lib/api';

type PassengerAiCard = {
  type: string;
  icon: string;
  result: string;
  detail: string;
  confidence: number;
  actionLabel?: string;
  onAction?: () => void;
  accentColor: string;
};

export default function PassengerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const [loadingAi, setLoadingAi] = useState(true);
  const [aiBannerText, setAiBannerText] = useState(
    `<strong>Hello, ${firstName}.</strong> Loading live trips, routes, and fares from backend...`
  );
  const [context, setContext] = useState<AiContextEnvelope['data'] | null>(null);
  const [aiCards, setAiCards] = useState<PassengerAiCard[]>([]);

  const transportCats = [
    { id: 'bus', icon: '🚌', name: 'Buses', desc: 'Long-distance · AC · Comfortable', path: '/passenger/search?cat=bus' },
    { id: 'matatu', icon: '🚐', name: 'Matatu', desc: 'City & town routes', path: '/passenger/search?cat=matatu' },
    { id: 'motorbike', icon: '🏍️', name: 'Motorbikes', desc: 'Fast · Last mile · Boda boda', path: '/passenger/search?cat=motorbike' },
  ];

  const otherServices = [
    { id: 'package', icon: '📦', name: 'Package Delivery', desc: 'Send parcels countrywide with GPS tracking', color: 'var(--brand)', path: '/carrier/package' },
    { id: 'movers', icon: '🚛', name: 'Movers & Relocation', desc: 'Home or office moves with instant AI quote', color: 'var(--info)', path: '/carrier/movers' },
    { id: 'courier', icon: '✉️', name: 'Document Courier', desc: 'Secure delivery with digital signature', color: 'var(--warning)', path: '/carrier/courier' },
  ];

  const defaultCards = useMemo<PassengerAiCard[]>(
    () => [
      {
        type: 'Trip Recommendation',
        icon: '🎯',
        result: 'Waiting for backend data',
        detail: 'Loading live trips and route reliability from database...',
        confidence: 0,
        accentColor: 'var(--brand)',
      },
      {
        type: 'Dynamic Pricing Insight',
        icon: '📈',
        result: 'Waiting for backend data',
        detail: 'Loading fare ranges and demand indicators...',
        confidence: 0,
        accentColor: '#f59e0b',
      },
      {
        type: 'Delay Risk Prediction',
        icon: '⏱️',
        result: 'Waiting for backend data',
        detail: 'Preparing route delay risk from live schedule context...',
        confidence: 0,
        accentColor: '#3b82f6',
      },
    ],
    []
  );

  const hydratePassengerAi = useCallback(async () => {
    setLoadingAi(true);

    try {
      const contextResponse = await aiContextApi();
      const ctx = contextResponse.data;
      setContext(ctx);

      const topTrip = ctx.nextTrip || ctx.trips[0] || null;
      const recent = ctx.recentBookings || [];
      const preferredRoutes = Array.from(new Set(recent.map((b) => b.route))).slice(0, 4);
      const preferredSaccos = Array.from(new Set(recent.map((b) => b.saccoName))).slice(0, 3);
      const preferredBudgetKes = recent.length
        ? Math.round(recent.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) / recent.length)
        : undefined;
      const preferredDepartureHour = topTrip
        ? new Date(topTrip.departureTime).getHours()
        : undefined;

      const assistResponse = await aiAssistApi({
        prompt: 'Generate concise passenger recommendation, pricing, and delay insight from backend trip context only.',
        language: 'en',
        route: topTrip?.route || ctx.routes[0]?.route || '',
        departureTime: topTrip?.departureTime || undefined,
        currentPrice: topTrip?.price || ctx.pricing.avgFare || 0,
        totalSeats: topTrip?.seatCapacity || 45,
        bookedSeats: topTrip?.bookedSeats || 0,
        noShowRate: 0.08,
        riskFactors: {
          weatherRisk: 0.28,
          trafficRisk: 0.42,
          routeRisk: Math.min(0.8, Math.max(0.1, (topTrip?.occupancyRate || 0.35) * 0.7)),
        },
        fraudSignals: {
          attemptsLast24h: 1,
          cardMismatch: false,
          rapidRetries: 0,
          geoMismatch: false,
        },
        trips: ctx.trips.slice(0, 20).map((trip) => ({
          id: trip.id,
          route: trip.route,
          price: trip.price,
          travelMinutes: trip.travelMinutes,
          reliabilityScore: trip.reliabilityScore,
          departureTime: trip.departureTime,
          saccoName: trip.saccoName,
        })),
        intent: {
          maxBudget: Math.max(ctx.pricing.avgFare || 0, 1000),
          maxTravelMinutes: 300,
          behavior: {
            preferredRoutes,
            preferredSaccos,
            preferredBudgetKes,
            preferredDepartureHour,
          },
        },
      });

      const modules = assistResponse.data.modules;

      if (topTrip) {
        const departure = new Date(topTrip.departureTime).toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setAiBannerText(
          `<strong>Good day, ${firstName}.</strong> Live backend data shows ${topTrip.origin} -> ${topTrip.destination} at ${departure} with ${topTrip.availableSeats} seats left from ${topTrip.saccoName || 'active sacco routes'}.`
        );
      } else {
        setAiBannerText(
          `<strong>Good day, ${firstName}.</strong> No upcoming trips returned from backend right now. Try searching routes.`
        );
      }

      setAiCards([
        {
          type: 'Trip Recommendation',
          icon: '🎯',
          result: modules.recommendation.topPick
            ? `${modules.recommendation.topPick.route} · KES ${Math.round(modules.recommendation.topPick.price || 0)}`
            : topTrip
              ? `${topTrip.origin} -> ${topTrip.destination} · KES ${Math.round(topTrip.price)}`
              : 'No current recommendation',
          detail: topTrip
            ? `${topTrip.vehicleName} (${topTrip.plateNumber}) · ${topTrip.availableSeats} seats available · reliability ${Math.round(topTrip.reliabilityScore * 100)}%`
            : 'No upcoming trip currently available from backend context.',
          confidence: Math.round((modules.recommendation.confidence || 0) * 100),
          actionLabel: topTrip ? 'Book this trip' : undefined,
          onAction: topTrip
            ? () =>
                navigate(
                  `/passenger/search?cat=bus&from=${encodeURIComponent(topTrip.origin)}&to=${encodeURIComponent(topTrip.destination)}${preferredBudgetKes ? `&maxFare=${preferredBudgetKes}` : ''}&auto=1`
                )
            : undefined,
          accentColor: 'var(--brand)',
        },
        {
          type: 'Dynamic Pricing Insight',
          icon: '📈',
          result: `KES ${Math.round(modules.pricing.currentPrice)} -> KES ${Math.round(modules.pricing.predictedPrice)}`,
          detail: `Backend fare range: KES ${Math.round(ctx.pricing.minFare)} - KES ${Math.round(ctx.pricing.maxFare)}. ${modules.pricing.cheaperWindowSuggestion}`,
          confidence: Math.round((modules.pricing.confidence || 0) * 100),
          accentColor: '#f59e0b',
        },
        {
          type: 'Delay Risk Prediction',
          icon: '⏱️',
          result: `${modules.delayRisk.riskLevel.toUpperCase()} risk · ${(modules.delayRisk.riskScore * 100).toFixed(0)}%`,
          detail: modules.delayRisk.recommendation,
          confidence: Math.round((modules.delayRisk.confidence || 0) * 100),
          accentColor: '#3b82f6',
        },
      ]);
    } catch {
      setAiBannerText(
        `<strong>Hello, ${firstName}.</strong> Backend AI data is currently unavailable. Please try again shortly.`
      );
      setAiCards(defaultCards);
    } finally {
      setLoadingAi(false);
    }
  }, [defaultCards, firstName, navigate]);

  useEffect(() => {
    void hydratePassengerAi();
  }, [hydratePassengerAi]);

  return (
    <DashboardLayout
      title="Home"
      subtitle="What would you like to book today?"
      actions={<button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>Search trips</button>}
    >
      <AiBanner
        text={aiBannerText}
        action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>Quick book →</button>}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Transport categories</h3>
      </div>
      <div className="grid-3 mb-6">
        {transportCats.map(c => (
          <div key={c.id} className="card card-hover" onClick={() => navigate(c.path)}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>{c.icon}</div>
            <h4 style={{ marginBottom: 4 }}>{c.name}</h4>
            <p className="text-sm text-muted mb-4">{c.desc}</p>
            <span className="btn btn-outline btn-sm">Browse →</span>
          </div>
        ))}
      </div>

      <AiAgentPanel
        title="AI Travel Assistant"
        subtitle={
          loadingAi
            ? 'Loading recommendations from backend context...'
            : `Backend source: ${context?.source || 'unknown'} · ${context?.operations.totalUpcomingTrips || 0} upcoming trips`
        }
        cols={3}
        cards={aiCards.length ? aiCards : defaultCards}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Other services</h3>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>Carrier services for packages, moves, and documents</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/carrier')}>View all →</button>
      </div>
      <div className="grid-3 mb-6">
        {otherServices.map(s => (
          <div key={s.id} className="card card-hover" onClick={() => navigate(s.path)} style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{s.icon}</div>
            <h4 style={{ marginBottom: 4 }}>{s.name}</h4>
            <p className="text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Popular routes today</div>
          <div style={{ padding: '12px 0' }}>
            <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
              Search routes to view live trips and pricing from the backend.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>
              Search live routes →
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recent bookings</div>
          {context?.recentBookings?.length ? (
            context.recentBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{booking.route}</div>
                  <div className="text-xs text-muted mt-2">{booking.saccoName} · KES {Math.round(booking.amount).toLocaleString()}</div>
                </div>
                <span className="badge badge-blue">{booking.status}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px 0' }}>
              <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
                Open your bookings page to load your latest trip history.
              </p>
            </div>
          )}
          <button className="btn btn-ghost btn-sm mt-4" onClick={() => navigate('/passenger/mybookings')}>
            View all bookings →
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
