import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, CheckCircle, XCircle, Clock, Phone } from "lucide-react";

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: 'driver_license' | 'limo_license' | 'profile_photo';
  documentUrl: string;
  expirationDate: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  whatsappNumber: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export default function DriverDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    driverLicense: { file: null as File | null, expirationDate: '' },
    limoLicense: { file: null as File | null, expirationDate: '' },
    profilePhoto: { file: null as File | null },
    whatsappNumber: ''
  });

  // Fetch driver documents
  const { data: documents, isLoading } = useQuery<DriverDocument[]>({
    queryKey: ['/api/driver/documents'],
    enabled: !!user && user.role === 'driver',
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ documentType, file, expirationDate, whatsappNumber }: {
      documentType: string;
      file: File;
      expirationDate?: string;
      whatsappNumber?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (expirationDate) formData.append('expirationDate', expirationDate);
      if (whatsappNumber) formData.append('whatsappNumber', whatsappNumber);

      const response = await fetch('/api/driver/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/documents'] });
      toast({
        title: "Document Uploaded",
        description: `Your ${variables.documentType.replace('_', ' ')} has been uploaded successfully.`,
      });
      setUploading(null);
      
      // Clear form
      if (variables.documentType === 'driver_license') {
        setFormData(prev => ({ ...prev, driverLicense: { file: null, expirationDate: '' } }));
      } else if (variables.documentType === 'limo_license') {
        setFormData(prev => ({ ...prev, limoLicense: { file: null, expirationDate: '' } }));
      } else if (variables.documentType === 'profile_photo') {
        setFormData(prev => ({ ...prev, profilePhoto: { file: null } }));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest('DELETE', `/api/driver/documents/${documentId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/documents'] });
      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (documentType: 'driver_license' | 'limo_license' | 'profile_photo') => {
    let file: File | null = null;
    let expirationDate: string | undefined;
    let whatsappNumber: string | undefined;

    if (documentType === 'driver_license') {
      file = formData.driverLicense.file;
      expirationDate = formData.driverLicense.expirationDate || undefined;
    } else if (documentType === 'limo_license') {
      file = formData.limoLicense.file;
      expirationDate = formData.limoLicense.expirationDate || undefined;
    } else if (documentType === 'profile_photo') {
      file = formData.profilePhoto.file;
      whatsappNumber = formData.whatsappNumber || undefined;
    }

    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(documentType);
    uploadMutation.mutate({ documentType, file, expirationDate, whatsappNumber });
  };

  const getDocumentByType = (type: string) => {
    return documents?.find(doc => doc.documentType === type);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Driver access required</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Documents</h1>
        <p className="text-muted-foreground">
          Upload and manage your verification documents. All documents must be approved before you can start accepting rides.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Driver License */}
          <Card data-testid="card-driver-license">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Driver License
              </CardTitle>
              <CardDescription>Upload your valid driver's license</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getDocumentByType('driver_license') ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(getDocumentByType('driver_license')!.status)}
                  </div>
                  {getDocumentByType('driver_license')!.expirationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expires:</span>
                      <span className="text-sm">
                        {new Date(getDocumentByType('driver_license')!.expirationDate!).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {getDocumentByType('driver_license')!.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">
                        <strong>Rejection Reason:</strong> {getDocumentByType('driver_license')!.rejectionReason}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(getDocumentByType('driver_license')!.id)}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-driver-license"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Replace Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="driver-license-file">Upload License (Image/PDF, max 2MB)</Label>
                    <Input
                      id="driver-license-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driverLicense: { ...prev.driverLicense, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-driver-license-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-license-expiry">Expiration Date</Label>
                    <Input
                      id="driver-license-expiry"
                      type="date"
                      value={formData.driverLicense.expirationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driverLicense: { ...prev.driverLicense, expirationDate: e.target.value }
                      }))}
                      data-testid="input-driver-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('driver_license')}
                    disabled={!formData.driverLicense.file || uploading === 'driver_license'}
                    data-testid="button-upload-driver-license"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading === 'driver_license' ? 'Uploading...' : 'Upload License'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limo License */}
          <Card data-testid="card-limo-license">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Limousine License
              </CardTitle>
              <CardDescription>Upload your limo/chauffeur license</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getDocumentByType('limo_license') ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(getDocumentByType('limo_license')!.status)}
                  </div>
                  {getDocumentByType('limo_license')!.expirationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expires:</span>
                      <span className="text-sm">
                        {new Date(getDocumentByType('limo_license')!.expirationDate!).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {getDocumentByType('limo_license')!.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">
                        <strong>Rejection Reason:</strong> {getDocumentByType('limo_license')!.rejectionReason}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(getDocumentByType('limo_license')!.id)}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-limo-license"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Replace Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="limo-license-file">Upload License (Image/PDF, max 2MB)</Label>
                    <Input
                      id="limo-license-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limoLicense: { ...prev.limoLicense, file: e.target.files?.[0] || null }
                      }))}
                      data-testid="input-limo-license-file"
                    />
                  </div>
                  <div>
                    <Label htmlFor="limo-license-expiry">Expiration Date</Label>
                    <Input
                      id="limo-license-expiry"
                      type="date"
                      value={formData.limoLicense.expirationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limoLicense: { ...prev.limoLicense, expirationDate: e.target.value }
                      }))}
                      data-testid="input-limo-license-expiry"
                    />
                  </div>
                  <Button
                    onClick={() => handleUpload('limo_license')}
                    disabled={!formData.limoLicense.file || uploading === 'limo_license'}
                    data-testid="button-upload-limo-license"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading === 'limo_license' ? 'Uploading...' : 'Upload License'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Photo */}
          <Card data-testid="card-profile-photo" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Driver Profile Photo & WhatsApp
              </CardTitle>
              <CardDescription>Upload your profile photo and provide WhatsApp contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getDocumentByType('profile_photo') ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(getDocumentByType('profile_photo')!.status)}
                  </div>
                  {getDocumentByType('profile_photo')!.whatsappNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">WhatsApp: {getDocumentByType('profile_photo')!.whatsappNumber}</span>
                    </div>
                  )}
                  {getDocumentByType('profile_photo')!.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">
                        <strong>Rejection Reason:</strong> {getDocumentByType('profile_photo')!.rejectionReason}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(getDocumentByType('profile_photo')!.id)}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-profile-photo"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Replace Photo
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="profile-photo-file">Upload Photo (Image, max 2MB)</Label>
                      <Input
                        id="profile-photo-file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          profilePhoto: { file: e.target.files?.[0] || null }
                        }))}
                        data-testid="input-profile-photo-file"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                      <Input
                        id="whatsapp-number"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          whatsappNumber: e.target.value
                        }))}
                        data-testid="input-whatsapp-number"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleUpload('profile_photo')}
                      disabled={!formData.profilePhoto.file || uploading === 'profile_photo'}
                      className="w-full"
                      data-testid="button-upload-profile-photo"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading === 'profile_photo' ? 'Uploading...' : 'Upload Photo & WhatsApp'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
