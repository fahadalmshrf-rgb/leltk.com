import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetMerchant, getGetMerchantQueryKey, useUpdateMerchant } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  ownerName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  businessName: z.string().min(2, "اسم المنشأة مطلوب"),
  phone: z.string().min(10, "رقم الجوال غير صحيح"),
  description: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { auth } = useAuth();
  const merchantId = auth.status === "authenticated" ? auth.merchantId : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: merchant, isLoading } = useGetMerchant(merchantId, {
    query: { enabled: !!merchantId, queryKey: getGetMerchantQueryKey(merchantId) }
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ownerName: "",
      businessName: "",
      phone: "",
      description: "",
    },
  });

  useEffect(() => {
    if (merchant) {
      form.reset({
        ownerName: merchant.ownerName,
        businessName: merchant.businessName,
        phone: merchant.phone,
        description: merchant.description || "",
      });
    }
  }, [merchant, form]);

  const updateProfile = useUpdateMerchant({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم التحديث", description: "تم تحديث الملف التجاري بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetMerchantQueryKey(merchantId) });
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({
      id: merchantId,
      data
    });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!merchant) {
    return <div className="text-center p-8 text-muted-foreground">لم يتم العثور على التاجر</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">الملف التجاري</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">{merchant.businessName}</CardTitle>
              <CardDescription>
                حالة الحساب: <span className="font-bold text-primary mr-1">
                  {merchant.status === 'approved' ? 'نشط وموثق' : merchant.status === 'pending' ? 'قيد المراجعة' : 'موقوف'}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المالك</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنشأة التجارية</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>رقم الجوال</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="text-muted-foreground">رقم السجل التجاري</FormLabel>
                  <div className="px-3 py-2 border rounded-md bg-muted/50 cursor-not-allowed text-muted-foreground" dir="ltr">
                    {merchant.crNumber}
                  </div>
                  <p className="text-xs text-muted-foreground">لا يمكن تعديل السجل التجاري</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف المنشأة</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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