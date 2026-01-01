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
import { 
  MessageSquare, 
  Pencil, 
  Send, 
  Loader2, 
  AlertCircle,
  Code,
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

const SMS_MAX_LENGTH = 160;
const SMS_SEGMENT_LENGTH = 153;

export function SmsNotificationsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    smsContent: "",
    status: "active" as "active" | "inactive",
  });
  const [testPhone, setTestPhone] = useState("");

  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates", "sms"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/notification-templates?type=sms");
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
      toast({ title: "Template Updated", description: "SMS notification template saved successfully." });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (data: { id: string; phoneNumber: string }) => {
      const response = await apiRequest("POST", `/api/admin/notification-templates/${data.id}/test-sms`, {
        phoneNumber: data.phoneNumber,
        testData: {
          passenger_name: "John Doe",
          booking_id: "12345",
          pickup_location: "123 Main St",
          dropoff_location: "456 Park Ave",
          pickup_time: "10:00 AM",
          driver_name: "Michael Smith",
          driver_phone: "(555) 123-4567",
          vehicle_model: "Mercedes S-Class",
          license_plate: "ABC-1234",
          new_status: "confirmed",
          estimated_arrival: "5 minutes",
        },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Test SMS Sent", description: `Test SMS sent to ${testPhone}` });
      setTestDialogOpen(false);
      setTestPhone("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      smsContent: template.smsContent || "",
      status: template.status,
    });
    setEditDialogOpen(true);
  };

  const handleTestSms = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      updates: {
        name: editForm.name,
        smsContent: editForm.smsContent,
        status: editForm.status,
      },
    });
  };

  const handleSendTest = () => {
    if (!selectedTemplate || !testPhone) return;
    testSmsMutation.mutate({ id: selectedTemplate.id, phoneNumber: testPhone });
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

  const getCharacterCountInfo = (text: string) => {
    const length = text.length;
    const segments = length <= SMS_MAX_LENGTH ? 1 : Math.ceil(length / SMS_SEGMENT_LENGTH);
    const remaining = length <= SMS_MAX_LENGTH 
      ? SMS_MAX_LENGTH - length 
      : SMS_SEGMENT_LENGTH - (length % SMS_SEGMENT_LENGTH);
    
    return { length, segments, remaining };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const charInfo = getCharacterCountInfo(editForm.smsContent);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SMS Notification Templates</h2>
        <p className="text-muted-foreground">
          Customize the SMS templates sent to passengers, drivers, and admins. Keep messages concise for better delivery.
        </p>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => {
          const templateCharInfo = getCharacterCountInfo(template.smsContent || "");
          return (
            <Card key={template.id} className={template.status === "inactive" ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
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
                    <Badge variant="outline" className="text-xs">
                      {templateCharInfo.length} chars / {templateCharInfo.segments} segment{templateCharInfo.segments > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono">
                    {template.smsContent || "No content"}
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
                  <Button variant="outline" size="sm" onClick={() => handleTestSms(template)}>
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
          );
        })}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              Customize the SMS content. Keep messages short to minimize costs and improve delivery rates.
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
              <div className="flex items-center justify-between">
                <Label htmlFor="smsContent">SMS Content</Label>
                <div className="text-sm space-x-2">
                  <span className={charInfo.length > SMS_MAX_LENGTH ? "text-amber-600" : "text-muted-foreground"}>
                    {charInfo.length} characters
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className={charInfo.segments > 1 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {charInfo.segments} segment{charInfo.segments > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Textarea
                id="smsContent"
                value={editForm.smsContent}
                onChange={(e) => setEditForm({ ...editForm, smsContent: e.target.value })}
                placeholder="Enter SMS content"
                className="min-h-[120px] font-mono text-sm resize-none"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      charInfo.length > SMS_MAX_LENGTH * 2 ? "bg-red-500" :
                      charInfo.length > SMS_MAX_LENGTH ? "bg-amber-500" :
                      charInfo.length > SMS_MAX_LENGTH * 0.8 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((charInfo.length / (SMS_MAX_LENGTH * 2)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{charInfo.remaining} left</span>
              </div>
              {charInfo.segments > 1 && (
                <p className="text-xs text-amber-600">
                  This message will be sent as {charInfo.segments} SMS segments, which may increase costs.
                </p>
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
                        setEditForm({ ...editForm, smsContent: editForm.smsContent + `{${code.trim()}}` });
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
            <DialogTitle>Send Test SMS</DialogTitle>
            <DialogDescription>
              Send a test SMS for "{selectedTemplate?.name}" to verify the template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Recipient Phone Number</Label>
              <Input
                id="testPhone"
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Test SMS will be sent with sample data and a [TEST] prefix. Standard SMS charges may apply.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={!testPhone || testSmsMutation.isPending}>
              {testSmsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Test SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
