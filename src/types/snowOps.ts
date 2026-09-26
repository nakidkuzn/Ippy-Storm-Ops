export type SiteStatus = 'completed' | 'in-progress' | 'pending';

export type PriorityTier = 'priority-1' | 'priority-2' | 'priority-3';

export type DistrictZoneId = 'north' | 'seaport' | 'cambridge-somerville' | 'metro-boston';

export interface ClientSite {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  status: SiteStatus;
  priority: PriorityTier;
  zone: DistrictZoneId;
  geofenceRadiusMeters: number;
  assignedTruckId?: string;
  completedAt?: string;
  passCount: number;
  notes: string;
  squareFootage: number;
  contactPerson?: string;
  contactPhone?: string;
}

export type VehicleStatus = 'plowing' | 'salting' | 'en-route' | 'refilling' | 'standby';

export interface PlowVehicle {
  id: string;
  unitNumber: string;
  name: string;
  driverName: string;
  vehicleType: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  speedMph: number;
  headingDeg: number;
  saltHopperPercent: number;
  fuelPercent: number;
  currentSiteId?: string;
  samsaraGatewayId: string;
  lastPingTime: string;
}

export interface GeofenceZone {
  id: DistrictZoneId;
  name: string;
  district: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  description: string;
  color: string;
  priority: 'High Priority' | 'Critical Industrial' | 'Commercial Core';
}

export interface WeatherReport {
  stationId: string;
  locationName: string;
  temperatureF: number;
  conditionText: string;
  windSpeedMph: number;
  windDirection: string;
  windGustMph: number;
  windChillF: number;
  snowIntensity: 'Light Flurries' | 'Steady Snow' | 'Heavy Snowfall' | 'Blowing Snow / Blizzard' | 'Freezing Drizzle';
  snowAccumulationInches: number;
  expectedStormTotalInches: number;
  roadTempF: number;
  advisoryHeadline: string;
  lastUpdated: string;
  isLiveNWS: boolean;
}

export interface StormAlert {
  id: string;
  timestamp: string;
  type: 'zone_cleared' | 'site_cleared' | 'geofence_entry' | 'weather_alert' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  siteId?: string;
  zoneId?: DistrictZoneId;
}

export interface OperationStats {
  totalSites: number;
  completedSites: number;
  inProgressSites: number;
  pendingSites: number;
  completionPercentage: number;
  activeVehicles: number;
  totalVehicles: number;
  saltTonsSpread: number;
  saltTonsRemaining: number;
  stormDurationHours: number;
}
