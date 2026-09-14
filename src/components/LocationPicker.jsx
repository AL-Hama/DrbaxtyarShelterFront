import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

function LocationMarker({
  position,
  setPosition,
  readOnly,
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
      }
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false,
}) {
  const [position, setPosition] = useState(
    latitude && longitude
      ? { lat: latitude, lng: longitude }
      : { lat: 36.1911, lng: 44.0092 } // Erbil
  );

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <LocationMarker
        position={position}
        readOnly={readOnly}
        setPosition={(p) => {
          setPosition(p);

          if (!readOnly) {
            onChange?.(p.lat, p.lng);
          }
        }}
      />
    </MapContainer>
  );
}