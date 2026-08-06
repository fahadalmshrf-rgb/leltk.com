import { useParams, useLocation } from "wouter";
import { useGetBooking, getGetBookingQueryKey, useUpdateMerchantBooking, getListMerchantBookingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Check, X, ArrowRight, Loader2, Phone, Calendar, Users, Building2, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const STATUS_MAP: Record<string, { label: string, className: string }> = {
  pending: { label: "معلق", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" },
  confirmed: { label: "مؤكد", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" },
  completed: { label: "مكتمل", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500" },
  cancelled: { label: "ملغي", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" },
};

export default function BookingDetails() {
  const [, setLocation] = useLocation();
  const { bookingId } = useParams();
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const { data: booking, isLoading } = useGetBooking(Number(bookingId), {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(Number(bookingId)) }
  });

  const updateBooking = useUpdateMerchantBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(Number(bookingId)) });
        queryClient.invalidateQueries({ queryKey: getListMerchantBookingsQueryKey(merchantId) });
        toast({ title: "تم التحديث", description: "تم تحديث الحجز بنجاح" });
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الحجز", variant: "destructive" });
      }
    }
  });

  const handleStatusUpdate = (status: 'confirmed' | 'cancelled') => {
    updateBooking.mutate({
      id: merchantId,
      bookingId: Number(bookingId),
      data: { status, notes: notes || booking?.notes || undefined }
    });
  };

  const handleNotesUpdate = () => {
    updateBooking.mutate({
      id: merchantId,
      bookingId: Number(bookingId),
      data: { status: booking?.status as any, notes }
    });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!booking) {
    return <div className="text-center p-8 text-muted-foreground">لم يتم العثور على الحجز</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/bookings")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">تفاصيل الحجز #{booking.id}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium mr-auto ${STATUS_MAP[booking.status]?.className}`}>
          {STATUS_MAP[booking.status]?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بيانات العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">العروسين</p>
              <p className="font-medium text-lg">{booking.groomName} و {booking.brideName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" /> رقم التواصل
              </p>
              <p className="font-medium" dir="ltr">{booking.contactPhone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              بيانات القاعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">القاعة</p>
              <p className="font-medium text-lg">{booking.venueName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> التاريخ
                </p>
                <p className="font-medium">{format(new Date(booking.eventDate), 'dd MMMM yyyy', { locale: arSA })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" /> عدد الضيوف
                </p>
                <p className="font-medium">{booking.guestCount} شخص</p>
              </div>
            </div>
            <div className="pt-2 border-t mt-2">
              <p className="text-sm text-muted-foreground">التكلفة الإجمالية</p>
              <p className="font-bold text-xl text-primary">{booking.totalPrice} ريال</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ملاحظات التاجر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="أضف ملاحظات داخلية حول هذا الحجز..." 
            className="min-h-[100px]" 
            defaultValue={booking.notes || ""}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button variant="secondary" onClick={handleNotesUpdate} disabled={updateBooking.isPending}>
            حفظ الملاحظات
          </Button>
        </CardContent>
      </Card>

      {booking.status === 'pending' && (
        <div className="flex gap-4 p-4 border rounded-lg bg-card">
          <Button 
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => handleStatusUpdate('confirmed')}
            disabled={updateBooking.isPending}
          >
            {updateBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
            تأكيد الحجز
          </Button>
          <Button 
            className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white" 
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={updateBooking.isPending}
          >
            {updateBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
            رفض وإلغاء الحجز
          </Button>
        </div>
      )}
    </div>
  );
}