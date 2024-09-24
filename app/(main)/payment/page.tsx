"use client"
import { StripePage } from "@/components/stripe/stripe";
import { useEffect } from "react";
import { useUser, useFirestore } from "reactfire";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const PaymentPage = () => {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().paid) {
          router.push('/app');
        }
      }
    };

    checkPaymentStatus();
  }, [user, firestore, router]);

  return (
    <>
      <StripePage />
    </>
  );
};

export default PaymentPage;