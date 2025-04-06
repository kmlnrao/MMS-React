import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "@/lib/protected-route";
import RegistrationPage from "@/pages/registration-page";
import StorageManagement from "@/pages/storage-management";
import PostmortemPage from "@/pages/postmortem";
import BodyRelease from "@/pages/body-release";
import UnclaimedBodies from "@/pages/unclaimed-bodies";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/registration" component={RegistrationPage} />
      <ProtectedRoute path="/storage" component={StorageManagement} />
      <ProtectedRoute path="/postmortem" component={PostmortemPage} />
      <ProtectedRoute path="/release" component={BodyRelease} />
      <ProtectedRoute path="/unclaimed" component={UnclaimedBodies} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute 
        path="/settings" 
        component={Settings} 
        allowedRoles={["admin", "mortuary_staff"]} 
      />
      <ProtectedRoute 
        path="/users" 
        component={UserManagement} 
        allowedRoles={["admin"]} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Wrap everything in error boundaries to prevent fatal crashes
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Fatal application error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "red" }}>Application Error</h1>
        <p>The application encountered a fatal error. Please reload the page.</p>
        <pre style={{ textAlign: "left", background: "#f0f0f0", padding: "1rem", borderRadius: "4px" }}>
          {errorMessage}
        </pre>
      </div>
    );
  }
}

export default App;
