"use client";
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFirebaseApp, useUser } from "reactfire";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useRouter } from "next/navigation";
import { uploadResume } from "@/components/firebase-providers";

const ResumeReader = () => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { data: user } = useUser();
  
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
      console.log("Uploading resume for user:", userId);
      await uploadResume(file, userId);

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been stored in our database.",
      });

      setFile(null);
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
      <div className="space-y-4">
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
