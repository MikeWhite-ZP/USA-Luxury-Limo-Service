import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Percent, Check, AlertCircle, Loader2 } from "lucide-react";

export function SurchargeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [surchargePercentage, setSurchargePercentage] = useState<string>("20");

  const { data: currentSurcharge, isLoading } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/system-settings/LAST_MINUTE_SURCHARGE_PERCENTAGE"],
    retry: false,
  });

  useEffect(() => {
    if (currentSurcharge?.value) {
      setSurchargePercentage(currentSurcharge.value);
    }
  }, [currentSurcharge]);

  const updateSurchargeMutation = useMutation({
    mutationFn: async (percentage: string) => {
      const response = await fetch("/api/system-settings/LAST_MINUTE_SURCHARGE_PERCENTAGE", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: percentage }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update surcharge" }));
        throw new Error(error.message || "Failed to update surcharge");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Surcharge Updated",
        description: "Last-minute booking surcharge has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/LAST_MINUTE_SURCHARGE_PERCENTAGE"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/last-minute-surcharge"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update surcharge.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const value = parseFloat(surchargePercentage);
    if (isNaN(value) || value < 0 || value > 100) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid percentage between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    updateSurchargeMutation.mutate(surchargePercentage);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSurchargePercentage(value);
    }
  };

  return (
    <Card id="surcharge-settings" className="border-border shadow-md">
      <CardHeader className="border-b border-border bg-gradient-to-r from-amber-50 to-yellow-50/30">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="bg-amber-600 p-2 rounded-lg">
            <Percent className="w-5 h-5 text-white" />
          </div>
          Last-Minute Booking Surcharge
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure the surcharge percentage applied when customers edit bookings within 24 hours of pickup time
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="surcharge-percentage" className="text-base font-medium">
                  Surcharge Percentage
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Input
                      id="surcharge-percentage"
                      type="text"
                      value={surchargePercentage}
                      onChange={handleInputChange}
                      placeholder="20"
                      className="pr-8 text-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a percentage between 0 and 100. This surcharge is automatically applied when customers
                  modify pickup or drop-off locations within 24 hours of their scheduled pickup time.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">How it works</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Applies to route changes (pickup/drop-off locations) within 24 hours of pickup</li>
                      <li>• Customers see a confirmation dialog showing the surcharge before saving</li>
                      <li>• Admins and dispatchers are exempt from this surcharge</li>
                      <li>• Date/time changes within 3 hours of pickup are blocked entirely</li>
                    </ul>
                  </div>
                </div>
              </div>

              {currentSurcharge?.value && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">
                      Current surcharge: <span className="font-medium text-foreground">{currentSurcharge.value}%</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={updateSurchargeMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {updateSurchargeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
