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
    <div className="flex h-screen bg-[#f5f9ff]">
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1976d2] mb-3">Mortuary Management System</h1>
            <div className="flex justify-center mb-3">
              <div style={{ width: '80px', height: '80px', position: 'relative', overflow: 'visible' }}>
                <img 
                  src={logoImage} 
                  alt="Suvarna Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }} 
                />
              </div>
            </div>
            <p className="text-[#546e7a] mt-2">Sign in to access the system</p>
          </div>

          <Card className="border-[#bbdefb] shadow-lg">
            <CardHeader className="bg-[#e3f2fd] border-b border-[#bbdefb]">
              <CardTitle className="text-xl text-center text-[#0d47a1]">Login</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[#1976d2] font-medium">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="border-[#bbdefb] focus:border-[#1e88e5] focus:ring-[#1e88e5]"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#1976d2] font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="border-[#bbdefb] focus:border-[#1e88e5] focus:ring-[#1e88e5]"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Sign In
                  </Button>
                  
                  <div className="text-center text-sm text-[#546e7a] mt-4">
                    <p>Need access? Contact your system administrator.</p>
                    <p className="mt-1">User accounts can only be created by administrators.</p>
                  </div>

                  <div className="mt-6 p-4 bg-[#e3f2fd] rounded-md border border-[#bbdefb]">
                    <h4 className="font-medium text-sm mb-2 text-[#0d47a1]">Demo Credentials:</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2 rounded border border-[#bbdefb]">
                        <p><span className="font-semibold text-[#1976d2]">Admin:</span></p>
                        <p>Username: admin</p>
                        <p>Password: admin123</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-[#bbdefb]">
                        <p><span className="font-semibold text-[#1976d2]">Staff:</span></p>
                        <p>Username: mortuary</p>
                        <p>Password: mortuary123</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6 text-sm text-[#607d8b]">
            <p>© 2025 Suvarna. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Column - Hero/Info Section */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1976d2] p-8 text-white flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl font-bold mb-6">Hospital Mortuary Management System</h2>
          <p className="text-lg text-[#e3f2fd] mb-8">
            A comprehensive solution for managing deceased patient records, storage allocation, 
            postmortem examinations, and body release processes.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-[rgba(255,255,255,0.15)] p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Secure Record Keeping</h3>
                <p className="text-[#e3f2fd]">Maintain detailed and secure records of all deceased patients.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[rgba(255,255,255,0.15)] p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Workflow Automation</h3>
                <p className="text-[#e3f2fd]">Streamlined processes for body storage, autopsies, and releases.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[rgba(255,255,255,0.15)] p-2 rounded-full mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">Comprehensive Reporting</h3>
                <p className="text-[#e3f2fd]">Generate detailed reports and statistics for management oversight.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 py-4 border-t border-[rgba(255,255,255,0.2)] flex items-center text-sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Need help? Contact the hospital IT department for assistance.</span>
          </div>
          
          <div className="mt-4 text-center text-xs text-[#e3f2fd]">
            <p>© 2025 Suvarna Technologies. All rights reserved.</p>
            <p className="mt-1">Powered by Suvarna HMS Integration Platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
