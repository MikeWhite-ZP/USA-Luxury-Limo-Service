import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface PricingRule {
  id: string;
  vehicleType: string;
  serviceType: string;
  baseRate: string | null;
  perMileRate: string | null;
  hourlyRate: string | null;
  minimumHours: number | null;
  minimumFare: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PricingFormData {
  vehicleType: string;
  serviceType: string;
  baseRate: string;
  perMileRate: string;
  hourlyRate: string;
  minimumHours: string;
  minimumFare: string;
  isActive: boolean;
}

const vehicleTypes = [
  { value: "business_sedan", label: "Business Sedan" },
  { value: "business_suv", label: "Business SUV" },
  { value: "first_class_sedan", label: "First Class Sedan" },
  { value: "first_class_suv", label: "First Class SUV" },
  { value: "business_van", label: "Business Van" }
];

const serviceTypes = [
  { value: "transfer", label: "Transfer (Point-to-Point)" },
  { value: "hourly", label: "Hourly Service" }
];

export default function AdminPricing() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState<PricingFormData>({
    vehicleType: "business_sedan",
    serviceType: "transfer",
    baseRate: "",
    perMileRate: "",
    hourlyRate: "",
    minimumHours: "",
    minimumFare: "",
    isActive: true
  });

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Fetch pricing rules
  const { data: pricingRules, isLoading: rulesLoading } = useQuery<PricingRule[]>({
    queryKey: ['/api/admin/pricing-rules'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create pricing rule mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<PricingFormData>) => {
      const payload = {
        vehicleType: data.vehicleType,
        serviceType: data.serviceType,
        baseRate: data.baseRate ? parseFloat(data.baseRate) : null,
        perMileRate: data.perMileRate ? parseFloat(data.perMileRate) : null,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        minimumHours: data.minimumHours ? parseInt(data.minimumHours) : null,
        minimumFare: data.minimumFare ? parseFloat(data.minimumFare) : null,
        isActive: data.isActive ?? true
      };
      const response = await apiRequest('POST', '/api/admin/pricing-rules', payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Pricing Rule Created",
        description: "New pricing rule has been added successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create pricing rule",
        variant: "destructive",
      });
    },
  });

  // Update pricing rule mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PricingFormData> }) => {
      const payload = {
        vehicleType: data.vehicleType,
        serviceType: data.serviceType,
        baseRate: data.baseRate ? parseFloat(data.baseRate) : null,
        perMileRate: data.perMileRate ? parseFloat(data.perMileRate) : null,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        minimumHours: data.minimumHours ? parseInt(data.minimumHours) : null,
        minimumFare: data.minimumFare ? parseFloat(data.minimumFare) : null,
        isActive: data.isActive ?? true
      };
      const response = await apiRequest('PUT', `/api/admin/pricing-rules/${id}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Pricing Rule Updated",
        description: "Pricing rule has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing rule",
        variant: "destructive",
      });
    },
  });

  // Delete pricing rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/pricing-rules/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Pricing Rule Deleted",
        description: "Pricing rule has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pricing rule",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      vehicleType: "business_sedan",
      serviceType: "transfer",
      baseRate: "",
      perMileRate: "",
      hourlyRate: "",
      minimumHours: "",
      minimumFare: "",
      isActive: true
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      vehicleType: rule.vehicleType,
      serviceType: rule.serviceType,
      baseRate: rule.baseRate || "",
      perMileRate: rule.perMileRate || "",
      hourlyRate: rule.hourlyRate || "",
      minimumHours: rule.minimumHours?.toString() || "",
      minimumFare: rule.minimumFare || "",
      isActive: rule.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this pricing rule?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on service type
    if (formData.serviceType === "transfer") {
      if (!formData.baseRate || !formData.perMileRate) {
        toast({
          title: "Validation Error",
          description: "Base rate and per-mile rate are required for transfer service",
          variant: "destructive",
        });
        return;
      }
    } else if (formData.serviceType === "hourly") {
      if (!formData.hourlyRate || !formData.minimumHours) {
        toast({
          title: "Validation Error",
          description: "Hourly rate and minimum hours are required for hourly service",
          variant: "destructive",
        });
        return;
      }
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    return vehicleTypes.find(v => v.value === type)?.label || type;
  };

  const getServiceTypeLabel = (type: string) => {
    return serviceTypes.find(s => s.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin-dashboard">
              <Button variant="secondary" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="pricing-title">Pricing Management</h1>
              <p className="text-primary-foreground/80" data-testid="pricing-subtitle">
                Configure pricing rules for all services
              </p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/logout'}
            variant="secondary"
            data-testid="button-logout"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card data-testid="pricing-rules-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Pricing Rules</span>
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-rule">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pricing Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-[#e2e3e8] text-[12px]" data-testid="dialog-pricing-form">
                  <DialogHeader>
                    <DialogTitle data-testid="dialog-title">
                      {editingRule ? "Edit Pricing Rule" : "Create New Pricing Rule"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select
                          value={formData.vehicleType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                        >
                          <SelectTrigger data-testid="select-vehicle-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="serviceType">Service Type *</Label>
                        <Select
                          value={formData.serviceType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                        >
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.serviceType === "transfer" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="baseRate">Base Rate * ($)</Label>
                          <Input
                            id="baseRate"
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            value={formData.baseRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, baseRate: e.target.value }))}
                            data-testid="input-base-rate"
                          />
                        </div>
                        <div>
                          <Label htmlFor="perMileRate">Per Mile Rate * ($)</Label>
                          <Input
                            id="perMileRate"
                            type="number"
                            step="0.01"
                            placeholder="2.50"
                            value={formData.perMileRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, perMileRate: e.target.value }))}
                            data-testid="input-per-mile-rate"
                          />
                        </div>
                      </div>
                    )}

                    {formData.serviceType === "hourly" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourlyRate">Hourly Rate * ($)</Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            step="0.01"
                            placeholder="75.00"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                            data-testid="input-hourly-rate"
                          />
                        </div>
                        <div>
                          <Label htmlFor="minimumHours">Minimum Hours *</Label>
                          <Input
                            id="minimumHours"
                            type="number"
                            placeholder="2"
                            value={formData.minimumHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, minimumHours: e.target.value }))}
                            data-testid="input-minimum-hours"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="minimumFare">Minimum Fare ($)</Label>
                      <Input
                        id="minimumFare"
                        type="number"
                        step="0.01"
                        placeholder="Optional minimum fare"
                        value={formData.minimumFare}
                        onChange={(e) => setFormData(prev => ({ ...prev, minimumFare: e.target.value }))}
                        data-testid="input-minimum-fare"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4"
                        data-testid="checkbox-is-active"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetForm();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-submit"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? 'Saving...'
                          : editingRule
                          ? 'Update Rule'
                          : 'Create Rule'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : pricingRules && pricingRules.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Base Rate</TableHead>
                      <TableHead>Per Mile</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Min Hours</TableHead>
                      <TableHead>Min Fare</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingRules.map((rule) => (
                      <TableRow key={rule.id} data-testid={`rule-row-${rule.id}`}>
                        <TableCell data-testid={`vehicle-type-${rule.id}`}>
                          {getVehicleTypeLabel(rule.vehicleType)}
                        </TableCell>
                        <TableCell data-testid={`service-type-${rule.id}`}>
                          {getServiceTypeLabel(rule.serviceType)}
                        </TableCell>
                        <TableCell data-testid={`base-rate-${rule.id}`}>
                          {rule.baseRate ? `$${rule.baseRate}` : '-'}
                        </TableCell>
                        <TableCell data-testid={`per-mile-${rule.id}`}>
                          {rule.perMileRate ? `$${rule.perMileRate}` : '-'}
                        </TableCell>
                        <TableCell data-testid={`hourly-rate-${rule.id}`}>
                          {rule.hourlyRate ? `$${rule.hourlyRate}` : '-'}
                        </TableCell>
                        <TableCell data-testid={`min-hours-${rule.id}`}>
                          {rule.minimumHours || '-'}
                        </TableCell>
                        <TableCell data-testid={`min-fare-${rule.id}`}>
                          {rule.minimumFare ? `$${rule.minimumFare}` : '-'}
                        </TableCell>
                        <TableCell data-testid={`status-${rule.id}`}>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(rule)}
                              data-testid={`button-edit-${rule.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(rule.id)}
                              data-testid={`button-delete-${rule.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-rules">
                No pricing rules configured yet. Add your first pricing rule to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
