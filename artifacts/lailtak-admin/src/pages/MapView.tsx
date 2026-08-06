import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FIELD_STATUSES, statusInfo, type AdminVenue } from "@/lib/fieldwork";

const STATUS_HEX: Record<string, string> = {
  not_visited: "#6b7280",
  visited: "#3b82f6",
  owner_contacted: "#f59e0b",
  agreement_signed: "#8b5cf6",
  live: "#059669",
};

const RIYADH_CENTER: [number, number] = [24.7136, 46.6753];

function pinIcon(status: string) {
  const color = STATUS_HEX[status] ?? STATUS_HEX.not_visited;
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

export default function MapView() {
  const [, navigate] = useLocation();
  const [venues, setVenues] = useState<AdminVenue[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/venues")
      .then(async (res) => {
        if (!res.ok) throw new Error("فشل تحميل القاعات");
        setVenues(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  const located = useMemo(
    () =>
      (venues ?? []).filter(
        (v) =>
          v.latitude != null &&
          v.longitude != null &&
          !Number.isNaN(parseFloat(v.latitude)) &&
          !Number.isNaN(parseFloat(v.longitude)) &&
          (filter === "" || v.fieldStatus === filter),
      ),
    [venues, filter],
  );

  const missingCount = useMemo(
    () =>
      (venues ?? []).filter(
        (v) => v.latitude == null || v.longitude == null || Number.isNaN(parseFloat(v.latitude ?? "")) || Number.isNaN(parseFloat(v.longitude ?? "")),
      ).length,
    [venues],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الخريطة</h1>
        {missingCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {missingCount} قاعة بدون إحداثيات لا تظهر على الخريطة
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={filter === "" ? "default" : "secondary"}
          className="cursor-pointer whitespace-nowrap px-3 py-1.5"
          onClick={() => setFilter("")}
        >
          الكل
        </Badge>
        {FIELD_STATUSES.map((s) => (
          <Badge
            key={s.value}
            variant={filter === s.value ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 gap-1.5"
            onClick={() => setFilter(s.value)}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: STATUS_HEX[s.value] }}
            />
            {s.label}
          </Badge>
        ))}
      </div>

      {error && <p className="text-destructive">{error}</p>}
      {venues === null ? (
        <p className="text-muted-foreground animate-pulse">جارٍ التحميل...</p>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ height: "65dvh" }}>
          <MapContainer center={RIYADH_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {located.map((v) => {
              const s = statusInfo(v.fieldStatus);
              return (
                <Marker
                  key={v.id}
                  position={[parseFloat(v.latitude!), parseFloat(v.longitude!)]}
                  icon={pinIcon(v.fieldStatus)}
                >
                  <Popup>
                    <div className="space-y-1.5 text-right" dir="rtl" style={{ minWidth: 160 }}>
                      <p className="font-bold m-0">{v.nameAr}</p>
                      <p className="m-0 text-xs flex items-center gap-1.5 justify-end">
                        {s.label}
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ background: STATUS_HEX[v.fieldStatus] ?? STATUS_HEX.not_visited }}
                        />
                      </p>
                      <p className="m-0 text-xs text-muted-foreground">{v.district}</p>
                      <Button size="sm" className="w-full mt-1" onClick={() => navigate(`/venues/${v.id}`)}>
                        فتح القاعة
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
