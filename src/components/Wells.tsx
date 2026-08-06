import { Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState, useCallback, useMemo } from "react";
import L, { type LeafletEvent } from "leaflet";
import WellChart from "./WellChart";

type Well = {
  well_id: string;
  lat: number;
  lon: number;
  region: string;
  last_gwl: number;
  n_measures: number;
};

const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-well-icon",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
        <!-- Halo / Effet de pulse discret en fond -->
        <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 group-hover:animate-ping"></span>

        <!-- Marqueur principal -->
        <div class="relative flex items-center justify-center w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-110">
          <!-- Icône SVG (goutte d'eau / forage) -->
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

function Wells() {
  const [wells, setWells] = useState<Well[]>([]);
  const map = useMap();

  const customIcon = useMemo(() => createCustomIcon(), []);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}/wells`)
      .then((response) => response.json())
      .then((data) => setWells(data))
      .catch((error) => console.error("Erreur chargement puits :", error));
  }, []);

  const centerOnPopup = useCallback(
    (popupEl: HTMLElement, markerLatLng: L.LatLng) => {
      const popupHeight = popupEl.offsetHeight;
      const mapSize = map.getSize();
      const markerPoint = map.latLngToContainerPoint(markerLatLng);

      const desiredMarkerY = mapSize.y / 2 + popupHeight / 2 + 20;
      const deltaX = markerPoint.x - mapSize.x / 2;
      const deltaY = markerPoint.y - desiredMarkerY;

      if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) return;

      const targetPoint = mapSize.divideBy(2).add([deltaX, deltaY]);
      const targetLatLng = map.containerPointToLatLng(targetPoint);
      map.flyTo(targetLatLng, map.getZoom(), { duration: 0.5 });
    },
    [map]
  );

  const handlePopupOpen = useCallback(
    (e: LeafletEvent) => {
      const popupEl: HTMLElement | undefined = e.popup?.getElement();
      const markerLatLng = e.popup?.getLatLng();

      if (!popupEl || !markerLatLng) return;

      requestAnimationFrame(() => {
        centerOnPopup(popupEl, markerLatLng);
      });
    },
    [centerOnPopup]
  );

  return (
    <MarkerClusterGroup
      maxClusterRadius={100}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
    >
      {wells.map((well) => (
        <Marker
          key={well.well_id}
          position={[well.lat, well.lon]}
          icon={customIcon}
          eventHandlers={{
            popupopen: handlePopupOpen,
          }}
        >
          <Popup maxWidth={750} autoPan={false} className="well-popup">
            <div className="p-1 font-sans">
              <div className="mb-2 pb-2 border-b border-slate-100">
                <div className="font-bold text-slate-800 text-sm">Puits : {well.well_id}</div>
                <div className="text-xs text-slate-500">
                  {well.region} • <span className="font-medium text-slate-700">{well.last_gwl.toFixed(2)} m</span> ({well.n_measures} mesures)
                </div>
              </div>
              <WellChart wellId={well.well_id} />
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}

export default Wells;