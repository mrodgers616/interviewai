import { FC } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export const InterviewDashboard: FC = () => {
  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <Image
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <div className="flex items-end justify-between space-y-2 mb-6">
          <h2 className="text-3xl leading-5 font-bold tracking-tight">
            Interview in Progress
          </h2>
        </div>
        <div className="flex h-16 items-center bg-muted px-6 rounded-xl">
          <MainNav />
        </div>
        <div className="flex-1 space-y-4 pt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Interview Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-4xl mx-auto">
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-white text-lg">Interview Practice</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Start Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <button className="w-full py-2 bg-green-500 text-white rounded-md">Begin Interview</button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-center">Microphone</CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full py-2 bg-blue-500 text-white rounded-md">Mute</button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-center">Camera</CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full py-2 bg-blue-500 text-white rounded-md">Turn Off</button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-center">Call</CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full py-2 bg-red-500 text-white rounded-md">End Call</button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
