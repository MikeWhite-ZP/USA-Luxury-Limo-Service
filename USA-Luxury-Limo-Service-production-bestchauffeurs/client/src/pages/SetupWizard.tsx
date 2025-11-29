import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Loader2, Building2, Database, HardDrive, ShieldCheck, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type SetupStep = "company" | "database" | "minio" | "admin" | "complete";

interface SetupFormData {
  companyName: string;
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbSslRequired: boolean;
  minioEndpoint: string;
  minioAccessKey: string;
  minioSecretKey: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export default function SetupWizard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<SetupStep>("company");
  const [formData, setFormData] = useState<SetupFormData>({
    companyName: "",
    dbHost: "",
    dbPort: "5432",
    dbUser: "",
    dbPassword: "",
    dbSslRequired: false,
    minioEndpoint: "",
    minioAccessKey: "",
    minioSecretKey: "",
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [dbTestStatus, setDbTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [minioTestStatus, setMinioTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const testDbMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/setup/test-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.dbHost,
          port: formData.dbPort,
          user: formData.dbUser,
          password: formData.dbPassword,
          sslRequired: formData.dbSslRequired,
        }),
      });
      return response.json();
    },
    onMutate: () => setDbTestStatus("testing"),
    onSuccess: (data) => {
      if (data.success) {
        setDbTestStatus("success");
        toast({ title: "Database Connected", description: data.message });
      } else {
        setDbTestStatus("error");
        toast({ title: "Connection Failed", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      setDbTestStatus("error");
      toast({ title: "Connection Failed", description: "Could not connect to database", variant: "destructive" });
    },
  });

  const testMinioMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/setup/test-minio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: formData.minioEndpoint,
          accessKey: formData.minioAccessKey,
          secretKey: formData.minioSecretKey,
        }),
      });
      return response.json();
    },
    onMutate: () => setMinioTestStatus("testing"),
    onSuccess: (data) => {
      if (data.success) {
        setMinioTestStatus("success");
        toast({ title: "MinIO Connected", description: data.message });
      } else {
        setMinioTestStatus("error");
        toast({ title: "Connection Failed", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      setMinioTestStatus("error");
      toast({ title: "Connection Failed", description: "Could not connect to MinIO", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentStep("complete");
        toast({ 
          title: "Setup Complete!", 
          description: `${data.companyName} is now ready. Database: ${data.databaseName}${data.bucketName ? `, Bucket: ${data.bucketName}` : ''}` 
        });
      } else {
        toast({ title: "Setup Failed", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Setup Failed", description: error.message || "An error occurred", variant: "destructive" });
    },
  });

  const handleInputChange = (field: keyof SetupFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field.startsWith("db")) setDbTestStatus("idle");
    if (field.startsWith("minio")) setMinioTestStatus("idle");
  };

  const steps = [
    { id: "company", label: "Company", icon: Building2 },
    { id: "database", label: "Database", icon: Database },
    { id: "minio", label: "Storage", icon: HardDrive },
    { id: "admin", label: "Admin", icon: ShieldCheck },
  ];

  const isStepComplete = (stepId: string) => {
    const stepOrder = ["company", "database", "minio", "admin", "complete"];
    return stepOrder.indexOf(stepId) < stepOrder.indexOf(currentStep);
  };

  const canProceed = () => {
    switch (currentStep) {
      case "company":
        return formData.companyName.trim().length >= 2;
      case "database":
        return dbTestStatus === "success";
      case "minio":
        return true;
      case "admin":
        return formData.adminEmail && formData.adminPassword && formData.adminPassword.length >= 6;
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case "company":
        setCurrentStep("database");
        break;
      case "database":
        setCurrentStep("minio");
        break;
      case "minio":
        setCurrentStep("admin");
        break;
      case "admin":
        completeMutation.mutate();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "database":
        setCurrentStep("company");
        break;
      case "minio":
        setCurrentStep("database");
        break;
      case "admin":
        setCurrentStep("minio");
        break;
    }
  };

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription>
              Your application is now ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Important: Restart Required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please restart the application to complete the setup. After restarting, 
                    you can log in with the admin account you just created.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/admin-login"}
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Application Setup</h1>
          <p className="text-slate-400">Configure your limo service application</p>
        </div>

        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep === step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : isStepComplete(step.id)
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-400"
                  }`}
                >
                  {isStepComplete(step.id) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 ${currentStep === step.id ? "text-white" : "text-slate-500"}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mt-[-1rem] ${isStepComplete(steps[index + 1].id) || currentStep === steps[index + 1].id ? "bg-primary" : "bg-slate-600"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === "company" && "Company Information"}
              {currentStep === "database" && "Database Configuration"}
              {currentStep === "minio" && "Object Storage (Optional)"}
              {currentStep === "admin" && "Admin Account"}
            </CardTitle>
            <CardDescription>
              {currentStep === "company" && "Enter your company name. This will be used to create the database and storage bucket."}
              {currentStep === "database" && "Connect to your PostgreSQL database server."}
              {currentStep === "minio" && "Configure MinIO/S3 storage for file uploads (can be set up later in admin dashboard)."}
              {currentStep === "admin" && "Create the admin account for managing your application."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === "company" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Hope Limo Services"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Database will be created as: <code className="bg-muted px-1 py-0.5 rounded">
                      {formData.companyName ? formData.companyName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'your_company' : 'your_company'}
                    </code>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Storage bucket will be created as: <code className="bg-muted px-1 py-0.5 rounded">
                      {formData.companyName ? formData.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'your-company' : 'your-company'}
                    </code>
                  </p>
                </div>
              </div>
            )}

            {currentStep === "database" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="dbHost">Host</Label>
                    <Input
                      id="dbHost"
                      placeholder="localhost or db.example.com"
                      value={formData.dbHost}
                      onChange={(e) => handleInputChange("dbHost", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPort">Port</Label>
                    <Input
                      id="dbPort"
                      placeholder="5432"
                      value={formData.dbPort}
                      onChange={(e) => handleInputChange("dbPort", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dbUser">Username</Label>
                  <Input
                    id="dbUser"
                    placeholder="postgres"
                    value={formData.dbUser}
                    onChange={(e) => handleInputChange("dbUser", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dbPassword">Password</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    placeholder="Enter database password"
                    value={formData.dbPassword}
                    onChange={(e) => handleInputChange("dbPassword", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sslRequired">Require SSL</Label>
                    <p className="text-sm text-muted-foreground">Enable for cloud databases like Neon, Supabase</p>
                  </div>
                  <Switch
                    id="sslRequired"
                    checked={formData.dbSslRequired}
                    onCheckedChange={(checked) => handleInputChange("dbSslRequired", checked)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => testDbMutation.mutate()}
                  disabled={!formData.dbHost || !formData.dbUser || !formData.dbPassword || testDbMutation.isPending}
                  className="w-full"
                >
                  {testDbMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : dbTestStatus === "success" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Connection Successful
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            )}

            {currentStep === "minio" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    MinIO/S3 storage is optional during setup. You can configure it later in the admin dashboard.
                    Skip this step if you don't have MinIO credentials ready.
                  </p>
                </div>
                <div>
                  <Label htmlFor="minioEndpoint">S3 API Endpoint</Label>
                  <Input
                    id="minioEndpoint"
                    placeholder="http://minio.example.com:9000"
                    value={formData.minioEndpoint}
                    onChange={(e) => handleInputChange("minioEndpoint", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="minioAccessKey">Access Key</Label>
                  <Input
                    id="minioAccessKey"
                    placeholder="minioadmin"
                    value={formData.minioAccessKey}
                    onChange={(e) => handleInputChange("minioAccessKey", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="minioSecretKey">Secret Key</Label>
                  <Input
                    id="minioSecretKey"
                    type="password"
                    placeholder="Enter secret key"
                    value={formData.minioSecretKey}
                    onChange={(e) => handleInputChange("minioSecretKey", e.target.value)}
                    className="mt-1"
                  />
                </div>
                {formData.minioEndpoint && formData.minioAccessKey && formData.minioSecretKey && (
                  <Button 
                    variant="outline" 
                    onClick={() => testMinioMutation.mutate()}
                    disabled={testMinioMutation.isPending}
                    className="w-full"
                  >
                    {testMinioMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : minioTestStatus === "success" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Connection Successful
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                )}
              </div>
            )}

            {currentStep === "admin" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <Input
                      id="adminFirstName"
                      placeholder="John"
                      value={formData.adminFirstName}
                      onChange={(e) => handleInputChange("adminFirstName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <Input
                      id="adminLastName"
                      placeholder="Doe"
                      value={formData.adminLastName}
                      onChange={(e) => handleInputChange("adminLastName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.adminPassword}
                    onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === "company"}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : currentStep === "admin" ? (
                  "Complete Setup"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
