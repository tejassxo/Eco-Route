export const VEHICLE_STATS: Record<string, any> = {
  "Petrol Car": { co2PerL: 2.31, mileage: 15, unit: 'km/l', energy: 'High' },
  "Diesel Car": { co2PerL: 2.68, mileage: 18, unit: 'km/l', energy: 'High' },
  "Bike": { co2PerL: 2.31, mileage: 40, unit: 'km/l', energy: 'Low' },
  "Electric Vehicle": { co2PerKm: 0.02, mileage: 6, unit: 'km/kWh', energy: 'Very Low' },
};

export const calculateEmissions = (distanceKm: number, vehicleType: string) => {
  if (vehicleType === "Electric Vehicle") {
    return { co2: distanceKm * VEHICLE_STATS["Electric Vehicle"].co2PerKm };
  }

  const { co2PerL, mileage } = VEHICLE_STATS[vehicleType];
  const fuelConsumed = distanceKm / mileage;
  return { co2: fuelConsumed * co2PerL };
};
