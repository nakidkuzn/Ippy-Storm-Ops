import React, { useState } from 'react';
import { ClientSite, PlowVehicle } from '../types/snowOps';
import { parseSamsaraOrCustomData, ParseResult } from '../utils/samsaraParser';
import { 
  X, 
  Radio, 
  CheckCircle2, 
  Key, 
  UploadCloud, 
  Download, 
  FileText, 
  Server, 
  RefreshCw,
  AlertTriangle,
  Truck,
  Building2,
  Sparkles,
  Info
} from 'lucide-react';

interface SamsaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: ClientSite[];
  vehicles: PlowVehicle[];
  onImportSites: (importedSites: ClientSite[]) => void;
  onImportVehicles: (importedVehicles: PlowVehicle[]) => void;
}

export const SamsaraModal: React.FC<SamsaraModalProps> = ({
  isOpen,
  onClose,
  sites,
  vehicles,
  onImportSites,
  onImportVehicles,
}) => {
  const [apiKey, setApiKey] = useState('samsara_api_live_***b891fc');
  const [syncRate, setSyncRate] = useState('5');
  const [geofenceWebhookEnabled, setGeofenceWebhookEnabled] = useState(true);
  const [customDataText, setCustomDataText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [targetType, setTargetType] = useState<'auto' | 'sites' | 'vehicles'>('auto');
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveApiMessage, setLiveApiMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time analysis of whatever the user pastes into the textarea
  const handleTextChange = (text: string) => {
    setCustomDataText(text);
    if (!text.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseSamsaraOrCustomData(text);
    setParseResult(result);
  };

  // Export current 113 sites to CSV
  const handleDownloadSitesCsv = () => {
    const headers = ['ID', 'Name', 'Address', 'City', 'Latitude', 'Longitude', 'Status', 'Priority', 'Zone', 'GeofenceRadiusMeters', 'PassCount', 'SquareFootage', 'AssignedTruck'];
    const rows = sites.map(s => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${(s.city || '').replace(/"/g, '""')}"`,
      s.lat,
      s.lng,
      s.status,
      s.priority,
      s.zone,
      s.geofenceRadiusMeters,
      s.passCount,
      s.squareFootage,
      s.assignedTruckId || 'Unassigned'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `snowops_sites_manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current 15 vehicles to CSV
  const handleDownloadVehiclesCsv = () => {
    const headers = ['ID', 'UnitNumber', 'Name', 'Driver', 'VehicleType', 'Status', 'Latitude', 'Longitude', 'SpeedMPH', 'HeadingDeg', 'SaltHopperPercent', 'FuelPercent', 'GatewaySerial'];
    const rows = vehicles.map(v => [
      v.id,
      `"${v.unitNumber}"`,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.driverName.replace(/"/g, '""')}"`,
      `"${v.vehicleType.replace(/"/g, '""')}"`,
      v.status,
      v.lat,
      v.lng,
      v.speedMph,
      v.headingDeg,
      v.saltHopperPercent,
      v.fuelPercent,
      v.samsaraGatewayId
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `samsara_vehicles_telematics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Real Samsara Vehicle API Example
  const handleLoadSampleVehicleData = () => {
    const sampleSamsaraVehiclesJson = JSON.stringify({
      data: [
        {
          id: "281474977051201",
          name: "UNIT-01 (Western Star 47X)",
          driver: { name: "M. Sullivan" },
          vehicleType: "Heavy Spreader V-Plow",
          location: {
            latitude: 42.4112,
            longitude: -71.0580,
            heading: 45,
            speed: 14.5,
            time: "2026-09-26T14:10:00Z",
            reverseGeo: { formattedLocation: "Everett, MA" }
          },
          fuelPercent: { value: 92 },
          saltHopperPercent: 80,
          gateway: { serial: "SAM-VG54-8841" }
        },
        {
          id: "281474977051202",
          name: "UNIT-02 (Ford F-550)",
          driver: { name: "D. Callahan" },
          vehicleType: "10ft Expandable XLS Plow",
          location: {
            latitude: 42.4045,
            longitude: -71.0498,
            heading: 120,
            speed: 11.0,
            time: "2026-09-26T14:10:00Z",
            reverseGeo: { formattedLocation: "Everett, MA" }
          },
          fuelPercent: { value: 78 },
          saltHopperPercent: 64,
          gateway: { serial: "SAM-VG54-8842" }
        },
        {
          id: "281474977051204",
          name: "UNIT-04 (Chevy 3500HD)",
          driver: { name: "T. McLaughlin" },
          vehicleType: "BOSS DXT Poly V-Plow",
          location: {
            latitude: 42.3468,
            longitude: -71.0360,
            heading: 95,
            speed: 12.0,
            time: "2026-09-26T14:10:00Z",
            reverseGeo: { formattedLocation: "Boston Seaport, MA" }
          },
          fuelPercent: { value: 88 },
          saltHopperPercent: 70,
          gateway: { serial: "SAM-VG54-8844" }
        }
      ]
    }, null, 2);

    handleTextChange(sampleSamsaraVehiclesJson);
  };

  // Load Real Samsara Address / Geofence API Example
  const handleLoadSampleAddressData = () => {
    const sampleSamsaraAddressesJson = JSON.stringify({
      data: [
        {
          id: "addr_1001",
          name: "Everett Gateway Center Hub",
          formattedAddress: "1 Mystic View Rd, Everett, MA 02149",
          geofence: {
            circle: {
              latitude: 42.4110,
              longitude: -71.0615,
              radiusMeters: 180
            }
          },
          tags: [{ name: "North District" }],
          notes: "Main anchor plaza. Keep truck docks clear.",
          squareFootage: 260000,
          status: "in-progress"
        },
        {
          id: "addr_1002",
          name: "Boston Marine Industrial Park Pier 5",
          formattedAddress: "21 Drydock Ave, Boston, MA 02210",
          geofence: {
            circle: {
              latitude: 42.3450,
              longitude: -71.0310,
              radiusMeters: 190
            }
          },
          tags: [{ name: "Seaport District" }],
          notes: "Bulkhead apron de-icing mandatory.",
          squareFootage: 310000,
          status: "completed"
        },
        {
          id: "addr_1003",
          name: "Assembly Row Commercial Plaza",
          formattedAddress: "300 Grand Union Blvd, Somerville, MA 02145",
          geofence: {
            circle: {
              latitude: 42.3910,
              longitude: -71.0795,
              radiusMeters: 170
            }
          },
          tags: [{ name: "Cambridge-Somerville" }],
          notes: "Zero ice tolerance on curb ramps.",
          squareFootage: 240000,
          status: "pending"
        }
      ]
    }, null, 2);

    handleTextChange(sampleSamsaraAddressesJson);
  };

  // Apply parsed data to live state
  const handleApplyData = () => {
    if (!parseResult) return;

    const resolvedType = targetType === 'auto' ? parseResult.type : targetType;

    if (resolvedType === 'vehicles' && parseResult.vehicles && parseResult.vehicles.length > 0) {
      onImportVehicles(parseResult.vehicles);
      onClose();
    } else if (parseResult.sites && parseResult.sites.length > 0) {
      onImportSites(parseResult.sites);
      onClose();
    }
  };

  // Safe live API fetch from Samsara endpoint
  const handleFetchLiveSamsara = async () => {
    setIsFetchingLive(true);
    setLiveApiMessage(null);

    try {
      // In web preview sandboxes, direct Samsara calls to api.samsara.com may fail CORS
      // We attempt the request with abort controller, and provide a clear status
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://api.samsara.com/fleet/vehicles/locations', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Samsara API HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const text = JSON.stringify(data, null, 2);
      handleTextChange(text);
      setLiveApiMessage(`Successfully fetched live telematics for ${data.data?.length || 0} vehicles!`);
    } catch (err: any) {
      // Graceful error display without crashing
      setLiveApiMessage(`Direct Samsara API request failed: ${err.message}. To import your live data, copy the JSON or CSV export from your Samsara dashboard and paste it into the box below.`);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const detectedType = parseResult?.type || 'unknown';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-100 uppercase tracking-wide">
                Samsara Fleet API & Custom Data Importer
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Universal parser for Samsara API JSON, CSV exports, vehicle telematics & client site geofences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-neutral-200 font-sans">
          {/* Section 1: Live Samsara Cloud Connection */}
          <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold uppercase text-neutral-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" /> Samsara Telematics Cloud Feed
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 font-mono text-[10px] font-bold">
                TELEMATICS READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase">Samsara API Access Token</label>
                <div className="relative mt-1">
                  <Key className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded pl-8 pr-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase">GPS Ping Frequency</label>
                <select
                  value={syncRate}
                  onChange={(e) => setSyncRate(e.target.value)}
                  className="w-full mt-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="5">Every 5 seconds (Real-Time Snow Push)</option>
                  <option value="15">Every 15 seconds (Standard Route)</option>
                  <option value="30">Every 30 seconds (Eco Telematics)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80 font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geofenceWebhookEnabled}
                  onChange={(e) => setGeofenceWebhookEnabled(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0"
                />
                <span className="text-neutral-300 text-[11px]">
                  Automate geofence arrival alerts when vehicles enter within 150m
                </span>
              </label>

              <button
                onClick={handleFetchLiveSamsara}
                disabled={isFetchingLive}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 rounded text-xs font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
                <span>Sync Live Samsara API</span>
              </button>
            </div>

            {liveApiMessage && (
              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{liveApiMessage}</span>
              </div>
            )}
          </div>

          {/* Section 2: Universal Import / Paste Box */}
          <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-bold uppercase text-neutral-200 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-cyan-400" /> Paste Real Samsara Data (JSON or CSV)
              </span>

              {/* Sample loaders */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <button
                  onClick={handleLoadSampleVehicleData}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-800/60 rounded"
                >
                  Load Sample Vehicles
                </button>
                <button
                  onClick={handleLoadSampleAddressData}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-blue-300 border border-blue-800/60 rounded"
                >
                  Load Sample Sites
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Paste raw JSON from Samsara's API (e.g. <code className="text-cyan-400 font-mono">/fleet/vehicles/locations</code> or <code className="text-cyan-400 font-mono">/addresses</code>) or CSV export. Our smart parser automatically detects whether you are importing <strong>Fleet Trucks</strong> or <strong>Client Sites</strong>, normalizes coordinates, and applies them cleanly without breaking the map.
            </p>

            {/* Target Type Selector */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-neutral-400">Import As:</span>
              <button
                onClick={() => setTargetType('auto')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  targetType === 'auto' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Auto-Detect
              </button>
              <button
                onClick={() => setTargetType('vehicles')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  targetType === 'vehicles' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Fleet Vehicles ({vehicles.length})
              </button>
              <button
                onClick={() => setTargetType('sites')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  targetType === 'sites' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Client Sites ({sites.length})
              </button>
            </div>

            <textarea
              value={customDataText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='Paste Samsara JSON {"data": [...]} or CSV records here...'
              rows={6}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-cyan-500"
            />

            {/* Parse Status & Validation Feedback */}
            {parseResult && (
              <div className={`p-3 rounded border font-mono text-xs space-y-1.5 ${
                parseResult.validCount > 0 ? 'bg-neutral-900 border-cyan-800/80 text-cyan-300' : 'bg-red-950/60 border-red-800 text-red-300'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {parseResult.validCount > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span>
                      {parseResult.type === 'vehicles' ? 'Detected: Samsara Fleet Vehicle Telematics' :
                       parseResult.type === 'sites' ? 'Detected: Client Sites & Geofences' :
                       'Unknown Data Format'}
                    </span>
                  </span>
                  <span className="text-neutral-300">
                    {parseResult.validCount} valid records recognized (from {parseResult.rawCount} items)
                  </span>
                </div>

                {parseResult.errors.length > 0 && (
                  <div className="text-[10px] text-amber-400/90 pt-1 border-t border-neutral-800">
                    Warnings / notes: {parseResult.errors.slice(0, 3).join(' · ')}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSitesCsv}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup Sites (CSV)</span>
                </button>
                <button
                  onClick={handleDownloadVehiclesCsv}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup Fleet (CSV)</span>
                </button>
              </div>

              <button
                onClick={handleApplyData}
                disabled={!parseResult || parseResult.validCount === 0}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-neutral-950 font-bold font-mono rounded text-xs transition-colors shadow-lg"
              >
                Apply Real Samsara Data to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono rounded transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
