import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { LocateFixed, Loader2 } from "lucide-react";

const RIYADH_CENTER: [number, number] = [24.7136, 46.6753];

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#e11d48;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type Props = {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
};

function parsePos(latitude: string, longitude: string): [number, number] | null {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const pos = useMemo(() => parsePos(latitude, longitude), [latitude, longitude]);

  function setPosition(lat: number, lng: number, pan = true) {
    onChange(lat.toFixed(6), lng.toFixed(6));
    if (pan) mapRef.current?.setView([lat, lng], Math.max(mapRef.current.getZoom(), 15));
  }

  function useMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setPosition(p.coords.latitude, p.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "تم رفض إذن الموقع — فعّل إذن الموقع للمتصفح ثم حاول مجددًا"
            : "تعذّر تحديد الموقع الحالي — حاول مجددًا",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" variant="outline" className="gap-2" onClick={useMyLocation} disabled={locating}>
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {locating ? "جارٍ تحديد الموقع..." : "استخدم موقعي الحالي"}
        </Button>
        <p className="text-xs text-muted-foreground">أو انقر على الخريطة / اسحب الدبوس لضبط الموقع</p>
      </div>
      {geoError && <p className="text-xs text-destructive">{geoError}</p>}
      <div className="rounded-md overflow-hidden border border-input" style={{ height: 240 }}>
        <MapContainer
          center={pos ?? RIYADH_CENTER}
          zoom={pos ? 15 : 11}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={(lat, lng) => setPosition(lat, lng, false)} />
          {pos && (
            <Marker
              position={pos}
              icon={pinIcon}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const ll = markerRef.current?.getLatLng();
                  if (ll) setPosition(ll.lat, ll.lng, false);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
