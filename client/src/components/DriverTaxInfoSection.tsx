import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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

export default function DriverTaxInfoSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const TAX_CLASSIFICATIONS = [
    { value: "individual", label: t("driverDashboard.settings.taxInfo.classifications.individual") },
    { value: "sole_proprietor", label: t("driverDashboard.settings.taxInfo.classifications.sole_proprietor") },
    { value: "llc", label: t("driverDashboard.settings.taxInfo.classifications.llc") },
    { value: "corporation", label: t("driverDashboard.settings.taxInfo.classifications.corporation") },
    { value: "partnership", label: t("driverDashboard.settings.taxInfo.classifications.partnership") },
  ];

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
        throw new Error(error.message || t("driverDashboard.settings.taxInfo.toast.errorDescription"));
      }
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/tax-info"] });
      setShowSsnInput(false);
      toast({
        title: t("driverDashboard.settings.taxInfo.toast.successTitle"),
        description: result.taxInfoComplete 
          ? t("driverDashboard.settings.taxInfo.toast.successComplete")
          : t("driverDashboard.settings.taxInfo.toast.successIncomplete"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("driverDashboard.settings.taxInfo.toast.errorTitle"),
        description: error.message || t("driverDashboard.settings.taxInfo.toast.errorDescription"),
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
          <AlertTitle>{t("driverDashboard.settings.taxInfo.requiredAlert.title")}</AlertTitle>
          <AlertDescription>
            {t("driverDashboard.settings.taxInfo.requiredAlert.description")}
          </AlertDescription>
        </Alert>
      )}

      {taxInfo?.taxInfoComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">{t("driverDashboard.settings.taxInfo.completeAlert.title")}</AlertTitle>
          <AlertDescription className="text-green-700">
            {t("driverDashboard.settings.taxInfo.completeAlert.description")}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-red-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-800">{t("driverDashboard.settings.taxInfo.title")}</CardTitle>
              <CardDescription className="text-red-600">
                {t("driverDashboard.settings.taxInfo.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxLegalFirstName" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.legalFirstName")} *</Label>
                <Input
                  id="taxLegalFirstName"
                  name="taxLegalFirstName"
                  type="text"
                  value={formData.taxLegalFirstName}
                  onChange={(e) => handleInputChange("taxLegalFirstName", e.target.value)}
                  placeholder={t("driverDashboard.settings.taxInfo.placeholders.firstName")}
                  required
                  autoComplete="given-name"
                  className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxLegalLastName" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.legalLastName")} *</Label>
                <Input
                  id="taxLegalLastName"
                  name="taxLegalLastName"
                  type="text"
                  value={formData.taxLegalLastName}
                  onChange={(e) => handleInputChange("taxLegalLastName", e.target.value)}
                  placeholder={t("driverDashboard.settings.taxInfo.placeholders.lastName")}
                  required
                  autoComplete="family-name"
                  className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssn" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.ssn")} *</Label>
                {taxInfo?.hasSsn && !showSsnInput ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-green-50 border border-green-200 rounded-md text-sm font-mono flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">***-**-{taxInfo.taxSsnLast4}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSsnInput(true)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {t("driverDashboard.settings.taxInfo.update")}
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="ssn"
                    name="ssn"
                    type="text"
                    value={formData.ssn}
                    onChange={(e) => handleInputChange("ssn", formatSSN(e.target.value))}
                    placeholder={t("driverDashboard.settings.taxInfo.placeholders.ssn")}
                    maxLength={11}
                    required={!taxInfo?.hasSsn}
                    autoComplete="off"
                    className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                  />
                )}
                <p className="text-xs text-muted-foreground">{t("driverDashboard.settings.taxInfo.ssnHelper")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxDateOfBirth" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.dateOfBirth")} *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none z-10" />
                  <Input
                    id="taxDateOfBirth"
                    name="taxDateOfBirth"
                    type="date"
                    value={formData.taxDateOfBirth}
                    onChange={(e) => handleInputChange("taxDateOfBirth", e.target.value)}
                    className="pl-10 bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                    required
                    autoComplete="bday"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAddressStreet" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.streetAddress")} *</Label>
              <Input
                id="taxAddressStreet"
                name="taxAddressStreet"
                type="text"
                value={formData.taxAddressStreet}
                onChange={(e) => handleInputChange("taxAddressStreet", e.target.value)}
                placeholder={t("driverDashboard.settings.taxInfo.placeholders.streetAddress")}
                required
                autoComplete="street-address"
                className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="taxAddressCity" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.city")} *</Label>
                <Input
                  id="taxAddressCity"
                  name="taxAddressCity"
                  type="text"
                  value={formData.taxAddressCity}
                  onChange={(e) => handleInputChange("taxAddressCity", e.target.value)}
                  placeholder={t("driverDashboard.settings.taxInfo.placeholders.city")}
                  required
                  autoComplete="address-level2"
                  className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAddressState" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.state")} *</Label>
                <Select 
                  value={formData.taxAddressState} 
                  onValueChange={(value) => handleInputChange("taxAddressState", value)}
                >
                  <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors">
                    <SelectValue placeholder={t("driverDashboard.settings.taxInfo.placeholders.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAddressZip" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.zipCode")} *</Label>
                <Input
                  id="taxAddressZip"
                  name="taxAddressZip"
                  type="text"
                  value={formData.taxAddressZip}
                  onChange={(e) => handleInputChange("taxAddressZip", e.target.value)}
                  placeholder={t("driverDashboard.settings.taxInfo.placeholders.zipCode")}
                  maxLength={10}
                  required
                  autoComplete="postal-code"
                  className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxClassification" className="font-medium text-foreground">{t("driverDashboard.settings.taxInfo.labels.taxClassification")}</Label>
              <Select 
                value={formData.taxClassification} 
                onValueChange={(value) => handleInputChange("taxClassification", value)}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_CLASSIFICATIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 shadow-md"
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? t("driverDashboard.settings.taxInfo.saving") : t("driverDashboard.settings.taxInfo.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
