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
        <header className="container mx-auto py-16 text-center">
          <Badge variant="secondary" className="mb-4">Now using the app router!</Badge>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Build Your Next Billion Dollar App
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-8">
            Jumpstart your project with our powerful boilerplate. Featuring Next.js, shadcn/ui, Tailwind, Firebase, and TypeScript.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto flex-grow">
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Boilerplate?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Vercel", description: "Deploy with ease" },
                { title: "Next.js", description: "React framework for production" },
                { title: "Firebase", description: "Powerful backend services" },
                { title: "shadcn/ui", description: "Beautiful, customizable UI components" },
                { title: "Tailwind CSS", description: "Utility-first CSS framework" },
                { title: "TypeScript", description: "Enhanced developer experience" },
              ].map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          
        </main>

        <footer className="bg-muted py-8 mt-16">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
