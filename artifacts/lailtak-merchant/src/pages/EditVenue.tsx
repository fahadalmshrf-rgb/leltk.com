import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetVenue, getGetVenueQueryKey, useUpdateMerchantVenue, useListCategories } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { VENUE_SERVICES } from "@/lib/services";

const editVenueSchema = z.object({
  nameAr: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  categorySlug: z.string().min(1, "يرجى اختيار نوع القاعة"),
  pricePerNight: z.coerce.number().min(1, "السعر مطلوب"),
  capacity: z.coerce.number().min(1, "السعة مطلوبة"),
  district: z.string().min(2, "الحي مطلوب"),
  description: z.string().optional(),
  services: z.array(z.string()).default([]),
});

type EditVenueFormValues = z.infer<typeof editVenueSchema>;

export default function EditVenue() {
  const [, setLocation] = useLocation();
  const { venueId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;

  const { data: venue, isLoading } = useGetVenue(Number(venueId), {
    query: { enabled: !!venueId, queryKey: getGetVenueQueryKey(Number(venueId)) }
  });
  const { data: categories } = useListCategories();

  const form = useForm<EditVenueFormValues>({
    resolver: zodResolver(editVenueSchema),
    defaultValues: {
      nameAr: "",
      categorySlug: "",
      pricePerNight: 0,
      capacity: 0,
      district: "",
      description: "",
      services: [],
    },
  });

  useEffect(() => {
    if (venue) {
      form.reset({
        nameAr: venue.nameAr,
        categorySlug: venue.categorySlug,
        pricePerNight: venue.pricePerNight,
        capacity: venue.capacity,
        district: venue.district,
        description: venue.description || "",
        services: venue.services ?? [],
      });
    }
  }, [venue, form]);

  const updateVenue = useUpdateMerchantVenue({
    mutation: {
      onSuccess: () => {
        toast({ title: "نجاح", description: "تم تحديث بيانات القاعة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(Number(venueId)) });
        setLocation("/venues");
      },
      onError: (error) => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: EditVenueFormValues) => {
    updateVenue.mutate({
      id: merchantId,
      venueId: Number(venueId),
      data
    });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!venue) {
    return <div className="text-center p-8 text-muted-foreground">لم يتم العثور على القاعة</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">تعديل: {venue.nameAr}</h1>
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
                        <Input {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        <Input {...field} />
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
                      <Textarea className="min-h-[100px]" {...field} />
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
                <Button type="submit" disabled={updateVenue.isPending}>
                  {updateVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}