"use client"
import { JobApplicationPage } from "@/components/jobApplicationPage/jobApplicationPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


const JobApplicationsPage = () => {
  return (
    <>
    <ProtectedRoute>
      <JobApplicationPage />
    </ProtectedRoute>
      
    </>
  );
};
export default JobApplicationsPage;