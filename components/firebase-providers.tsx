"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  AnalyticsProvider,
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
} from "reactfire";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { isBrowser } from "@/lib/utils";
import { getAnalytics } from "firebase/analytics";
import { FirebaseOptions } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, limit } from "firebase/firestore";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_APPID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENTID,
};

const FirebaseProviderSDKs: FC<{ children: ReactNode }> = ({ children }) => {
  const firebase = useFirebaseApp();
  // we have to use getters to pass to providers, children should use hooks
  const auth = useMemo(() => getAuth(), []);
  const firestore = useMemo(() => getFirestore(firebase), []);
  const analytics = useMemo(() => isBrowser() && getAnalytics(firebase), []);

  return (
    <>
      {auth && (
        <AuthProvider sdk={auth}>
          <FirestoreProvider sdk={firestore}>
            {/* we can only use analytics in the browser */}
            {analytics ? (
              <AnalyticsProvider sdk={analytics}>{children}</AnalyticsProvider>
            ) : (
              <>{children}</>
            )}
          </FirestoreProvider>
        </AuthProvider>
      )}
    </>
  );
};

export const MyFirebaseProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <FirebaseAppProvider firebaseConfig={config}>
        <FirebaseProviderSDKs>{children}</FirebaseProviderSDKs>
      </FirebaseAppProvider>
    </>
  );
};

export const uploadResume = async (file: File, userId: string): Promise<string> => {
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the maximum limit of 15MB');
  }

  const storage = getStorage();
  const storageRef = ref(storage, `resumes/${userId}/${file.name}`);
  const db = getFirestore();

  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded resume successfully');

    // Add the storage ref to the user's Firestore document
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      resumeStorageRef: snapshot.ref.fullPath
    });

    console.log('Updated user document with resume storage ref');

    return snapshot.ref.fullPath;
  } catch (error) {
    console.error('Error uploading resume or updating user document:', error);
    throw error;
  }
};

export const uploadJobDescription = async (jobDescription: string, userId: string): Promise<string> => {
  const db = getFirestore();
  const userDocRef = doc(db, "users", userId);
  const jobDescriptionsRef = collection(db, "jobDescriptions");

  try {
    // Update user document
    await updateDoc(userDocRef, {
      jobDescription: jobDescription,
      jobDescriptionUpdatedAt: new Date()
    });

    // Add to jobDescriptions collection
    const docRef = await addDoc(jobDescriptionsRef, {
      userId,
      description: jobDescription,
      createdAt: new Date()
    });

    console.log('Updated user document and added to jobDescriptions collection');
    return docRef.id;
  } catch (error) {
    console.error('Error updating job description:', error);
    throw error;
  }
};

export const fetchExistingJobDescription = async (userId: string): Promise<string | null> => {
  const db = getFirestore();
  const userDocRef = doc(db, "users", userId);

  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().jobDescription) {
      return userDoc.data().jobDescription;
    }

    // If not in user document, check jobDescriptions collection
    const jobDescriptionsRef = collection(db, "jobDescriptions");
    const q = query(jobDescriptionsRef, where("userId", "==", userId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().description;
    }

    return null;
  } catch (error) {
    console.error('Error fetching job description:', error);
    throw error;
  }
};
