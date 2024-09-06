import { FC, useEffect, useState } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useFirestore, useUser } from "reactfire";
import { collection, query, where, getDocs } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DemoDashboard: FC = () => {
  const [userData, setUserData] = useState({
    totalInterviews: 0,
    averageScore: 0,
    skillsImproved: 0,
    recentInterviews: [],
  });

  const { data: user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const interviewsRef = collection(firestore, 'interviews');
        const q = query(interviewsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let totalScore = 0;
        let totalInterviews = 0;
        let skillsImproved = new Set();
        let recentInterviews: any = [];

        querySnapshot.forEach((doc) => {
          const interview = doc.data();
          totalScore += interview.score;
          totalInterviews++;
          skillsImproved.add(interview.skillImproved);
          recentInterviews.push(interview);
        });

        setUserData({ 
          totalInterviews,
          averageScore: totalInterviews > 0 ? totalScore / totalInterviews : 0,
          skillsImproved: skillsImproved.size,
          recentInterviews: recentInterviews.slice(0, 5),
        });
      }
    };

    fetchUserData();
  }, [user, firestore]);

  const chartData = [
    { name: 'Jan', score: 65 },
    { name: 'Feb', score: 59 },
    { name: 'Mar', score: 80 },
    { name: 'Apr', score: 81 },
    { name: 'May', score: 76 },
    { name: 'Jun', score: 85 },
  ];

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
            Interview Dashboard
          </h2>
        </div>
        <div className="flex h-16 items-center bg-muted px-6 rounded-xl">
          <MainNav />
        </div>
        <div className="flex-1 space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Interviews
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.totalInterviews}</div>
                <p className="text-xs text-muted-foreground">
                  Total interviews completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.averageScore.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Average interview score
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills Improved</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.skillsImproved}</div>
                <p className="text-xs text-muted-foreground">
                  Unique skills improved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Interview
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Tomorrow</div>
                <p className="text-xs text-muted-foreground">
                  9:00 AM - Software Engineer
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Interviews</CardTitle>
                <CardDescription>
                  Your last {userData.recentInterviews.length} interviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <RecentInterviews interviews={userData.recentInterviews} /> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
