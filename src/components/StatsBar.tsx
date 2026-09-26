import React from 'react';
import { OperationStats, WeatherReport } from '../types/snowOps';
import { CheckCircle2, Clock, AlertCircle, Truck, Wind, Droplets, Thermometer, ShieldAlert } from 'lucide-react';

interface StatsBarProps {
  stats: OperationStats;
  weather: WeatherReport;
  lastPingTime: string;
  nextWeatherCountdown: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  weather,
  lastPingTime,
  nextWeatherCountdown,
}) => {
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-neutral-900/95 border-b border-neutral-800 text-neutral-200 px-4 py-2 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs font-mono">
        {/* Metric 1: Overall Site Completion */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-sans uppercase font-bold text-[11px] tracking-wide">
              Sites Manifest:
            </span>
            <span className="font-bold text-neutral-100 text-sm tabular-nums">
              {stats.completedSites}/{stats.totalSites}
            </span>
            <span className="text-cyan-400 font-bold tabular-nums">
              ({stats.completionPercentage}%)
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-24 sm:w-32 h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(stats.completedSites / stats.totalSites) * 100}%` }}
              title={`Completed: ${stats.completedSites}`}
            />
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${(stats.inProgressSites / stats.totalSites) * 100}%` }}
              title={`In-Progress: ${stats.inProgressSites}`}
            />
            <div 
              className="bg-neutral-700 h-full transition-all duration-500" 
              style={{ width: `${(stats.pendingSites / stats.totalSites) * 100}%` }}
              title={`Pending: ${stats.pendingSites}`}
            />
          </div>
        </div>

        {/* Metric 2: Status Counters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Completed Sites">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Completed:</span>
            <span className="text-emerald-400 font-bold tabular-nums">{stats.completedSites}</span>
          </div>

          <div className="flex items-center gap-1.5" title="In-Progress Sites">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">In Progress:</span>
            <span className="text-amber-400 font-bold tabular-nums">{stats.inProgressSites}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Pending Sites">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-neutral-400">Pending:</span>
            <span className="text-yellow-400 font-bold tabular-nums">{stats.pendingSites}</span>
          </div>
        </div>

        {/* Metric 3: Fleet & Materials */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Active Plow Trucks">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-400">Fleet:</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {stats.activeVehicles}/{stats.totalVehicles} Active
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5" title="Salt Tonnage Deployed">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-neutral-400">Salt Deployed:</span>
            <span className="text-blue-300 font-bold tabular-nums">
              {stats.saltTonsSpread.toFixed(1)}T
            </span>
          </div>
        </div>

        {/* Metric 4: Weather Pulse */}
        <div className="flex items-center gap-3 border-l border-neutral-800 pl-3">
          <div className="flex items-center gap-1.5" title="Current Everett/Boston Temp & Wind">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-100 font-bold tabular-nums">{weather.temperatureF}°F</span>
            <span className="text-neutral-400 text-[11px]">(Chill {weather.windChillF}°F)</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5" title="Wind Conditions">
            <Wind className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-300 tabular-nums">
              {weather.windDirection} {weather.windSpeedMph}G{weather.windGustMph}mph
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-neutral-400" title="Telemetry Refresh">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden lg:inline">GPS Sync:</span>
            <span className="tabular-nums text-neutral-300">{lastPingTime}</span>
            <span className="hidden xl:inline text-neutral-500">· NWS: {formatCountdown(nextWeatherCountdown)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
