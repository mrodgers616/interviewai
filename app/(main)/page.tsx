import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="container mx-auto py-16 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800">AI-Powered Interview Practice</Badge>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-indigo-900">
            Master Your Interviews with AI
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-indigo-700 mb-8">
            Practice interviews with our advanced AI system. Get personalized feedback and improve your skills for your dream job.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">Start Practicing</Button>
            </Link>
            <Link href="/about" className={cn(buttonVariants({ variant: "outline" }), "text-lg border-indigo-600 text-indigo-600 hover:bg-indigo-50")}>
              Learn More
            </Link>
          </div>
        </header>

        <main className="container mx-auto flex-grow">
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-indigo-900">Why Choose InterviewAI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "AI-Powered", description: "Realistic interview simulations", color: "bg-blue-50" },
                { title: "Personalized Feedback", description: "Tailored advice for improvement", color: "bg-indigo-50" },
                { title: "Diverse Industries", description: "Practice for various job sectors", color: "bg-purple-50" },
                { title: "24/7 Availability", description: "Practice anytime, anywhere", color: "bg-blue-50" },
                { title: "Progress Tracking", description: "Monitor your improvement over time", color: "bg-indigo-50" },
                { title: "Expert-Crafted Questions", description: "Based on real interview experiences", color: "bg-purple-50" },
              ].map((feature, index) => (
                <Card key={index} className={`text-center ${feature.color}`}>
                  <CardHeader>
                    <CardTitle className="text-indigo-800">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-indigo-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="py-16">
            <Card className="text-center p-8 bg-gradient-to-r from-indigo-100 to-blue-100">
              <CardHeader>
                <CardTitle className="text-2xl mb-4 text-indigo-900">Ready to Ace Your Next Interview?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg mb-6 text-indigo-700">
                  Join thousands of job seekers who have improved their interview skills with InterviewAI.
                </CardDescription>
                <Link href="/signup">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">Sign Up Now</Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </main>

        <footer className="bg-indigo-900 text-white py-8 mt-16">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
