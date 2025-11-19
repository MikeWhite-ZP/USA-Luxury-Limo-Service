import { useState, useEffect } from "react";
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
import { Loader2, Save, RotateCcw, Mail, Info, Code, Eye, Bold, Italic, Strikethrough, List, ListOrdered, Link2, Image as ImageIcon, Heading1, Heading2, Heading3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [htmlSource, setHtmlSource] = useState("");

  // Fetch template data
  const { data: template, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/email-templates", templateSlug],
    enabled: !!templateSlug,
  });

  // Tiptap editor for WYSIWYG editing
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 border rounded-md',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlSource(html);
      form.setValue('body', html);
    },
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

  // Sync template body with editor
  useEffect(() => {
    if (template?.body && editor) {
      editor.commands.setContent(template.body);
      setHtmlSource(template.body);
    }
  }, [template, editor]);

  // Handle mode switch between visual and HTML
  const handleModeSwitch = (mode: "visual" | "html") => {
    if (mode === "html" && editor) {
      // Switch to HTML mode - get current HTML from editor
      const html = editor.getHTML();
      setHtmlSource(html);
      form.setValue('body', html);
    } else if (mode === "visual" && editor) {
      // Switch to visual mode - get HTML from form (most up-to-date) and set to editor
      const currentHtml = form.getValues('body') || htmlSource;
      editor.commands.setContent(currentHtml);
      setHtmlSource(currentHtml);
    }
    setEditorMode(mode);
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      const res = await apiRequest("PUT", `/api/admin/email-templates/${templateSlug}`, data);
      return res.json();
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
      const res = await apiRequest("POST", `/api/admin/email-templates/${templateSlug}/reset`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates", templateSlug] });
      if (editor) {
        editor.commands.setContent(data.body);
      }
      setHtmlSource(data.body);
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
      const res = await apiRequest("POST", `/api/admin/email-templates/${templateSlug}/test`, { toEmail: email });
      return res.json();
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

  // Toolbar helper functions
  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setColor = () => {
    if (!editor) return;
    const color = window.prompt('Enter text color (e.g., #ff0000 or red)');
    if (color) {
      editor.chain().focus().setColor(color).run();
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
              <Label htmlFor="body" data-testid="label-template-body">Email Body</Label>
              
              <Tabs value={editorMode} onValueChange={(value) => handleModeSwitch(value as "visual" | "html")} className="mt-2">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="visual" data-testid="tab-visual">
                    <Eye className="w-4 h-4 mr-2" />
                    Visual Editor
                  </TabsTrigger>
                  <TabsTrigger value="html" data-testid="tab-html">
                    <Code className="w-4 h-4 mr-2" />
                    HTML Source
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="mt-4">
                  {editor && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      {/* Toolbar */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 p-3 flex flex-wrap gap-1">
                        {/* Text Formatting */}
                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('bold') ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleBold().run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-bold"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('italic') ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleItalic().run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-italic"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('strike') ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleStrike().run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-strikethrough"
                        >
                          <Strikethrough className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-9 bg-slate-300 mx-1" />

                        {/* Headings */}
                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-h1"
                        >
                          <Heading1 className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-h2"
                        >
                          <Heading2 className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-h3"
                        >
                          <Heading3 className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-9 bg-slate-300 mx-1" />

                        {/* Lists */}
                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleBulletList().run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-bullet-list"
                        >
                          <List className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                          onClick={() => editor.chain().focus().toggleOrderedList().run()}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-ordered-list"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-9 bg-slate-300 mx-1" />

                        {/* Link & Image */}
                        <Button
                          type="button"
                          size="sm"
                          variant={editor.isActive('link') ? 'default' : 'outline'}
                          onClick={setLink}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-link"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addImage}
                          className="h-9 w-9 p-0"
                          data-testid="toolbar-image"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-9 bg-slate-300 mx-1" />

                        {/* Color */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={setColor}
                          className="h-9 px-3"
                          data-testid="toolbar-text-color"
                        >
                          <span className="text-xs font-medium">Text Color</span>
                        </Button>
                      </div>

                      {/* Editor Content */}
                      <EditorContent editor={editor} className="bg-white" data-testid="wysiwyg-editor" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Use the toolbar to format your email. Variables like {"{{variable_name}}"} will be automatically replaced when sending.
                  </p>
                </TabsContent>
                
                <TabsContent value="html" className="mt-4">
                  <Textarea
                    id="body"
                    value={htmlSource}
                    onChange={(e) => {
                      setHtmlSource(e.target.value);
                      form.setValue('body', e.target.value);
                    }}
                    placeholder="Email HTML content (you can use variables like {{user_name}})"
                    className="font-mono text-sm min-h-[400px]"
                    data-testid="textarea-html-source"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Edit the HTML source directly. Variables should be wrapped in double curly braces like {"{{variable_name}}"}.
                  </p>
                </TabsContent>
              </Tabs>
              
              {form.formState.errors.body && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
              )}
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
