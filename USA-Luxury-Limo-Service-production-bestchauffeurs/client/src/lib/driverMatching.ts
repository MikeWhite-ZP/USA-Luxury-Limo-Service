// Utility functions for smart driver matching and ranking

export interface DriverWithExtras {
  id: string;
  firstName: string;
  lastName: string;
  rating: string;
  totalRides: number;
  isAvailable: boolean;
  isActive: boolean;
  currentLocation: string | null;
  email: string;
  phone: string;
  vehiclePlate: string | null;
  upcomingBookingsCount: number;
  hasConflict: boolean;
  conflictingBooking: any;
}

export interface RankedDriver extends DriverWithExtras {
  matchScore: number;
  distanceKm?: number;
  distanceMiles?: number;
  matchReasons: string[];
  warnings: string[];
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse GPS location string and extract coordinates
 * @param locationStr JSON string with {lat, lng, timestamp}
 * @returns {lat, lng} or null
 */
export function parseLocation(locationStr: string | null): { lat: number; lng: number } | null {
  if (!locationStr) return null;
  
  try {
    const parsed = JSON.parse(locationStr);
    if (parsed.lat && parsed.lng) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch (e) {
    // Invalid JSON
  }
  
  return null;
}

/**
 * Parse address coordinates from pickup/destination addresses
 * Assumes address might have coordinates in format "address|lat,lng"
 */
export function parseAddressCoordinates(address: string | null): { lat: number; lng: number } | null {
  if (!address) return null;
  
  // Check if address has coordinates appended
  const parts = address.split('|');
  if (parts.length > 1) {
    const coords = parts[1].split(',');
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  
  return null;
}

/**
 * Rank drivers based on multiple criteria
 * @param drivers List of drivers with enriched data
 * @param booking The booking to assign (optional for general ranking)
 * @returns Ranked list of drivers with match scores
 */
export function rankDrivers(
  drivers: DriverWithExtras[],
  booking?: {
    pickupAddress: string;
    pickupCoordinates?: string | null;
    scheduledDateTime: string;
    passengerCount: number;
  }
): RankedDriver[] {
  const rankedDrivers: RankedDriver[] = [];
  
  for (const driver of drivers) {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const warnings: string[] = [];

    // Base score: Active and verified drivers
    if (driver.isActive) {
      matchScore += 20;
    } else {
      warnings.push('Driver is not active');
      continue; // Skip inactive drivers
    }

    // Availability score (highest priority)
    if (driver.isAvailable) {
      matchScore += 30;
      matchReasons.push('Currently available');
    } else {
      matchScore += 5;
      warnings.push('Driver marked as busy');
    }

    // Rating score (0-20 points based on rating)
    const rating = parseFloat(driver.rating) || 0;
    const ratingScore = Math.min(20, (rating / 5) * 20);
    matchScore += ratingScore;
    if (rating >= 4.5) {
      matchReasons.push(`Excellent rating (${rating}/5)`);
    } else if (rating >= 4.0) {
      matchReasons.push(`Good rating (${rating}/5)`);
    }

    // Experience score (based on total rides)
    const experienceScore = Math.min(15, Math.log(driver.totalRides + 1) * 5);
    matchScore += experienceScore;
    if (driver.totalRides >= 50) {
      matchReasons.push(`Experienced (${driver.totalRides} rides)`);
    }

    // Workload penalty (current bookings)
    if (driver.upcomingBookingsCount > 0) {
      const workloadPenalty = Math.min(15, driver.upcomingBookingsCount * 5);
      matchScore -= workloadPenalty;
      warnings.push(`${driver.upcomingBookingsCount} upcoming ride${driver.upcomingBookingsCount > 1 ? 's' : ''}`);
    } else {
      matchScore += 5;
      matchReasons.push('No pending rides');
    }

    // Schedule conflict check
    if (driver.hasConflict) {
      matchScore -= 30;
      warnings.push('Schedule conflict detected');
    }

    // Distance calculation if booking provided
    let distanceKm: number | undefined;
    let distanceMiles: number | undefined;
    
    if (booking) {
      const driverLoc = parseLocation(driver.currentLocation);
      const pickupLoc = parseAddressCoordinates(booking.pickupCoordinates || booking.pickupAddress);

      if (driverLoc && pickupLoc) {
        distanceKm = calculateDistance(driverLoc.lat, driverLoc.lng, pickupLoc.lat, pickupLoc.lng);
        distanceMiles = distanceKm * 0.621371;

        // Distance score (closer is better, max 20 points)
        if (distanceKm < 5) {
          matchScore += 20;
          matchReasons.push(`Very close (${distanceMiles.toFixed(1)} mi)`);
        } else if (distanceKm < 10) {
          matchScore += 15;
          matchReasons.push(`Nearby (${distanceMiles.toFixed(1)} mi)`);
        } else if (distanceKm < 20) {
          matchScore += 10;
          matchReasons.push(`Within range (${distanceMiles.toFixed(1)} mi)`);
        } else if (distanceKm < 50) {
          matchScore += 5;
        } else {
          warnings.push(`Far away (${distanceMiles.toFixed(1)} mi)`);
        }
      }
    }

    rankedDrivers.push({
      ...driver,
      matchScore,
      distanceKm,
      distanceMiles,
      matchReasons,
      warnings,
    });
  }
  
  return rankedDrivers.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get the best matched driver (highest score)
 */
export function getBestDriver(drivers: DriverWithExtras[], booking?: any): RankedDriver | null {
  const ranked = rankDrivers(drivers, booking);
  return ranked.length > 0 ? ranked[0] : null;
}

/**
 * Format match reasons and warnings for display
 */
export function formatMatchInfo(driver: RankedDriver): {
  badge: string;
  badgeColor: string;
  description: string;
} {
  if (driver.matchScore >= 80) {
    return {
      badge: 'Best Match',
      badgeColor: 'bg-green-500',
      description: driver.matchReasons.join(' • '),
    };
  } else if (driver.matchScore >= 60) {
    return {
      badge: 'Good Match',
      badgeColor: 'bg-blue-500',
      description: driver.matchReasons.join(' • '),
    };
  } else if (driver.matchScore >= 40) {
    return {
      badge: 'Fair Match',
      badgeColor: 'bg-yellow-500',
      description: driver.matchReasons.join(' • '),
    };
  } else {
    return {
      badge: 'Low Match',
      badgeColor: 'bg-gray-500',
      description: driver.warnings.join(' • '),
    };
  }
}
