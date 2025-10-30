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
import { DollarSign, Plus, Edit, Trash2, X } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";

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
  { value: -1, label: "All Days" },
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
  const [pricingMethod, setPricingMethod] = useState<"distance-breakdown" | "per-mile">("distance-breakdown");
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
        baseRate: data.baseRate ? String(data.baseRate) : null,
        perMileRate: data.perMileRate ? String(data.perMileRate) : null,
        hourlyRate: data.hourlyRate ? String(data.hourlyRate) : null,
        minimumHours: data.minimumHours ? parseInt(String(data.minimumHours)) : null,
        minimumFare: data.minimumFare ? String(data.minimumFare) : null,
        gratuityPercent: data.gratuityPercent ? String(data.gratuityPercent) : "20",
        airportFees: (data.airportFees || []).filter(fee => fee.airportCode && fee.airportCode.trim().length >= 3),
        meetAndGreet: data.meetAndGreet || { enabled: false, charge: 0 },
        surgePricing: data.surgePricing || [],
        distanceTiers: data.distanceTiers || [],
        overtimeRate: data.overtimeRate ? String(data.overtimeRate) : null,
        effectiveStart: (data.effectiveStart && data.effectiveStart.trim() !== '') ? new Date(data.effectiveStart) : null,
        effectiveEnd: (data.effectiveEnd && data.effectiveEnd.trim() !== '') ? new Date(data.effectiveEnd) : null,
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
        baseRate: data.baseRate ? String(data.baseRate) : null,
        perMileRate: data.perMileRate ? String(data.perMileRate) : null,
        hourlyRate: data.hourlyRate ? String(data.hourlyRate) : null,
        minimumHours: data.minimumHours ? parseInt(String(data.minimumHours)) : null,
        minimumFare: data.minimumFare ? String(data.minimumFare) : null,
        gratuityPercent: data.gratuityPercent ? String(data.gratuityPercent) : "20",
        airportFees: (data.airportFees || []).filter(fee => fee.airportCode && fee.airportCode.trim().length >= 3),
        meetAndGreet: data.meetAndGreet || { enabled: false, charge: 0 },
        surgePricing: data.surgePricing || [],
        distanceTiers: data.distanceTiers || [],
        overtimeRate: data.overtimeRate ? String(data.overtimeRate) : null,
        effectiveStart: (data.effectiveStart && data.effectiveStart.trim() !== '') ? new Date(data.effectiveStart) : null,
        effectiveEnd: (data.effectiveEnd && data.effectiveEnd.trim() !== '') ? new Date(data.effectiveEnd) : null,
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
    setPricingMethod("distance-breakdown");
  };

  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    
    // Determine which pricing method is being used
    const hasPerMileRate = rule.perMileRate && rule.perMileRate.trim() !== '';
    const hasDistanceTiers = rule.distanceTiers && rule.distanceTiers.length > 0;
    setPricingMethod(hasPerMileRate ? "per-mile" : "distance-breakdown");
    
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
      effectiveStart: formatDateForInput(rule.effectiveStart),
      effectiveEnd: formatDateForInput(rule.effectiveEnd),
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
    
    console.log('=== FORM SUBMISSION ===');
    console.log('Service Type:', formData.serviceType);
    console.log('Pricing Method:', pricingMethod);
    console.log('Base Rate:', formData.baseRate);
    console.log('Per Mile Rate:', formData.perMileRate);
    console.log('Distance Tiers:', formData.distanceTiers);
    console.log('Distance Tiers Count:', formData.distanceTiers.length);
    console.log('Hourly Rate:', formData.hourlyRate);
    console.log('Minimum Hours:', formData.minimumHours);
    console.log('======================');
    
    // Validate based on service type
    if (formData.serviceType === 'transfer') {
      if (!formData.baseRate) {
        toast({
          title: "Validation Error",
          description: "Base rate is required for transfer service",
          variant: "destructive",
        });
        return;
      }
      
      // Validate based on selected pricing method
      if (pricingMethod === 'per-mile') {
        if (!formData.perMileRate || formData.perMileRate.trim() === '') {
          toast({
            title: "Validation Error",
            description: "Per mile rate is required when using Per Mile Rate method",
            variant: "destructive",
          });
          return;
        }
      } else {
        // distance-breakdown method
        if (!formData.distanceTiers || formData.distanceTiers.length === 0) {
          toast({
            title: "Validation Error",
            description: "At least one distance tier is required when using Distance Breakdown method",
            variant: "destructive",
          });
          return;
        }
      }
    } else if (formData.serviceType === 'hourly') {
      if (!formData.hourlyRate || !formData.minimumHours) {
        toast({
          title: "Validation Error",
          description: "Hourly rate and minimum hours are required for hourly service",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Prepare submission data, clearing opposite method's data based on pricingMethod
    const submissionData = { ...formData };
    if (formData.serviceType === 'transfer') {
      if (pricingMethod === 'per-mile') {
        submissionData.distanceTiers = [];
      } else {
        submissionData.perMileRate = "";
      }
    }
    
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
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
      <AdminNav 
        onCredentialsClick={(section) => {
          // Navigate to admin dashboard credentials section
          window.location.href = '/admin';
        }}
        onUserManagerClick={(type) => {
          // Navigate to admin dashboard user manager
          window.location.href = '/admin';
        }}
        onBookingsClick={() => {
          // Navigate to admin dashboard bookings
          window.location.href = '/admin';
        }}
        onSettingsClick={(section) => {
          // Navigate to admin dashboard settings
          window.location.href = '/admin';
        }}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-lg shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pricing Rules</h2>
                <p className="text-sm text-slate-600 mt-1">Configure advanced pricing for all vehicle types and services</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold" data-testid="button-add-rule">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing Rule
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-white flex flex-col" data-testid="dialog-pricing-form">
                  <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50/30 -mx-6 -mt-6 px-6 py-4 border-b border-slate-200 rounded-t-lg">
                    <DialogTitle className="text-slate-900 font-semibold text-xl" data-testid="dialog-title">
                      {editingRule ? "Edit Pricing Rule" : "Create New Pricing Rule"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-2 text-sm">
                    {/* Basic Configuration */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-slate-900">Basic Configuration</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleType" className="text-slate-700 font-medium">Vehicle Type *</Label>
                          <Select
                            value={formData.vehicleType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                          >
                            <SelectTrigger className="mt-2 border-slate-300" data-testid="select-vehicle-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {vehicleTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="serviceType" className="text-slate-700 font-medium">Service Type *</Label>
                          <Select
                            value={formData.serviceType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                          >
                            <SelectTrigger className="mt-2 border-slate-300" data-testid="select-service-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
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
                        {/* Pricing Method Tabs */}
                        <div className="space-y-4">
                          <Tabs 
                            value={pricingMethod}
                            onValueChange={(value) => {
                              setPricingMethod(value as "distance-breakdown" | "per-mile");
                            }}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="distance-breakdown">Distance Breakdown/Fix Rate</TabsTrigger>
                              <TabsTrigger value="per-mile">Per Mile Rate</TabsTrigger>
                            </TabsList>

                            <TabsContent value="distance-breakdown" className="space-y-4 mt-4">
                              {/* Fix/Base Rate and Minimum Rate */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="baseRate">Fix/Base Rate ($)</Label>
                                  <Input
                                    id="baseRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="113.49"
                                    value={formData.baseRate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, baseRate: e.target.value }))}
                                    data-testid="input-base-rate"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="minimumFareInline">Minimum Rate ($)</Label>
                                  <Input
                                    id="minimumFareInline"
                                    type="number"
                                    step="0.01"
                                    placeholder="113.49"
                                    value={formData.minimumFare}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minimumFare: e.target.value }))}
                                    data-testid="input-minimum-rate"
                                  />
                                </div>
                              </div>

                              {/* Distance Tiers */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="text-sm font-medium">Progressive Distance Pricing</div>
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
                                
                                {formData.distanceTiers.map((tier, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded">
                                    <div className="w-24 text-sm font-medium text-slate-700">{getTierLabel(index)}</div>
                                    {!tier.isRemaining && (
                                      <>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="20"
                                          className="w-32 border-slate-300"
                                          value={tier.miles}
                                          onChange={(e) => updateDistanceTier(index, 'miles', parseFloat(e.target.value) || 0)}
                                          data-testid={`input-tier-miles-${index}`}
                                        />
                                        <span className="text-sm text-slate-600">mile</span>
                                      </>
                                    )}
                                    <span className="text-sm text-slate-600">@</span>
                                    <span className="text-sm font-semibold bg-slate-900 text-white px-2 py-1 rounded">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0"
                                      className="w-32 border-slate-300"
                                      value={tier.ratePerMile}
                                      onChange={(e) => updateDistanceTier(index, 'ratePerMile', parseFloat(e.target.value) || 0)}
                                      data-testid={`input-tier-rate-${index}`}
                                    />
                                    <Button type="button" variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => removeDistanceTier(index)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                
                                {formData.distanceTiers.length === 0 && (
                                  <div className="text-sm text-muted-foreground italic p-2">
                                    No tiers defined. Click "Add Tier" to create progressive pricing tiers.
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="per-mile" className="space-y-4 mt-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="baseRateSimple">Base Rate ($)</Label>
                                  <Input
                                    id="baseRateSimple"
                                    type="number"
                                    step="0.01"
                                    placeholder="50.00"
                                    value={formData.baseRate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, baseRate: e.target.value }))}
                                    data-testid="input-base-rate-simple"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="perMileRate">Per Mile Rate ($)</Label>
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
                                  <Label htmlFor="minimumFareSimple">Minimum Fare ($)</Label>
                                  <Input
                                    id="minimumFareSimple"
                                    type="number"
                                    step="0.01"
                                    placeholder="Optional"
                                    value={formData.minimumFare}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minimumFare: e.target.value }))}
                                    data-testid="input-minimum-fare-simple"
                                  />
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Gratuity */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Gratuity</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="gratuityPercent">Gratuity (%)</Label>
                              <Input
                                id="gratuityPercent"
                                type="number"
                                step="0.01"
                                placeholder="20.00"
                                className="border-slate-300"
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
                                  className="border-slate-300"
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
                              <Label className="text-slate-700 font-medium">Charge ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                className="border-slate-300 mt-2"
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
                                  <SelectContent className="bg-white">
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

                        {/* Gratuity */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Gratuity</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="gratuityPercentHourly">Gratuity (%)</Label>
                              <Input
                                id="gratuityPercentHourly"
                                type="number"
                                step="0.01"
                                placeholder="20.00"
                                className="border-slate-300"
                                value={formData.gratuityPercent}
                                onChange={(e) => setFormData(prev => ({ ...prev, gratuityPercent: e.target.value }))}
                                data-testid="input-gratuity-hourly"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Airport Fees */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Airport Fees</h3>
                            <Button type="button" size="sm" onClick={addAirportFee} data-testid="button-add-airport-fee-hourly">
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
                                  data-testid={`input-airport-code-hourly-${index}`}
                                />
                              </div>
                              <div>
                                <Label>Fee ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={fee.fee}
                                  onChange={(e) => updateAirportFee(index, 'fee', parseFloat(e.target.value) || 0)}
                                  data-testid={`input-airport-fee-hourly-${index}`}
                                />
                              </div>
                              <div>
                                <Label>Waiver (min)</Label>
                                <Input
                                  type="number"
                                  placeholder="Optional"
                                  className="border-slate-300"
                                  value={fee.waiverMinutes || ""}
                                  onChange={(e) => updateAirportFee(index, 'waiverMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid={`input-waiver-hourly-${index}`}
                                />
                              </div>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeAirportFee(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Common Fields */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Schedule & Status</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="effectiveStart" className="text-slate-700 font-medium">Effective From</Label>
                          <Input
                            id="effectiveStart"
                            type="date"
                            className="border-slate-300 mt-2"
                            value={formData.effectiveStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, effectiveStart: e.target.value }))}
                            data-testid="input-effective-start"
                          />
                        </div>
                        <div>
                          <Label htmlFor="effectiveEnd" className="text-slate-700 font-medium">Effective Until</Label>
                          <Input
                            id="effectiveEnd"
                            type="date"
                            className="border-slate-300 mt-2"
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

                    <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 sticky bottom-0 bg-white">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300 hover:bg-slate-100"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
          </div>
        
        {/* Content Card */}
        <Card className="border-slate-200 shadow-md bg-white overflow-hidden" data-testid="pricing-rules-card">
          <CardContent className="p-0">
            {rulesLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : pricingRules && pricingRules.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-50 hover:to-indigo-50 border-b-2 border-blue-200">
                      <TableHead className="font-semibold text-slate-700 h-12">Vehicle Type</TableHead>
                      <TableHead className="font-semibold text-slate-700">Service Type</TableHead>
                      <TableHead className="font-semibold text-slate-700">Base/Hourly Rate</TableHead>
                      <TableHead className="font-semibold text-slate-700">Gratuity</TableHead>
                      <TableHead className="font-semibold text-slate-700">Airport Fees</TableHead>
                      <TableHead className="font-semibold text-slate-700">Surge Rules</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingRules.map((rule) => (
                      <TableRow 
                        key={rule.id} 
                        data-testid={`rule-row-${rule.id}`}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                      >
                        <TableCell data-testid={`vehicle-type-${rule.id}`} className="font-medium text-slate-900">
                          {getVehicleTypeLabel(rule.vehicleType)}
                        </TableCell>
                        <TableCell data-testid={`service-type-${rule.id}`} className="text-slate-700">
                          {getServiceTypeLabel(rule.serviceType)}
                        </TableCell>
                        <TableCell data-testid={`rate-${rule.id}`} className="font-semibold text-blue-700">
                          {rule.serviceType === 'transfer' && rule.baseRate ? `$${rule.baseRate}` : 
                           rule.serviceType === 'hourly' && rule.hourlyRate ? `$${rule.hourlyRate}/hr` : '-'}
                        </TableCell>
                        <TableCell data-testid={`gratuity-${rule.id}`} className="text-slate-600">
                          {rule.gratuityPercent ? `${rule.gratuityPercent}%` : '-'}
                        </TableCell>
                        <TableCell data-testid={`airport-fees-${rule.id}`} className="text-slate-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">
                            {rule.airportFees?.length || 0} airports
                          </span>
                        </TableCell>
                        <TableCell data-testid={`surge-rules-${rule.id}`} className="text-slate-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm">
                            {rule.surgePricing?.length || 0} periods
                          </span>
                        </TableCell>
                        <TableCell data-testid={`status-${rule.id}`}>
                          <Badge className={rule.isActive ? "bg-green-100 text-green-800 border-green-200 font-medium" : "bg-slate-100 text-slate-700 border-slate-200 font-medium"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              onClick={() => handleEdit(rule)}
                              data-testid={`button-edit-${rule.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition-colors"
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
              <div className="text-center p-12 m-6 text-slate-600 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-dashed border-slate-300" data-testid="no-rules">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="font-medium text-slate-700">No pricing rules configured yet</p>
                <p className="text-sm text-slate-500 mt-1">Add your first pricing rule to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
