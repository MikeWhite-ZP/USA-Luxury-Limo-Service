import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, FileText } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      if (user) {
        setLocation('/passenger');
      } else {
        setLocation('/');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-400" data-testid="success-title">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your payment has been processed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address with all the details.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2 text-left">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">What's Next?</p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Be ready 10 minutes before pickup time</li>
                  <li>• Our driver will contact you before arrival</li>
                  <li>• Keep your confirmation email for reference</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {user ? (
              <Button 
                onClick={() => setLocation('/passenger')} 
                className="w-full"
                size="lg"
                data-testid="button-dashboard"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            ) : (
              <Button 
                onClick={() => setLocation('/')} 
                className="w-full"
                size="lg"
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              You will be redirected automatically in 10 seconds
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Thank you for choosing USA Luxury Limo!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
