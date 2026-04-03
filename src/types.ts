export enum VehicleType {
  PETROL_CAR = "Petrol Car",
  DIESEL_CAR = "Diesel Car",
  BIKE = "Bike",
  ELECTRIC_VEHICLE = "Electric Vehicle",
}

export interface RouteStep {
  instruction: string;
  distance: number;
  location: [number, number];
}

export interface RouteData {
  id: string | number;
  distance: number; // in km
  duration: number; // in minutes
  emissions: number; // in kg CO2
  isEco: boolean;
  summary: string;
  polyline: [number, number][]; // Array of [lat, lon]
  steps?: RouteStep[];
  bounds?: [[number, number], [number, number]];
}

export interface EmissionResult {
  emissions: number;
  fuelConsumption: number;
}

export interface SavedRoute {
  id: string;
  source: string;
  destination: string;
  sourceCoords?: [number, number];
  destCoords?: [number, number];
}
