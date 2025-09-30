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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Edit, Trash2, ArrowLeft, X } from "lucide-react";
import { Link } from "wouter";

// TypeScript interfaces for advanced pricing
interface AirportFee {
  airportCode: string;
  fee: number;
  waiverMinutes?: number;
}

interface MeetAndGreet {
  enabled: boolean;
  charge: number;
}

interface SurgePricing {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  multiplier: number;
}

interface DistanceTier {
  miles: number;
  ratePerMile: number;
  isRemaining?: boolean;
}

interface PricingRule {
  id: string;
  vehicleType: string;
  serviceType: string;
  baseRate: string | null;
  perMileRate: string | null;
  hourlyRate: string | null;
  minimumHours: number | null;
  minimumFare: string | null;
  gratuityPercent: string | null;
  airportFees: AirportFee[];
  meetAndGreet: MeetAndGreet;
  surgePricing: SurgePricing[];
  distanceTiers: DistanceTier[];
  overtimeRate: string | null;
  effectiveStart: string | null;
  effectiveEnd: string | null;
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
  gratuityPercent: string;
  airportFees: AirportFee[];
  meetAndGreet: MeetAndGreet;
  surgePricing: SurgePricing[];
  distanceTiers: DistanceTier[];
  overtimeRate: string;
  effectiveStart: string;
  effectiveEnd: string;
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

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
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
    gratuityPercent: "20",
    airportFees: [],
    meetAndGreet: { enabled: false, charge: 0 },
    surgePricing: [],
    distanceTiers: [],
    overtimeRate: "",
    effectiveStart: "",
    effectiveEnd: "",
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
        gratuityPercent: data.gratuityPercent ? parseFloat(data.gratuityPercent) : 20,
        airportFees: data.airportFees || [],
        meetAndGreet: data.meetAndGreet || { enabled: false, charge: 0 },
        surgePricing: data.surgePricing || [],
        distanceTiers: data.distanceTiers || [],
        overtimeRate: data.overtimeRate ? parseFloat(data.overtimeRate) : null,
        effectiveStart: data.effectiveStart || null,
        effectiveEnd: data.effectiveEnd || null,
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
        gratuityPercent: data.gratuityPercent ? parseFloat(data.gratuityPercent) : 20,
        airportFees: data.airportFees || [],
        meetAndGreet: data.meetAndGreet || { enabled: false, charge: 0 },
        surgePricing: data.surgePricing || [],
        distanceTiers: data.distanceTiers || [],
        overtimeRate: data.overtimeRate ? parseFloat(data.overtimeRate) : null,
        effectiveStart: data.effectiveStart || null,
        effectiveEnd: data.effectiveEnd || null,
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
      await apiRequest('DELETE', `/api/admin/pricing-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-rules'] });
      toast({
        title: "Pricing Rule Deleted",
        description: "Pricing rule has been deleted successfully.",
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
      gratuityPercent: "20",
      airportFees: [],
      meetAndGreet: { enabled: false, charge: 0 },
      surgePricing: [],
      distanceTiers: [],
      overtimeRate: "",
      effectiveStart: "",
      effectiveEnd: "",
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
      gratuityPercent: rule.gratuityPercent || "20",
      airportFees: rule.airportFees || [],
      meetAndGreet: rule.meetAndGreet || { enabled: false, charge: 0 },
      surgePricing: rule.surgePricing || [],
      distanceTiers: rule.distanceTiers || [],
      overtimeRate: rule.overtimeRate || "",
      effectiveStart: rule.effectiveStart || "",
      effectiveEnd: rule.effectiveEnd || "",
      isActive: rule.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this pricing rule?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Airport fee management
  const addAirportFee = () => {
    setFormData(prev => ({
      ...prev,
      airportFees: [...prev.airportFees, { airportCode: "", fee: 0 }]
    }));
  };

  const removeAirportFee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      airportFees: prev.airportFees.filter((_, i) => i !== index)
    }));
  };

  const updateAirportFee = (index: number, field: keyof AirportFee, value: any) => {
    setFormData(prev => ({
      ...prev,
      airportFees: prev.airportFees.map((fee, i) => 
        i === index ? { ...fee, [field]: value } : fee
      )
    }));
  };

  // Surge pricing management
  const addSurgePricing = () => {
    setFormData(prev => ({
      ...prev,
      surgePricing: [...prev.surgePricing, { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", multiplier: 1.5 }]
    }));
  };

  const removeSurgePricing = (index: number) => {
    setFormData(prev => ({
      ...prev,
      surgePricing: prev.surgePricing.filter((_, i) => i !== index)
    }));
  };

  const updateSurgePricing = (index: number, field: keyof SurgePricing, value: any) => {
    setFormData(prev => ({
      ...prev,
      surgePricing: prev.surgePricing.map((surge, i) => 
        i === index ? { ...surge, [field]: value } : surge
      )
    }));
  };

  // Distance tier management
  const addDistanceTier = () => {
    setFormData(prev => ({
      ...prev,
      distanceTiers: [...prev.distanceTiers, { miles: 0, ratePerMile: 0 }]
    }));
  };

  const addRemainingTier = () => {
    setFormData(prev => ({
      ...prev,
      distanceTiers: [...prev.distanceTiers, { miles: 0, ratePerMile: 0, isRemaining: true }]
    }));
  };

  const removeDistanceTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distanceTiers: prev.distanceTiers.filter((_, i) => i !== index)
    }));
  };

  const updateDistanceTier = (index: number, field: keyof DistanceTier, value: any) => {
    setFormData(prev => ({
      ...prev,
      distanceTiers: prev.distanceTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const getTierLabel = (index: number) => {
    if (formData.distanceTiers[index]?.isRemaining) return "Remaining";
    if (index === 0) return "First";
    return "Next";
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
              <h1 className="text-2xl font-bold" data-testid="pricing-title">Advanced Pricing Management</h1>
              <p className="text-primary-foreground/80" data-testid="pricing-subtitle">
                Configure sophisticated pricing rules with gratuity, fees, and surge pricing
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
                <span>Pricing Rules (n8n-Style)</span>
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#e2e3e8] text-[12px]" data-testid="dialog-pricing-form">
                  <DialogHeader>
                    <DialogTitle data-testid="dialog-title">
                      {editingRule ? "Edit Pricing Rule" : "Create New Pricing Rule"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Configuration */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Basic Configuration</h3>
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
                    </div>

                    {/* Service-specific pricing */}
                    <Tabs value={formData.serviceType} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transfer" data-testid="tab-transfer">Transfer Service</TabsTrigger>
                        <TabsTrigger value="hourly" data-testid="tab-hourly">Hourly Service</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="transfer" className="space-y-6">
                        {/* Base Transfer Pricing */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Base Transfer Pricing</h3>
                          <div className="grid grid-cols-3 gap-4">
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
                            <div>
                              <Label htmlFor="gratuityPercent">Gratuity (%)</Label>
                              <Input
                                id="gratuityPercent"
                                type="number"
                                step="0.01"
                                placeholder="20.00"
                                value={formData.gratuityPercent}
                                onChange={(e) => setFormData(prev => ({ ...prev, gratuityPercent: e.target.value }))}
                                data-testid="input-gratuity"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Airport Fees */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Airport Fees</h3>
                            <Button type="button" size="sm" onClick={addAirportFee} data-testid="button-add-airport-fee">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Airport
                            </Button>
                          </div>
                          {formData.airportFees.map((fee, index) => (
                            <div key={index} className="grid grid-cols-4 gap-2 items-end">
                              <div>
                                <Label>Airport Code</Label>
                                <Input
                                  placeholder="IAH"
                                  value={fee.airportCode}
                                  onChange={(e) => updateAirportFee(index, 'airportCode', e.target.value)}
                                  data-testid={`input-airport-code-${index}`}
                                />
                              </div>
                              <div>
                                <Label>Fee ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={fee.fee}
                                  onChange={(e) => updateAirportFee(index, 'fee', parseFloat(e.target.value) || 0)}
                                  data-testid={`input-airport-fee-${index}`}
                                />
                              </div>
                              <div>
                                <Label>Waiver (min)</Label>
                                <Input
                                  type="number"
                                  placeholder="Optional"
                                  value={fee.waiverMinutes || ""}
                                  onChange={(e) => updateAirportFee(index, 'waiverMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid={`input-waiver-${index}`}
                                />
                              </div>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeAirportFee(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Meet & Greet */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Meet & Greet</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="meetGreetEnabled"
                                checked={formData.meetAndGreet.enabled}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  meetAndGreet: { ...prev.meetAndGreet, enabled: e.target.checked }
                                }))}
                                className="w-4 h-4"
                                data-testid="checkbox-meet-greet"
                              />
                              <Label htmlFor="meetGreetEnabled">Enable Meet & Greet</Label>
                            </div>
                            <div>
                              <Label>Charge ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={formData.meetAndGreet.charge}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  meetAndGreet: { ...prev.meetAndGreet, charge: parseFloat(e.target.value) || 0 }
                                }))}
                                disabled={!formData.meetAndGreet.enabled}
                                data-testid="input-meet-greet-charge"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Surge Pricing */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Surge Pricing</h3>
                            <Button type="button" size="sm" onClick={addSurgePricing} data-testid="button-add-surge">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Surge Period
                            </Button>
                          </div>
                          {formData.surgePricing.map((surge, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2 items-end">
                              <div>
                                <Label>Day of Week</Label>
                                <Select
                                  value={surge.dayOfWeek.toString()}
                                  onValueChange={(value) => updateSurgePricing(index, 'dayOfWeek', parseInt(value))}
                                >
                                  <SelectTrigger data-testid={`select-day-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {daysOfWeek.map((day) => (
                                      <SelectItem key={day.value} value={day.value.toString()}>
                                        {day.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Start Time</Label>
                                <Input
                                  type="time"
                                  value={surge.startTime}
                                  onChange={(e) => updateSurgePricing(index, 'startTime', e.target.value)}
                                  data-testid={`input-start-time-${index}`}
                                />
                              </div>
                              <div>
                                <Label>End Time</Label>
                                <Input
                                  type="time"
                                  value={surge.endTime}
                                  onChange={(e) => updateSurgePricing(index, 'endTime', e.target.value)}
                                  data-testid={`input-end-time-${index}`}
                                />
                              </div>
                              <div>
                                <Label>Multiplier</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="1.5"
                                  value={surge.multiplier}
                                  onChange={(e) => updateSurgePricing(index, 'multiplier', parseFloat(e.target.value) || 1)}
                                  data-testid={`input-multiplier-${index}`}
                                />
                              </div>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeSurgePricing(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Distance Tiers - Tiered Pricing */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Distance Breakdown (Tiered Pricing)</h3>
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={addDistanceTier} data-testid="button-add-tier">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Tier
                              </Button>
                              {(!formData.distanceTiers.some(t => t.isRemaining)) && (
                                <Button type="button" size="sm" variant="outline" onClick={addRemainingTier} data-testid="button-add-remaining">
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Remaining
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Define progressive pricing tiers (e.g., First 20 miles @ $0, Next 24.45 miles @ $4.45)
                          </div>
                          {formData.distanceTiers.map((tier, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-24 text-sm font-medium">{getTierLabel(index)}</div>
                              {!tier.isRemaining && (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Miles"
                                    className="w-32"
                                    value={tier.miles}
                                    onChange={(e) => updateDistanceTier(index, 'miles', parseFloat(e.target.value) || 0)}
                                    data-testid={`input-tier-miles-${index}`}
                                  />
                                  <span className="text-sm">mile{tier.miles !== 1 ? 's' : ''}</span>
                                </>
                              )}
                              <span className="text-sm">@</span>
                              <span className="text-sm font-bold">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Rate"
                                className="w-32"
                                value={tier.ratePerMile}
                                onChange={(e) => updateDistanceTier(index, 'ratePerMile', parseFloat(e.target.value) || 0)}
                                data-testid={`input-tier-rate-${index}`}
                              />
                              <span className="text-sm">per mile</span>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeDistanceTier(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {formData.distanceTiers.length === 0 && (
                            <div className="text-sm text-muted-foreground italic">
                              No tiers defined. Click "Add Tier" to create tiered pricing or use base rate + per mile rate for simple pricing.
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="hourly" className="space-y-6">
                        {/* Hourly Pricing */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Hourly Service Pricing</h3>
                          <div className="grid grid-cols-3 gap-4">
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
                            <div>
                              <Label htmlFor="overtimeRate">Overtime Rate ($)</Label>
                              <Input
                                id="overtimeRate"
                                type="number"
                                step="0.01"
                                placeholder="Optional"
                                value={formData.overtimeRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, overtimeRate: e.target.value }))}
                                data-testid="input-overtime-rate"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Common Fields */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Common Settings</h3>
                      <div className="grid grid-cols-3 gap-4">
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
                        <div>
                          <Label htmlFor="effectiveStart">Effective From</Label>
                          <Input
                            id="effectiveStart"
                            type="date"
                            value={formData.effectiveStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, effectiveStart: e.target.value }))}
                            data-testid="input-effective-start"
                          />
                        </div>
                        <div>
                          <Label htmlFor="effectiveEnd">Effective Until</Label>
                          <Input
                            id="effectiveEnd"
                            type="date"
                            value={formData.effectiveEnd}
                            onChange={(e) => setFormData(prev => ({ ...prev, effectiveEnd: e.target.value }))}
                            data-testid="input-effective-end"
                          />
                        </div>
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
                      <TableHead>Base/Hourly Rate</TableHead>
                      <TableHead>Gratuity</TableHead>
                      <TableHead>Airport Fees</TableHead>
                      <TableHead>Surge Rules</TableHead>
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
                        <TableCell data-testid={`rate-${rule.id}`}>
                          {rule.serviceType === 'transfer' && rule.baseRate ? `$${rule.baseRate}` : 
                           rule.serviceType === 'hourly' && rule.hourlyRate ? `$${rule.hourlyRate}/hr` : '-'}
                        </TableCell>
                        <TableCell data-testid={`gratuity-${rule.id}`}>
                          {rule.gratuityPercent ? `${rule.gratuityPercent}%` : '-'}
                        </TableCell>
                        <TableCell data-testid={`airport-fees-${rule.id}`}>
                          {rule.airportFees?.length || 0} airports
                        </TableCell>
                        <TableCell data-testid={`surge-rules-${rule.id}`}>
                          {rule.surgePricing?.length || 0} periods
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
