import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListVenues } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { VenueCard } from "@/components/venue-card";
import { VenueCardSkeleton } from "@/components/venue-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const CATEGORIES = [
  { label: 'الكل', slug: '' },
  { label: 'شاليه', slug: 'chalet' },
  { label: 'قاعة أفراح', slug: 'wedding-hall' },
  { label: 'صالة أفراح', slug: 'ballroom' },
  { label: 'قاعة حفلات', slug: 'banquet-hall' },
  { label: 'فندقية', slug: 'hotel-hall' },
];

export function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempMinCapacity, setTempMinCapacity] = useState<number[]>([0]);
  const [tempPriceRange, setTempPriceRange] = useState<number[]>([0, 50000]);
  
  const [minCapacity, setMinCapacity] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useListVenues({
    search: debouncedSearch || undefined,
    category: category || undefined,
    minCapacity: minCapacity || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    limit: 20
  });

  const applyFilters = () => {
    setMinCapacity(tempMinCapacity[0] > 0 ? tempMinCapacity[0] : undefined);
    setMinPrice(tempPriceRange[0] > 0 ? tempPriceRange[0] : undefined);
    setMaxPrice(tempPriceRange[1] < 50000 ? tempPriceRange[1] : undefined);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setTempMinCapacity([0]);
    setTempPriceRange([0, 50000]);
    setMinCapacity(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setIsFilterOpen(false);
  };

  const activeFiltersCount = (minCapacity ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  return (
    <div className="min-h-full bg-background pb-24 flex flex-col">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-safe">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="ابحث عن قاعة، حي..." 
                className="pl-4 pr-10 h-12 bg-muted/50 border-transparent focus-visible:ring-primary rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-12 w-12 rounded-xl shrink-0 border-border/50">
                  <Filter className="w-5 h-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-[430px] mx-auto rounded-t-3xl">
                <DrawerHeader className="text-right">
                  <DrawerTitle className="font-serif text-xl font-bold">تصفية النتائج</DrawerTitle>
                </DrawerHeader>
                <div className="p-6 space-y-8">
                  {/* Capacity Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-bold">السعة الاستيعابية</Label>
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {tempMinCapacity[0] === 0 ? "أي سعة" : `أكثر من ${tempMinCapacity[0]} شخص`}
                      </span>
                    </div>
                    <Slider 
                      value={tempMinCapacity} 
                      onValueChange={setTempMinCapacity} 
                      max={1000} 
                      step={50}
                      className="py-4"
                      dir="rtl"
                    />
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-bold">السعر (ر.س)</Label>
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {tempPriceRange[0]} - {tempPriceRange[1] >= 50000 ? "50,000+" : tempPriceRange[1]}
                      </span>
                    </div>
                    <Slider 
                      value={tempPriceRange} 
                      onValueChange={setTempPriceRange} 
                      max={50000} 
                      step={500}
                      minStepsBetweenThumbs={1}
                      className="py-4"
                      dir="rtl"
                    />
                  </div>
                </div>
                <DrawerFooter className="flex-row gap-3 pt-2 pb-8 border-t border-border/50">
                  <Button className="flex-1 h-12 rounded-xl text-lg font-bold" onClick={applyFilters}>تطبيق</Button>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-lg" onClick={resetFilters}>إعادة ضبط</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map((cat) => (
              <Badge 
                key={cat.label} 
                variant={category === cat.slug ? "default" : "secondary"} 
                className="whitespace-nowrap px-4 py-2 text-sm rounded-xl cursor-pointer transition-colors"
                onClick={() => setCategory(cat.slug)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="grid gap-4">
            <VenueCardSkeleton />
            <VenueCardSkeleton />
            <VenueCardSkeleton />
          </div>
        ) : data?.venues && data.venues.length > 0 ? (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground font-medium">
              وجدنا {data.total} قاعة
            </div>
            <div className="grid gap-4">
              {data.venues.map((venue, idx) => (
                <div key={venue.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}>
                  <VenueCard venue={venue} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">لم نجد نتائج</h3>
              <p className="text-sm text-muted-foreground">جرب تغيير كلمات البحث أو التصفية</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setCategory(""); resetFilters(); }} className="mt-2 rounded-xl">
              إلغاء التصفية
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
