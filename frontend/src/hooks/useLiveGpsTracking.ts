import { useEffect, useMemo, useState } from 'react';

type Coordinates = { lat: number; lon: number };

type GpsPosition = Coordinates & {
  accuracy: number | null;
  updatedAt: number;
  source: 'gps' | 'simulated';
};

type UseLiveGpsTrackingOptions = {
  start: Coordinates;
  end: Coordinates;
  simulateStep?: number;
  simulateIntervalMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function useLiveGpsTracking({
  start,
  end,
  simulateStep = 0.05,
  simulateIntervalMs = 3500,
}: UseLiveGpsTrackingOptions) {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const simulatedPosition = useMemo(() => {
    const t = clamp(simulationProgress, 0, 1);
    return {
      lat: lerp(start.lat, end.lat, t),
      lon: lerp(start.lon, end.lon, t),
    };
  }, [start.lat, start.lon, end.lat, end.lon, simulationProgress]);

  useEffect(() => {
    let watchId: number | null = null;
    let simulationTimer: ReturnType<typeof setInterval> | null = null;

    const startSimulation = () => {
      if (simulationTimer) return;
      simulationTimer = setInterval(() => {
        setSimulationProgress((prev) => {
          const next = prev + simulateStep;
          return next >= 1 ? 1 : next;
        });
      }, simulateIntervalMs);
    };

    const stopSimulation = () => {
      if (!simulationTimer) return;
      clearInterval(simulationTimer);
      simulationTimer = null;
    };

    if (!('geolocation' in navigator)) {
      setTrackingError('GPS is not supported on this device. Using simulated tracking.');
      startSimulation();
      return () => stopSimulation();
    }

    setIsTracking(true);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        stopSimulation();
        setTrackingError(null);
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          updatedAt: Date.now(),
          source: 'gps',
        });
      },
      () => {
        setTrackingError('GPS permission denied or unavailable. Using simulated route tracking.');
        startSimulation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 8000,
      }
    );

    return () => {
      stopSimulation();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      setIsTracking(false);
    };
  }, [simulateIntervalMs, simulateStep]);

  const activePosition = position || {
    lat: simulatedPosition.lat,
    lon: simulatedPosition.lon,
    accuracy: null,
    updatedAt: Date.now(),
    source: 'simulated' as const,
  };

  return {
    position: activePosition,
    trackingError,
    isTracking,
  };
}
