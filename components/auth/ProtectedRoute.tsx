import { useUser } from "reactfire";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, status } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (status === "success" && !user) {
      router.push("/login"); // Redirect to login page if not authenticated
    }
  }, [user, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>; // Or a proper loading component
  }

  return user ? <>{children}</> : null;
}