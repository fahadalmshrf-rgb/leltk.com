import { Switch, Route, Router as WouterRouter, Link, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Venues from "@/pages/Venues";
import VenueForm from "@/pages/VenueForm";
import MapView from "@/pages/MapView";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Map, LogOut, Settings as SettingsIcon } from "lucide-react";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  const { auth, logout } = useAuth();
  const [location] = useLocation();
  const displayName = auth.status === "authenticated" ? auth.displayName : "";

  const nav = [
    { href: "/", label: "لوحة المتابعة", icon: LayoutDashboard },
    { href: "/venues", label: "القاعات", icon: Building2 },
    { href: "/map", label: "الخريطة", icon: Map },
    { href: "/settings", label: "الإعدادات", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="font-bold text-primary">إدارة ليلتك</span>
            <nav className="flex gap-1">
              {nav.map((n) => {
                const active = n.href === "/" ? location === "/" : location.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href}>
                    <Button variant={active ? "secondary" : "ghost"} size="sm" className="gap-1.5">
                      <n.icon className="w-4 h-4" /> {n.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{displayName}</span>
            <Button variant="ghost" size="icon" onClick={() => logout()} aria-label="خروج">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 pb-16">{children}</main>
    </div>
  );
}

function Protected() {
  const { auth } = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground animate-pulse">
        جارٍ التحميل...
      </div>
    );
  }
  if (auth.status === "unauthenticated") {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/venues" component={Venues} />
        <Route path="/venues/new" component={VenueForm} />
        <Route path="/venues/:id" component={VenueForm} />
        <Route path="/map" component={MapView} />
        <Route path="/settings" component={Settings} />
        <Route path="/login"><Redirect to="/" /></Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Protected />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
