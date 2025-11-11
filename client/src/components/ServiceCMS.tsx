import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertServiceSchema, serviceIconEnum } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Plane,
  Briefcase,
  Heart,
  Clock,
  Car,
  Users,
  Star,
  Shield,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";

type Service = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  icon: typeof serviceIconEnum[number];
  features: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type InsertService = z.infer<typeof insertServiceSchema>;

const iconMap = {
  Plane,
  Briefcase,
  Heart,
  Clock,
  Car,
  Users,
  Star,
  Shield,
  Calendar,
  MapPin,
};

const formSchema = insertServiceSchema.extend({
  id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ServiceCMS() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      icon: "Plane",
      features: [],
      imageUrl: "",
      imageAlt: "",
      ctaLabel: "",
      ctaUrl: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  // Fetch services
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const response = await apiRequest("POST", "/api/admin/services", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setEditDialogOpen(false);
      form.reset();
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertService>;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setEditDialogOpen(false);
      setSelectedService(null);
      form.reset();
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setDeleteDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`/api/admin/services/${id}/upload-image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      form.setValue("imageUrl", data.imageUrl);
      setImagePreview(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    setSelectedService(null);
    form.reset({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      icon: "Plane",
      features: [],
      imageUrl: "",
      imageAlt: "",
      ctaLabel: "",
      ctaUrl: "",
      displayOrder: services.length,
      isActive: true,
    });
    setImagePreview(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    form.reset({
      id: service.id,
      title: service.title,
      slug: service.slug,
      subtitle: service.subtitle || "",
      description: service.description,
      icon: service.icon,
      features: service.features || [],
      imageUrl: service.imageUrl || "",
      imageAlt: service.imageAlt || "",
      ctaLabel: service.ctaLabel || "",
      ctaUrl: service.ctaUrl || "",
      displayOrder: service.displayOrder,
      isActive: service.isActive,
    });
    setImagePreview(service.imageUrl);
    setEditDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    const { id, ...serviceData } = data;
    
    // Convert empty strings to null for optional fields
    const cleanData: InsertService = {
      ...serviceData,
      subtitle: serviceData.subtitle || null,
      imageUrl: serviceData.imageUrl || null,
      imageAlt: serviceData.imageAlt || null,
      ctaLabel: serviceData.ctaLabel || null,
      ctaUrl: serviceData.ctaUrl || null,
    };

    if (id) {
      updateMutation.mutate({ id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Image must be under 2MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return;
    }

    const serviceId = form.getValues("id");
    if (!serviceId) {
      toast({
        title: "Info",
        description: "Please save the service first before uploading images",
      });
      return;
    }

    // Check image dimensions and aspect ratio
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;
      const idealRatio = 4 / 5; // 0.8
      
      // Warn if dimensions are too small
      if (width < 800 || height < 1000) {
        toast({
          title: "Low Resolution Warning",
          description: `Image is ${width}×${height}px. Recommended minimum is 800×1000px for best quality.`,
          variant: "destructive",
        });
        return;
      }
      
      // Warn if aspect ratio is far from ideal (portrait orientation)
      if (aspectRatio > 1.2) {
        toast({
          title: "Aspect Ratio Warning",
          description: `Image is landscape (${width}×${height}px). Portrait images (4:5 ratio) work best for service cards.`,
        });
        // Don't return, allow upload but with warning
      }
      
      // Show helpful info for good images
      if (width >= 1200 && height >= 1500 && Math.abs(aspectRatio - idealRatio) < 0.1) {
        toast({
          title: "Perfect Image!",
          description: "This image has ideal dimensions for service cards.",
        });
      }
      
      // Proceed with upload
      setUploadingImage(true);
      try {
        await uploadImageMutation.mutateAsync({ id: serviceId, file });
      } finally {
        setUploadingImage(false);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Error",
        description: "Failed to load image. Please try a different file.",
        variant: "destructive",
      });
    };
    
    img.src = objectUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (!selectedService) {
      // Auto-generate slug for new services
      form.setValue("slug", generateSlug(value));
    }
  };

  const addFeature = () => {
    const features = form.getValues("features") || [];
    form.setValue("features", [...features, ""]);
  };

  const removeFeature = (index: number) => {
    const features = form.getValues("features") || [];
    form.setValue("features", features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const features = form.getValues("features") || [];
    const newFeatures = [...features];
    newFeatures[index] = value;
    form.setValue("features", newFeatures);
  };

  const getIconComponent = (icon: string) => {
    const Icon = iconMap[icon as keyof typeof iconMap];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span>Service Cards</span>
          </CardTitle>
          <Button
            onClick={handleCreateNew}
            data-testid="button-create-service"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No services found. Create your first service to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="header-title">Title</TableHead>
                  <TableHead data-testid="header-slug">Slug</TableHead>
                  <TableHead data-testid="header-icon">Icon</TableHead>
                  <TableHead data-testid="header-features">Features</TableHead>
                  <TableHead data-testid="header-image">Image</TableHead>
                  <TableHead data-testid="header-order">Order</TableHead>
                  <TableHead data-testid="header-status">Status</TableHead>
                  <TableHead data-testid="header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                    <TableCell data-testid={`text-title-${service.id}`} className="font-medium">
                      {service.title}
                    </TableCell>
                    <TableCell data-testid={`text-slug-${service.id}`} className="text-slate-600">
                      {service.slug}
                    </TableCell>
                    <TableCell data-testid={`icon-${service.id}`}>
                      <div className="flex items-center gap-2">
                        {getIconComponent(service.icon)}
                        <span className="text-sm text-slate-500">{service.icon}</span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-features-${service.id}`}>
                      <Badge variant="secondary">{service.features?.length || 0}</Badge>
                    </TableCell>
                    <TableCell data-testid={`image-${service.id}`}>
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.imageAlt || service.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-order-${service.id}`}>
                      {service.displayOrder}
                    </TableCell>
                    <TableCell data-testid={`badge-status-${service.id}`}>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                          data-testid={`button-edit-${service.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service)}
                          data-testid={`button-delete-${service.id}`}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-service">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Edit Service" : "Create Service"}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? "Update the service card details"
                : "Create a new service card for your homepage"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Airport Transfer"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="airport-transfer"
                          data-testid="input-slug"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subtitle */}
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Quick and reliable transfers"
                        data-testid="input-subtitle"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your service..."
                        rows={4}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon Selection */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon *</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          data-testid="select-icon"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceIconEnum.map((icon) => (
                              <SelectItem key={icon} value={icon} data-testid={`select-option-${icon}`}>
                                <div className="flex items-center gap-2">
                                  {getIconComponent(icon)}
                                  <span>{icon}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <div className="p-3 bg-slate-100 rounded-lg">
                        {getIconComponent(field.value)}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    data-testid="button-add-feature"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.watch("features") || []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description"
                        data-testid={`input-feature-${index}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        data-testid={`button-remove-feature-${index}`}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Service Image</Label>
                  <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    Recommended: 1200×1500px (4:5 ratio)
                  </div>
                </div>
                
                {/* Image Specifications Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Image Specifications for Best Results
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
                    <li><strong>Recommended size:</strong> 1200×1500px (high quality)</li>
                    <li><strong>Minimum size:</strong> 800×1000px</li>
                    <li><strong>Aspect ratio:</strong> 4:5 (portrait orientation)</li>
                    <li><strong>Format:</strong> JPG, PNG, or WebP</li>
                    <li><strong>Max file size:</strong> 2MB</li>
                    <li><strong>Tip:</strong> Use high-contrast images as text will overlay</li>
                  </ul>
                </div>

                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      data-testid="image-preview"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ✓ Preview
                    </div>
                  </div>
                )}
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive ? "border-blue-500 bg-blue-50 scale-105" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="dropzone-image"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file"
                  />
                  <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm text-slate-600 mb-1 font-medium">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Supports JPG, PNG, WebP (max 2MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || !form.getValues("id")}
                    data-testid="button-upload-image"
                    className="hover:bg-blue-50 hover:border-blue-400"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select Image
                      </>
                    )}
                  </Button>
                  {!form.getValues("id") && (
                    <p className="text-xs text-slate-500 mt-3 bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-block">
                      💡 Save the service first to enable image upload
                    </p>
                  )}
                </div>

                {/* Image URL (read-only display) */}
                {form.watch("imageUrl") && (
                  <div className="space-y-1">
                    <Label className="text-sm text-slate-600">Image URL</Label>
                    <Input
                      value={form.watch("imageUrl") || ""}
                      readOnly
                      className="bg-slate-50 text-sm"
                      data-testid="input-image-url"
                    />
                  </div>
                )}

                {/* Image Alt Text */}
                <FormField
                  control={form.control}
                  name="imageAlt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt Text</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Describe the image for accessibility"
                          data-testid="input-image-alt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* CTA Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ctaLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Label</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Learn More"
                          data-testid="input-cta-label"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ctaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="/services/airport-transfer"
                          data-testid="input-cta-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Display Order and Active Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Status</FormLabel>
                      <div className="flex items-center gap-3 h-10">
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                        <span className="text-sm text-slate-600">
                          {field.value ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedService(null);
                    form.reset();
                    setImagePreview(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Service"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service "{selectedService?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedService && deleteMutation.mutate(selectedService.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
