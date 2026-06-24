# 🌿 EcoRoute

> **Smarter paths for a greener planet.** A high-performance, minimalist, and visually striking routing platform engineered to minimize global carbon footprints by helping travelers make environmentally conscious travel decisions.

EcoRoute blends sophisticated **mapping algorithms**, **real-time carbon emission calculations**, and **Gemini AI-powered route optimization/tips** into an Apple/Stripe-inspired user interface. Best of all, it operates under an **open-access, authentication-free model**, allowing anyone to plan their green journeys instantly.

---

## 🚀 Live Demonstration

* **Development Preview:** [Development App](https://ais-dev-htorcxr6mpiiiv5qjf2kxq-95016692217.asia-east1.run.app)
* **Production Build:** [Shared App](https://ais-pre-htorcxr6mpiiiv5qjf2kxq-95016692217.asia-east1.run.app)

---

## ✨ Core Features

### 🗺️ Smart Eco-Friendly Routing
* **Multi-Route Analysis:** Instantly calculates alternative routes between any two geographical coordinates using the high-performance **OSRM (Open Source Routing Machine)** and **Nominatim Geocoding** engines.
* **Carbon Signature Evaluation:** Compares routes based on distance, traffic characteristics, and duration, highlighting the greenest route with a distinctive **Eco** badge.
* **In-App Real-Time Navigation:** Simulate driving along the selected route with animated vehicles and heading orientation, accompanied by structured step-by-step navigation instructions.

### 📊 Impact & Analytics Dashboard
* **Saved Journeys:** Persists historical travel routes locally (`localStorage`) for zero-friction access.
* **Environmental Impact Metrics:** Translates saved carbon emissions into simple, human-understandable terms (e.g., *equivalent young trees planted*).
* **Route Detail Inspector:** Examine detailed, interactive modal cards outlining the full starting point, destination, distance, exact emissions (in kg CO₂), and AI-generated trip summaries.

### 🤖 Gemini-Powered Assistance ("Vihari")
* **Interactive Chat Companion:** Chat with **Vihari**, an embedded conversational assistant tuned to provide travel optimization advice, carbon calculations, and general instructions.
* **Contextual Green Recommendations:** Fetches highly targeted, actionable driving tips tailored specifically to the length of your trip, route destination, and vehicle type.

### 🎨 Apple/Stripe-Style UI/UX
* **Aesthetic Minimalism:** Generous negative space, clean typography (using pairings of Inter and display layouts), soft shadow surfaces, and high-contrast light and dark themes.
* **Cinematic Micro-Interactions:** Custom entrance sequences and layout timelines managed by **GSAP (GreenSock)** and fluid spring layout transitions powered by **Motion (Framer Motion)**.
* **Responsive Canvas Sizing:** Adapts perfectly from desktop layouts down to touch-target mobile views.

---

## 🛠️ Technological Architecture

EcoRoute is architected as a modern full-stack web application designed for high performance, ease of expansion, and secure environment integration.

### Frontend
* **Core Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
* **Language:** TypeScript (Strictly Typed)
* **Styling Engine:** [Tailwind CSS](https://tailwindcss.com/)
* **Animation Suite:** [GSAP (GreenSock)](https://greensock.com/gsap/) & [Motion (Framer Motion)](https://motion.dev/)
* **Map & GIS Rendering:** [React Leaflet](https://react-leaflet.js.org/) & [Leaflet.js](https://leafletjs.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

### Backend & API proxy
* **Server Runtime:** Node.js (Express server proxying calls to keep keys secure)
* **AI Integration:** [@google/genai](https://www.npmjs.com/package/@google/genai) utilizing `gemini-3-flash-preview`
* **Geocoding & Reverse-Lookup:** [Nominatim OpenStreetMap API](https://nominatim.org/)
* **Routing Engine:** [OSRM API](http://project-osrm.org/)

---

## 📥 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **yarn**

### Environment Setup
Create a `.env` file in the root directory and add your secret credentials:

```env
# Server-side Gemini API key (Required for AI features, never exposed to client)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/eco-route.git
   cd eco-route
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (runs both frontend Vite asset compiler and Express server via custom integration):
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

### Production Build

To compile a optimized static client build paired with bundled server output:

```bash
npm run build
npm start
```

---

## 📁 Directory Structure

```text
├── src/
│   ├── components/
│   │   ├── ChatVihari.tsx         # Embedded conversational AI chatbot
│   │   ├── Dashboard.tsx          # User impact, stats, and historical logs
│   │   ├── ErrorBoundary.tsx      # App-wide robust error boundary
│   │   ├── InputForm.tsx          # Geocoding search inputs with vehicle selector
│   │   ├── Loader.tsx             # Beautiful layout loader indicator
│   │   ├── MapComponent.tsx       # Leaflet maps wrapper with navigation controller
│   │   ├── NavigationOverlay.tsx  # In-app real-time driving simulation
│   │   ├── RouteCard.tsx          # Detailed route summary UI
│   │   ├── ScenicOpening.tsx      # Cinematic intro splash screen
│   │   └── ThemeToggle.tsx        # Dark/Light theme utility
│   ├── context/
│   │   └── ThemeContext.tsx       # Tailwind theme context
│   ├── pages/
│   │   ├── AboutPage.tsx          # Scientific mission statements
│   │   ├── ContactUsPage.tsx      # Contact interface
│   │   ├── ContentPages.tsx       # Dynamic pages (Features, Cookie Policy, etc.)
│   │   └── LandingPage.tsx        # High-impact minimalistic landing layout
│   ├── utils/
│   │   └── emissionCalculator.ts  # Mathematical carbon calculation constants
│   ├── App.tsx                    # Main routing engine (React Router)
│   ├── main.tsx                   # Core index mounting file
│   └── types.ts                   # Strict TypeScript definitions
├── server.ts                      # Custom Express backend and Gemini proxy layer
├── vite.config.ts                 # Dev server asset pipeline configurations
└── package.json                   # Metadata & script runners
```

---

## 🔒 Security & Performance Commitments

* **No-Token Authentication:** The platform features zero user authorization databases to eliminate identity-theft and credential injection vectors.
* **Client-Only Local Persistence:** Historical logs and saved journeys are managed directly in browser-local storage, keeping your travel logs fully private to your device.
* **Secure API Proxies:** The server proxies all calls to Google Gemini AI models securely, ensuring API secrets never leak into user browsers.
* **Anti-Flicker Layout Mounting:** Component mounting sequences are managed with GSAP's explicit context states to prevent cumulative layout shifts (CLS).

---

## 🤝 Contributing

We welcome contributions from engineers, researchers, and designers passionate about green technologies!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

Developed with 💚 by **Batch 9** for a sustainable future.
