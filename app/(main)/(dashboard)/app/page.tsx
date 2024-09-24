"use client"
import { DemoDashboard } from "@/components/demo-dashboard/demo-dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const ApplicationPage = () => {
  return (
    <ProtectedRoute>
      <DemoDashboard />
    </ProtectedRoute>
  );
};

export default ApplicationPage;
