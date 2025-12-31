import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Check, AlertCircle, Loader2 } from "lucide-react";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "America/Anchorage", label: "Alaska Time (AKT) - Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST) - Honolulu" },
  { value: "America/Phoenix", label: "Arizona Time (MST) - Phoenix" },
  { value: "America/Detroit", label: "Eastern Time (ET) - Detroit" },
  { value: "America/Indianapolis", label: "Eastern Time (ET) - Indianapolis" },
  { value: "America/Boise", label: "Mountain Time (MT) - Boise" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) - London" },
  { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
  { value: "Europe/Berlin", label: "Central European Time (CET) - Berlin" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST) - Dubai" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) - Singapore" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - Tokyo" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET) - Sydney" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

export function TimezoneSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  const { data: currentTimezone, isLoading } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/system-settings/system_timezone"],
    retry: false,
  });

  useEffect(() => {
    if (currentTimezone?.value) {
      setSelectedTimezone(currentTimezone.value);
    }
  }, [currentTimezone]);

  const updateTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      const response = await fetch("/api/system-settings/system_timezone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: timezone }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update timezone" }));
        throw new Error(error.message || "Failed to update timezone");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timezone Updated",
        description: "System timezone has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/system_timezone"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update timezone.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedTimezone) {
      toast({
        title: "Validation Error",
        description: "Please select a timezone.",
        variant: "destructive",
      });
      return;
    }
    updateTimezoneMutation.mutate(selectedTimezone);
  };

  const getCurrentTimeInTimezone = (tz: string): string => {
    try {
      return new Date().toLocaleString("en-US", {
        timeZone: tz,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Unable to display time";
    }
  };

  return (
    <Card id="settings-section" className="border-border shadow-md">
      <CardHeader className="border-b border-border bg-gradient-to-r from-orange-50 to-amber-50/30">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="bg-orange-600 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          System Timezone
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure the system timezone used for booking time restrictions and calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="font-semibold text-blue-900">Important:</strong>{" "}
                  This timezone is used to enforce booking restrictions (e.g., preventing date/time changes within 3 hours of pickup) and calculate surcharges for last-minute bookings.
                </p>
              </div>
            </div>

            {selectedTimezone && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current System Time</p>
                    <p className="text-lg font-semibold text-orange-700">
                      {getCurrentTimeInTimezone(selectedTimezone)}
                    </p>
                  </div>
                  <div className="bg-background rounded-full p-3 shadow-sm">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-background border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-700" />
                </div>
                <h3 className="font-semibold text-foreground">Select Timezone</h3>
              </div>

              <div className="space-y-3">
                <Label htmlFor="timezone-select" className="text-muted-foreground font-medium">
                  System Timezone
                </Label>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger id="timezone-select" className="w-full border-border">
                    <SelectValue placeholder="Select a timezone..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                  Select the timezone that matches your primary business location
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={updateTimezoneMutation.isPending || !selectedTimezone}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold w-full sm:w-auto"
              >
                {updateTimezoneMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Timezone
                  </>
                )}
              </Button>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-600 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground">How Timezone Affects Bookings</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border">
                  <div className="bg-orange-100 rounded-full p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong>3-Hour Restriction:</strong> Passengers cannot change booking date/time within 3 hours of pickup time in the configured timezone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border">
                  <div className="bg-orange-100 rounded-full p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong>24-Hour Surcharge:</strong> When editing bookings within 24 hours of pickup, a 20% surcharge is automatically applied to the updated price.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border">
                  <div className="bg-orange-100 rounded-full p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong>Price Confirmation:</strong> When address changes affect pricing, passengers must confirm the new price before saving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
