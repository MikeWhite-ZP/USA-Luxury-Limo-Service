import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Search, FolderOpen, Image as ImageIcon, Download, Copy, X, Loader2, FileImage, ChevronLeft, ChevronRight, Upload, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminNav } from "@/components/AdminNav";

interface MinIOFile {
  key: string;
  name: string;
  folder: string;
  size: number;
  lastModified: string;
  url: string;
  isImage: boolean;
}

interface MinIOBrowseResponse {
  success: boolean;
  files: MinIOFile[];
  folders: string[];
  totalFiles: number;
}

export default function MinIOBrowser() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<MinIOFile | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch MinIO files
  const { data, isLoading } = useQuery<MinIOBrowseResponse>({
    queryKey: ["/api/admin/minio/browse", selectedFolder, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolder) {
        params.append("folder", selectedFolder);
      }
      params.append("page", currentPage.toString());
      params.append("pageSize", pageSize.toString());
      const response = await fetch(`/api/admin/minio/browse?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
  });

  // Calculate pagination
  const totalPages = Math.ceil((data?.totalFiles || 0) / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset to page 1 when folder changes
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setCurrentPage(1);
  };

  // Filter files based on search query
  const filteredFiles = data?.files.filter((file) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(searchLower) ||
      file.folder.toLowerCase().includes(searchLower)
    );
  });

  const handleImageClick = (file: MinIOFile) => {
    setSelectedImage(file);
    setPreviewDialogOpen(true);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "Image URL has been copied to clipboard",
    });
  };

  const handleDownload = (file: MinIOFile) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download Started",
      description: `Downloading ${file.name}`,
    });
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/minio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/minio/browse'] });
      setUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only JPEG, PNG, GIF, WebP, and HEIC images are allowed',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadFolder || selectedFolder || 'cms/general');

    uploadMutation.mutate(formData);
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Open upload dialog with current folder as default
  const handleOpenUploadDialog = () => {
    setUploadFolder(selectedFolder || 'cms/general');
    setUploadDialogOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-sm overflow-hidden">
            <CardHeader className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b-0 pb-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
              
              <CardTitle className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-3.5 rounded-2xl shadow-lg">
                      <FileImage className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">MinIO Image Browser</h1>
                    <p className="text-sm text-slate-300 mt-0.5 font-light">Browse and manage your object storage files</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {data && (
                    <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20 px-4 py-2 text-sm">
                      {data.totalFiles} {data.totalFiles === 1 ? "file" : "files"}
                    </Badge>
                  )}
                  <Button
                    onClick={handleOpenUploadDialog}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                    data-testid="button-upload-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Assets
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-8 bg-gradient-to-b from-white to-slate-50/30">
              {/* Search and Filters */}
              <div className="mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 border-slate-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm focus:border-cyan-400 focus:ring-cyan-400/20 focus:shadow-md transition-all text-base"
                    data-testid="input-search-files"
                  />
                </div>

                {/* Folder Filter Buttons */}
                {data && data.folders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleFolderChange("")}
                      variant={selectedFolder === "" ? "default" : "outline"}
                      className={selectedFolder === "" 
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl"
                        : "border-slate-200 hover:bg-slate-50 rounded-xl"}
                      data-testid="button-filter-all"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      All Files
                    </Button>
                    {data.folders.map((folder) => (
                      <Button
                        key={folder}
                        onClick={() => handleFolderChange(folder)}
                        variant={selectedFolder === folder ? "default" : "outline"}
                        className={selectedFolder === folder 
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl"
                          : "border-slate-200 hover:bg-slate-50 rounded-xl"}
                        data-testid={`button-filter-${folder}`}
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {folder}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Files Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center p-16">
                  <div className="relative">
                    <Loader2 className="animate-spin w-12 h-12 text-cyan-600" />
                    <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-cyan-400 rounded-full opacity-20" />
                  </div>
                </div>
              ) : filteredFiles && filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.key}
                      className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:border-slate-200 hover:-translate-y-1"
                      data-testid={`file-card-${file.key}`}
                    >
                      {/* Image Preview */}
                      <div
                        className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden cursor-pointer"
                        onClick={() => file.isImage && handleImageClick(file)}
                      >
                        {file.isImage ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Cg transform="translate(200,150)"%3E%3Cpath d="M-30,-20 L30,-20 L30,20 L-30,20 Z" fill="%2394a3b8"/%3E%3C/g%3E%3Ctext x="50%25" y="75%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-20 h-20 text-slate-300" />
                          </div>
                        )}

                        {/* Folder Badge */}
                        {file.folder && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-slate-800/80 backdrop-blur-sm text-white border-0 shadow-lg px-2 py-1 text-xs">
                              {file.folder}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-900 truncate mb-1" title={file.name} data-testid={`file-name-${file.key}`}>
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span className="truncate">{formatDate(file.lastModified)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCopyUrl(file.url)}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg text-xs"
                            data-testid={`button-copy-url-${file.key}`}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy URL
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(file)}
                            variant="outline"
                            className="px-3 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 rounded-lg"
                            data-testid={`button-download-${file.key}`}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 border-2 border-dashed border-slate-200">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
                  <div className="relative text-center py-20 px-6">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-cyan-100 rounded-full blur-2xl opacity-50" />
                      <div className="relative bg-gradient-to-br from-slate-100 to-cyan-100 p-6 rounded-full">
                        <FileImage className="w-16 h-16 text-slate-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Files Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {searchQuery || selectedFolder
                        ? "Try adjusting your search or filter criteria."
                        : "Upload some files to get started with MinIO object storage."}
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredFiles && filteredFiles.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages} • {data?.totalFiles} total {data?.totalFiles === 1 ? "file" : "files"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPrevPage}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNextPage}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-cyan-700">
                <ImageIcon className="w-5 h-5" />
                Image Preview
              </DialogTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              {/* Image */}
              <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center max-h-[60vh] overflow-auto">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif"%3EImage Load Error%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* File Details */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Filename:</span>
                    <p className="text-slate-900 font-mono text-xs mt-1 break-all">{selectedImage.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Size:</span>
                    <p className="text-slate-900 mt-1">{formatFileSize(selectedImage.size)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Folder:</span>
                    <p className="text-slate-900 mt-1">{selectedImage.folder || "Root"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Last Modified:</span>
                    <p className="text-slate-900 mt-1">{formatDate(selectedImage.lastModified)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCopyUrl(selectedImage.url)}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  onClick={() => handleDownload(selectedImage)}
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="flex items-center gap-2 text-cyan-700">
              <CloudUpload className="w-5 h-5" />
              Upload File to MinIO Storage
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Folder Selector */}
            <div className="space-y-2">
              <Label htmlFor="upload-folder" className="text-sm font-medium text-slate-700">
                Destination Folder
              </Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger id="upload-folder" className="bg-white border-slate-200" data-testid="select-upload-folder">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cms/general">cms/general</SelectItem>
                  <SelectItem value="cms/vehicles">cms/vehicles</SelectItem>
                  <SelectItem value="cms/logos">cms/logos</SelectItem>
                  <SelectItem value="cms/drivers">cms/drivers</SelectItem>
                  <SelectItem value="cms/hero-images">cms/hero-images</SelectItem>
                  <SelectItem value="cms/testimonials">cms/testimonials</SelectItem>
                  {data?.folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Choose where to store your file in MinIO storage</p>
            </div>

            {/* Drag & Drop Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-50/50'
                  : 'border-slate-300 bg-slate-50/50 hover:border-cyan-400 hover:bg-cyan-50/30'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-testid="upload-drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-file-upload"
              />
              
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-full">
                      <CloudUpload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">
                    {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                  </p>
                  <p className="text-sm text-slate-500">or</p>
                </div>

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                  data-testid="button-browse-files"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </>
                  )}
                </Button>

                <div className="pt-2 space-y-1">
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Supported formats:</span> JPEG, PNG, GIF, WebP, HEIC
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Maximum size:</span> 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
