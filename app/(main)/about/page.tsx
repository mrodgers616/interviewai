"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useUser } from "reactfire";
import { useRouter } from "next/navigation";

const AboutPage = () => {
  const { data: user } = useUser();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/app");
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">About InterviewAI</h1>
      
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-3xl font-bold">Welcome to InterviewAI</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6 text-lg">
            InterviewAI is an innovative platform designed to revolutionize the way job seekers prepare for interviews. Our mission is to empower individuals with the tools and confidence they need to excel in their job interviews.
          </p>
          
          <Separator className="my-6" />
          
          <h3 className="text-2xl font-semibold mb-4">What We Offer</h3>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>AI-powered mock interviews tailored to your specific job description</li>
            <li>Personalized feedback and performance analysis</li>
            <li>Resume optimization suggestions</li>
            <li>Industry-specific interview question bank</li>
            <li>Real-time interview practice with voice recognition</li>
          </ul>
          
          <Separator className="my-6" />
          
          <h3 className="text-2xl font-semibold mb-4">How It Works</h3>
          <ol className="list-decimal list-inside mb-6 space-y-2">
            <li>Upload your resume and job description</li>
            <li>Our AI analyzes your information and creates a customized interview</li>
            <li>Practice with our virtual interviewer</li>
            <li>Receive instant feedback and suggestions for improvement</li>
            <li>Track your progress and refine your skills</li>
          </ol>
          
          <Separator className="my-6" />
          
          <p className="mb-4 text-lg">
            Whether you're a recent graduate, career changer, or seasoned professional, InterviewAI is here to help you land your dream job. Our cutting-edge technology combined with industry expertise ensures that you're always one step ahead in your interview preparation.
          </p>
          
          <p className="text-xl font-semibold text-center mt-8">
            Start your journey to interview success today with InterviewAI!
          </p>

          <div className="flex justify-center mt-8">
            <Button onClick={handleGetStarted} size="lg">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function About() {
  return (
    <AboutPage />
  );
}
