"use client"
import { InterviewDashboard } from "@/components/interview-dashboard/interview-dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


const InterviewPage = () => {
  return (
    <>
    <ProtectedRoute>
      <InterviewDashboard />
    </ProtectedRoute>
      
    </>
  );
};
export default InterviewPage;