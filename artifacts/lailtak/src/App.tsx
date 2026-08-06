import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import InviteCreate from "@/pages/invite-create";
import InviteView from "@/pages/invite-view";
import InviteManage from "@/pages/invite-manage";
import { Splash } from "./components/Splash";
import { useState } from "react";
import { Home as HomeIcon, Search, Calendar } from "lucide-react";

import { Home } from "./pages/home";
import { SearchPage } from "./pages/search";
import { VenueDetail } from "./pages/venue-detail";

const queryClient = new QueryClient();

function PageContainer({ children, hideNav = false }: { children: React.ReactNode, hideNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center pb-16">
      {/* Expanded max width from 430px to full responsive layout (up to max-w-6xl on desktop) */}
      <div className="w-full max-w-5xl bg-background relative min-h-[100dvh] px-4 md:px-8">
        {children}
        {!hideNav && <MobileNav />}
      </div>
    </div>
  );
}

function MobileNav() {
  const [location] = useLocation();
  
  return (
    /* Fixed bottom bar that centers smoothly across screen sizes */
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl bg-card border-t border-border flex justify-around items-center p-3 z-40 pb-safe shadow-lg">
      <Link href="/" className={`flex flex-col items-center gap-1 ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>
        <HomeIcon className={`w-6 h-6 ${location === '/' ? 'fill-primary/20' : ''}`} />
        <span className="text-xs font-medium">الرئيسية</span>
      </Link>
      <Link href="/search" className={`flex flex-col items-center gap-1 ${location === '/search' || location === '/venues' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>
        <Search className={`w-6 h-6 ${location === '/search' || location === '/venues' ? 'fill-primary/20' : ''}`} />
        <span className="text-xs font-medium">بحث</span>
      </Link>
      <Link href="/bookings" className={`flex flex-col items-center gap-1 ${location.startsWith('/bookings') ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>
        <Calendar className={`w-6 h-6 ${location.startsWith('/bookings') ? 'fill-primary/20' : ''}`} />
        <span className="text-xs font-medium">حجوزاتي</span>
      </Link>
    </nav>
  );
}

function Bookings() {
  return (
    <PageContainer>
      <div className="p-4 space-y-6">
        <header className="pt-4">
          <h1 className="text-2xl font-bold font-serif text-primary">حجوزاتي</h1>
        </header>
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-primary/40" />
          <p className="font-medium text-foreground">لا توجد حجوزات بعد</p>
          <p className="text-sm">عند إضافة القاعات، تقدر تحجز وتتابع حجوزاتك من هنا</p>
        </div>
      </div>
    </PageContainer>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PageContainer><Home /></PageContainer>
      </Route>
      <Route path="/bookings">
        <PageContainer><Bookings /></PageContainer>
      </Route>
      <Route path="/search">
        <PageContainer><SearchPage /></PageContainer>
      </Route>
      <Route path="/venues">
        <PageContainer><SearchPage /></PageContainer>
      </Route>
      <Route path="/venues/:id">
        <PageContainer hideNav><VenueDetail /></PageContainer>
      </Route>
      <Route path="/invite" component={InviteCreate} />
      <Route path="/i/:publicToken" component={InviteView} />
      <Route path="/invite/manage" component={InviteManage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function isDirectInvitationLink(): boolean {
  const path = window.location.pathname;
  const hash = window.location.hash;
  return /\/i\//.test(path) || (path.includes("/invite/manage") && hash.includes("token="));
}

function App() {
  const [showSplash, setShowSplash] = useState(() => !isDirectInvitationLink());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {showSplash ? (
          <Splash onComplete={() => setShowSplash(false)} />
        ) : (
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;