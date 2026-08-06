import { useRoute, Link } from "wouter";
import { resolveMediaUrl } from "@/lib/media";
import { useGetVenue, useListVenueReviews, useGetVenueAvailability, getGetVenueQueryKey, getListVenueReviewsQueryKey, getGetVenueAvailabilityQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, MapPin, Users, Star, Phone, FileText, Share, Heart, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useState, useEffect } from "react";

export function VenueDetail() {
  const [match, params] = useRoute("/venues/:id");
  const venueId = params?.id ? parseInt(params.id, 10) : null;
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: 'rtl' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: venue, isLoading } = useGetVenue(venueId as number, { 
    query: { enabled: !!venueId, queryKey: getGetVenueQueryKey(venueId as number) } 
  });
  
  const { data: reviews } = useListVenueReviews(venueId as number, { 
    query: { enabled: !!venueId, queryKey: getListVenueReviewsQueryKey(venueId as number) } 
  });

  const { data: availability } = useGetVenueAvailability(venueId as number, {
    query: { enabled: !!venueId, queryKey: getGetVenueAvailabilityQueryKey(venueId as number) }
  });

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  if (isLoading || !venueId) {
    return (
      <div className="min-h-full bg-background pb-24">
        <Skeleton className="w-full aspect-[4/3] rounded-none" />
        <div className="p-4 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold">القاعة غير موجودة</h2>
        <p className="text-muted-foreground mt-2">عذراً، لم نتمكن من العثور على القاعة المطلوبة.</p>
        <Link href="/">
          <Button className="mt-6">العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header Actions */}
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent max-w-[430px] mx-auto w-full pt-safe">
        <Link href="/">
          <Button size="icon" variant="ghost" className="rounded-full bg-background/20 backdrop-blur-md border-transparent text-white hover:bg-background/40 hover:text-white">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="rounded-full bg-background/20 backdrop-blur-md border-transparent text-white hover:bg-background/40 hover:text-white">
            <Share className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full bg-background/20 backdrop-blur-md border-transparent text-white hover:bg-background/40 hover:text-white">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-muted">
        {venue.images && venue.images.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef} dir="rtl">
            <div className="flex touch-pan-x">
              {venue.images.map((img, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 relative aspect-[4/3]">
                  <img src={resolveMediaUrl(img)} alt={`${venue.nameAr} - ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {/* Pagination dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
              {venue.images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] w-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
            بدون صورة
          </div>
        )}
        
        {/* Curved inner edge */}
        <div className="absolute -bottom-6 left-0 right-0 h-6 bg-background rounded-t-[2rem] z-20" />
      </div>

      <div className="px-5 space-y-8 pt-2">
        {/* Title & Price */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-2xl md:text-3xl font-bold font-serif leading-tight">{venue.nameAr}</h1>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-center shrink-0">
              <span className="block text-lg font-bold">{venue.pricePerNight}</span>
              <span className="block text-[10px] font-medium opacity-80">ر.س / ليلة</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-lg">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-foreground">{venue.rating.toFixed(1)}</span>
              <span className="opacity-70">({venue.reviewCount} تقييم)</span>
            </div>
            {venue.isFeatured && (
              <Badge className="bg-accent text-accent-foreground rounded-lg">مميزة</Badge>
            )}
            {venue.isAvailable ? (
              <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-600/10 rounded-lg">متاحة للحجز</Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600/30 bg-red-600/10 rounded-lg">غير متاحة مؤقتاً</Badge>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-2xl p-4 flex flex-col gap-1 items-start">
            <MapPin className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">الموقع</span>
            <span className="font-semibold text-sm">{venue.district}</span>
          </div>
          <div className="bg-secondary/50 rounded-2xl p-4 flex flex-col gap-1 items-start">
            <Users className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">السعة الاستيعابية</span>
            <span className="font-semibold text-sm">حتى {venue.capacity} شخص</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {venue.phone && (
            <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Phone className="w-4 h-4" />
              اتصال
            </Button>
          )}
          {venue.menuPdf && (
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-12 gap-2 border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => window.open(resolveMediaUrl(venue.menuPdf!), '_blank')}
            >
              <FileText className="w-4 h-4" />
              منيو القاعة
            </Button>
          )}
        </div>

        {/* Description */}
        {venue.description && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold font-serif">عن القاعة</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {venue.description}
            </p>
          </section>
        )}

        {/* Amenities & Services */}
        {(venue.amenities?.length || venue.services?.length) ? (
          <section className="space-y-4">
            <h3 className="text-lg font-bold font-serif">المرافق والخدمات</h3>
            <div className="flex flex-wrap gap-2">
              {venue.amenities?.map((item) => (
                <div key={item} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary/70" />
                  <span>{item}</span>
                </div>
              ))}
              {venue.services?.map((item) => (
                <div key={item} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary/70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Availability */}
        {availability && availability.availableDates.length > 0 && (
          <section className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <h3 className="text-lg font-bold font-serif text-primary flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              مواعيد متاحة قريباً
            </h3>
            <div className="flex flex-wrap gap-2">
              {availability.availableDates.slice(0, 5).map(date => (
                <div key={date} className="bg-background px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-border/50">
                  {new Date(date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', weekday: 'short' })}
                </div>
              ))}
              {availability.availableDates.length > 5 && (
                <div className="bg-background/50 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground flex items-center">
                  +{availability.availableDates.length - 5}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Address */}
        {venue.address && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold font-serif">العنوان التفصيلي</h3>
            <p className="text-sm text-muted-foreground">
              {venue.address}
            </p>
            {/* Map placeholder */}
            <div className="w-full h-32 bg-secondary/80 rounded-xl flex items-center justify-center text-muted-foreground border border-border/50">
              <MapPin className="w-6 h-6 ml-2" />
              خريطة الموقع
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold font-serif">التقييمات</h3>
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="bg-card border border-border/50 p-4 rounded-2xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-sm">{review.authorName}</div>
                    <div className="flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded text-accent font-medium text-xs">
                      <Star className="w-3 h-3 fill-accent" />
                      {review.rating.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating Book Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 p-4 max-w-[430px] mx-auto pb-safe">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
          طلب حجز
        </Button>
      </div>
    </div>
  );
}
