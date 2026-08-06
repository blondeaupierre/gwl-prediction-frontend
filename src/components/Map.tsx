import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Wells from "./Wells";

function Map() {
  return (
    <MapContainer
      center={[46.6, 2.5]}
      zoom={6}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Wells />
    </MapContainer>
  );
}

export default Map;