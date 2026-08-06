import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, UserPlus, KeyRound, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeamMember {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
}

// ── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 8) {
      toast({ title: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.error ?? "حدث خطأ", variant: "destructive" });
        return;
      }
      toast({ title: "تم تغيير كلمة المرور بنجاح" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast({ title: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">تغيير كلمة المرور</CardTitle>
        </div>
        <CardDescription>غيّر كلمة المرور الخاصة بحسابك</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
            <Input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Team Members ─────────────────────────────────────────────────────────────

function TeamSection() {
  const { auth } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const currentId = auth.status === "authenticated" ? auth.adminId : null;

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/team");
      if (!res.ok) throw new Error("فشل تحميل أعضاء الفريق");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "فشل الحذف");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "تم حذف العضو" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const [addForm, setAddForm] = useState({ username: "", displayName: "", password: "" });
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await apiFetch("/api/admin/team", {
        method: "POST",
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.error ?? "حدث خطأ", variant: "destructive" });
        return;
      }
      toast({ title: "تم إضافة العضو بنجاح" });
      setAddForm({ username: "", displayName: "", password: "" });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["team"] });
    } catch {
      toast({ title: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">أعضاء الفريق</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
            <UserPlus className="w-4 h-4 me-1.5" />
            {showAdd ? "إلغاء" : "إضافة عضو"}
          </Button>
        </div>
        <CardDescription>حسابات الإدارة التي يمكنها الدخول إلى هذه اللوحة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3 bg-muted/40">
            <p className="text-sm font-medium">حساب جديد</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newUsername">اسم المستخدم</Label>
                <Input
                  id="newUsername"
                  placeholder="ahmed_ali"
                  value={addForm.username}
                  onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
                  required
                  minLength={3}
                  pattern="[a-z0-9_]+"
                  title="أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newDisplayName">الاسم الظاهر</Label>
                <Input
                  id="newDisplayName"
                  placeholder="أحمد علي"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm((f) => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="newMemberPassword">كلمة المرور</Label>
              <Input
                id="newMemberPassword"
                type="password"
                placeholder="8 أحرف على الأقل"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? "جارٍ الإضافة..." : "إضافة"}
            </Button>
          </form>
        )}

        {/* Members list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">جارٍ التحميل...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا يوجد أعضاء</p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{m.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{m.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.id === currentId && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">أنت</span>
                  )}
                  {m.id !== currentId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف {m.displayName}؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف حساب <strong>@{m.username}</strong> نهائياً ولن يتمكن من الدخول مجدداً.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(m.id)}
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">الإعدادات</h1>
      <ChangePasswordSection />
      <TeamSection />
    </div>
  );
}
