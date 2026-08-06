import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateMerchantVenue, useListCategories } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { VENUE_SERVICES } from "@/lib/services";

const venueSchema = z.object({
  nameAr: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  categorySlug: z.string().min(1, "يرجى اختيار نوع القاعة"),
  pricePerNight: z.coerce.number().min(1, "السعر مطلوب"),
  capacity: z.coerce.number().min(1, "السعة مطلوبة"),
  district: z.string().min(2, "الحي مطلوب"),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  services: z.array(z.string()).default([]),
});

type VenueFormValues = z.infer<typeof venueSchema>;

export default function NewVenue() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;

  const { data: categories } = useListCategories();
  
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      nameAr: "",
      categorySlug: "",
      pricePerNight: 0,
      capacity: 0,
      district: "",
      description: "",
      phone: "",
      address: "",
      services: [],
    },
  });

  const createVenue = useCreateMerchantVenue({
    mutation: {
      onSuccess: () => {
        toast({ title: "نجاح", description: "تم إضافة القاعة بنجاح" });
        setLocation("/venues");
      },
      onError: (error) => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة القاعة", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: VenueFormValues) => {
    createVenue.mutate({
      id: merchantId,
      data: {
        ...data,
        amenities: [],
        services: data.services,
        images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=60"], // Mock image
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">إضافة قاعة جديدة</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم القاعة</FormLabel>
                      <FormControl>
                        <Input placeholder="قاعة الفخامة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع القاعة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع القاعة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.nameAr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر لليلة (ريال)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعة الاستيعابية (شخص)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحي</FormLabel>
                      <FormControl>
                        <Input placeholder="حي الملقا" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم التواصل (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="0500000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف القاعة</FormLabel>
                    <FormControl>
                      <Textarea placeholder="وصف تفصيلي للقاعة ومميزاتها..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الخدمات المتوفرة مع القاعة (اختياري)</FormLabel>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {VENUE_SERVICES.map((service) => {
                        const checked = field.value?.includes(service);
                        return (
                          <label
                            key={service}
                            className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                if (v) {
                                  field.onChange([...(field.value ?? []), service]);
                                } else {
                                  field.onChange((field.value ?? []).filter((s) => s !== service));
                                }
                              }}
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/venues")}>إلغاء</Button>
                <Button type="submit" disabled={createVenue.isPending}>
                  {createVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  حفظ وإضافة القاعة
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}