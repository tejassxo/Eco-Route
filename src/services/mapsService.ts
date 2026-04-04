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
