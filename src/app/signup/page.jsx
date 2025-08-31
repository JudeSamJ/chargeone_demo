"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { signUpWithEmail, signInWithPhoneNumber, verifyPhoneNumberOtp } from "@/lib/firebase";
import Image from "next/image";

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const phoneSchema = z.object({
  phone: z.string()
    .length(10, { message: "Phone number must be exactly 10 digits." })
    .regex(/^[6-9]\d{9}$/, { message: "Please enter a valid Indian mobile number." }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState("");
  const [activeTab, setActiveTab] = useState("phone");

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  // This simulates an OTP flow for email.
  const onEmailSubmit = async (data) => {
    setLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Please log in.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Email sign up failed", error);
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(data.phone);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone." });
    } catch (error) {
      console.error("Failed to send OTP", error);
      toast({ variant: "destructive", title: "Failed to send OTP", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    if (!confirmationResult || !otp) return;
    setLoading(true);
    try {
      await verifyPhoneNumberOtp(confirmationResult, otp);
      toast({ title: "Success!", description: "Your phone number has been verified." });
      router.push("/vehicle-details");
    } catch (error) {
      console.error("OTP verification failed", error);
      toast({ variant: "destructive", title: "Invalid OTP", description: "The OTP you entered is incorrect." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join ChargeOne to start your EV journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="phone">
              {!otpSent ? (
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <div className="flex items-center gap-2">
                            <span className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                                +91
                            </span>
                            <FormControl>
                                <Input placeholder="9876543210" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <form onSubmit={handleOtpVerification} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Sign Up"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
           <p>Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link></p>
        </CardFooter>
      </Card>
      <div id="recaptcha-container" className="fixed bottom-0 right-0" />
    </div>
  );
}