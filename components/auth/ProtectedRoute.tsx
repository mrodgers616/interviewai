import { useUser, useFirestore } from "reactfire";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
      } else {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !userDoc.data().paid) {
          router.push('/payment');
        } else {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [user, firestore, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};