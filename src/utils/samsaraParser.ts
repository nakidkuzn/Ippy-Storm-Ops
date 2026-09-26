import { ClientSite, PlowVehicle, DistrictZoneId, SiteStatus, PriorityTier } from '../types/snowOps';

export interface ParseResult {
  type: 'sites' | 'vehicles' | 'unknown';
  sites?: ClientSite[];
  vehicles?: PlowVehicle[];
  rawCount: number;
  validCount: number;
  errors: string[];
}

// Helper to safely parse CSV lines
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => 
    h.trim().replace(/^["']|["']$/g, '').toLowerCase()
  );

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => 
      v.trim().replace(/^["']|["']$/g, '')
    );
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Determines zone automatically based on latitude and longitude in Greater Boston
export function assignZoneFromCoordinates(lat: number, lng: number): DistrictZoneId {
  if (lat >= 42.4000) return 'north'; // Everett, Chelsea, Malden, Revere
  if (lat <= 42.3550 && lng >= -71.0550) return 'seaport'; // Boston Seaport & South Boston
  if (lng <= -71.0700) return 'cambridge-somerville'; // Cambridge, Somerville
  return 'metro-boston'; // Charlestown, Downtown, East Boston
}

// Universal Samsara and custom data parser
export function parseSamsaraOrCustomData(input: string): ParseResult {
  const errors: string[] = [];
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: 'unknown', rawCount: 0, validCount: 0, errors: ['Input is empty.'] };
  }

  let rawItems: any[] = [];

  // 1. Try parsing as JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawItems = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Handle common Samsara API envelopes: { data: [...] }, { vehicles: [...] }, { addresses: [...] }, { assets: [...] }
        if (Array.isArray(parsed.data)) {
          rawItems = parsed.data;
        } else if (Array.isArray(parsed.vehicles)) {
          rawItems = parsed.vehicles;
        } else if (Array.isArray(parsed.addresses)) {
          rawItems = parsed.addresses;
        } else if (Array.isArray(parsed.assets)) {
          rawItems = parsed.assets;
        } else {
          // Single object wrapped
          rawItems = [parsed];
        }
      }
    } catch (jsonErr: any) {
      errors.push(`JSON parse failed (${jsonErr.message}), trying CSV parser...`);
    }
  }

  // 2. If JSON didn't yield items, try CSV
  if (rawItems.length === 0) {
    try {
      const csvRows = parseCSV(trimmed);
      if (csvRows.length > 0) {
        rawItems = csvRows;
      }
    } catch (csvErr: any) {
      errors.push(`CSV parse failed: ${csvErr.message}`);
    }
  }

  if (rawItems.length === 0) {
    return {
      type: 'unknown',
      rawCount: 0,
      validCount: 0,
      errors: errors.length > 0 ? errors : ['Could not extract records from input. Verify JSON or CSV syntax.'],
    };
  }

  // 3. Inspect items to determine if they are VEHICLES or SITES/GEOFENCES
  const sample = rawItems[0] || {};
  const isVehicle = Boolean(
    sample.speed !== undefined ||
    sample.speedMilesPerHour !== undefined ||
    sample.speedmph !== undefined ||
    sample.currentspeed !== undefined ||
    sample.engineHours !== undefined ||
    sample.vin !== undefined ||
    sample.gateway !== undefined ||
    sample.driver !== undefined ||
    sample.driverName !== undefined ||
    sample.drivername !== undefined ||
    sample.heading !== undefined ||
    sample.headingDeg !== undefined ||
    sample.headingdegrees !== undefined ||
    (typeof sample.name === 'string' && /truck|plow|unit|rig|vehicle/i.test(sample.name))
  );

  // 4. Transform into either PlowVehicles or ClientSites with 100% safe fallbacks
  if (isVehicle) {
    const validVehicles: PlowVehicle[] = [];

    rawItems.forEach((item, index) => {
      try {
        const id = String(item.id || item.vehicleId || `samsara-v-${index + 1}`);
        const unitNumber = String(
          item.unitNumber ||
          item.unit ||
          item.name ||
          `UNIT-${String(index + 1).padStart(2, '0')}`
        );
        const name = String(item.name || item.model || `Samsara Fleet Unit ${index + 1}`);
        
        let driverName = 'Assigned Driver';
        if (typeof item.driver === 'string') driverName = item.driver;
        else if (item.driver && typeof item.driver.name === 'string') driverName = item.driver.name;
        else if (item.driverName) driverName = String(item.driverName);
        else if (item.drivername) driverName = String(item.drivername);

        const vehicleType = String(item.vehicleType || item.type || 'Samsara Fleet Plow Rig');

        // Extract coordinates with deep fallbacks
        let lat = 42.4085 + ((index % 6) - 3) * 0.005;
        let lng = -71.0535 + (((index * 2) % 6) - 3) * 0.005;

        const rawLat = item.location?.latitude ?? item.latitude ?? item.lat ?? item.gps?.[0]?.latitude;
        const rawLng = item.location?.longitude ?? item.longitude ?? item.lng ?? item.lon ?? item.gps?.[0]?.longitude;

        if (rawLat !== undefined && !isNaN(Number(rawLat))) lat = Number(rawLat);
        if (rawLng !== undefined && !isNaN(Number(rawLng))) lng = Number(rawLng);

        // Extract speed
        let speedMph = 12;
        const rawSpeed = item.location?.speed ?? item.speed ?? item.speedMilesPerHour ?? item.speedmph ?? item.currentspeed;
        if (rawSpeed !== undefined && !isNaN(Number(rawSpeed))) speedMph = Math.round(Number(rawSpeed));

        // Extract heading
        let headingDeg = 45;
        const rawHeading = item.location?.heading ?? item.heading ?? item.headingDeg ?? item.headingdegrees;
        if (rawHeading !== undefined && !isNaN(Number(rawHeading))) headingDeg = Math.round(Number(rawHeading)) % 360;

        // Salt and Fuel
        let saltHopperPercent = 75;
        if (item.saltHopperPercent !== undefined && !isNaN(Number(item.saltHopperPercent))) {
          saltHopperPercent = Math.min(100, Math.max(0, Number(item.saltHopperPercent)));
        }

        let fuelPercent = 85;
        const rawFuel = item.fuelPercent?.value ?? item.fuelPercent ?? item.fuelLevelPercent ?? item.fuel;
        if (rawFuel !== undefined && !isNaN(Number(rawFuel))) {
          fuelPercent = Math.min(100, Math.max(0, Number(rawFuel)));
        }

        // Status
        let status: PlowVehicle['status'] = speedMph > 5 ? 'plowing' : 'standby';
        if (item.status && ['plowing', 'salting', 'en-route', 'refilling', 'standby'].includes(item.status.toLowerCase())) {
          status = item.status.toLowerCase() as PlowVehicle['status'];
        }

        // Samsara Gateway
        const samsaraGatewayId = String(
          item.gateway?.serial ||
          item.samsaraGatewayId ||
          item.gatewaySerial ||
          item.vin ||
          `SAM-VG54-${8800 + index}`
        );

        validVehicles.push({
          id,
          unitNumber,
          name,
          driverName,
          vehicleType,
          status,
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          speedMph,
          headingDeg,
          saltHopperPercent,
          fuelPercent,
          samsaraGatewayId,
          lastPingTime: 'Just now',
        });
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    });

    return {
      type: 'vehicles',
      vehicles: validVehicles,
      rawCount: rawItems.length,
      validCount: validVehicles.length,
      errors,
    };
  } else {
    // Process as Client Sites & Geofences
    const validSites: ClientSite[] = [];

    rawItems.forEach((item, index) => {
      try {
        const id = String(item.id || item.siteId || item.addressId || `site-imp-${index + 1}`);
        const name = String(item.name || item.addressName || item.title || `Client Site #${index + 1}`);
        
        let address = 'Everett / Greater Boston';
        if (item.formattedAddress) address = String(item.formattedAddress);
        else if (item.address) address = String(item.address);
        else if (item.street) address = String(item.street);
        else if (item.location?.formattedLocation) address = String(item.location.formattedLocation);

        let city = 'Everett, MA';
        if (item.city) {
          city = String(item.city);
        } else if (address.includes(',')) {
          const parts = address.split(',');
          if (parts.length >= 2) {
            city = parts.slice(1).join(',').trim();
          }
        }

        // Extract coordinates
        let lat = 42.4085 + ((index % 7) - 3) * 0.0035;
        let lng = -71.0535 + (((index * 3) % 7) - 3) * 0.0035;

        const rawLat = 
          item.geofence?.circle?.latitude ?? 
          item.location?.latitude ?? 
          item.latitude ?? 
          item.lat ?? 
          item.y;
        const rawLng = 
          item.geofence?.circle?.longitude ?? 
          item.location?.longitude ?? 
          item.longitude ?? 
          item.lng ?? 
          item.lon ?? 
          item.x;

        if (rawLat !== undefined && !isNaN(Number(rawLat))) lat = Number(rawLat);
        if (rawLng !== undefined && !isNaN(Number(rawLng))) lng = Number(rawLng);

        // Geofence radius
        let geofenceRadiusMeters = 150;
        const rawRadius = 
          item.geofence?.circle?.radiusMeters ?? 
          item.geofenceRadiusMeters ?? 
          item.radiusMeters ?? 
          item.radius;
        if (rawRadius !== undefined && !isNaN(Number(rawRadius))) {
          geofenceRadiusMeters = Math.max(30, Math.min(1000, Number(rawRadius)));
        }

        // Status
        let status: SiteStatus = 'pending';
        if (item.status) {
          const s = String(item.status).toLowerCase();
          if (s.includes('done') || s.includes('complete') || s.includes('clear')) status = 'completed';
          else if (s.includes('prog') || s.includes('active') || s.includes('plow')) status = 'in-progress';
          else status = 'pending';
        }

        // Priority
        let priority: PriorityTier = 'priority-2';
        if (item.priority) {
          const p = String(item.priority).toLowerCase();
          if (p.includes('1') || p.includes('crit') || p.includes('high')) priority = 'priority-1';
          else if (p.includes('3') || p.includes('low') || p.includes('std')) priority = 'priority-3';
          else priority = 'priority-2';
        }

        // District Zone
        let zone: DistrictZoneId = assignZoneFromCoordinates(lat, lng);
        if (item.zone && ['north', 'seaport', 'cambridge-somerville', 'metro-boston'].includes(item.zone.toLowerCase())) {
          zone = item.zone.toLowerCase() as DistrictZoneId;
        }

        const passCount = item.passCount !== undefined && !isNaN(Number(item.passCount)) 
          ? Number(item.passCount) 
          : status === 'completed' ? 2 : status === 'in-progress' ? 1 : 0;

        const squareFootage = item.squareFootage !== undefined && !isNaN(Number(item.squareFootage))
          ? Number(item.squareFootage)
          : 85000 + (index * 3500) % 150000;

        const notes = String(item.notes || item.description || 'Imported client site via Samsara integration');
        const contactPerson = item.contactPerson ? String(item.contactPerson) : undefined;
        const contactPhone = item.contactPhone ? String(item.contactPhone) : undefined;
        const assignedTruckId = item.assignedTruckId ? String(item.assignedTruckId) : undefined;

        validSites.push({
          id,
          name,
          address,
          city,
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          status,
          priority,
          zone,
          geofenceRadiusMeters,
          assignedTruckId,
          passCount,
          notes,
          squareFootage,
          contactPerson,
          contactPhone,
        });
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    });

    return {
      type: 'sites',
      sites: validSites,
      rawCount: rawItems.length,
      validCount: validSites.length,
      errors,
    };
  }
}
