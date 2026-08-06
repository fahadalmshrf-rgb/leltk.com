import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FIELD_STATUSES, statusInfo } from "@/lib/fieldwork";
import { Building2, Plus } from "lucide-react";

type Stats = {
  total: number;
  byStatus: { fieldStatus: string; count: number }[];
  byDistrict: { district: string; count: number }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("فشل تحميل الإحصائيات");
        setStats(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-destructive p-4">{error}</p>;
  if (!stats) return <p className="text-muted-foreground p-4 animate-pulse">جارٍ التحميل...</p>;

  const countFor = (s: string) => stats.byStatus.find((x) => x.fieldStatus === s)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">لوحة المتابعة</h1>
        <Link href="/venues/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> قاعة جديدة</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي القاعات المسجلة</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-bold">حسب حالة العمل الميداني</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {FIELD_STATUSES.map((s) => (
            <Card key={s.value}>
              <CardContent className="p-4 text-center space-y-1">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.color}`} />
                <p className="text-2xl font-bold">{countFor(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">حسب الحي</h2>
        {stats.byDistrict.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد قاعات بعد — ابدأ بإضافة أول قاعة.</p>
        ) : (
          <div className="space-y-2">
            {stats.byDistrict.map((d) => (
              <div key={d.district} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{d.district}</span>
                <span className="font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
