import { useAuth, loginSchema } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import { Loader2, HelpCircle, LogIn } from "lucide-react";
import logoImage from "@/assets/logo.png";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  // Redirect if the user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-neutral-light">
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <img src={logoImage} alt="Suvarna Logo" className="h-16" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Mortuary Management System</h1>
            <p className="text-gray-600 mt-2">Sign in to access the system</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Login</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Sign In
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    <p>Need access? Contact your system administrator.</p>
                    <p className="mt-1">User accounts can only be created by administrators.</p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Hero/Info Section */}
      <div className="hidden lg:flex lg:flex-1 bg-primary p-8 text-white flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl font-bold mb-6">Hospital Mortuary Management System</h2>
          <p className="text-lg text-neutral-light mb-8">
            A comprehensive solution for managing deceased patient records, storage allocation, 
            postmortem examinations, and body release processes.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-secondary bg-opacity-30 p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Secure Record Keeping</h3>
                <p className="text-neutral-light">Maintain detailed and secure records of all deceased patients.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-secondary bg-opacity-30 p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Workflow Automation</h3>
                <p className="text-neutral-light">Streamlined processes for body storage, autopsies, and releases.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-secondary bg-opacity-30 p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Comprehensive Reporting</h3>
                <p className="text-neutral-light">Generate detailed reports and statistics for management oversight.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex items-center text-sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Need help? Contact the hospital IT department for assistance.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
