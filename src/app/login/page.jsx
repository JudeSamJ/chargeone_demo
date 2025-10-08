"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signInWithPhoneNumber,
  verifyPhoneNumberOtp,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

// Google Icon SVG Component
const GoogleIcon = (props) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-5.067 2.4-4.32 0-7.733-3.5-7.733-7.733s3.413-7.733 7.733-7.733c2.373 0 4.147.933 5.333 2.027l2.547-2.547C18.4 1.867 15.6 0 12.48 0 5.867 0 0 5.867 0 12.48s5.867 12.48 12.48 12.48c7.04 0 12.067-4.8 12.067-12.32 0-.733-.067-1.467-.187-2.16H12.48z" />
  </svg>
);

// Apple Icon SVG Component
const AppleIcon = (props) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12.152 6.896c-.922 0-1.855.487-2.578 1.488-.733 1.01-.983 2.456.262 3.95s1.69.207 3.277-1.24c.768-.696 1.334-2.132 1.334-3.32C14.447 7.33 13.434 6.896 12.152 6.896zm4.846 12.203C15.424 21.058 14 24 11.53 24c-2.443 0-3.23-1.57-4.71-1.57-1.51 0-2.83.98-3.792 2.536-1.01.99-2.074 1.05-2.828.98-2.396-.28-3.95-2.02-3.95-5.323 0-3.362 2.44-5.366 4.71-5.366 1.48 0 2.653.946 3.73 1.01s2.21-.92 3.92-1.01c2.01-.12 3.65.01 5.31 1.76.7.74 1.13 1.76.79 2.89-.33 1.1-.98 1.86-1.76 2.53l.21.14c1.23-.74 1.69-1.53 1.69-2.39 0-.61-.31-1.21-.86-1.63-.04-.04-.07-.06-.1-.1l-.01-.01c-.11-.09-.23-.19-.36-.29-1.53-1.18-3.9-1.5-5.46-.86-1.59.65-2.42 2.22-2.18 3.85.24 1.64 1.75 2.76 3.35 2.11 1.58-.64 2.17-2.32 1.93-3.95-.08-.53-.29-.98-.59-1.32-.2-.23-.44-.43-.71-.59-.03-.02-.06-.03-.09-.05l.29.13z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push("/vehicle-details");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google Sign In Failed", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Could not sign in with Google.",
        });
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      router.push("/vehicle-details");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Apple Sign In Failed", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Could not sign in with Apple.",
        });
      }
    }
  };

  // Simplified Email Login (no OTP for login, just for signup)
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // This is a placeholder for a password field if you want to add it
      // For now, we assume a passwordless system isn't fully built for email login
      toast({
        variant: "destructive",
        title: "Not Implemented",
        description: "Please sign up first or use Google/Apple.",
      });
    } catch (error) {
      console.error("Email login failed", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian mobile number.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(phone);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your phone.",
      });
    } catch (error) {
      console.error("Failed to send OTP", error);
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    try {
      await verifyPhoneNumberOtp(confirmationResult, otp);
      toast({ title: "Success", description: "You have been logged in." });
      router.push("/vehicle-details");
    } catch (error) {
      console.error("OTP verification failed", error);
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to ChargeOne.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phone">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In with Email"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="phone">
              <form
                onSubmit={otpSent ? handleOtpVerification : handlePhoneLogin}
                className="space-y-4 pt-4"
              >
                {!otpSent ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : otpSent
                    ? "Verify OTP"
                    : "Send OTP"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleGoogleSignIn}>
              <GoogleIcon className="mr-2 h-5 w-5 fill-[#4285F4]" />
              Google
            </Button>
            <Button variant="outline" onClick={handleAppleSignIn}>
              <AppleIcon className="mr-2 h-5 w-5 fill-black dark:fill-white" />
              Apple
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
      <div id="recaptcha-container" />
    </div>
  );
}
