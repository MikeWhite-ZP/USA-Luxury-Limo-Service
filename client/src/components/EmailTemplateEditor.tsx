import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, RotateCcw, Mail, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailTemplateEditorProps {
  templateSlug: string;
}

const emailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

export function EmailTemplateEditor({ templateSlug }: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Fetch template data
  const { data: template, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/email-templates", templateSlug],
    enabled: !!templateSlug,
  });

  // Form setup
  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    values: template ? {
      name: template.name || "",
      subject: template.subject || "",
      body: template.body || "",
    } : undefined,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      return await apiRequest(`/api/admin/email-templates/${templateSlug}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates", templateSlug] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/email-templates/${templateSlug}/reset`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates", templateSlug] });
      form.reset({
        name: data.name,
        subject: data.subject,
        body: data.body,
      });
      toast({
        title: "Success",
        description: "Template reset to default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset template",
        variant: "destructive",
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest(`/api/admin/email-templates/${templateSlug}/test`, {
        method: "POST",
        body: JSON.stringify({ toEmail: email }),
      });
    },
    onSuccess: () => {
      setTestEmailOpen(false);
      setTestEmail("");
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailTemplateFormData) => {
    updateMutation.mutate(data);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset this template to its default? This cannot be undone.")) {
      resetMutation.mutate();
    }
  };

  const handleSendTest = () => {
    if (testEmail) {
      testEmailMutation.mutate(testEmail);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center text-gray-500">
        Template not found
      </div>
    );
  }

  const variables = template.variables || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        <Badge className="mt-2" variant="outline">{template.category}</Badge>
      </div>

      {variables.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Available Variables:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {variables.map((v: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap">
                    {"{{" + v.name + "}}"}
                  </code>
                  <span className="text-gray-600 text-xs">{v.description}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Edit the email subject and body</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" data-testid="label-template-name">Template Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Template Name"
                data-testid="input-template-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject" data-testid="label-template-subject">Email Subject</Label>
              <Input
                id="subject"
                {...form.register("subject")}
                placeholder="Email Subject (you can use variables like {{user_name}})"
                data-testid="input-template-subject"
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="body" data-testid="label-template-body">Email Body (HTML)</Label>
              <Textarea
                id="body"
                {...form.register("body")}
                placeholder="Email HTML content (you can use variables like {{user_name}})"
                className="font-mono text-sm min-h-[400px]"
                data-testid="textarea-template-body"
              />
              {form.formState.errors.body && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Tip: Use HTML tags for formatting. Variables should be wrapped in double curly braces like {"{{variable_name}}"}.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            data-testid="button-save-template"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            data-testid="button-reset-template"
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setTestEmailOpen(true)}
            data-testid="button-test-email"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Test Email
          </Button>
        </div>
      </form>

      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent data-testid="dialog-test-email">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to send a test version of this template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="admin@example.com"
              data-testid="input-test-email"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestEmailOpen(false)}
              data-testid="button-cancel-test"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || testEmailMutation.isPending}
              data-testid="button-send-test"
            >
              {testEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
