import React, { useState, useMemo } from 'react';
import { ClientSite, PlowVehicle, DistrictZoneId, SiteStatus, PriorityTier } from '../types/snowOps';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  Crosshair, 
  Plus, 
  Minus,
  CheckCheck,
  Building2,
  Phone
} from 'lucide-react';

interface SiteListPanelProps {
  sites: ClientSite[];
  vehicles: PlowVehicle[];
  selectedSiteId?: string;
  onSelectSite: (site: ClientSite) => void;
  onUpdateSiteStatus: (siteId: string, status: SiteStatus) => void;
  onIncrementPass: (siteId: string) => void;
  onAssignTruck: (siteId: string, truckId: string) => void;
}

export const SiteListPanel: React.FC<SiteListPanelProps> = ({
  sites,
  vehicles,
  selectedSiteId,
  onSelectSite,
  onUpdateSiteStatus,
  onIncrementPass,
  onAssignTruck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SiteStatus>('all');
  const [districtFilter, setDistrictFilter] = useState<DistrictZoneId | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityTier | 'all'>('all');

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (statusFilter !== 'all' && site.status !== statusFilter) return false;
      if (districtFilter !== 'all' && site.zone !== districtFilter) return false;
      if (priorityFilter !== 'all' && site.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameStr = (site.name || '').toLowerCase();
        const addrStr = (site.address || '').toLowerCase();
        const cityStr = (site.city || '').toLowerCase();
        const matchesName = nameStr.includes(query);
        const matchesAddr = addrStr.includes(query);
        const matchesCity = cityStr.includes(query);
        const matchesTruck = Boolean(site.assignedTruckId && String(site.assignedTruckId).toLowerCase().includes(query));
        const matchesDriver = Boolean(vehicles.find(v => v.id === site.assignedTruckId)?.driverName?.toLowerCase().includes(query));
        return matchesName || matchesAddr || matchesCity || matchesTruck || matchesDriver;
      }

      return true;
    });
  }, [sites, vehicles, statusFilter, districtFilter, priorityFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: sites.length,
      completed: sites.filter(s => s.status === 'completed').length,
      inProgress: sites.filter(s => s.status === 'in-progress').length,
      pending: sites.filter(s => s.status === 'pending').length,
    };
  }, [sites]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 text-neutral-100 w-full select-none">
      {/* Search & Filter Top Section */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/90 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-bold text-base tracking-wide uppercase text-neutral-100">
              Client Sites Manifest
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Showing <strong className="text-neutral-100">{filteredSites.length}</strong> of {sites.length}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search site, address, driver or unit..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Tabs (Buttons allowed for functional filters) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded border border-neutral-800 text-[11px] font-mono font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1 text-center rounded transition-colors ${
              statusFilter === 'all'
                ? 'bg-neutral-800 text-neutral-100 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`py-1 text-center rounded transition-colors ${
              statusFilter === 'in-progress'
                ? 'bg-orange-950 text-orange-300 font-bold border border-orange-700/60 shadow'
                : 'text-orange-400/80 hover:text-orange-300'
            }`}
          >
            In-Prog ({counts.inProgress})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`py-1 text-center rounded transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-950 text-yellow-300 font-bold border border-yellow-700/60 shadow'
                : 'text-yellow-400/80 hover:text-yellow-300'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`py-1 text-center rounded transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60 shadow'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Done ({counts.completed})
          </button>
        </div>

        {/* Secondary Filter dropdowns */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as DistrictZoneId | 'all')}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-300 outline-none"
          >
            <option value="all">All Hot Zones</option>
            <option value="north">North: Everett Core</option>
            <option value="seaport">Seaport District</option>
            <option value="cambridge-somerville">Cambridge / Somerville</option>
            <option value="metro-boston">Metro Boston / Port</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityTier | 'all')}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="priority-1">Priority 1 (Critical)</option>
            <option value="priority-2">Priority 2 (Commercial)</option>
            <option value="priority-3">Priority 3 (Standard)</option>
          </select>
        </div>
      </div>

      {/* Scrollable Site Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800">
        {filteredSites.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 font-mono text-xs">
            No matching sites found for current filters.
          </div>
        ) : (
          filteredSites.map((site) => {
            const isSelected = selectedSiteId === site.id;
            const assignedVehicle = vehicles.find((v) => v.id === site.assignedTruckId);

            return (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className={`p-3 transition-colors cursor-pointer hover:bg-neutral-800/60 ${
                  isSelected ? 'bg-neutral-800 border-l-4 border-l-cyan-400' : ''
                }`}
              >
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-display font-bold text-sm tracking-wide text-neutral-100 uppercase leading-snug">
                      {site.name || 'Client Site'}
                    </h3>
                    <div className="text-[11px] text-neutral-400">
                      {site.address || 'Everett Area'} · <span className="text-neutral-300">{site.city || 'MA'}</span>
                    </div>
                  </div>

                  {/* Priority and Status Indicators */}
                  <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        site.priority === 'priority-1'
                          ? 'bg-red-950 text-red-300 border border-red-700/60'
                          : site.priority === 'priority-2'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {site.priority === 'priority-1' ? 'P1 CRITICAL' : site.priority === 'priority-2' ? 'P2 COMM' : 'P3 STD'}
                    </span>

                    <span
                      className={`font-semibold uppercase ${
                        site.status === 'completed'
                          ? 'text-emerald-400'
                          : site.status === 'in-progress'
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {site.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Metadata Row: Geofence, Sqft, Pass Count */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 my-1.5">
                  <span>Radius: {site.geofenceRadiusMeters || 150}m</span>
                  <span>·</span>
                  <span>{Number(site.squareFootage || 0).toLocaleString()} sqft</span>
                  <span>·</span>
                  <span className="text-neutral-300 font-semibold">{site.passCount || 0} pass(es)</span>
                </div>

                {/* Assigned Truck & Quick Actions */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-neutral-800/80">
                  {/* Assigned Truck Selector / Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-400 font-mono">Assigned:</span>
                    <select
                      value={site.assignedTruckId || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        onAssignTruck(site.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-neutral-950 text-cyan-400 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none"
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.unitNumber} ({v.driverName.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pass count incrementer and Status Switcher */}
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIncrementPass(site.id);
                      }}
                      title="Add completed pass"
                      className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700"
                    >
                      + Pass
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateSiteStatus(site.id, site.status === 'completed' ? 'in-progress' : 'completed');
                      }}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        site.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {site.status === 'completed' ? 'Done' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
