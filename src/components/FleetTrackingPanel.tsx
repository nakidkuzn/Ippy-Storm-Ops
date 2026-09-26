import React from 'react';
import { PlowVehicle, ClientSite } from '../types/snowOps';
import { 
  Truck, 
  Fuel, 
  Compass, 
  MapPin, 
  Gauge, 
  Radio, 
  RefreshCw,
  Navigation,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface FleetTrackingPanelProps {
  vehicles: PlowVehicle[];
  sites: ClientSite[];
  selectedVehicleId?: string;
  onSelectVehicle: (vehicle: PlowVehicle) => void;
  onTrackOnMap: (vehicle: PlowVehicle) => void;
  onUpdateVehicleStatus: (vehicleId: string, status: PlowVehicle['status']) => void;
}

export const FleetTrackingPanel: React.FC<FleetTrackingPanelProps> = ({
  vehicles,
  sites,
  selectedVehicleId,
  onSelectVehicle,
  onTrackOnMap,
  onUpdateVehicleStatus,
}) => {
  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 text-neutral-100 w-full select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          <h2 className="font-display font-bold text-base tracking-wide uppercase text-neutral-100">
            Fleet Vehicle Tracking
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-neutral-300">15 Units Operational</span>
        </div>
      </div>

      {/* Fleet Vehicles List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          const assignedSite = sites.find((s) => s.id === vehicle.currentSiteId);

          const statusBadge = 
            vehicle.status === 'plowing' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' :
            vehicle.status === 'salting' ? 'bg-blue-950 text-blue-300 border border-blue-700/60' :
            vehicle.status === 'en-route' ? 'bg-purple-950 text-purple-300 border border-purple-700/60' :
            vehicle.status === 'refilling' ? 'bg-yellow-950 text-yellow-300 border border-yellow-700/60' :
            'bg-neutral-800 text-neutral-400 border border-neutral-700';

          return (
            <div
              key={vehicle.id}
              onClick={() => onSelectVehicle(vehicle)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-neutral-800/90 border-cyan-500 shadow-lg' 
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
              }`}
            >
              {/* Unit Header */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base tracking-wide text-neutral-100">
                      {vehicle.unitNumber}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">
                      {vehicle.driverName}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-snug">
                    {vehicle.name}
                  </div>
                </div>

                {/* Status Dropdown */}
                <select
                  value={vehicle.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateVehicleStatus(vehicle.id, e.target.value as PlowVehicle['status']);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-[10px] font-mono font-bold uppercase rounded px-2 py-0.5 outline-none cursor-pointer ${statusBadge}`}
                >
                  <option value="plowing">PLOWING</option>
                  <option value="salting">SALTING</option>
                  <option value="en-route">EN-ROUTE</option>
                  <option value="refilling">REFILLING</option>
                  <option value="standby">STANDBY</option>
                </select>
              </div>

              {/* Equipment Spec */}
              <div className="text-[10px] font-mono text-neutral-400 mb-2 truncate" title={vehicle.vehicleType}>
                {vehicle.vehicleType}
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-neutral-900/80 p-2 rounded border border-neutral-800/80 text-[10px] font-mono mb-2">
                <div className="flex flex-col">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" /> Speed
                  </span>
                  <span className="text-neutral-200 font-bold tabular-nums">
                    {vehicle.speedMph ?? 0} MPH
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-neutral-400" /> Heading
                  </span>
                  <span className="text-neutral-200 font-bold tabular-nums">
                    {vehicle.headingDeg ?? 0}°
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400" /> Gateway
                  </span>
                  <span className="text-emerald-400 font-semibold truncate">
                    {String(vehicle.samsaraGatewayId || 'VG54').replace('SAM-', '')}
                  </span>
                </div>
              </div>

              {/* Salt Hopper & Fuel Gauges */}
              <div className="space-y-1.5 mb-2.5 text-[10px] font-mono">
                <div>
                  <div className="flex justify-between text-neutral-400 mb-0.5">
                    <span>Salt Hopper Level:</span>
                    <span className="text-blue-300 font-bold tabular-nums">{vehicle.saltHopperPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
                    <div 
                      className={`h-full rounded transition-all duration-500 ${
                        vehicle.saltHopperPercent < 25 ? 'bg-red-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${vehicle.saltHopperPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-0.5">
                    <span>Fuel Reserve:</span>
                    <span className="text-amber-300 font-bold tabular-nums">{vehicle.fuelPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
                    <div 
                      className={`h-full rounded transition-all duration-500 ${
                        vehicle.fuelPercent < 20 ? 'bg-red-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${vehicle.fuelPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment & Map Track Button */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px]">
                <div className="flex items-center gap-1 text-neutral-400 truncate max-w-[190px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {assignedSite ? assignedSite.name : 'Staged / Roaming'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackOnMap(vehicle);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-cyan-400 rounded border border-neutral-700 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Locate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
