"use client";

import { useState, useEffect } from "react";
import { useUser } from "reactfire";
import { getAuth, updatePassword, updateProfile, User, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { data: user } = useUser();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPlan, setCurrentPlan] = useState("Basic"); // This should be fetched from your backend

  useEffect(() => {
    if (user?.displayName) {
      const nameParts = user.displayName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user]);

  const handlePasswordChange = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (error) {
          throw new Error('Failed to reauthenticate. Please check your old password.');
        }
        
        await updatePassword(currentUser, newPassword);
        toast({
          title: "Password updated",
          description: "Your password has been successfully changed.",
        });
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNameChange = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: `${firstName} ${lastName}`.trim()
        });
        toast({
          title: "Name updated",
          description: "Your name has been successfully updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlanChange = (plan: string) => {
    // This should integrate with your backend and payment provider
    toast({
      title: "Plan change requested",
      description: `You've requested to change to the ${plan} plan. This feature is not yet implemented.`,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Manage your subscription plan here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Current Plan: {currentPlan}</p>
              <div className="flex space-x-4">
                <Button onClick={() => handlePlanChange("Basic")}>Basic</Button>
                <Button onClick={() => handlePlanChange("Pro")}>Pro</Button>
                <Button onClick={() => handlePlanChange("Enterprise")}>Enterprise</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={() => handlePlanChange("Cancel")}>
                Cancel Subscription
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and personal information here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <Button onClick={handleNameChange}>Update Name</Button>
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button onClick={handlePasswordChange}>Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
