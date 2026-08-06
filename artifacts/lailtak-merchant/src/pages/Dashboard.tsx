import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetMerchantDashboard, getGetMerchantDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Building2, CalendarDays, Wallet, Clock, CheckCircle, Star, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const STATUS_MAP: Record<string, { label: string, className: string }> = {
  pending: { label: "معلق", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" },
  confirmed: { label: "مؤكد", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" },
  completed: { label: "مكتمل", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500" },
  cancelled: { label: "ملغي", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" },
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;

  const { data: dashboard, isLoading } = useGetMerchantDashboard(merchantId, {
    query: { enabled: !!merchantId, queryKey: getGetMerchantDashboardQueryKey(merchantId) }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-center text-muted-foreground">حدث خطأ في تحميل البيانات</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalRevenue} ريال</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.thisMonthRevenue} ريال</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجوزات الكلية</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القاعات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalVenues}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حجوزات معلقة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.pendingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حجوزات مؤكدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.confirmedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {dashboard.avgRating.toFixed(1)}
              <Star className="h-4 w-4 fill-primary text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>آخر الحجوزات</CardTitle>
            </div>
            <Link href="/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard.recentBookings && dashboard.recentBookings.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{booking.venueName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.groomName} و {booking.brideName} • {format(new Date(booking.eventDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">{booking.totalPrice} ريال</div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[booking.status]?.className || ''}`}>
                        {STATUS_MAP[booking.status]?.label || booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">لا توجد حجوزات حديثة</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}