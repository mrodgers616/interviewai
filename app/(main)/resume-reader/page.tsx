"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFirebaseApp } from "reactfire";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";


export default function ResumeReader() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const app = useFirebaseApp();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const router = useRouter();
  
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
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `resumes/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Store file metadata in Firestore
      await addDoc(collection(db, "resumes"), {
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date(),
        downloadURL: downloadURL,
      });

      const docRef = await addDoc(collection(db, "resumes"), {
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date(),
        downloadURL: downloadURL,
      });

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been stored in our database.",
      });

      setFile(null);

      router.push(`/resume-analysis/${docRef.id}`);
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
}
