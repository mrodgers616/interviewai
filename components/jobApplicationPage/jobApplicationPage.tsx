import { FC, useState, useEffect } from "react";
import { useAuth } from "reactfire";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";

export const JobApplicationPage: FC = () => {
  const auth = useAuth();
  const db = getFirestore();
  const [config, setConfig] = useState({
    remote: true,
    experienceLevel: {
      internship: false,
      entry: true,
      associate: true,
      "mid-senior level": true,
      director: false,
      executive: false,
    },
    jobTypes: {
      "full-time": true,
      contract: false,
      "part-time": false,
      temporary: true,
      internship: false,
      other: false,
      volunteer: true,
    },
    date: {
      "all time": false,
      month: false,
      week: false,
      "24 hours": true,
    },
    positions: ["Software engineer"],
    locations: ["Germany"],
    apply_once_at_company: true,
    distance: 100,
    company_blacklist: ["wayfair", "Crossover"],
    title_blacklist: ["word1", "word2"],
    job_applicants_threshold: {
      min_applicants: 0,
      max_applicants: 30,
    },
  });

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
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Remote */}
            <div className="mb-4">
              <Checkbox
                checked={config.remote}
                onCheckedChange={(checked: boolean) =>
                  setConfig({ ...config, remote: checked })
                }
                id="remote"
              />
              <label htmlFor="remote" className="ml-2">
                Remote
              </label>
            </div>

            {/* Experience Level */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Experience Level</h3>
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
              <h3 className="text-lg font-semibold mb-2">Positions</h3>
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
              <Checkbox
                checked={config.apply_once_at_company}
                onCheckedChange={(checked: boolean) =>
                  setConfig({ ...config, apply_once_at_company: checked })
                }
                id="apply_once_at_company"
              />
              <label htmlFor="apply_once_at_company" className="ml-2">
                Apply once at company
              </label>
            </div>

            {/* Distance */}
            <div className="mb-4">
              <Input
                value={config.distance.toString()}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    distance: parseInt(e.target.value, 10),
                  })
                }
                placeholder="Enter distance in kilometers"
              />
            </div>

            {/* Company Blacklist */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Company Blacklist</h3>
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
              <h3 className="text-lg font-semibold mb-2">Title Blacklist</h3>
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
              <h3 className="text-lg font-semibold mb-2">Job Applicants Threshold</h3>
              <div className="flex items-center mb-2">
                <Input
                  value={config.job_applicants_threshold.min_applicants.toString()}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      job_applicants_threshold: {
                        ...config.job_applicants_threshold,
                        min_applicants: parseInt(e.target.value, 10),
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
                        max_applicants: parseInt(e.target.value, 10),
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
  );
};

export default JobApplicationPage;
