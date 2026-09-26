import React from 'react';
import { 
  Snowflake, 
  MapPin, 
  Truck, 
  Volume2, 
  VolumeX, 
  Radio, 
  Download, 
  Play, 
  Pause,
  AlertTriangle,
  RotateCw,
  Video
} from 'lucide-react';

interface TopHeaderProps {
  activeTab: 'map' | 'sites' | 'fleet' | 'weather' | 'satellite-comms';
  setActiveTab: (tab: 'map' | 'sites' | 'fleet' | 'weather' | 'satellite-comms') => void;
  isMuted: boolean;
  toggleMute: () => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  onOpenSamsara: () => void;
  onExportCsv: () => void;
  onTriggerTestAlert: () => void;
  activeAlertCount: number;
  onToggleAlertDrawer: () => void;
  onResetSim: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  toggleMute,
  isSimulating,
  toggleSimulation,
  onOpenSamsara,
  onExportCsv,
  onTriggerTestAlert,
  activeAlertCount,
  onToggleAlertDrawer,
  onResetSim,
}) => {
  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 text-neutral-100 shrink-0 z-30 select-none">
      {/* Zone 1: Single text wordmark in display face */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Snowflake className="w-4 h-4 animate-spin" style={{ animationDuration: '14s' }} />
          </div>
          <span className="font-display text-xl lg:text-2xl font-bold tracking-wider uppercase text-neutral-100">
            SNOWOPS <span className="text-cyan-400">COMMAND</span>
          </span>
        </div>
        <span className="hidden xl:inline text-xs text-neutral-400 tracking-wide font-mono pl-2 border-l border-neutral-800">
          EVERETT & GREATER BOSTON DISPATCH
        </span>
      </div>

      {/* Zone 2: Clean single-line navigation tabs */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Live Operations Map</span>
        </button>

        <button
          onClick={() => setActiveTab('sites')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
            activeTab === 'sites'
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <span>Site Manifest</span>
          <span className="font-mono text-[10px] px-1 py-0.2 bg-neutral-950 rounded text-neutral-300">113</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fleet Tracker</span>
          <span className="font-mono text-[10px] px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-800/50">15</span>
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
            activeTab === 'weather'
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Snowflake className="w-3.5 h-3.5 text-blue-400" />
          <span>NWS Weather</span>
        </button>

        <button
          onClick={() => setActiveTab('satellite-comms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
            activeTab === 'satellite-comms'
              ? 'bg-red-950/80 text-red-300 border border-red-700/80 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
          title="Live video feed & radio comms with Back Bay Satellite Office"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Video className="w-3.5 h-3.5 text-red-400" />
          <span className="font-bold">Back Bay Feed</span>
        </button>
      </nav>

      {/* Zone 3: Primary operational actions */}
      <div className="flex items-center gap-2">
        {/* Simulation toggle */}
        <button
          onClick={toggleSimulation}
          title={isSimulating ? "Pause real-time GPS simulation" : "Start real-time GPS simulation"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
            isSimulating 
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60' 
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">SIM ACTIVE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">SIM RUN</span>
            </>
          )}
        </button>

        {/* Reset simulation */}
        <button
          onClick={onResetSim}
          title="Reset storm simulation & site progress"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Audio Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute tactical geofence alerts" : "Mute alert audio"}
          className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        {/* Samsara Integration Modal */}
        <button
          onClick={onOpenSamsara}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono bg-neutral-800 text-neutral-200 hover:bg-neutral-700 rounded border border-neutral-700 whitespace-nowrap"
          title="Samsara Fleet API & Custom Site Import"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>SAMSARA</span>
        </button>

        {/* Export CSV */}
        <button
          onClick={onExportCsv}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded border border-neutral-700 whitespace-nowrap"
          title="Export current storm operational manifest to CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT CSV</span>
        </button>

        {/* Alerts Button */}
        <button
          onClick={onToggleAlertDrawer}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
            activeAlertCount > 0
              ? 'bg-amber-950 text-amber-300 border border-amber-600/70 hover:bg-amber-900'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
          }`}
          title="View tactical geofence alerts"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${activeAlertCount > 0 ? 'text-amber-400 animate-pulse' : ''}`} />
          <span className="font-mono">{activeAlertCount}</span>
        </button>
      </div>
    </header>
  );
};
