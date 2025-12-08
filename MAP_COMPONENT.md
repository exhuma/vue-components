# Map Component Documentation

## Overview

The `MapView` component provides an interactive or static map display for GPS coordinates. It's built with Leaflet and uses OpenStreetMap tiles by default (no API key required for development).

## Usage

### Basic Display (Read-only)

```vue
<MapView
  :coordinates="{ latitude: 51.505, longitude: -0.09 }"
  height="300px"
  :zoom="15"
  :interactive="false"
/>
```

### Interactive Map (Click to set location)

```vue
<MapView
  :coordinates="coordinates"
  @update:coordinates="coordinates = $event"
  height="400px"
  :zoom="13"
  :interactive="true"
/>
```

## Props

- **coordinates** `{ latitude: number; longitude: number } | undefined`
  - GPS coordinates to display
  - Optional - map will show default location if not provided

- **height** `string`
  - CSS height value for the map container
  - Default: `"400px"`

- **zoom** `number`
  - Initial zoom level (1-19)
  - Default: `13`

- **interactive** `boolean`
  - Whether users can click to change location
  - Default: `true`

## Events

- **update:coordinates** `(coordinates: { latitude: number; longitude: number }) => void`
  - Emitted when user clicks on the map (interactive mode only)
  - Use with `v-model` pattern for two-way binding

## Switching to Google Maps for Production

### Option 1: Environment-based tile provider

Modify `MapView.vue` to use different tiles based on environment:

```typescript
const tileUrl = import.meta.env.VITE_MAP_PROVIDER === 'google'
  ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const attribution = import.meta.env.VITE_MAP_PROVIDER === 'google'
  ? '&copy; Google Maps'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

L.tileLayer(tileUrl, {
  attribution,
  maxZoom: 19,
}).addTo(map);
```

Then set in `.env.production`:
```
VITE_MAP_PROVIDER=google
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Option 2: Use Google Maps plugin

Install `leaflet-google-maps` or switch to native Google Maps SDK:

```bash
npm install @googlemaps/js-api-loader
```

Create a separate `GoogleMapView.vue` component and use conditional rendering:

```vue
<MapView v-if="useOpenStreetMap" ... />
<GoogleMapView v-else ... />
```

### Option 3: Mapbox (Recommended for production)

Mapbox provides better tile quality and a generous free tier:

```typescript
L.tileLayer(
  'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
  {
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN
  }
).addTo(map);
```

## Development vs Production

**Development:**
- Uses OpenStreetMap (no API key needed)
- Free and unlimited
- Good enough for testing

**Production Options:**
- **OpenStreetMap** - Free but has usage policies
- **Google Maps** - Requires API key, paid service
- **Mapbox** - Generous free tier (100k requests/month)
- **Azure Maps** - Microsoft alternative
- **HERE Maps** - Another commercial option

Choose based on your budget and requirements.
