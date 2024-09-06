"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFirebaseApp, useUser } from "reactfire";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import { uploadResume } from "@/components/firebase-providers";
import { MainNav } from "@/components/demo-dashboard/main-nav";


const ResumeReader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [existingResume, setExistingResume] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: user } = useUser();
  const firestore = getFirestore(useFirebaseApp());
  const storage = getStorage(useFirebaseApp());
  
  useEffect(() => {
    const checkExistingResume = async () => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().resumeStorageRef) {
          setExistingResume(userDoc.data().resumeStorageRef);
        }
      }
    };
    checkExistingResume();
  }, [user, firestore]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = user?.uid;

      if (!userId) {
        toast({
          title: "User not logged in",
          description: "Please log in to upload a resume.",
          variant: "destructive",
        });
        return;
      }

      // Delete existing resume if it exists
      if (existingResume) {
        const oldResumeRef = ref(storage, existingResume);
        await deleteObject(oldResumeRef);
      }

      console.log("Uploading resume for user:", userId);
      const newResumeRef = await uploadResume(file, userId);

      // Update user document with new resume reference
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        resumeStorageRef: newResumeRef
      });

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been updated in our database.",
      });

      setFile(null);
      setExistingResume(newResumeRef);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    setFile(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Resume Upload</h1>
      <div className="flex h-16 items-center bg-muted px-6 rounded-xl mb-6">
          <MainNav />
      </div>
      
      <div className="space-y-4">
        {existingResume && (
          <p className="text-sm text-muted-foreground">
            Existing resume: {existingResume.substring(existingResume.lastIndexOf('/') + 1)}
          </p>
        )}
        <div className="flex items-center space-x-4">
          <Button onClick={() => document.getElementById('fileInput')?.click()}>
            Choose File
          </Button>
          <Input
            id="fileInput"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          {file && (
            <>
              <span>{file.name}</span>
              <Button variant="destructive" onClick={handleDelete}>X</Button>
            </>
          )}
        </div>
        <Button onClick={handleUpload} disabled={!file}>
          Upload Resume
        </Button>
      </div>
    </div>
  );
};

export default ResumeReader;
