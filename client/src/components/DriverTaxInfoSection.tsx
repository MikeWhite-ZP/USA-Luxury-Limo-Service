import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Save, AlertTriangle, CheckCircle2, Lock, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DriverTaxInfo {
  taxLegalFirstName: string;
  taxLegalLastName: string;
  taxSsnLast4: string;
  hasSsn: boolean;
  taxDateOfBirth: string | null;
  taxAddressStreet: string;
  taxAddressCity: string;
  taxAddressState: string;
  taxAddressZip: string;
  taxClassification: string;
  taxInfoComplete: boolean;
  taxInfoCompletedAt: string | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const TAX_CLASSIFICATIONS = [
  { value: "individual", label: "Individual / Sole Proprietor" },
  { value: "sole_proprietor", label: "Sole Proprietor (Schedule C)" },
  { value: "llc", label: "Limited Liability Company (LLC)" },
  { value: "corporation", label: "Corporation (S-Corp or C-Corp)" },
  { value: "partnership", label: "Partnership" },
];

export default function DriverTaxInfoSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    taxLegalFirstName: "",
    taxLegalLastName: "",
    ssn: "",
    taxDateOfBirth: "",
    taxAddressStreet: "",
    taxAddressCity: "",
    taxAddressState: "",
    taxAddressZip: "",
    taxClassification: "individual",
  });

  const [showSsnInput, setShowSsnInput] = useState(false);

  const { data: taxInfo, isLoading } = useQuery<DriverTaxInfo>({
    queryKey: ["/api/driver/tax-info"],
  });

  useEffect(() => {
    if (taxInfo) {
      setFormData({
        taxLegalFirstName: taxInfo.taxLegalFirstName || "",
        taxLegalLastName: taxInfo.taxLegalLastName || "",
        ssn: "",
        taxDateOfBirth: taxInfo.taxDateOfBirth ? new Date(taxInfo.taxDateOfBirth).toISOString().split('T')[0] : "",
        taxAddressStreet: taxInfo.taxAddressStreet || "",
        taxAddressCity: taxInfo.taxAddressCity || "",
        taxAddressState: taxInfo.taxAddressState || "",
        taxAddressZip: taxInfo.taxAddressZip || "",
        taxClassification: taxInfo.taxClassification || "individual",
      });
    }
  }, [taxInfo]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = { ...data };
      if (!data.ssn) {
        delete payload.ssn;
      }
      const response = await apiRequest("PATCH", "/api/driver/tax-info", payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save tax information");
      }
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/tax-info"] });
      setShowSsnInput(false);
      toast({
        title: "Tax Information Saved",
        description: result.taxInfoComplete 
          ? "Your tax information is complete and ready for 1099 generation."
          : "Your tax information has been saved. Please complete all required fields.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tax information",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!taxInfo?.taxInfoComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tax Information Required</AlertTitle>
          <AlertDescription>
            Please complete your tax information. This is required for 1099 generation when your yearly earnings exceed $600.
          </AlertDescription>
        </Alert>
      )}

      {taxInfo?.taxInfoComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Tax Information Complete</AlertTitle>
          <AlertDescription className="text-green-700">
            Your tax information is on file and will be used for 1099 generation.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">1099 Tax Information</CardTitle>
              <CardDescription>
                Required for tax reporting when earnings exceed $600/year
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxLegalFirstName">Legal First Name *</Label>
                <Input
                  id="taxLegalFirstName"
                  value={formData.taxLegalFirstName}
                  onChange={(e) => handleInputChange("taxLegalFirstName", e.target.value)}
                  placeholder="As it appears on your tax documents"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxLegalLastName">Legal Last Name *</Label>
                <Input
                  id="taxLegalLastName"
                  value={formData.taxLegalLastName}
                  onChange={(e) => handleInputChange("taxLegalLastName", e.target.value)}
                  placeholder="As it appears on your tax documents"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssn">Social Security Number (SSN) *</Label>
                {taxInfo?.hasSsn && !showSsnInput ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span>***-**-{taxInfo.taxSsnLast4}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSsnInput(true)}
                    >
                      Update
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="ssn"
                    type="text"
                    value={formData.ssn}
                    onChange={(e) => handleInputChange("ssn", formatSSN(e.target.value))}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    required={!taxInfo?.hasSsn}
                  />
                )}
                <p className="text-xs text-muted-foreground">Your SSN is encrypted and stored securely</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxDateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="taxDateOfBirth"
                    type="date"
                    value={formData.taxDateOfBirth}
                    onChange={(e) => handleInputChange("taxDateOfBirth", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAddressStreet">Street Address *</Label>
              <Input
                id="taxAddressStreet"
                value={formData.taxAddressStreet}
                onChange={(e) => handleInputChange("taxAddressStreet", e.target.value)}
                placeholder="123 Main Street, Apt 4"
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="taxAddressCity">City *</Label>
                <Input
                  id="taxAddressCity"
                  value={formData.taxAddressCity}
                  onChange={(e) => handleInputChange("taxAddressCity", e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAddressState">State *</Label>
                <Select 
                  value={formData.taxAddressState} 
                  onValueChange={(value) => handleInputChange("taxAddressState", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAddressZip">ZIP Code *</Label>
                <Input
                  id="taxAddressZip"
                  value={formData.taxAddressZip}
                  onChange={(e) => handleInputChange("taxAddressZip", e.target.value)}
                  placeholder="10001"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxClassification">Tax Classification</Label>
              <Select 
                value={formData.taxClassification} 
                onValueChange={(value) => handleInputChange("taxClassification", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_CLASSIFICATIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Tax Information"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
