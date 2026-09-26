import React from 'react';
import { StormAlert } from '../types/snowOps';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  CloudSnow, 
  Bell, 
  Trash2, 
  Volume2, 
  VolumeX,
  Radio
} from 'lucide-react';

interface AlertLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StormAlert[];
  onClearAlerts: () => void;
  onMarkAllRead: () => void;
  onTriggerTestAlert: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export const AlertLogDrawer: React.FC<AlertLogDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  onMarkAllRead,
  onTriggerTestAlert,
  isMuted,
  toggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl text-neutral-100 select-none">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-lg uppercase tracking-wide">
              Tactical Geofence & Ops Alerts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex items-center gap-1 text-neutral-300 hover:text-neutral-100 p-1 rounded hover:bg-neutral-800"
              title="Toggle Audio Alert Chimes"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? 'Muted' : 'Audio Live'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerTestAlert}
              className="px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 rounded text-[11px] font-bold"
            >
              + Trigger Test Alert
            </button>
            <button
              onClick={onMarkAllRead}
              className="text-neutral-400 hover:text-neutral-200 text-[11px]"
            >
              Mark Read
            </button>
            <button
              onClick={onClearAlerts}
              className="text-red-400 hover:text-red-300 p-1"
              title="Clear alerts log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Alert Cards Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 font-mono text-xs">
              No active operational alerts recorded.
            </div>
          ) : (
            alerts.map((alert) => {
              const borderClass =
                alert.severity === 'critical' ? 'border-red-600 bg-red-950/20' :
                alert.severity === 'success' ? 'border-emerald-600 bg-emerald-950/20' :
                alert.severity === 'warning' ? 'border-amber-600 bg-amber-950/20' :
                'border-cyan-600 bg-cyan-950/20';

              const icon =
                alert.type === 'zone_cleared' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> :
                alert.type === 'site_cleared' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> :
                alert.type === 'weather_alert' ? <CloudSnow className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> :
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs font-sans space-y-1 transition-all ${borderClass} ${!alert.read ? 'ring-1 ring-amber-500/40' : 'opacity-85'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold font-display text-sm tracking-wide text-neutral-100">
                      {icon}
                      <span>{alert.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>

                  <p className="text-neutral-300 text-[11px] leading-relaxed pl-5">
                    {alert.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-center text-[10px] font-mono text-neutral-500">
          Automated Geofence Engine · Web Audio & NWS Connected
        </div>
      </div>
    </div>
  );
};
