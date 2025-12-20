<template>
  <div
    id="map-container__map-id"
    class="map-container"
    :style="{ height: height }"
  ></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with Leaflet in bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapCoordinates {
  latitude: number;
  longitude: number;
}

const props = defineProps<{
  coordinates?: MapCoordinates;
  height?: string;
  zoom?: number;
  interactive?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:coordinates", value: MapCoordinates): void;
}>();

let map: L.Map | null = null;
let marker: L.Marker | null = null;

const defaultHeight = props.height || "400px";
const defaultZoom = props.zoom || 13;
const isInteractive = props.interactive ?? true;

onMounted(() => {
  // Initialize map
  const defaultLat = props.coordinates?.latitude || 51.505;
  const defaultLng = props.coordinates?.longitude || -0.09;

  map = L.map("map-container__map-id", {
    dragging: isInteractive,
    touchZoom: isInteractive,
    scrollWheelZoom: isInteractive,
    doubleClickZoom: isInteractive,
    boxZoom: isInteractive,
    keyboard: isInteractive,
    zoomControl: isInteractive,
  }).setView([defaultLat, defaultLng], defaultZoom);

  // Add OpenStreetMap tiles (no API key needed for dev)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Add marker if coordinates are provided
  if (props.coordinates) {
    addOrUpdateMarker(props.coordinates);
  }

  // Add click handler for interactive mode
  if (isInteractive) {
    map.on("click", (e: L.LeafletMouseEvent) => {
      const newCoordinates = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      };
      addOrUpdateMarker(newCoordinates);
      emit("update:coordinates", newCoordinates);
    });
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function addOrUpdateMarker(coordinates: MapCoordinates): void {
  if (!map) {
    return;
  }

  const { latitude, longitude } = coordinates;

  if (marker) {
    marker.setLatLng([latitude, longitude]);
  } else {
    marker = L.marker([latitude, longitude]).addTo(map);
  }

  map.setView([latitude, longitude], map.getZoom());
}

watch(
  () => props.coordinates,
  (newCoordinates) => {
    if (newCoordinates) {
      addOrUpdateMarker(newCoordinates);
    } else if (marker && map) {
      map.removeLayer(marker);
      marker = null;
    }
  },
  { deep: true },
);
</script>

<style scoped>
.map-container {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

/* Ensure Leaflet controls are visible */
:deep(.leaflet-control-container) {
  position: relative;
}
</style>
