import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FIELD_STATUSES, statusInfo, type AdminVenue } from "@/lib/fieldwork";
import { Plus, MapPin, Phone, Users } from "lucide-react";

export default function Venues() {
  const [venues, setVenues] = useState<AdminVenue[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = filter ? `?status=${filter}` : "";
    apiFetch(`/api/admin/venues${q}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("فشل تحميل القاعات");
        setVenues(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">القاعات</h1>
        <Link href="/venues/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> قاعة جديدة</Button>
        </Link>
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
            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </Badge>
        ))}
      </div>

      {error && <p className="text-destructive">{error}</p>}
      {venues === null ? (
        <p className="text-muted-foreground animate-pulse">جارٍ التحميل...</p>
      ) : venues.length === 0 ? (
        <p className="text-muted-foreground text-sm border border-dashed rounded-xl p-8 text-center">
          لا توجد قاعات {filter ? "بهذه الحالة" : "بعد"} — أضف قاعة جديدة.
        </p>
      ) : (
        <div className="space-y-3">
          {venues.map((v) => {
            const s = statusInfo(v.fieldStatus);
            return (
              <Link key={v.id} href={`/venues/${v.id}`}>
                <Card className="cursor-pointer hover-elevate mb-3">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold">{v.nameAr}</h3>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.district}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> حتى {v.capacity}</span>
                      {v.ownerPhone && (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {v.ownerPhone}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
