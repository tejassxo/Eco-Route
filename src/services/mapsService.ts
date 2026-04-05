import { GoogleGenAI } from "@google/genai";

export interface ChargingStation {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export const getNearbyEVStations = async (lat: number, lng: number): Promise<ChargingStation[]> => {
  if (!process.env.GEMINI_API_KEY) return [];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 electric vehicle charging stations near latitude ${lat}, longitude ${lng}. Return a JSON array of objects with 'name', 'lat', 'lng', and 'address'.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              lat: { type: "NUMBER" },
              lng: { type: "NUMBER" },
              address: { type: "STRING" }
            },
            required: ["name", "lat", "lng", "address"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching EV stations via Gemini:", error);
    return [];
  }
};

export const getRouteWithTraffic = async (source: string, destination: string): Promise<{ duration: number, distance: number, summary: string } | null> => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Calculate a route from ${source} to ${destination} considering current traffic conditions. Return a JSON object with 'duration' (in minutes), 'distance' (in km), and a 'summary' of the route and traffic situation.`,
      config: {
        tools: [{ googleMaps: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            duration: { type: "NUMBER" },
            distance: { type: "NUMBER" },
            summary: { type: "STRING" }
          },
          required: ["duration", "distance", "summary"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching traffic-aware route via Gemini:", error);
    return null;
  }
};

export const geocodeLocation = async (address: string): Promise<{ lat: number, lng: number } | null> => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the latitude and longitude for the address: "${address}". Return a JSON object with 'lat' (number) and 'lng' (number).`,
      config: {
        tools: [{ googleMaps: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            lat: { type: "NUMBER" },
            lng: { type: "NUMBER" }
          },
          required: ["lat", "lng"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error geocoding location via Gemini:", error);
    return null;
  }
};
