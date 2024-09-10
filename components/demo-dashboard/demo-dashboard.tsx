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
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DemoDashboard: FC = () => {
  const [userData, setUserData] = useState({
    interviewCount: 0,
    averageScore: 0,
    skillsimproved: 0,
    recentInterviews: [],
  });

  const { data: user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserData({
            interviewCount: userData.interviewCount || 0,
            averageScore: userData.averageScore || 0,
            skillsimproved: userData.skillsimproved || 0,
            recentInterviews: [],
          });
        }

        const interviewsRef = collection(firestore, 'interviews');
        const q = query(interviewsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let recentInterviews: any = [];

        querySnapshot.forEach((doc) => {
          const interview = doc.data();
          recentInterviews.push(interview);
        });

        setUserData(prevState => ({ 
          ...prevState,
          recentInterviews: recentInterviews.slice(0, 5),
        }));
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <div className="text-2xl font-bold">{userData.interviewCount}</div>
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
                <div className="text-2xl font-bold">{userData.skillsimproved}</div>
                <p className="text-xs text-muted-foreground">
                  Unique skills improved
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
