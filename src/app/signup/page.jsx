
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
import { useAuth } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    signInWithPhoneNumber, 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,
    RecaptchaVerifier
} from "firebase/auth";

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path><path fill="none" d="M1 1h22v22H1z"></path></svg>
);

const AppleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current"><path d="M12.152 6.896c-.948 0-1.896.48-2.616 1.224-.624.744-1.128 1.824-1.128 2.88 0 1.944 1.2 3.336 2.448 3.336.504 0 .816-.144 1.392-.408.48-.24.72-.384.984-.384.24 0 .528.144.912.384.456.24.888.432 1.44.432 1.2 0 2.256-1.344 2.256-3.24 0-1.776-.84-2.88-2.088-2.88-.936 0-1.536.528-2.04.528-.48 0-1.08-.528-1.92-.528zM13.2 2c-.648 1.032-1.032 2.28-1.032 3.672 0 .528.096.936.192 1.464.744.096 1.776-.312 2.688-.96.672-.48 1.488-1.464 1.488-2.64 0-1.584-1.056-2.52-2.112-2.52-.576 0-1.152.312-1.224.984z"></path></svg>
);


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
  const auth = useAuth();
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
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push('/vehicle-details');
    } catch (error) {
        console.error("Google Sign In Failed", error);
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Could not sign up with Google." });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
        const provider = new OAuthProvider('apple.com');
        await signInWithPopup(auth, provider);
        router.push('/vehicle-details');
    } catch (error) {
        console.error("Apple Sign In Failed", error);
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Could not sign up with Apple." });
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (data) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Let's set up your vehicle.",
      });
      router.push("/vehicle-details");
    } catch (error) {
      console.error("Email sign up failed", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already in use. Please log in instead.";
      } else {
        description = error.message;
      }
      toast({ variant: "destructive", title: "Sign Up Failed", description });
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (data) => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
      }
      const appVerifier = window.recaptchaVerifier;
      const formattedPhoneNumber = `+91${data.phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
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
      await confirmationResult.confirm(otp);
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <GoogleIcon />
                  Google
              </Button>
              <Button variant="outline" onClick={handleAppleSignIn}>
                  <AppleIcon />
                  Apple
              </Button>
          </div>

        </CardContent>
        <CardFooter className="flex justify-center text-sm">
           <p>Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link></p>
        </CardFooter>
      </Card>
      <div id="recaptcha-container" className="fixed bottom-0 right-0" />
    </div>
  );
}
