import { useState } from "react";
import { Link } from "wouter";
import { useListMerchantBookings, getListMerchantBookingsQueryKey, useUpdateMerchantBooking } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Eye, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, { label: string, className: string }> = {
  pending: { label: "معلق", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" },
  confirmed: { label: "مؤكد", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" },
  completed: { label: "مكتمل", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500" },
  cancelled: { label: "ملغي", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" },
};

export default function Bookings() {
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;
  const [activeTab, setActiveTab] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useListMerchantBookings(merchantId, {
    query: { enabled: !!merchantId, queryKey: getListMerchantBookingsQueryKey(merchantId) }
  });

  const updateBooking = useUpdateMerchantBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMerchantBookingsQueryKey(merchantId) });
        toast({ title: "تم", description: "تم تحديث حالة الحجز بنجاح" });
      }
    }
  });

  const handleStatusUpdate = (bookingId: number, status: 'confirmed' | 'cancelled') => {
    updateBooking.mutate({
      id: merchantId,
      bookingId,
      data: { status }
    });
  };

  const filteredBookings = bookings?.filter(b => activeTab === "all" ? true : b.status === activeTab) || [];

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">الحجوزات</h1>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted rounded-xl">
          <TabsTrigger value="all" className="rounded-lg px-6 py-2">الكل</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg px-6 py-2">معلق</TabsTrigger>
          <TabsTrigger value="confirmed" className="rounded-lg px-6 py-2">مؤكد</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-6 py-2">مكتمل</TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg px-6 py-2">ملغي</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">العروسين</th>
                    <th className="px-6 py-4 font-medium">القاعة</th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                    <th className="px-6 py-4 font-medium">الضيوف</th>
                    <th className="px-6 py-4 font-medium">السعر الكلي</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          {booking.groomName} و {booking.brideName}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{booking.venueName}</td>
                        <td className="px-6 py-4">{format(new Date(booking.eventDate), 'dd MMMM yyyy', { locale: arSA })}</td>
                        <td className="px-6 py-4">{booking.guestCount} شخص</td>
                        <td className="px-6 py-4 font-medium">{booking.totalPrice} ريال</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_MAP[booking.status]?.className}`}>
                            {STATUS_MAP[booking.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2 justify-end">
                          {booking.status === 'pending' && (
                            <>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                disabled={updateBooking.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                disabled={updateBooking.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Link href={`/bookings/${booking.id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد حجوزات في هذا التصنيف.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}