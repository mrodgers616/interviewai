import { FC, useState, useEffect } from "react";
import { useAuth } from "reactfire";
import { doc, setDoc, getFirestore, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { MainNav } from "@/components/demo-dashboard/main-nav";

interface Config {
  remote: boolean;
  experienceLevel: Record<string, boolean>;
  jobTypes: Record<string, boolean>;
  date: Record<string, boolean>;
  positions: string[];
  locations: string[];
  apply_once_at_company: boolean;
  distance: number;
  company_blacklist: string[];
  title_blacklist: string[];
  job_applicants_threshold: {
    min_applicants: number;
    max_applicants: number;
  };
}

const defaultConfig: Config = {
  remote: false,
  experienceLevel: {
    internship: false,
    entry: false,
    associate: false,
    "mid-senior level": false,
    director: false,
    executive: false,
  },
  jobTypes: {
    "full-time": false,
    contract: false,
    "part-time": false,
    temporary: false,
    internship: false,
    other: false,
    volunteer: false,
  },
  date: {
    "all time": false,
    month: false,
    week: false,
    "24 hours": false,
  },
  positions: [],
  locations: [],
  apply_once_at_company: false,
  distance: 0,
  company_blacklist: [],
  title_blacklist: [],
  job_applicants_threshold: {
    min_applicants: 0,
    max_applicants: 0,
  },
};

export const JobApplicationPage: FC = () => {
  const auth = useAuth();
  const db = getFirestore();
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    const fetchUserConfig = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && userDocSnap.data().config) {
            setConfig({ ...defaultConfig, ...userDocSnap.data().config });
          }
        } catch (error) {
          console.error("Error fetching user configuration:", error);
          toast.error("Failed to load user configuration");
        }
      }
    };

    fetchUserConfig();
  }, [auth.currentUser, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("You must be logged in to save configuration");
      return;
    }

    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { config }, { merge: true });
      toast.success("Configuration saved successfully");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    }
  };

  return (
    <>
      <div className="flex h-16 items-center bg-muted px-6 rounded-xl">
          <MainNav />
        </div>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Remote */}
              <div className="mb-4">
                <div className="flex items-center">
                  <Checkbox
                    checked={config.remote}
                    onCheckedChange={(checked: boolean) =>
                      setConfig({ ...config, remote: checked })
                    }
                    id="remote"
                  />
                  <label htmlFor="remote" className="ml-2 flex items-center">
                    Remote
                    <span className="ml-1 group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Only show remote job opportunities
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Experience Level
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Select the experience levels you're interested in
                    </span>
                  </span>
                </h3>
                {Object.entries(config.experienceLevel).map(([key, value]) => (
                  <div key={key} className="flex items-center mb-2">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked: boolean) =>
                        setConfig({
                          ...config,
                          experienceLevel: {
                            ...config.experienceLevel,
                            [key]: checked,
                          },
                        })
                      }
                      id={`experience-${key}`}
                    />
                    <label htmlFor={`experience-${key}`} className="ml-2">
                      {key}
                    </label>
                  </div>
                ))}
              </div>

              {/* Job Types */}
              {/* Similar structure as Experience Level */}

              {/* Date */}
              {/* Similar structure as Experience Level */}

              {/* Positions */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Positions
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Enter job positions you're interested in, separated by commas
                    </span>
                  </span>
                </h3>
                <Input
                  value={config.positions.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      positions: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Enter positions separated by commas"
                />
              </div>

              {/* Locations */}
              {/* Similar structure as Positions */}

              {/* Apply Once at Company */}
              <div className="mb-4">
                <div className="flex items-center">
                  <Checkbox
                    checked={config.apply_once_at_company}
                    onCheckedChange={(checked: boolean) =>
                      setConfig({ ...config, apply_once_at_company: checked })
                    }
                    id="apply_once_at_company"
                  />
                  <label htmlFor="apply_once_at_company" className="ml-2 flex items-center">
                    Apply once at company
                    <span className="ml-1 group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span className="absolute bottom-full right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Only apply once to each company, even if they have multiple job openings
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Distance */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Distance
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Maximum distance in miles from your location
                    </span>
                  </span>
                </h3>
                <Input
                  value={config.distance.toString()}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      distance: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="Enter distance in Miles"
                />
              </div>

              {/* Company Blacklist */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Company Blacklist
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Companies to exclude from your job search
                    </span>
                  </span>
                </h3>
                <Input
                  value={config.company_blacklist.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      company_blacklist: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Enter companies separated by commas"
                />
              </div>

              {/* Title Blacklist */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Title Blacklist
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Job titles to exclude from your search
                    </span>
                  </span>
                </h3>
                <Input
                  value={config.title_blacklist.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      title_blacklist: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Enter titles separated by commas"
                />
              </div>

              {/* Job Applicants Threshold */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Job Applicants Threshold
                  <span className="ml-1 group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span className="absolute bottom-full right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Range of acceptable number of applicants for a job
                    </span>
                  </span>
                </h3>
                <div className="flex items-center mb-2">
                  <Input
                    value={config.job_applicants_threshold.min_applicants.toString()}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        job_applicants_threshold: {
                          ...config.job_applicants_threshold,
                          min_applicants: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    placeholder="Enter minimum applicants"
                  />
                  <span className="mx-2">to</span>
                  <Input
                    value={config.job_applicants_threshold.max_applicants.toString()}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        job_applicants_threshold: {
                          ...config.job_applicants_threshold,
                          max_applicants: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    placeholder="Enter maximum applicants"
                  />
                </div>
              </div>

              <Button type="submit" className="mt-4">
                Save Configuration
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default JobApplicationPage;
