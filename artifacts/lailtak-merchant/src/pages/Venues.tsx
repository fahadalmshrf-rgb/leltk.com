import { useListMerchantVenues, getListMerchantVenuesQueryKey, useUpdateMerchantVenue } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, MapPin, Star, Eye, EyeOff, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Venues() {
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: venues, isLoading } = useListMerchantVenues(merchantId, {
    query: { enabled: !!merchantId, queryKey: getListMerchantVenuesQueryKey(merchantId) }
  });

  const updateVenue = useUpdateMerchantVenue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMerchantVenuesQueryKey(merchantId) });
        toast({ title: "تم التحديث", description: "تم تحديث حالة القاعة بنجاح." });
      }
    }
  });

  const toggleAvailability = (venueId: number, isAvailable: boolean) => {
    updateVenue.mutate({
      id: merchantId,
      venueId,
      data: { isAvailable: !isAvailable }
    });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">قاعاتي</h1>
        <Link href="/venues/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة قاعة
          </Button>
        </Link>
      </div>

      {!venues || venues.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-medium">لا توجد قاعات بعد</h3>
            <p className="text-muted-foreground">ابدأ بإضافة قاعتك الأولى لاستقبال الحجوزات.</p>
            <Link href="/venues/new">
              <Button>إضافة قاعة جديدة</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Card key={venue.id} className="overflow-hidden flex flex-col">
              {venue.images && venue.images.length > 0 ? (
                <div className="aspect-video w-full overflow-hidden">
                  <img src={venue.images[0]} alt={venue.nameAr} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">لا توجد صورة</span>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{venue.nameAr}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-md font-medium ${venue.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'}`}>
                    {venue.isAvailable ? 'متاحة' : 'غير متاحة'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.district}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground gap-2">
                    <Users className="h-4 w-4" />
                    <span>تتسع لـ {venue.capacity} شخص</span>
                  </div>
                  <div className="flex items-center text-muted-foreground gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>{venue.rating.toFixed(1)} ({venue.reviewCount} تقييم)</span>
                  </div>
                  <div className="pt-2 font-medium text-lg">
                    {venue.pricePerNight} ريال / ليلة
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 flex gap-2 border-t p-4 mt-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2" 
                  onClick={() => toggleAvailability(venue.id, venue.isAvailable)}
                  disabled={updateVenue.isPending}
                >
                  {venue.isAvailable ? (
                    <><EyeOff className="h-4 w-4" /> إخفاء</>
                  ) : (
                    <><Eye className="h-4 w-4" /> إظهار</>
                  )}
                </Button>
                <Link href={`/venues/${venue.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full gap-2">
                    <Edit className="h-4 w-4" /> تعديل
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}