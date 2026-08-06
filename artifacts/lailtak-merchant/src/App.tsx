import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import { MerchantLayout } from "@/components/layout/MerchantLayout";
import Dashboard from "@/pages/Dashboard";
import Venues from "@/pages/Venues";
import NewVenue from "@/pages/NewVenue";
import EditVenue from "@/pages/EditVenue";
import Bookings from "@/pages/Bookings";
import BookingDetails from "@/pages/BookingDetails";
import Profile from "@/pages/Profile";
import Register from "@/pages/Register";
import Login from "@/pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: any, [key: string]: any }) {
  const { auth } = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return <Redirect to="/login" />;
  }

  return (
    <MerchantLayout>
      <Component {...rest} />
    </MerchantLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />

      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/venues">
        <ProtectedRoute component={Venues} />
      </Route>
      <Route path="/venues/new">
        <ProtectedRoute component={NewVenue} />
      </Route>
      <Route path="/venues/:venueId">
        <ProtectedRoute component={EditVenue} />
      </Route>
      <Route path="/bookings">
        <ProtectedRoute component={Bookings} />
      </Route>
      <Route path="/bookings/:bookingId">
        <ProtectedRoute component={BookingDetails} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
