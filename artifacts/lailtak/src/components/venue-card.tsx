import { Venue } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Star } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

export function VenueCard({ venue }: { venue: Venue }) {
  const imageUrl = venue.images && venue.images.length > 0 ? resolveMediaUrl(venue.images[0]) : null;

  return (
    <Link href={`/venues/${venue.id}`} className="block w-full">
      <Card className="overflow-hidden border-border/50 hover-elevate transition-all duration-300">
        <div className="relative aspect-[4/3] bg-muted w-full overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={venue.nameAr} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/30">
              بدون صورة
            </div>
          )}
          {venue.isFeatured && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold shadow-sm" variant="default">
              مميز
            </Badge>
          )}
          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-md text-foreground px-2 py-1 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            <span className="mt-0.5">{venue.rating.toFixed(1)}</span>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg font-serif line-clamp-1">{venue.nameAr}</h3>
            <span className="text-primary font-bold whitespace-nowrap bg-primary/5 px-2 py-1 rounded-md text-sm">{venue.pricePerNight} ر.س</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{venue.district}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>حتى {venue.capacity} شخص</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
