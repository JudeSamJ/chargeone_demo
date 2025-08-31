"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithGoogle, signInWithApple, signInWithEmail, signInWithPhoneNumber, verifyPhoneNumberOtp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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
            router.push('/');
        } catch (error) {
            console.error("Google Sign In Failed", error);
            toast({ variant: "destructive", title: "Login Failed", description: "Could not sign in with Google." });
        }
    };

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
            router.push('/');
        } catch (error) {
            console.error("Apple Sign In Failed", error);
            toast({ variant: "destructive", title: "Login Failed", description: "Could not sign in with Apple." });
        }
    };
    
    // Simplified Email Login (no OTP for login, just for signup)
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // This is a placeholder for a password field if you want to add it
            // For now, we assume a passwordless system isn't fully built for email login
             toast({ variant: "destructive", title: "Not Implemented", description: "Please sign up first or use Google/Apple." });
        } catch (error) {
            console.error("Email login failed", error);
            toast({ variant: "destructive", title: "Login Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signInWithPhoneNumber(`+${phone}`);
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
        if (!confirmationResult) return;
        setLoading(true);
        try {
            await verifyPhoneNumberOtp(confirmationResult, otp);
            toast({ title: "Success", description: "You have been logged in." });
            router.push('/');
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
                    <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                    <CardDescription>
                        Sign in to continue to ChargeOne.
                    </CardDescription>
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
                                   <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                               </div>
                               <Button type="submit" className="w-full" disabled={loading}>
                                   {loading ? 'Signing in...' : 'Sign In with Email'}
                               </Button>
                           </form>
                        </TabsContent>
                        <TabsContent value="phone">
                            <form onSubmit={otpSent ? handleOtpVerification : handlePhoneLogin} className="space-y-4 pt-4">
                                {!otpSent ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="9123456789" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="otp">Enter OTP</Label>
                                        <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Please wait...' : (otpSent ? 'Verify OTP' : 'Send OTP')}
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
                            <Image src="https://picsum.photos/20/20" data-ai-hint="google logo" width={20} height={20} className="mr-2 h-5 w-5" alt="Google" />
                            Google
                        </Button>
                        <Button variant="outline" onClick={handleAppleSignIn}>
                            <Image src="https://picsum.photos/20/20" data-ai-hint="apple logo" width={20} height={20} className="mr-2 h-5 w-5" alt="Apple" />
                            Apple
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center text-sm">
                    <p>Don't have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></p>
                </CardFooter>
            </Card>
            <div id="recaptcha-container" />
        </div>
    );
}
