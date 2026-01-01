import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Mail, 
  Pencil, 
  Send, 
  Loader2, 
  AlertCircle,
  Code,
  Eye,
  EyeOff,
} from "lucide-react";

interface NotificationTemplate {
  id: string;
  type: "email" | "sms";
  code: string;
  name: string;
  recipientType: "passenger" | "driver" | "admin" | "user";
  purpose: string;
  subject: string | null;
  content: string | null;
  smsContent: string | null;
  status: "active" | "inactive";
  availableShortcodes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function EmailNotificationsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    subject: "",
    content: "",
    status: "active" as "active" | "inactive",
  });
  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates", "email"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/notification-templates?type=email");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<NotificationTemplate> }) => {
      const response = await apiRequest("PUT", `/api/admin/notification-templates/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      toast({ title: "Template Updated", description: "Email notification template saved successfully." });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (data: { id: string; recipientEmail: string }) => {
      const response = await apiRequest("POST", `/api/admin/notification-templates/${data.id}/test-email`, {
        recipientEmail: data.recipientEmail,
        testData: {
          passenger_name: "John Doe",
          booking_id: "12345",
          pickup_location: "123 Main St, New York, NY",
          dropoff_location: "456 Park Ave, New York, NY",
          pickup_datetime: "January 15, 2026 at 10:00 AM",
          vehicle_type: "Sedan",
          estimated_fare: "$75.00",
          driver_name: "Michael Smith",
          driver_phone: "(555) 123-4567",
          vehicle_model: "Mercedes S-Class",
          license_plate: "ABC-1234",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Test Email Sent", description: `Test email sent to ${testEmail}` });
      setTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject || "",
      content: template.content || "",
      status: template.status,
    });
    setEditDialogOpen(true);
  };

  const handleTestEmail = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      updates: {
        name: editForm.name,
        subject: editForm.subject,
        content: editForm.content,
        status: editForm.status,
      },
    });
  };

  const handleSendTest = () => {
    if (!selectedTemplate || !testEmail) return;
    testEmailMutation.mutate({ id: selectedTemplate.id, recipientEmail: testEmail });
  };

  const getRecipientBadgeColor = (type: string) => {
    switch (type) {
      case "passenger": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "driver": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "admin": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "user": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Notification Templates</h2>
        <p className="text-muted-foreground">
          Customize the email templates sent to passengers, drivers, and admins. Use shortcodes to personalize messages.
        </p>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className={template.status === "inactive" ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.status === "active" ? "default" : "secondary"}>
                      {template.status}
                    </Badge>
                  </div>
                  <CardDescription>{template.purpose}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRecipientBadgeColor(template.recipientType)}>
                    {template.recipientType}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Subject: </span>
                  <span className="text-muted-foreground">{template.subject || "No subject"}</span>
                </div>
                {template.availableShortcodes && (
                  <div className="flex items-start gap-2 text-sm">
                    <Code className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {template.availableShortcodes.split(",").map((code) => (
                        <code key={code} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                          {code.trim()}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleTestEmail(template)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
                <Button size="sm" onClick={() => handleEdit(template)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Customize the email content and settings. Use shortcodes like {"{passenger_name}"} to personalize messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "active" | "inactive") => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="Enter email subject line"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Email Content (HTML)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-8"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
              {showPreview ? (
                <div 
                  className="min-h-[300px] p-4 border rounded-md bg-white dark:bg-gray-950 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: editForm.content }}
                />
              ) : (
                <Textarea
                  id="content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Enter email content in HTML format"
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
            </div>
            {selectedTemplate?.availableShortcodes && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Available Shortcodes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.availableShortcodes.split(",").map((code) => (
                    <Button
                      key={code}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditForm({ ...editForm, content: editForm.content + `{${code.trim()}}` });
                      }}
                    >
                      {`{${code.trim()}}`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email for "{selectedTemplate?.name}" to verify the template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Recipient Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Test emails will be sent with sample data and a [TEST] prefix in the subject line.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={!testEmail || testEmailMutation.isPending}>
              {testEmailMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
