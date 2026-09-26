import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClientSite, 
  PlowVehicle, 
  GeofenceZone, 
  WeatherReport, 
  StormAlert, 
  OperationStats,
  SiteStatus 
} from './types/snowOps';
import { 
  generate113Sites, 
  INITIAL_PLOW_VEHICLES, 
  INITIAL_GEOFENCE_ZONES, 
  INITIAL_ALERTS 
} from './data/snowOpsData';
import { fetchLiveBostonWeather } from './services/weatherService';
import { 
  playTacticalAlertSound, 
  setAudioMuted, 
  getAudioMuted 
} from './services/audioAlertService';

import { TopHeader } from './components/TopHeader';
import { StatsBar } from './components/StatsBar';
import { OperationsMap } from './components/OperationsMap';
import { SiteListPanel } from './components/SiteListPanel';
import { FleetTrackingPanel } from './components/FleetTrackingPanel';
import { WeatherWidget } from './components/WeatherWidget';
import { AlertLogDrawer } from './components/AlertLogDrawer';
import { SamsaraModal } from './components/SamsaraModal';
import { BackBaySatelliteComms } from './components/BackBaySatelliteComms';

export default function App() {
  // Main operational state
  const [sites, setSites] = useState<ClientSite[]>(() => generate113Sites());
  const [vehicles, setVehicles] = useState<PlowVehicle[]>(INITIAL_PLOW_VEHICLES);
  const [zones] = useState<GeofenceZone[]>(INITIAL_GEOFENCE_ZONES);
  const [alerts, setAlerts] = useState<StormAlert[]>(INITIAL_ALERTS);

  // Weather state & 5-minute auto-refresh countdown
  const [weather, setWeather] = useState<WeatherReport>({
    stationId: 'KBOS (Logan / Boston & Everett)',
    locationName: 'Everett & Greater Boston',
    temperatureF: 27,
    conditionText: 'Moderate Snow & Gusty Winds',
    windSpeedMph: 22,
    windDirection: 'NNE',
    windGustMph: 36,
    windChillF: 15,
    snowIntensity: 'Heavy Snowfall',
    snowAccumulationInches: 5.6,
    expectedStormTotalInches: 10.0,
    roadTempF: 25,
    advisoryHeadline: 'NWS Winter Storm Warning in effect. Snow accumulation rates 1.0-1.5 in/hr.',
    lastUpdated: '14:00:00 EST',
    isLiveNWS: true,
  });
  const [weatherCountdown, setWeatherCountdown] = useState<number>(300); // 5 mins in seconds
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Navigation & selection
  const [activeTab, setActiveTab] = useState<'map' | 'sites' | 'fleet' | 'weather' | 'satellite-comms'>('map');
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>('site-001');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>('v-01');

  // Drawer / Modal states
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isSamsaraModalOpen, setIsSamsaraModalOpen] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');

  // Notification Toast for instant alert display
  const [toastAlert, setToastAlert] = useState<StormAlert | null>(null);

  // Audio mute handler
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMutedState(nextMuted);
    setAudioMuted(nextMuted);
  };

  // Weather Fetch function
  const refreshWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchLiveBostonWeather();
      setWeather(data);
      setWeatherCountdown(300); // Reset 5-min timer
    } catch {
      // Handled in weather service
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Fetch initial live weather on mount
  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  // 5-minute weather countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherCountdown((prev) => {
        if (prev <= 1) {
          refreshWeather();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshWeather]);

  // Dispatch an automated alert
  const dispatchAlert = useCallback((newAlert: Omit<StormAlert, 'id' | 'timestamp' | 'read'>) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' EST';
    const alert: StormAlert = {
      ...newAlert,
      id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      read: false,
    };

    setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    setToastAlert(alert);

    // Audio cue
    if (alert.type === 'zone_cleared') {
      playTacticalAlertSound('zone_cleared');
    } else if (alert.type === 'site_cleared') {
      playTacticalAlertSound('site_cleared');
    } else if (alert.severity === 'critical') {
      playTacticalAlertSound('warning');
    } else {
      playTacticalAlertSound('radar_ping');
    }

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setToastAlert((curr) => (curr?.id === alert.id ? null : curr));
    }, 6000);
  }, []);

  // Update site status and trigger automated geofence clearance checks
  const handleUpdateSiteStatus = useCallback((siteId: string, newStatus: SiteStatus) => {
    setSites((prevSites) => {
      const target = prevSites.find((s) => s.id === siteId);
      if (!target) return prevSites;

      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' EST';

      const updatedSites = prevSites.map((s) => {
        if (s.id === siteId) {
          return {
            ...s,
            status: newStatus,
            completedAt: newStatus === 'completed' ? nowTime : s.completedAt,
            passCount: newStatus === 'completed' ? Math.max(s.passCount, 1) : s.passCount,
          };
        }
        return s;
      });

      // Automated alert when a site is marked completed
      if (newStatus === 'completed' && target.status !== 'completed') {
        const assignedTruck = vehicles.find((v) => v.id === target.assignedTruckId);
        dispatchAlert({
          type: 'site_cleared',
          title: `Site Cleared: ${target.name}`,
          message: `${target.address}, ${target.city} marked cleared & salted by ${assignedTruck ? assignedTruck.unitNumber : 'Field Crew'}.`,
          severity: 'success',
          siteId: target.id,
          zoneId: target.zone,
        });

        // Check if all sites in the zone are now cleared
        const zoneSites = updatedSites.filter((s) => s.zone === target.zone);
        const allZoneComplete = zoneSites.every((s) => s.status === 'completed');
        if (allZoneComplete && zoneSites.length > 0) {
          const zoneObj = zones.find((z) => z.id === target.zone);
          dispatchAlert({
            type: 'zone_cleared',
            title: `GEOFENCE CLEARED: [${zoneObj?.name || target.zone.toUpperCase()}] 100% COMPLETE!`,
            message: `All ${zoneSites.length} commercial and industrial sites in this priority sector have been cleared and de-iced!`,
            severity: 'critical',
            zoneId: target.zone,
          });
        }
      }

      return updatedSites;
    });
  }, [vehicles, zones, dispatchAlert]);

  // Increment pass count
  const handleIncrementPass = useCallback((siteId: string) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const newPass = s.passCount + 1;
          return {
            ...s,
            passCount: newPass,
            status: newPass >= 2 ? 'completed' : 'in-progress',
          };
        }
        return s;
      })
    );
  }, []);

  // Assign plow truck to site
  const handleAssignTruck = useCallback((siteId: string, truckId: string) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, assignedTruckId: truckId || undefined } : s))
    );
    if (truckId) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === truckId ? { ...v, currentSiteId: siteId } : v))
      );
    }
  }, []);

  // Update vehicle status
  const handleUpdateVehicleStatus = useCallback((vehicleId: string, status: PlowVehicle['status']) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status } : v))
    );
  }, []);

  // Real-time GPS Simulation Loop (Nudges plow trucks along Everett / Boston corridors & simulates site progress)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const now = new Date();
      setLastPingTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' EST');

      // Randomly update a few vehicles' position, speed and heading
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          // If vehicle is refilling, keep at depo
          if (vehicle.status === 'refilling') return vehicle;

          // Tiny GPS jitter / road progress (~15-30 meters)
          const angleRad = (vehicle.headingDeg * Math.PI) / 180;
          const deltaLat = Math.cos(angleRad) * 0.00035;
          const deltaLng = Math.sin(angleRad) * 0.00035;

          let newHeading = vehicle.headingDeg;
          if (Math.random() < 0.2) {
            newHeading = (vehicle.headingDeg + (Math.random() > 0.5 ? 25 : -25) + 360) % 360;
          }

          // Gentle speed variation
          const speedDelta = Math.floor((Math.random() - 0.5) * 4);
          const newSpeed = Math.max(5, Math.min(26, vehicle.speedMph + speedDelta));

          // Decrement salt hopper slowly when plowing/salting
          const hopperDelta = vehicle.status === 'salting' ? 0.3 : vehicle.status === 'plowing' ? 0.1 : 0;
          const newHopper = Math.max(12, Math.round(vehicle.saltHopperPercent - hopperDelta));

          return {
            ...vehicle,
            lat: Number((vehicle.lat + deltaLat).toFixed(5)),
            lng: Number((vehicle.lng + deltaLng).toFixed(5)),
            headingDeg: newHeading,
            speedMph: newSpeed,
            saltHopperPercent: newHopper,
            lastPingTime: 'Just now',
          };
        })
      );

      // Periodically trigger a simulated geofence arrival or site progress (every ~20s)
      if (Math.random() < 0.12) {
        setSites((currentSites) => {
          const pendingSites = currentSites.filter((s) => s.status === 'pending');
          if (pendingSites.length > 0) {
            const randomPending = pendingSites[Math.floor(Math.random() * pendingSites.length)];
            const availableTruck = INITIAL_PLOW_VEHICLES[Math.floor(Math.random() * INITIAL_PLOW_VEHICLES.length)];

            dispatchAlert({
              type: 'geofence_entry',
              title: `Geofence Arrival: ${availableTruck.unitNumber}`,
              message: `${availableTruck.unitNumber} (${availableTruck.driverName.split(' ')[0]}) arrived inside geofence for ${randomPending.name}. Commencing first push pass.`,
              severity: 'info',
              siteId: randomPending.id,
              zoneId: randomPending.zone,
            });

            return currentSites.map((s) =>
              s.id === randomPending.id
                ? { ...s, status: 'in-progress', assignedTruckId: availableTruck.id, passCount: 1 }
                : s
            );
          }
          return currentSites;
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, dispatchAlert]);

  // Calculate live operational metrics
  const stats: OperationStats = useMemo(() => {
    const total = sites.length;
    const completed = sites.filter((s) => s.status === 'completed').length;
    const inProgress = sites.filter((s) => s.status === 'in-progress').length;
    const pending = sites.filter((s) => s.status === 'pending').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeVehicles = vehicles.filter((v) => v.status !== 'standby').length;

    // Estimate salt deployed based on square footage & passes
    const totalPlowedSqft = sites.reduce((acc, s) => {
      const sqft = Number(s?.squareFootage) || 80000;
      const pass = Number(s?.passCount) || 1;
      return acc + (s?.status === 'completed' ? sqft * pass : s?.status === 'in-progress' ? sqft * 0.5 : 0);
    }, 0);
    const saltTonsSpread = Math.min(85, Math.max(12, Number((totalPlowedSqft / 500000).toFixed(1))));

    return {
      totalSites: total,
      completedSites: completed,
      inProgressSites: inProgress,
      pendingSites: pending,
      completionPercentage,
      activeVehicles,
      totalVehicles: vehicles.length,
      saltTonsSpread,
      saltTonsRemaining: Math.max(0, 100 - saltTonsSpread),
      stormDurationHours: 6.5,
    };
  }, [sites, vehicles]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Address', 'City', 'Latitude', 'Longitude', 'Status', 'Priority', 'Zone', 'GeofenceRadiusMeters', 'PassCount', 'CompletedAt', 'SquareFootage', 'AssignedTruck'];
    const rows = sites.map((s) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.address.replace(/"/g, '""')}"`,
      `"${s.city.replace(/"/g, '""')}"`,
      s.lat,
      s.lng,
      s.status,
      s.priority,
      s.zone,
      s.geofenceRadiusMeters,
      s.passCount,
      `"${s.completedAt || ''}"`,
      s.squareFootage,
      s.assignedTruckId || 'Unassigned',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `everett_snowops_manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset simulation state
  const handleResetSim = () => {
    setSites(generate113Sites());
    setVehicles(INITIAL_PLOW_VEHICLES);
    dispatchAlert({
      type: 'system',
      title: 'Storm Manifest Reset',
      message: 'Client site status and fleet vehicle coordinates reset to initial storm deployment.',
      severity: 'info',
    });
  };

  // Trigger test geofence alert
  const handleTriggerTestAlert = () => {
    const sampleSites = sites.filter((s) => s.zone === 'north');
    const target = sampleSites[Math.floor(Math.random() * sampleSites.length)];
    dispatchAlert({
      type: 'zone_cleared',
      title: `GEOFENCE CLEARED: [Everett Commercial Core] 100%`,
      message: `Automated geofence verification confirmed: Everett Gateway Plaza corridor has been cleared of snow accumulation.`,
      severity: 'success',
      siteId: target?.id,
      zoneId: 'north',
    });
  };

  const activeAlertCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Tactical Top Bar Contract */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        toggleMute={handleToggleMute}
        isSimulating={isSimulating}
        toggleSimulation={() => setIsSimulating(!isSimulating)}
        onOpenSamsara={() => setIsSamsaraModalOpen(true)}
        onExportCsv={handleExportCsv}
        onTriggerTestAlert={handleTriggerTestAlert}
        activeAlertCount={activeAlertCount}
        onToggleAlertDrawer={() => setIsAlertDrawerOpen(true)}
        onResetSim={handleResetSim}
      />

      {/* Live Operational Metrics & Telemetry Bar */}
      <StatsBar
        stats={stats}
        weather={weather}
        lastPingTime={lastPingTime}
        nextWeatherCountdown={weatherCountdown}
      />

      {/* Pop-up Alert Toast Notification */}
      {toastAlert && (
        <div className="absolute top-24 right-4 z-[2500] max-w-sm bg-neutral-900 border border-amber-500/80 rounded-lg p-3 shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0 animate-ping" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-neutral-100 font-display text-sm tracking-wide">
              {toastAlert.title}
            </div>
            <div className="text-neutral-300 mt-0.5 leading-snug">
              {toastAlert.message}
            </div>
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="text-neutral-500 hover:text-neutral-200 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Desktop Split View or Full Tab Switcher */}
        {activeTab === 'map' ? (
          <div className="w-full h-full flex flex-col lg:flex-row relative">
            {/* Map Canvas (Dominant View) */}
            <div className="flex-1 h-full relative">
              <OperationsMap
                sites={sites}
                vehicles={vehicles}
                zones={zones}
                selectedSiteId={selectedSiteId}
                selectedVehicleId={selectedVehicleId}
                onSelectSite={(site) => setSelectedSiteId(site.id)}
                onSelectVehicle={(veh) => setSelectedVehicleId(veh.id)}
                onUpdateSiteStatus={handleUpdateSiteStatus}
                onAssignTruck={handleAssignTruck}
              />
            </div>

            {/* Collapsible Quick Sidebar on Desktop for rapid site operations */}
            <div className="hidden xl:block w-96 h-full z-10 shadow-2xl">
              <SiteListPanel
                sites={sites}
                vehicles={vehicles}
                selectedSiteId={selectedSiteId}
                onSelectSite={(site) => setSelectedSiteId(site.id)}
                onUpdateSiteStatus={handleUpdateSiteStatus}
                onIncrementPass={handleIncrementPass}
                onAssignTruck={handleAssignTruck}
              />
            </div>
          </div>
        ) : activeTab === 'sites' ? (
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
            <SiteListPanel
              sites={sites}
              vehicles={vehicles}
              selectedSiteId={selectedSiteId}
              onSelectSite={(site) => {
                setSelectedSiteId(site.id);
                setActiveTab('map');
              }}
              onUpdateSiteStatus={handleUpdateSiteStatus}
              onIncrementPass={handleIncrementPass}
              onAssignTruck={handleAssignTruck}
            />
          </div>
        ) : activeTab === 'fleet' ? (
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
            <FleetTrackingPanel
              vehicles={vehicles}
              sites={sites}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
              onTrackOnMap={(v) => {
                setSelectedVehicleId(v.id);
                setActiveTab('map');
              }}
              onUpdateVehicleStatus={handleUpdateVehicleStatus}
            />
          </div>
        ) : activeTab === 'satellite-comms' ? (
          <div className="w-full h-full flex flex-col">
            <BackBaySatelliteComms onClose={() => setActiveTab('map')} />
          </div>
        ) : (
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
            <WeatherWidget
              weather={weather}
              countdownSeconds={weatherCountdown}
              onRefreshWeather={refreshWeather}
              isLoading={isWeatherLoading}
            />
          </div>
        )}
      </main>

      {/* Slide-out Alert Drawer */}
      <AlertLogDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onClearAlerts={() => setAlerts([])}
        onMarkAllRead={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
        onTriggerTestAlert={handleTriggerTestAlert}
        isMuted={isMuted}
        toggleMute={handleToggleMute}
      />

      {/* Samsara Integration & Custom Site Modal */}
      <SamsaraModal
        isOpen={isSamsaraModalOpen}
        onClose={() => setIsSamsaraModalOpen(false)}
        sites={sites}
        vehicles={vehicles}
        onImportVehicles={(newVehicles) => {
          setVehicles(newVehicles);
          setIsSamsaraModalOpen(false);
          dispatchAlert({
            type: 'system',
            title: 'Samsara Fleet Telematics Connected',
            message: `Loaded ${newVehicles.length} live Samsara vehicles with GPS telemetry into command map.`,
            severity: 'success',
          });
        }}
        onImportSites={(newSites) => {
          setSites(newSites);
          setIsSamsaraModalOpen(false);
          dispatchAlert({
            type: 'system',
            title: 'Client Sites & Geofences Loaded',
            message: `${newSites.length} client sites loaded into live dispatch console.`,
            severity: 'success',
          });
        }}
      />
    </div>
  );
}
