import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRegisterMerchant } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2 } from "lucide-react";
import { Link } from "wouter";

const registerSchema = z.object({
  ownerName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  businessName: z.string().min(2, "اسم المنشأة مطلوب"),
  phone: z.string().min(10, "رقم الجوال غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  crNumber: z.string().min(5, "رقم السجل التجاري مطلوب"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  description: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ownerName: "",
      businessName: "",
      phone: "",
      email: "",
      crNumber: "",
      password: "",
      description: "",
    },
  });

  const registerMerchant = useRegisterMerchant({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم التسجيل", description: "تم إنشاء الحساب — يمكنك الآن تسجيل الدخول" });
        setLocation("/login");
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التسجيل", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMerchant.mutate({ data });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">ليلتك للتجار</h1>
          <p className="text-muted-foreground">قم بتسجيل منشأتك وابدأ في استقبال الحجوزات</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-center">أدخل بيانات السجل التجاري والمنشأة</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المالك</FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم الكامل" {...field} />
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
                        <Input placeholder="قاعات السعادة للأفراح" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الجوال</FormLabel>
                        <FormControl>
                          <Input placeholder="0500000000" {...field} dir="ltr" className="text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="crNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم السجل التجاري</FormLabel>
                        <FormControl>
                          <Input {...field} dir="ltr" className="text-right" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="8 أحرف على الأقل" {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف مبسط للمنشأة (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="نبذة عن خبرة المنشأة في تنظيم المناسبات..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-12 text-lg" disabled={registerMerchant.isPending}>
                  {registerMerchant.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  تسجيل المنشأة
                </Button>
              </form>
            </Form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-primary hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
