import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetFeaturedVenues, useGetNearbyVenues } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ChevronLeft, MapPin, Star } from "lucide-react";
import { VenueCard } from "@/components/venue-card";
import { VenueCardSkeleton } from "@/components/venue-card-skeleton";

const CATEGORIES = [
  { label: 'الكل', slug: '' },
  { label: 'شاليه', slug: 'chalet' },
  { label: 'قاعة أفراح', slug: 'wedding-hall' },
  { label: 'صالة أفراح', slug: 'ballroom' },
  { label: 'قاعة حفلات', slug: 'banquet-hall' },
  { label: 'فندقية', slug: 'hotel-hall' },
];

export function Home() {
  const [, setLocation] = useLocation();
  const { data: rawFeatured, isLoading: isLoadingFeatured } = useGetFeaturedVenues();
  const { data: rawNearby, isLoading: isLoadingNearby } = useGetNearbyVenues({ district: "الملقا" });

  const featuredVenues = Array.isArray(rawFeatured) ? rawFeatured : [];
  const nearbyVenues = Array.isArray(rawNearby) ? rawNearby : [];

  const handleCategoryClick = (slug: string) => {
    if (slug) {
      setLocation(`/search?category=${slug}`);
    } else {
      setLocation(`/search`);
    }
  };

  return (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-primary">ليلتك أنت</h1>
          <p className="text-sm text-muted-foreground mt-1">اكتشف قاعات الرياض الفاخرة</p>
        </div>
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <User className="w-5 h-5 text-primary" />
        </div>
      </header>

      {/* E-Invitation entry */}
      <Link href="/invite" className="block">
        <Card className="overflow-hidden border-accent/40 bg-gradient-to-l from-primary to-[hsl(155_70%_14%)] text-primary-foreground cursor-pointer hover-elevate shadow-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-accent/20 text-accent p-3 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">دعوة زفاف إلكترونية</h3>
              <p className="text-xs text-primary-foreground/80 mt-1 leading-relaxed">
                أنشئ دعوتك وشاركها، وتابع تأكيدات الحضور
              </p>
            </div>
            <ChevronLeft className="w-6 h-6 text-accent" />
          </CardContent>
        </Card>
      </Link>

      {/* Categories */}
      <section>
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map((cat, i) => (
            <Badge 
              key={cat.label} 
              variant={i === 0 ? "default" : "secondary"} 
              className="whitespace-nowrap px-5 py-2.5 text-sm rounded-xl cursor-pointer shadow-sm hover:bg-primary/90 transition-colors"
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif text-foreground">قاعات مميزة</h2>
          <Link href="/search" className="text-sm font-semibold text-primary bg-primary/5 px-3 py-1 rounded-full">عرض الكل</Link>
        </div>
        
        <div className="grid gap-4">
          {isLoadingFeatured ? (
            <>
              <VenueCardSkeleton />
              <VenueCardSkeleton />
            </>
          ) : featuredVenues.length > 0 ? (
            featuredVenues.slice(0, 3).map((venue, idx) => (
              <div key={venue.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms`, animationFillMode: "both" }}>
                <VenueCard venue={venue} />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-3 text-primary/40" />
              <p className="text-sm">لا توجد قاعات مميزة حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* Nearby */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif text-foreground">قاعات قريبة منك</h2>
        </div>
        
        <div className="grid gap-4">
          {isLoadingNearby ? (
            <>
              <VenueCardSkeleton />
            </>
          ) : nearbyVenues.length > 0 ? (
            nearbyVenues.map((venue, idx) => (
              <div key={venue.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms`, animationFillMode: "both" }}>
                <VenueCard venue={venue} />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-primary/40" />
              <p className="text-sm">لا توجد قاعات قريبة حالياً</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}