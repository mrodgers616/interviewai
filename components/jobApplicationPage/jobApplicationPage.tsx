import { FC, useState, useEffect } from "react";
import { useAuth } from "reactfire";
import { doc, setDoc, getFirestore, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import { Toaster } from 'react-hot-toast';

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
  personal_information: {
    name: string;
    surname: string;
    date_of_birth: string;
    country: string;
    city: string;
    address: string;
    zip_code: string;
    phone_prefix: string;
    phone: string;
    email: string;
    github: string;
    linkedin: string;
  };
  education_details: Array<{
    education_level: string;
    institution: string;
    field_of_study: string;
    final_evaluation_grade: string;
    start_date: string;
    year_of_completion: string;
    exam: Record<string, string>;
  }>;
  experience_details: Array<{
    position: string;
    company: string;
    employment_period: string;
    location: string;
    industry: string;
    key_responsibilities: string[];
    skills_acquired: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    link: string;
  }>;
  achievements: Array<{
    name: string;
    description: string;
  }>;
  certifications: string[];
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  interests: string[];
  availability: {
    notice_period: string;
  };
  salary_expectations: {
    salary_range_usd: string;
  };
  self_identification: {
    gender: string;
    pronouns: string;
    veteran: string;
    disability: string;
    ethnicity: string;
  };
  legal_authorization: {
    eu_work_authorization: string;
    us_work_authorization: string;
    requires_us_visa: string;
    requires_us_sponsorship: string;
    requires_eu_visa: string;
    legally_allowed_to_work_in_eu: string;
    legally_allowed_to_work_in_us: string;
    requires_eu_sponsorship: string;
    canada_work_authorization: string;
    requires_canada_visa: string;
    legally_allowed_to_work_in_canada: string;
    requires_canada_sponsorship: string;
    uk_work_authorization: string;
    requires_uk_visa: string;
    legally_allowed_to_work_in_uk: string;
    requires_uk_sponsorship: string;
  };
  work_preferences: {
    remote_work: string;
    in_person_work: string;
    open_to_relocation: string;
    willing_to_complete_assessments: string;
    willing_to_undergo_drug_tests: string;
    willing_to_undergo_background_checks: string;
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
  personal_information: {
    name: "",
    surname: "",
    date_of_birth: "",
    country: "",
    city: "",
    address: "",
    zip_code: "",
    phone_prefix: "",
    phone: "",
    email: "",
    github: "",
    linkedin: "",
  },
  education_details: [],
  experience_details: [],
  projects: [],
  achievements: [],
  certifications: [],
  languages: [],
  interests: [],
  availability: {
    notice_period: "",
  },
  salary_expectations: {
    salary_range_usd: "",
  },
  self_identification: {
    gender: "",
    pronouns: "",
    veteran: "",
    disability: "",
    ethnicity: "",
  },
  legal_authorization: {
    eu_work_authorization: "",
    us_work_authorization: "",
    requires_us_visa: "",
    requires_us_sponsorship: "",
    requires_eu_visa: "",
    legally_allowed_to_work_in_eu: "",
    legally_allowed_to_work_in_us: "",
    requires_eu_sponsorship: "",
    canada_work_authorization: "",
    requires_canada_visa: "",
    legally_allowed_to_work_in_canada: "",
    requires_canada_sponsorship: "",
    uk_work_authorization: "",
    requires_uk_visa: "",
    legally_allowed_to_work_in_uk: "",
    requires_uk_sponsorship: "",
  },
  work_preferences: {
    remote_work: "",
    in_person_work: "",
    open_to_relocation: "",
    willing_to_complete_assessments: "",
    willing_to_undergo_drug_tests: "",
    willing_to_undergo_background_checks: "",
  },
};

const splitAndTrim = (input: string) => {
  return input.split(/,\s*/).map(item => item.trim()).filter(item => item !== '');
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

  const renderInfoIcon = (tooltip: string) => (
    <span className="ml-1 group relative">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-help">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {tooltip}
      </span>
    </span>
  );

  return (
    <>
      <Toaster position="top-right" />
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
                    {renderInfoIcon("Only show remote job opportunities")}
                  </label>
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Experience Level
                  {renderInfoIcon("Select the experience levels you're interested in")}
                </h3>
                {[
                  "internship",
                  "entry",
                  "associate",
                  "mid-senior level",
                  "director",
                  "executive"
                ].map((key) => (
                  <div key={key} className="flex items-center mb-2">
                    <Checkbox
                      checked={config.experienceLevel[key as keyof typeof config.experienceLevel]}
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
                      {key.charAt(0).toUpperCase() + key.slice(1)}
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
                  {renderInfoIcon("Enter job positions you're interested in, separated by commas")}
                </h3>
                <Input
                  value={config.positions.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      positions: splitAndTrim(e.target.value),
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
                    {renderInfoIcon("Only apply once to each company, even if they have multiple job openings")}
                  </label>
                </div>
              </div>

              {/* Distance */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Distance
                  {renderInfoIcon("Maximum distance in miles from your location")}
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
                  {renderInfoIcon("Companies to exclude from your job search")}
                </h3>
                <Input
                  value={config.company_blacklist.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      company_blacklist: splitAndTrim(e.target.value),
                    })
                  }
                  placeholder="Enter companies separated by commas"
                />
              </div>

              {/* Title Blacklist */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Title Blacklist
                  {renderInfoIcon("Job titles to exclude from your search")}
                </h3>
                <Input
                  value={config.title_blacklist.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      title_blacklist: splitAndTrim(e.target.value),
                    })
                  }
                  placeholder="Enter titles separated by commas"
                />
              </div>

              {/* Job Applicants Threshold */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Job Applicants Threshold
                  {renderInfoIcon("Range of acceptable number of applicants for a job")}
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

              {/* Personal Information */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Personal Information
                  {renderInfoIcon("Basic personal details to identify yourself and provide contact information")}
                </h3>
                <Input
                  value={config.personal_information.name}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        name: e.target.value,
                      },
                    })
                  }
                  placeholder="First Name"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.surname}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        surname: e.target.value,
                      },
                    })
                  }
                  placeholder="Last Name"
                  className="mb-2"
                />
                <h4 className="text-sm font-medium mb-1">Date of Birth</h4>
                <Input
                  value={config.personal_information.date_of_birth}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        date_of_birth: e.target.value,
                      },
                    })
                  }
                  placeholder="Date of Birth"
                  className="mb-2"
                  type="date"
                />
                <Input
                  value={config.personal_information.country}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        country: e.target.value,
                      },
                    })
                  }
                  placeholder="Country"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.city}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        city: e.target.value,
                      },
                    })
                  }
                  placeholder="City"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.address}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        address: e.target.value,
                      },
                    })
                  }
                  placeholder="Address"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.zip_code}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        zip_code: e.target.value,
                      },
                    })
                  }
                  placeholder="Zip Code"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.phone_prefix}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        phone_prefix: e.target.value,
                      },
                    })
                  }
                  placeholder="Phone Prefix"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.phone}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        phone: e.target.value,
                      },
                    })
                  }
                  placeholder="Phone Number"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.email}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        email: e.target.value,
                      },
                    })
                  }
                  placeholder="Email"
                  className="mb-2"
                  type="email"
                />
                <Input
                  value={config.personal_information.github}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        github: e.target.value,
                      },
                    })
                  }
                  placeholder="GitHub Profile"
                  className="mb-2"
                />
                <Input
                  value={config.personal_information.linkedin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      personal_information: {
                        ...config.personal_information,
                        linkedin: e.target.value,
                      },
                    })
                  }
                  placeholder="LinkedIn Profile"
                  className="mb-2"
                />
              </div>

              {/* Education Details */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Education Details
                  {renderInfoIcon("Your academic background, including degrees earned and relevant coursework")}
                </h3>
                {config.education_details.map((education, index) => (
                  <div key={index} className="mb-4 p-4 border rounded">
                    <Input
                      value={education.education_level}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].education_level = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Education Level"
                      className="mb-2"
                    />
                    <Input
                      value={education.institution}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].institution = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Institution"
                      className="mb-2"
                    />
                    <Input
                      value={education.field_of_study}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].field_of_study = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Field of Study"
                      className="mb-2"
                    />
                    <Input
                      value={education.final_evaluation_grade}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].final_evaluation_grade = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Final Evaluation Grade"
                      className="mb-2"
                    />
                    <Input
                      value={education.start_date}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].start_date = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Start Date"
                      className="mb-2"
                      type="date"
                    />
                    <Input
                      value={education.year_of_completion}
                      onChange={(e) => {
                        const newEducationDetails = [...config.education_details];
                        newEducationDetails[index].year_of_completion = e.target.value;
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      placeholder="Year of Completion"
                      className="mb-2"
                    />
                    <Button 
                      onClick={() => {
                        const newEducationDetails = config.education_details.filter((_, i) => i !== index);
                        setConfig({...config, education_details: newEducationDetails});
                      }}
                      className="mt-2"
                      variant="destructive"
                    >
                      Delete Entry
                    </Button>
                  </div>
                ))}
                <Button onClick={() => setConfig({...config, education_details: [...config.education_details, {
                  education_level: '',
                  institution: '',
                  field_of_study: '',
                  final_evaluation_grade: '',
                  start_date: '',
                  year_of_completion: '',
                  exam: {}
                }]})}>
                  {config.education_details.length > 0 ? "Add Another Education Entry" : "Add Education Entry"}
                </Button>
              </div>

              {/* Experience Details */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Experience Details
                  {renderInfoIcon("Your work experience, including job roles, companies, and key responsibilities")}
                </h3>
                {config.experience_details.map((experience, index) => (
                  <div key={index} className="mb-4 p-4 border rounded">
                    <Input
                      value={experience.position}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].position = e.target.value;
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Position"
                      className="mb-2"
                    />
                    <Input
                      value={experience.company}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].company = e.target.value;
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Company"
                      className="mb-2"
                    />
                    <Input
                      value={experience.employment_period}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].employment_period = e.target.value;
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Employment Period (e.g., 06/2021 - Present)"
                      className="mb-2"
                    />
                    <Input
                      value={experience.location}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].location = e.target.value;
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Location"
                      className="mb-2"
                    />
                    <Input
                      value={experience.industry}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].industry = e.target.value;
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Industry"
                      className="mb-2"
                    />
                    <h4 className="font-medium mb-1">Key Responsibilities</h4>
                    <Input
                      value={experience.key_responsibilities.join(", ")}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].key_responsibilities = splitAndTrim(e.target.value);
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Enter key responsibilities separated by commas"
                      className="mb-2"
                    />
                    <h4 className="font-medium mb-1">Skills Acquired</h4>
                    <Input
                      value={experience.skills_acquired.join(", ")}
                      onChange={(e) => {
                        const newExperienceDetails = [...config.experience_details];
                        newExperienceDetails[index].skills_acquired = splitAndTrim(e.target.value);
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      placeholder="Enter skills acquired separated by commas"
                      className="mb-2"
                    />
                    <Button 
                      onClick={() => {
                        const newExperienceDetails = config.experience_details.filter((_, i) => i !== index);
                        setConfig({...config, experience_details: newExperienceDetails});
                      }}
                      className="mt-2"
                      variant="destructive"
                    >
                      Delete Entry
                    </Button>
                  </div>
                ))}
                <Button onClick={() => setConfig({...config, experience_details: [...config.experience_details, {
                  position: '',
                  company: '',
                  employment_period: '',
                  location: '',
                  industry: '',
                  key_responsibilities: [],
                  skills_acquired: []
                }]})}>
                  {config.experience_details.length > 0 ? "Add Another Experience Entry" : "Add Experience Entry"}
                </Button>
              </div>

              {/* Projects */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Projects
                  {renderInfoIcon("Notable projects you have worked on, including personal or professional projects")}
                </h3>
                <Input
                  value={config.projects.map(project => project.name).join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      projects: splitAndTrim(e.target.value).map((s) => ({
                        name: s,
                        description: '',
                        link: ''
                      })),
                    })
                  }
                  placeholder="Enter projects separated by commas"
                />
              </div>

              {/* Achievements */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Achievements
                  {renderInfoIcon("Notable accomplishments or awards you have received")}
                </h3>
                <Input
                  value={config.achievements.map(achievement => achievement.name).join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      achievements: splitAndTrim(e.target.value).map((s) => ({
                        name: s,
                        description: ''
                      })),
                    })
                  }
                  placeholder="Enter achievements separated by commas"
                />
              </div>

              {/* Certifications */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Certifications
                  {renderInfoIcon("Professional certifications you have earned")}
                </h3>
                <Input
                  value={config.certifications.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      certifications: splitAndTrim(e.target.value),
                    })
                  }
                  placeholder="Enter certifications separated by commas"
                />
              </div>

              {/* Languages */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Languages
                  {renderInfoIcon("Languages you speak and your proficiency level in each")}
                </h3>
                <Input
                  value={config.languages.map(lang => lang.language).join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      languages: splitAndTrim(e.target.value).map((s) => ({
                        language: s,
                        proficiency: ''
                      })),
                    })
                  }
                  placeholder="Enter languages separated by commas"
                />
              </div>

              {/* Interests */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Interests
                  {renderInfoIcon("Professional or personal interests that may be relevant to your career")}
                </h3>
                <Input
                  value={config.interests.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      interests: splitAndTrim(e.target.value),
                    })
                  }
                  placeholder="Enter interests separated by commas"
                />
              </div>

              {/* Availability */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Availability
                  {renderInfoIcon("Your current availability or notice period")}
                </h3>
                <Input
                  value={config.availability.notice_period}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      availability: {
                        ...config.availability,
                        notice_period: e.target.value,
                      },
                    })
                  }
                  placeholder="Notice Period (e.g., 2 weeks)"
                />
              </div>

              {/* Salary Expectations */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Salary Expectations
                  {renderInfoIcon("Your expected salary range")}
                </h3>
                <Input
                  value={config.salary_expectations.salary_range_usd}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      salary_expectations: {
                        ...config.salary_expectations,
                        salary_range_usd: e.target.value,
                      },
                    })
                  }
                  placeholder="Salary Range (USD)"
                />
              </div>

              {/* Self Identification */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Self Identification
                  {renderInfoIcon("Information related to personal identity, including gender and pronouns")}
                </h3>
                <Input
                  value={config.self_identification.gender}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      self_identification: {
                        ...config.self_identification,
                        gender: e.target.value,
                      },
                    })
                  }
                  placeholder="Gender"
                  className="mb-2"
                />
                <Input
                  value={config.self_identification.pronouns}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      self_identification: {
                        ...config.self_identification,
                        pronouns: e.target.value,
                      },
                    })
                  }
                  placeholder="Pronouns"
                  className="mb-2"
                />
                <Input
                  value={config.self_identification.veteran}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      self_identification: {
                        ...config.self_identification,
                        veteran: e.target.value,
                      },
                    })
                  }
                  placeholder="Veteran Status"
                  className="mb-2"
                />
                <Input
                  value={config.self_identification.disability}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      self_identification: {
                        ...config.self_identification,
                        disability: e.target.value,
                      },
                    })
                  }
                  placeholder="Disability Status"
                  className="mb-2"
                />
                <Input
                  value={config.self_identification.ethnicity}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      self_identification: {
                        ...config.self_identification,
                        ethnicity: e.target.value,
                      },
                    })
                  }
                  placeholder="Ethnicity"
                  className="mb-2"
                />
              </div>

              {/* Legal Authorization */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Legal Authorization
                  {renderInfoIcon("Your legal ability to work in various locations")}
                </h3>
                {[
                  { country: "USA", fields: ["us_work_authorization", "requires_us_visa", "requires_us_sponsorship", "legally_allowed_to_work_in_us"] },
                  { country: "EU", fields: ["eu_work_authorization", "requires_eu_visa", "requires_eu_sponsorship", "legally_allowed_to_work_in_eu"] },
                  { country: "CANADA", fields: ["canada_work_authorization", "requires_canada_visa", "requires_canada_sponsorship", "legally_allowed_to_work_in_canada"] },
                  { country: "UK", fields: ["uk_work_authorization", "requires_uk_visa", "requires_uk_sponsorship", "legally_allowed_to_work_in_uk"] },
                ].map(({ country, fields }) => (
                  <div key={country} className="mb-4">
                    <h4 className="font-medium mb-2">{country}</h4>
                    {fields.map((key) => (
                      <div key={key} className="flex items-center mb-2">
                        <Checkbox
                          checked={config.legal_authorization[key as keyof typeof config.legal_authorization] === "Yes"}
                          onCheckedChange={(checked) =>
                            setConfig({
                              ...config,
                              legal_authorization: {
                                ...config.legal_authorization,
                                [key]: checked ? "Yes" : "No",
                              },
                            })
                          }
                          id={`legal-${key}`}
                        />
                        <label htmlFor={`legal-${key}`} className="ml-2 flex items-center">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          {key.includes("work_authorization") && renderInfoIcon("Work authorization is the legal right to work in a specific country")}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Work Preferences */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Work Preferences
                  {renderInfoIcon("Your preferences for work arrangements and conditions")}
                </h3>
                {Object.entries(config.work_preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center mb-2">
                    <Checkbox
                      checked={value === "Yes"}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          work_preferences: {
                            ...config.work_preferences,
                            [key]: checked ? "Yes" : "No",
                          },
                        })
                      }
                      id={`preference-${key}`}
                    />
                    <label htmlFor={`preference-${key}`} className="ml-2">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                  </div>
                ))}
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