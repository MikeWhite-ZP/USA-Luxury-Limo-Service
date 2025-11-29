import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Database, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DatabaseURLInfo {
  hasValue: boolean;
  fromDatabase: boolean;
  fromEnv: boolean;
  hasEncryptionKey: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export function DatabaseURLSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const { data: dbInfo, isLoading } = useQuery<DatabaseURLInfo>({
    queryKey: ['/api/admin/database-url'],
  });

  const updateMutation = useMutation({
    mutationFn: async (newUrl: string) => {
      const response = await apiRequest('POST', '/api/admin/database-url', { databaseUrl: newUrl });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update DATABASE_URL');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Database URL Updated",
        description: data.message || "Changes will take effect after application restart",
      });
      setDatabaseUrl("");
      setShowUrl(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-url'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update DATABASE_URL",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/database-url');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete DATABASE_URL');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Database URL Removed",
        description: data.message || "Application will use environment variable on next restart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-url'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete DATABASE_URL",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a database URL",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(databaseUrl);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to remove the DATABASE_URL setting? The application will use the environment variable on next restart.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <Card data-testid="database-url-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database URL Configuration
        </CardTitle>
        <CardDescription>
          Manage your PostgreSQL database connection URL for VPS/Coolify deployments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encryption Key Setup Alert */}
        {!dbInfo?.hasEncryptionKey && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200 space-y-2">
              <div>
                <strong>Setup Required:</strong> The encryption key is not configured. Follow these steps to enable DATABASE_URL management:
              </div>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                <li>Click on <strong>"Tools"</strong> in the left sidebar</li>
                <li>Select <strong>"Secrets"</strong></li>
                <li>Click <strong>"+ New Secret"</strong></li>
                <li>Add a secret with:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>Key:</strong> <code className="bg-red-100 dark:bg-red-900 px-1 rounded">SETTINGS_ENCRYPTION_KEY</code></li>
                    <li><strong>Value:</strong> Generate a 32-byte key using: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</code></li>
                  </ul>
                </li>
                <li>Click <strong>"Add secret"</strong> and restart the application</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        {dbInfo?.hasEncryptionKey && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Important:</strong> Changes to DATABASE_URL require an application restart to take effect. 
              The connection string is encrypted and stored securely.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <div className="space-y-2">
          <Label>Current Status</Label>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md border">
            {dbInfo?.fromDatabase ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ Database URL configured in settings (encrypted)
                </p>
                {dbInfo.updatedAt && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Last updated: {new Date(dbInfo.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : dbInfo?.fromEnv ? (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Using DATABASE_URL from environment variable
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No DATABASE_URL configured
              </p>
            )}
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database-url">
              PostgreSQL Connection String
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="database-url"
                  type={showUrl ? "text" : "password"}
                  placeholder="postgres://user:password@host:5432/database"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  className="font-mono text-sm pr-10"
                  data-testid="input-database-url"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowUrl(!showUrl)}
                  data-testid="button-toggle-visibility"
                >
                  {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Format: postgres://username:password@host:port/database
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!dbInfo?.hasEncryptionKey || updateMutation.isPending || !databaseUrl.trim()}
              data-testid="button-save-database-url"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Database URL"}
            </Button>

            {dbInfo?.fromDatabase && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={!dbInfo?.hasEncryptionKey || deleteMutation.isPending}
                data-testid="button-delete-database-url"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? "Removing..." : "Remove Override"}
              </Button>
            )}
          </div>
        </form>

        {/* Info Section */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">How It Works</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>DATABASE_URL is stored encrypted using AES-256-GCM</li>
            <li>The application uses environment variable by default</li>
            <li>Database override takes precedence when configured</li>
            <li>Application restart required for changes to take effect</li>
            <li>Useful for VPS/Coolify deployments where you manage the connection centrally</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
