import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, FileText, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TenantTaxSettings {
  businessLegalName: string;
  businessEin: string;
  businessAddressStreet: string;
  businessAddressCity: string;
  businessAddressState: string;
  businessAddressZip: string;
  businessPhone: string;
  businessTaxEmail: string;
  taxSetupComplete: boolean;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

export default function TenantTaxSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TenantTaxSettings>({
    businessLegalName: "",
    businessEin: "",
    businessAddressStreet: "",
    businessAddressCity: "",
    businessAddressState: "",
    businessAddressZip: "",
    businessPhone: "",
    businessTaxEmail: "",
    taxSetupComplete: false,
  });

  const { data: settings, isLoading } = useQuery<TenantTaxSettings>({
    queryKey: ["/api/admin/tenant-tax-settings"],
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<TenantTaxSettings, "taxSetupComplete">) => {
      const response = await apiRequest("PUT", "/api/admin/tenant-tax-settings", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save tax settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenant-tax-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenant-tax-setup-status"] });
      toast({
        title: "Tax Settings Saved",
        description: "Your business tax information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tax settings",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof TenantTaxSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatEIN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { taxSetupComplete, ...dataToSave } = formData;
    saveMutation.mutate(dataToSave);
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
    <div className="space-y-6">
      {!formData.taxSetupComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tax Setup Required</AlertTitle>
          <AlertDescription>
            Please complete your business tax information. This is required for generating invoices and 1099 forms for drivers.
          </AlertDescription>
        </Alert>
      )}

      {formData.taxSetupComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Tax Setup Complete</AlertTitle>
          <AlertDescription className="text-green-700">
            Your business tax information is configured and ready for invoice and 1099 generation.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Business Tax Information</CardTitle>
              <CardDescription>
                This information will appear on all invoices and 1099-NEC forms issued to drivers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessLegalName">Legal Business Name *</Label>
                <Input
                  id="businessLegalName"
                  value={formData.businessLegalName}
                  onChange={(e) => handleInputChange("businessLegalName", e.target.value)}
                  placeholder="Your Company LLC"
                  required
                />
                <p className="text-xs text-muted-foreground">As registered with the IRS</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEin">Employer Identification Number (EIN) *</Label>
                <Input
                  id="businessEin"
                  value={formData.businessEin}
                  onChange={(e) => handleInputChange("businessEin", formatEIN(e.target.value))}
                  placeholder="XX-XXXXXXX"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">9-digit number issued by the IRS</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Business Address
              </h4>

              <div className="space-y-2">
                <Label htmlFor="businessAddressStreet">Street Address *</Label>
                <Input
                  id="businessAddressStreet"
                  value={formData.businessAddressStreet}
                  onChange={(e) => handleInputChange("businessAddressStreet", e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessAddressCity">City *</Label>
                  <Input
                    id="businessAddressCity"
                    value={formData.businessAddressCity}
                    onChange={(e) => handleInputChange("businessAddressCity", e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddressState">State *</Label>
                  <select
                    id="businessAddressState"
                    value={formData.businessAddressState}
                    onChange={(e) => handleInputChange("businessAddressState", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddressZip">ZIP Code *</Label>
                  <Input
                    id="businessAddressZip"
                    value={formData.businessAddressZip}
                    onChange={(e) => handleInputChange("businessAddressZip", e.target.value)}
                    placeholder="10001"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={formData.businessPhone}
                  onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessTaxEmail">Tax Contact Email</Label>
                <Input
                  id="businessTaxEmail"
                  type="email"
                  value={formData.businessTaxEmail}
                  onChange={(e) => handleInputChange("businessTaxEmail", e.target.value)}
                  placeholder="accounting@yourcompany.com"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Tax Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
