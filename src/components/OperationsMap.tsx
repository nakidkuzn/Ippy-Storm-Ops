import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ClientSite, PlowVehicle, GeofenceZone, DistrictZoneId } from '../types/snowOps';
import { 
  Crosshair, 
  Layers, 
  MapPin, 
  Truck, 
  CloudRain, 
  Maximize2,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface OperationsMapProps {
  sites: ClientSite[];
  vehicles: PlowVehicle[];
  zones: GeofenceZone[];
  selectedSiteId?: string;
  selectedVehicleId?: string;
  onSelectSite: (site: ClientSite) => void;
  onSelectVehicle: (vehicle: PlowVehicle) => void;
  onUpdateSiteStatus: (siteId: string, status: 'completed' | 'in-progress' | 'pending') => void;
  onAssignTruck: (siteId: string, truckId: string) => void;
}

export const OperationsMap: React.FC<OperationsMapProps> = ({
  sites,
  vehicles,
  zones,
  selectedSiteId,
  selectedVehicleId,
  onSelectSite,
  onSelectVehicle,
  onUpdateSiteStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);
  const vehiclesLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [showSites, setShowSites] = React.useState(true);
  const [showVehicles, setShowVehicles] = React.useState(true);
  const [showZones, setShowZones] = React.useState(true);
  const [showRadar, setShowRadar] = React.useState(false);
  const [activeZoneFilter, setActiveZoneFilter] = React.useState<DistrictZoneId | 'all'>('all');

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered between Everett and Boston Harbor
    const map = L.map(mapContainerRef.current, {
      center: [42.3850, -71.0500],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 18,
    });

    // High performance CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right for tactical layout
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    sitesLayerRef.current = L.layerGroup().addTo(map);
    vehiclesLayerRef.current = L.layerGroup().addTo(map);

    // Weather radar layer (RainViewer latest radar layer)
    const radarTile = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_5/256/{z}/{x}/{y}/2/1_1.png', {
      opacity: 0.55,
      zIndex: 10,
    });
    radarLayerRef.current = radarTile;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Zones Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = zonesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!showZones) return;

    zones.forEach((zone) => {
      if (activeZoneFilter !== 'all' && zone.id !== activeZoneFilter) return;

      // Calculate completion % for this specific zone
      const zoneSites = sites.filter((s) => s.zone === zone.id);
      const completedZoneSites = zoneSites.filter((s) => s.status === 'completed').length;
      const zonePercent = zoneSites.length > 0 ? Math.round((completedZoneSites / zoneSites.length) * 100) : 0;

      // Geofence Circle
      const circle = L.circle([zone.centerLat, zone.centerLng], {
        radius: zone.radiusMeters,
        color: zone.color,
        weight: 2,
        dashArray: '6, 6',
        fillColor: zone.color,
        fillOpacity: 0.08,
      });

      // Geofence Zone Label Badge
      const zoneIcon = L.divIcon({
        className: 'geofence-label',
        html: `
          <div style="transform: translate(-50%, -50%);" class="pointer-events-none text-center">
            <div class="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border border-neutral-700 bg-neutral-900/90 text-neutral-100 shadow-md inline-block whitespace-nowrap">
              <span style="color: ${zone.color}">●</span> ${zone.district} · <span class="${zonePercent === 100 ? 'text-emerald-400' : 'text-neutral-300'}">${zonePercent}%</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const labelMarker = L.marker([zone.centerLat, zone.centerLng], {
        icon: zoneIcon,
        interactive: false,
      });

      circle.bindTooltip(
        `<b>${zone.name}</b><br/>${zoneSites.length} Client Sites (${completedZoneSites} cleared - ${zonePercent}%)`,
        { className: 'text-xs font-mono', direction: 'top' }
      );

      layer.addLayer(circle);
      layer.addLayer(labelMarker);
    });
  }, [zones, sites, showZones, activeZoneFilter]);

  // Update Sites Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = sitesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!showSites) return;

    sites.forEach((site) => {
      if (!site) return;
      const lat = Number(site.lat);
      const lng = Number(site.lng);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      if (activeZoneFilter !== 'all' && site.zone !== activeZoneFilter) return;

      const isSelected = selectedSiteId === site.id;

      // Colors based on requested specification:
      // green = completed, orange = in-progress, yellow = pending
      let markerBg = '#eab308'; // yellow pending
      let markerBorder = '#ca8a04';
      let ringHtml = '';

      if (site.status === 'completed') {
        markerBg = '#10b981'; // emerald green
        markerBorder = '#059669';
      } else if (site.status === 'in-progress') {
        markerBg = '#f97316'; // orange in-progress
        markerBorder = '#c2410c';
        ringHtml = `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: #f97316;"></div>`;
      }

      const priorityIndicator = site.priority === 'priority-1' 
        ? '<div class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-neutral-900"></div>' 
        : '';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: 22px; height: 22px;">
          ${ringHtml}
          <div class="relative w-4 h-4 rounded-full border-2 shadow-lg flex items-center justify-center ${isSelected ? 'scale-150 ring-2 ring-cyan-400' : ''}" style="background-color: ${markerBg}; border-color: ${markerBorder};">
            ${priorityIndicator}
          </div>
        </div>
      `;

      const siteIcon = L.divIcon({
        className: 'site-marker-icon',
        html: iconHtml,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: siteIcon });

      // Build Interactive Popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 text-xs font-sans max-w-[280px] bg-neutral-900 text-neutral-100 rounded border border-neutral-800';

      const priorityText = site.priority === 'priority-1' ? 'Priority 1 (Critical)' : site.priority === 'priority-2' ? 'Priority 2 (Commercial)' : 'Priority 3 (Standard)';
      const priorityColor = site.priority === 'priority-1' ? 'text-red-400' : site.priority === 'priority-2' ? 'text-amber-400' : 'text-neutral-400';
      const sqftDisplay = Number(site.squareFootage || 0).toLocaleString();

      popupDiv.innerHTML = `
        <div class="border-b border-neutral-800 pb-2 mb-2">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="font-display font-bold text-sm tracking-wide text-neutral-100 uppercase">${site.name || 'Client Site'}</span>
            <span class="font-mono text-[10px] ${priorityColor}">${priorityText}</span>
          </div>
          <div class="text-[11px] text-neutral-400">${site.address || 'Everett Area'}, ${site.city || 'MA'}</div>
        </div>

        <div class="space-y-1 mb-2.5 text-[11px] font-mono">
          <div class="flex justify-between">
            <span class="text-neutral-400">Current Status:</span>
            <span class="font-bold uppercase ${site.status === 'completed' ? 'text-emerald-400' : site.status === 'in-progress' ? 'text-orange-400' : 'text-yellow-400'}">
              ${site.status || 'pending'} ${site.completedAt ? `(${site.completedAt})` : ''}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-400">Passes Completed:</span>
            <span class="text-neutral-200">${site.passCount || 0} pass(es)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-400">Assigned Unit:</span>
            <span class="text-cyan-400">${site.assignedTruckId ? String(site.assignedTruckId).toUpperCase() : 'Unassigned'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-400">Paved Footprint:</span>
            <span class="text-neutral-300">${sqftDisplay} sq ft</span>
          </div>
          ${site.notes ? `<div class="text-[10px] text-neutral-400 italic pt-1 border-t border-neutral-800">${site.notes}</div>` : ''}
        </div>

        <div class="pt-2 border-t border-neutral-800 flex gap-1.5">
          <button id="btn-complete-${site.id}" class="flex-1 py-1 px-2 rounded text-[11px] font-bold font-mono transition-colors ${site.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'}">
            Mark Done
          </button>
          <button id="btn-prog-${site.id}" class="flex-1 py-1 px-2 rounded text-[11px] font-bold font-mono transition-colors ${site.status === 'in-progress' ? 'bg-orange-950 text-orange-400 border border-orange-600' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'}">
            In-Prog
          </button>
          <button id="btn-pend-${site.id}" class="flex-1 py-1 px-2 rounded text-[11px] font-bold font-mono transition-colors ${site.status === 'pending' ? 'bg-yellow-950 text-yellow-400 border border-yellow-600' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'}">
            Pending
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv, { maxWidth: 300 });

      marker.on('popupopen', () => {
        onSelectSite(site);
        const completeBtn = document.getElementById(`btn-complete-${site.id}`);
        const progBtn = document.getElementById(`btn-prog-${site.id}`);
        const pendBtn = document.getElementById(`btn-pend-${site.id}`);

        if (completeBtn) {
          completeBtn.onclick = (e) => {
            e.stopPropagation();
            onUpdateSiteStatus(site.id, 'completed');
            marker.closePopup();
          };
        }
        if (progBtn) {
          progBtn.onclick = (e) => {
            e.stopPropagation();
            onUpdateSiteStatus(site.id, 'in-progress');
            marker.closePopup();
          };
        }
        if (pendBtn) {
          pendBtn.onclick = (e) => {
            e.stopPropagation();
            onUpdateSiteStatus(site.id, 'pending');
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      layer.addLayer(marker);
    });
  }, [sites, showSites, selectedSiteId, activeZoneFilter, onSelectSite, onUpdateSiteStatus]);

  // Update Vehicles Layer (15 Plow Trucks with Heading Arrow & Pulse)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = vehiclesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!showVehicles) return;

    vehicles.forEach((vehicle) => {
      if (!vehicle) return;
      const lat = Number(vehicle.lat);
      const lng = Number(vehicle.lng);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const isSelected = selectedVehicleId === vehicle.id;

      // Status indicator color
      const statusColor = 
        vehicle.status === 'plowing' ? '#06b6d4' : // cyan
        vehicle.status === 'salting' ? '#3b82f6' : // blue
        vehicle.status === 'en-route' ? '#a855f7' : // purple
        vehicle.status === 'refilling' ? '#eab308' : // yellow
        '#737373'; // gray standby

      const vehicleHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none group" style="width: 32px; height: 32px;">
          <!-- Radar ripple around active plow -->
          <div class="absolute inset-0 rounded-full animate-ping opacity-30" style="background-color: ${statusColor};"></div>
          
          <!-- Outer circular badge with heading orientation -->
          <div class="relative w-8 h-8 rounded-full bg-neutral-900 border-2 shadow-xl flex items-center justify-center transition-transform hover:scale-125 ${isSelected ? 'ring-2 ring-cyan-400 scale-125' : ''}" style="border-color: ${statusColor};">
            <!-- Heading needle indicator -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style="transform: rotate(${vehicle.headingDeg || 0}deg);">
              <div class="w-1.5 h-1.5 -translate-y-3.5 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent" style="border-bottom-color: ${statusColor};"></div>
            </div>
            
            <!-- Plow icon -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
          </div>

          <!-- Unit Pill Tag -->
          <div class="absolute -bottom-3.5 px-1 py-0.2 bg-neutral-950/95 text-[9px] font-mono font-bold rounded border border-neutral-700 whitespace-nowrap pointer-events-none shadow" style="color: ${statusColor};">
            ${vehicle.unitNumber || 'UNIT'}
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: vehicleHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: vehicleIcon });

      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 text-xs font-sans max-w-[280px] bg-neutral-900 text-neutral-100 rounded border border-neutral-800';

      const statusBadge = 
        vehicle.status === 'plowing' ? 'bg-cyan-950 text-cyan-400 border border-cyan-700' :
        vehicle.status === 'salting' ? 'bg-blue-950 text-blue-400 border border-blue-700' :
        vehicle.status === 'en-route' ? 'bg-purple-950 text-purple-400 border border-purple-700' :
        'bg-yellow-950 text-yellow-400 border border-yellow-700';

      popupDiv.innerHTML = `
        <div class="border-b border-neutral-800 pb-2 mb-2">
          <div class="flex items-center justify-between">
            <span class="font-display font-bold text-base text-neutral-100">${vehicle.unitNumber}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${statusBadge}">
              ${vehicle.status}
            </span>
          </div>
          <div class="text-[11px] text-neutral-300 font-semibold mt-0.5">${vehicle.name}</div>
          <div class="text-[11px] text-neutral-400">Driver: <strong class="text-neutral-200">${vehicle.driverName}</strong></div>
        </div>

        <div class="space-y-1.5 text-[11px] font-mono mb-2">
          <div class="flex justify-between">
            <span class="text-neutral-400">Ground Speed:</span>
            <span class="text-neutral-100 font-bold">${vehicle.speedMph} MPH (${vehicle.headingDeg}°)</span>
          </div>
          <div>
            <div class="flex justify-between text-[10px] text-neutral-400 mb-0.5">
              <span>Salt Hopper:</span>
              <span class="text-blue-300">${vehicle.saltHopperPercent}%</span>
            </div>
            <div class="w-full h-1.5 bg-neutral-800 rounded overflow-hidden">
              <div class="h-full bg-blue-500 rounded" style="width: ${vehicle.saltHopperPercent}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[10px] text-neutral-400 mb-0.5">
              <span>Fuel Tank:</span>
              <span class="text-amber-300">${vehicle.fuelPercent}%</span>
            </div>
            <div class="w-full h-1.5 bg-neutral-800 rounded overflow-hidden">
              <div class="h-full bg-amber-500 rounded" style="width: ${vehicle.fuelPercent}%"></div>
            </div>
          </div>
          <div class="flex justify-between pt-1 border-t border-neutral-800">
            <span class="text-neutral-400">Samsara Gateway:</span>
            <span class="text-emerald-400">${vehicle.samsaraGatewayId}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupDiv, { maxWidth: 300 });

      marker.on('click', () => {
        onSelectVehicle(vehicle);
      });

      layer.addLayer(marker);
    });
  }, [vehicles, showVehicles, selectedVehicleId, onSelectVehicle]);

  // Radar layer toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const radar = radarLayerRef.current;
    if (!map || !radar) return;

    if (showRadar) {
      if (!map.hasLayer(radar)) map.addLayer(radar);
    } else {
      if (map.hasLayer(radar)) map.removeLayer(radar);
    }
  }, [showRadar]);

  // Map Navigation shortcuts
  const centerOnEverett = () => {
    mapInstanceRef.current?.flyTo([42.4085, -71.0535], 14, { duration: 1.2 });
  };

  const centerOnSeaport = () => {
    mapInstanceRef.current?.flyTo([42.3482, -71.0378], 14, { duration: 1.2 });
  };

  const fitAllSites = () => {
    if (!mapInstanceRef.current || sites.length === 0) return;
    const validSites = sites.filter((s) => s && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng)) && Number(s.lat) !== 0 && Number(s.lng) !== 0);
    if (validSites.length === 0) return;
    const bounds = L.latLngBounds(validSites.map((s) => [Number(s.lat), Number(s.lng)]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col overflow-hidden">
      {/* Tactical Map Control Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-lg border border-neutral-800 shadow-xl max-w-[calc(100%-24px)]">
        {/* Quick District Focus */}
        <button
          onClick={centerOnEverett}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 transition-colors"
          title="Focus on Everett Commercial Core"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Everett HQ</span>
        </button>

        <button
          onClick={centerOnSeaport}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-neutral-700 transition-colors"
          title="Focus on Boston Seaport Hot Zone"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Seaport</span>
        </button>

        <button
          onClick={fitAllSites}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
          title="Zoom out to show all 113 sites"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fit All Sites</span>
        </button>

        <div className="h-4 w-px bg-neutral-700 mx-1 hidden sm:block" />

        {/* Layer Toggles */}
        <button
          onClick={() => setShowSites(!showSites)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors ${
            showSites ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle 113 client sites"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Sites</span>
        </button>

        <button
          onClick={() => setShowVehicles(!showVehicles)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors ${
            showVehicles ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle 15 plow trucks"
        >
          <Truck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Fleet</span>
        </button>

        <button
          onClick={() => setShowZones(!showZones)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors ${
            showZones ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle Geofence Hot Zones"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Hot Zones</span>
        </button>

        <button
          onClick={() => setShowRadar(!showRadar)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors ${
            showRadar ? 'bg-blue-950 text-blue-300 border border-blue-600' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle Doppler Weather Radar Overlay"
        >
          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Live Radar</span>
        </button>

        {/* Zone Selector */}
        <select
          value={activeZoneFilter}
          onChange={(e) => setActiveZoneFilter(e.target.value as DistrictZoneId | 'all')}
          className="bg-neutral-800 text-neutral-200 text-xs font-mono py-1 px-2 rounded border border-neutral-700 outline-none cursor-pointer"
        >
          <option value="all">All Districts (113 Sites)</option>
          <option value="north">North: Everett / Mystic</option>
          <option value="seaport">Seaport: Boston Harbor</option>
          <option value="cambridge-somerville">Cambridge / Somerville</option>
          <option value="metro-boston">Metro Boston / Airport</option>
        </select>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded border border-neutral-800 text-[11px] font-mono text-neutral-300 space-y-1 shadow-lg pointer-events-auto">
        <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
          Tactical Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Completed Site (Cleared & Salted)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse"></span>
          <span>In-Progress (Plow On-Site)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
          <span>Pending (Queued for Dispatch)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
          <span className="w-3 h-3 rounded-full border border-cyan-400 bg-neutral-900 inline-flex items-center justify-center text-[8px] text-cyan-400">▲</span>
          <span>Active Plow Vehicle & Heading</span>
        </div>
      </div>

      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
