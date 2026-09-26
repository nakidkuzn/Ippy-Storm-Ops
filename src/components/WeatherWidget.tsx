import React from 'react';
import { WeatherReport } from '../types/snowOps';
import { 
  CloudSnow, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  RefreshCw, 
  Compass, 
  Calendar, 
  ExternalLink,
  ShieldAlert,
  Snowflake
} from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherReport;
  countdownSeconds: number;
  onRefreshWeather: () => void;
  isLoading: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  countdownSeconds,
  onRefreshWeather,
  isLoading,
}) => {
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 text-neutral-100 w-full select-none overflow-y-auto p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <CloudSnow className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-lg tracking-wide uppercase text-neutral-100">
              National Weather Service (NWS)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-mono">
            Station: {weather.stationId} · {weather.locationName}
          </p>
        </div>

        {/* Manual Refresh & Countdown */}
        <div className="flex items-center gap-2">
          <div className="text-right text-[11px] font-mono text-neutral-400">
            <div>Auto-refresh:</div>
            <div className="text-cyan-400 font-bold tabular-nums">{formatCountdown(countdownSeconds)}</div>
          </div>
          <button
            onClick={onRefreshWeather}
            disabled={isLoading}
            title="Refresh NWS observations"
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-red-950/80 border border-red-700/80 rounded-lg p-3 text-red-100 flex items-start gap-3 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold uppercase tracking-wider text-red-300 font-mono mb-0.5">
            Active Winter Storm Warning
          </div>
          <div className="text-neutral-200 leading-relaxed">
            {weather.advisoryHeadline}
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 font-mono">
            Source: NOAA / National Weather Service Boston Forecast Office (BOX)
          </div>
        </div>
      </div>

      {/* Primary Observations Card */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Snowflake className="w-7 h-7" />
            </div>
            <div>
              <div className="font-display font-extrabold text-3xl text-neutral-100 tabular-nums">
                {weather.temperatureF}°F
              </div>
              <div className="text-xs font-semibold text-neutral-300">
                {weather.conditionText}
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-xs space-y-1">
            <div className="text-neutral-400">
              Wind Chill: <span className="text-cyan-300 font-bold">{weather.windChillF}°F</span>
            </div>
            <div className="text-neutral-400">
              Road Surface: <span className="text-amber-400 font-bold">{weather.roadTempF}°F (Icy)</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase">
              {weather.isLiveNWS ? '● LIVE NWS FEED' : '● ACTIVE STORM MODEL'}
            </div>
          </div>
        </div>

        {/* Tactical Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800 text-xs font-mono">
          <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" /> Wind Speed
            </div>
            <div className="font-bold text-neutral-200 mt-1 tabular-nums">
              {weather.windDirection} {weather.windSpeedMph} MPH
            </div>
            <div className="text-[10px] text-red-400">
              Gusts to {weather.windGustMph} MPH
            </div>
          </div>

          <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1">
              <CloudSnow className="w-3 h-3 text-cyan-400" /> Snowfall Rate
            </div>
            <div className="font-bold text-cyan-300 mt-1">
              1.0 - 1.5 in/hr
            </div>
            <div className="text-[10px] text-neutral-400">
              {weather.snowIntensity}
            </div>
          </div>

          <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-cyan-400" /> Current Depth
            </div>
            <div className="font-bold text-neutral-100 mt-1 tabular-nums">
              {weather.snowAccumulationInches.toFixed(1)}" on ground
            </div>
            <div className="text-[10px] text-neutral-400">
              Forecast: {weather.expectedStormTotalInches}" total
            </div>
          </div>

          <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" /> Last Observation
            </div>
            <div className="font-bold text-neutral-200 mt-1 tabular-nums">
              {weather.lastUpdated}
            </div>
            <div className="text-[10px] text-neutral-500">
              Next pass in ~15m
            </div>
          </div>
        </div>
      </div>

      {/* Snow Accumulation Progress Meter */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400 font-semibold">Storm Accumulation Progress:</span>
          <span className="text-cyan-400 font-bold tabular-nums">
            {weather.snowAccumulationInches.toFixed(1)}" of {weather.expectedStormTotalInches}" Expected ({Math.round((weather.snowAccumulationInches / weather.expectedStormTotalInches) * 100)}%)
          </span>
        </div>
        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 flex">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700" 
            style={{ width: `${(weather.snowAccumulationInches / weather.expectedStormTotalInches) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-1">
          <span>0" (Storm Start)</span>
          <span>4" (Standard Salting Threshold)</span>
          <span>8" (Pushers & Skid Steers)</span>
          <span>12"+ (Haul Out)</span>
        </div>
      </div>

      {/* Crew Winter Operations Guidance */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-3 text-xs space-y-2">
        <div className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] font-mono border-b border-neutral-800 pb-1.5 flex items-center justify-between">
          <span>Field Crew Operational Directives</span>
          <span className="text-cyan-400">PRIORITY CODE RED</span>
        </div>
        <ul className="space-y-1.5 text-neutral-300 text-[11px] font-sans">
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold">1.</span>
            <span>Maintain minimum 2 passes on Everett Gateway and Mystic Commercial access drives before 5:00 AM shift change.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold">2.</span>
            <span>Seaport waterfront piers experiencing ocean spray and accelerated glaze freeze; bump salt hopper flow rate by 15%.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold">3.</span>
            <span>Do not pile snow within 15 feet of fire hydrants or loading dock egress doors in the Cambridge Biotech corridor.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
