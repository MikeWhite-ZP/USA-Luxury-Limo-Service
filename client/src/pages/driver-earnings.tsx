import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  ArrowLeft,
  Car
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { isMobileDevice } from "@/lib/deviceDetection";

interface YearlySummary {
  year: number;
  total: number;
  rides: number;
  eligible1099: boolean;
  canDownload1099: boolean;
}

interface YearlyEarningsData {
  yearlySummary: YearlySummary[];
  currentYear: number;
  taxInfoComplete: boolean;
}

interface EarningsData {
  today: number;
  week: number;
  month: number;
  year: number;
  allTime: number;
  currentDate: string;
  completedRidesCount: number;
}

export default function DriverEarningsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [downloading, setDownloading] = useState<number | null>(null);
  const isMobile = isMobileDevice();

  const { data: yearlyData, isLoading: yearlyLoading } = useQuery<YearlyEarningsData>({
    queryKey: ["/api/driver/earnings/yearly"],
    enabled: isAuthenticated && user?.role === "driver",
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/driver/earnings"],
    enabled: isAuthenticated && user?.role === "driver",
  });

  const handle1099Download = async (year: number) => {
    setDownloading(year);
    try {
      const response = await apiRequest("GET", `/api/driver/1099/${year}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate 1099");
      }
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1099-NEC-${year}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "1099 Generated",
        description: `Your 1099-NEC form for ${year} has been downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate 1099 form",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">This page is only accessible to drivers.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isMobile && <Header />}
      
      <div className={`${isMobile ? 'p-4 pb-20' : 'container mx-auto px-4 py-8'}`}>
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/driver-dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
            <p className="text-sm text-gray-600">View your earnings and download 1099 forms</p>
          </div>
        </div>

        {!yearlyData?.taxInfoComplete && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Tax Information Required</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Complete your tax information to download 1099 forms.</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setLocation("/driver-dashboard")}
                className="w-fit"
              >
                Go to Settings
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <p className="text-xl font-bold text-blue-600">
                ${earningsLoading ? "..." : earnings?.today?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">This Week</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                ${earningsLoading ? "..." : earnings?.week?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">This Month</span>
              </div>
              <p className="text-xl font-bold text-purple-600">
                ${earningsLoading ? "..." : earnings?.month?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">Completed Rides</span>
              </div>
              <p className="text-xl font-bold text-orange-600">
                {earningsLoading ? "..." : earnings?.completedRidesCount || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-600" />
              <div>
                <CardTitle>Yearly Earnings & 1099 Forms</CardTitle>
                <CardDescription>
                  Download 1099-NEC forms for years where earnings exceeded $600
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {yearlyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : !yearlyData?.yearlySummary?.length ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No earnings data available yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete rides to see your earnings here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {yearlyData.yearlySummary.map((yearData) => (
                  <div 
                    key={yearData.year}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{yearData.year}</h3>
                        {yearData.year === yearlyData.currentYear && (
                          <Badge variant="secondary">Current Year</Badge>
                        )}
                        {yearData.eligible1099 && (
                          <Badge className="bg-green-100 text-green-700">1099 Eligible</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Total: <span className="font-medium text-gray-900">${yearData.total.toFixed(2)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {yearData.rides} rides
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      {yearData.canDownload1099 ? (
                        yearlyData.taxInfoComplete ? (
                          <Button
                            onClick={() => handle1099Download(yearData.year)}
                            disabled={downloading === yearData.year}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {downloading === yearData.year ? "Generating..." : "Download 1099"}
                          </Button>
                        ) : (
                          <Button variant="outline" disabled>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Complete Tax Info First
                          </Button>
                        )
                      ) : yearData.year === yearlyData.currentYear ? (
                        <Badge variant="outline" className="text-gray-500">
                          Available next year
                        </Badge>
                      ) : !yearData.eligible1099 ? (
                        <Badge variant="outline" className="text-gray-500">
                          Below $600 threshold
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {yearlyData?.taxInfoComplete && (
          <div className="mt-6">
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Tax Information on File</AlertTitle>
              <AlertDescription className="text-blue-700">
                Your tax information is complete. You can download 1099 forms for any year where your earnings exceeded $600.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
