"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "reactfire";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { uploadJobDescription, fetchExistingJobDescription } from "@/components/firebase-providers";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const JobDescriptionForm = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [existingJobDescription, setExistingJobDescription] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: user } = useUser();
  
  useEffect(() => {
    const checkExistingJobDescription = async () => {
      if (user) {
        const existingDescription = await fetchExistingJobDescription(user.uid);
        if (existingDescription) {
          setExistingJobDescription(existingDescription);
          // Remove this line: setJobDescription(existingDescription);
        }
      }
    };
    checkExistingJobDescription();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast({
        title: "Empty job description",
        description: "Please enter a job description.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!user) {
        toast({
          title: "User not logged in",
          description: "Please log in to submit a job description.",
          variant: "destructive",
        });
        return;
      }

      await uploadJobDescription(jobDescription, user.uid);

      toast({
        title: "Job description submitted successfully",
        description: "Your job description has been updated in our database.",
      });

      setExistingJobDescription(jobDescription);
      setJobDescription('');
    } catch (error) {
      console.error("Error submitting job description:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your job description. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Job Description Input</h1>
      <div className="flex h-16 items-center bg-muted px-6 rounded-xl mb-6">
        <MainNav />
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Enter Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          {existingJobDescription && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Existing Job Description:</h3>
              <p className="text-sm text-muted-foreground">{existingJobDescription}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Enter a new job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="mb-4 h-64"
            />
            <Button type="submit" className="w-full">
              Submit Job Description
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function JobDescriptionInput() {
  return (
    <ProtectedRoute>
      <JobDescriptionForm />
    </ProtectedRoute>
  );
}