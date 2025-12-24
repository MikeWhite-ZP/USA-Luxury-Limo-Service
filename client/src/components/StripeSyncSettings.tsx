import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle, 
  User, 
  Mail, 
  Phone,
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface SyncCandidate {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  stripeCustomer: {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    paymentMethodsCount: number;
  } | null;
  matchConfidence: 'high' | 'medium' | 'low' | 'no_match';
  matchDetails: string;
}

interface SyncPreviewResponse {
  totalPassengersWithoutStripe: number;
  candidates: SyncCandidate[];
  summary: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    noMatch: number;
  };
}

interface SyncExecuteResponse {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    userId: string;
    success: boolean;
    message: string;
  }>;
}

export function StripeSyncSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<SyncExecuteResponse | null>(null);

  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery<SyncPreviewResponse>({
    queryKey: ['/api/admin/stripe-sync/preview'],
    refetchOnWindowFocus: false,
  });

  const syncMutation = useMutation({
    mutationFn: async (syncItems: Array<{ userId: string; stripeCustomerId: string }>) => {
      const response = await fetch('/api/admin/stripe-sync/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ syncItems }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute sync');
      }
      return response.json() as Promise<SyncExecuteResponse>;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stripe-sync/preview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Sync Complete",
        description: `Successfully linked ${data.successful} of ${data.total} passengers`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (confidence: 'high' | 'medium' | 'all') => {
    if (!previewData) return;
    
    const newSelected = new Set(selectedItems);
    previewData.candidates
      .filter(c => c.stripeCustomer && (
        confidence === 'all' || 
        c.matchConfidence === confidence ||
        (confidence === 'high' && c.matchConfidence === 'high')
      ))
      .forEach(c => newSelected.add(c.userId));
    
    setSelectedItems(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleToggleItem = (userId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedItems(newSelected);
  };

  const handleExecuteSync = () => {
    if (!previewData || selectedItems.size === 0) return;

    const syncItems = previewData.candidates
      .filter(c => selectedItems.has(c.userId) && c.stripeCustomer)
      .map(c => ({
        userId: c.userId,
        stripeCustomerId: c.stripeCustomer!.id,
      }));

    syncMutation.mutate(syncItems);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800 border-green-300">High Match</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium Match</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Low Match</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">No Match</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Stripe Customer Sync</CardTitle>
                <CardDescription>
                  Link existing Stripe customers with imported passengers to restore their saved payment methods
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetchPreview()}
              disabled={previewLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${previewLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Searching Stripe for matching customers...</span>
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-700">{previewData.summary.highConfidence}</div>
                    <div className="text-sm text-green-600">High Confidence</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-700">{previewData.summary.mediumConfidence}</div>
                    <div className="text-sm text-yellow-600">Medium Confidence</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-700">{previewData.summary.lowConfidence}</div>
                    <div className="text-sm text-orange-600">Low Confidence</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-gray-700">{previewData.summary.noMatch}</div>
                    <div className="text-sm text-gray-600">No Match Found</div>
                  </CardContent>
                </Card>
              </div>

              {previewData.candidates.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Quick Select:</span>
                      <Button variant="outline" size="sm" onClick={() => handleSelectAll('high')}>
                        All High Confidence
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSelectAll('medium')}>
                        All Medium
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSelectAll('all')}>
                        All Matches
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                        Clear
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedItems.size} selected
                      </span>
                      <Button 
                        onClick={handleExecuteSync} 
                        disabled={selectedItems.size === 0 || syncMutation.isPending}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Sync Selected ({selectedItems.size})
                      </Button>
                    </div>
                  </div>

                  {syncResults && (
                    <Alert className={syncResults.failed > 0 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}>
                      <Check className="h-4 w-4" />
                      <AlertTitle>Sync Results</AlertTitle>
                      <AlertDescription>
                        Successfully linked {syncResults.successful} of {syncResults.total} passengers.
                        {syncResults.failed > 0 && ` ${syncResults.failed} failed.`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Passenger</TableHead>
                          <TableHead>Stripe Customer</TableHead>
                          <TableHead>Match Details</TableHead>
                          <TableHead className="text-center">Cards</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.candidates
                          .filter(c => c.matchConfidence !== 'no_match')
                          .sort((a, b) => {
                            const order = { high: 0, medium: 1, low: 2, no_match: 3 };
                            return order[a.matchConfidence] - order[b.matchConfidence];
                          })
                          .map((candidate) => (
                            <TableRow key={candidate.userId} className="hover:bg-muted/50">
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.has(candidate.userId)}
                                  onCheckedChange={() => handleToggleItem(candidate.userId)}
                                  disabled={!candidate.stripeCustomer}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {candidate.firstName} {candidate.lastName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    {candidate.email}
                                  </div>
                                  {candidate.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-3 h-3" />
                                      {candidate.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {candidate.stripeCustomer ? (
                                  <div className="space-y-1">
                                    <div className="text-xs font-mono text-muted-foreground">
                                      {candidate.stripeCustomer.id}
                                    </div>
                                    {candidate.stripeCustomer.name && (
                                      <div className="text-sm">{candidate.stripeCustomer.name}</div>
                                    )}
                                    {candidate.stripeCustomer.email && (
                                      <div className="text-sm text-muted-foreground">
                                        {candidate.stripeCustomer.email}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getConfidenceBadge(candidate.matchConfidence)}
                                  <div className="text-xs text-muted-foreground">
                                    {candidate.matchDetails}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {candidate.stripeCustomer ? (
                                  <Badge variant="secondary">
                                    {candidate.stripeCustomer.paymentMethodsCount} cards
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {previewData.candidates.filter(c => c.matchConfidence === 'no_match').length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Passengers with No Stripe Match ({previewData.summary.noMatch})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {previewData.candidates
                          .filter(c => c.matchConfidence === 'no_match')
                          .slice(0, 12)
                          .map((candidate) => (
                            <div 
                              key={candidate.userId}
                              className="text-sm p-2 bg-muted/50 rounded border"
                            >
                              <div className="font-medium truncate">
                                {candidate.firstName} {candidate.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {candidate.email}
                              </div>
                            </div>
                          ))}
                        {previewData.summary.noMatch > 12 && (
                          <div className="text-sm p-2 text-muted-foreground flex items-center justify-center">
                            +{previewData.summary.noMatch - 12} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {previewData.candidates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>All passengers are already synced with Stripe</p>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load sync preview. Please check if Stripe is configured properly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
