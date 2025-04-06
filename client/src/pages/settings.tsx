import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageUnit, SystemAlert } from "@shared/schema";
import { 
  Loader2, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Bell,
  Thermometer,
  RefreshCw,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user has the right role
  if (user && user.role !== "admin" && user.role !== "mortuary_staff") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <AlertTriangle className="w-12 h-12 text-error mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access settings.</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">System Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="alerts">Alert Configuration</TabsTrigger>
          <TabsTrigger value="storage">Storage Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <AlertSettings />
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4">
          <StorageSettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function GeneralSettings() {
  const { toast } = useToast();
  const [hospitalName, setHospitalName] = useState("Memorial Hospital");
  const [mortuaryDepartment, setMortuaryDepartment] = useState("Mortuary Services");
  const [contactEmail, setContactEmail] = useState("mortuary@memorialhospital.org");
  const [contactPhone, setContactPhone] = useState("(555) 123-4567");
  const [legalReleaseDeadline, setLegalReleaseDeadline] = useState("21");
  
  const handleSaveGeneral = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Settings saved",
      description: "General settings have been updated successfully.",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Basic configuration for the mortuary management system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hospital-name">Hospital Name</Label>
            <Input 
              id="hospital-name" 
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mortuary-department">Department Name</Label>
            <Input 
              id="mortuary-department" 
              value={mortuaryDepartment}
              onChange={(e) => setMortuaryDepartment(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input 
              id="contact-email" 
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input 
              id="contact-phone" 
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Legal Compliance Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="release-deadline">
                Unclaimed Body Retention Period (Days)
              </Label>
              <Input 
                id="release-deadline" 
                type="number"
                value={legalReleaseDeadline}
                onChange={(e) => setLegalReleaseDeadline(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Number of days before legal action is required for unclaimed bodies
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveGeneral}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

function AlertSettings() {
  const { toast } = useToast();
  const [temperatureThreshold, setTemperatureThreshold] = useState("6.0");
  const [temperatureCheck, setTemperatureCheck] = useState("30");
  const [retentionWarning, setRetentionWarning] = useState("14");
  const [retentionCritical, setRetentionCritical] = useState("21");
  
  const [showAddAlertDialog, setShowAddAlertDialog] = useState(false);
  
  // Load alerts
  const { data: alerts, isLoading } = useQuery<SystemAlert[]>({
    queryKey: ["/api/alerts"],
  });
  
  const handleSaveAlerts = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Alert settings saved",
      description: "Alert configuration has been updated successfully.",
    });
  };
  
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, { status: "acknowledged" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert acknowledged",
        description: "The alert has been acknowledged successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to acknowledge alert: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const resolveAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, { status: "resolved" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to resolve alert: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateAlert = () => {
    // Close dialog - in a real implementation this would create a new alert
    setShowAddAlertDialog(false);
    toast({
      title: "Test alert created",
      description: "A test alert has been created successfully.",
    });
  };
  
  const handleAcknowledgeAlert = (id: number) => {
    acknowledgeAlertMutation.mutate(id);
  };
  
  const handleResolveAlert = (id: number) => {
    resolveAlertMutation.mutate(id);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>Configure system alert thresholds and triggers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp-threshold">
                Temperature Alert Threshold (°C)
              </Label>
              <Input 
                id="temp-threshold" 
                type="number"
                value={temperatureThreshold}
                onChange={(e) => setTemperatureThreshold(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Trigger alert when storage temperature exceeds this value
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temp-check">
                Temperature Check Interval (minutes)
              </Label>
              <Input 
                id="temp-check" 
                type="number"
                value={temperatureCheck}
                onChange={(e) => setTemperatureCheck(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                How often temperature checks are performed
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retention-warning">
                Retention Warning Threshold (days)
              </Label>
              <Input 
                id="retention-warning" 
                type="number"
                value={retentionWarning}
                onChange={(e) => setRetentionWarning(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Show warning alert when unclaimed body reaches this many days
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retention-critical">
                Retention Critical Threshold (days)
              </Label>
              <Input 
                id="retention-critical" 
                type="number"
                value={retentionCritical}
                onChange={(e) => setRetentionCritical(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Show critical alert when unclaimed body reaches this many days
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveAlerts}>
            <Save className="w-4 h-4 mr-2" />
            Save Thresholds
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Alerts</CardTitle>
            <CardDescription>Manage system alerts and notifications</CardDescription>
          </div>
          <Button onClick={() => setShowAddAlertDialog(true)}>
            <Bell className="w-4 h-4 mr-2" />
            Create Test Alert
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts && alerts.length > 0 ? (
                  alerts.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-xs text-gray-500">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>{alert.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          alert.severity === "critical" ? "bg-error bg-opacity-10 text-error" : 
                          alert.severity === "warning" ? "bg-warning bg-opacity-10 text-warning" : 
                          "bg-info bg-opacity-10 text-info"
                        }`}>
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(alert.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          alert.status === "active" ? "bg-error bg-opacity-10 text-error" : 
                          alert.status === "acknowledged" ? "bg-warning bg-opacity-10 text-warning" : 
                          "bg-success bg-opacity-10 text-success"
                        }`}>
                          {alert.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {alert.status === "active" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <Bell className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          {(alert.status === "active" || alert.status === "acknowledged") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No alerts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Create Alert Dialog */}
      <Dialog open={showAddAlertDialog} onOpenChange={setShowAddAlertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Test Alert</DialogTitle>
            <DialogDescription>Generate a test alert for system testing</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-type">Alert Type</Label>
              <Select defaultValue="temperature">
                <SelectTrigger>
                  <SelectValue placeholder="Select alert type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-severity">Severity</Label>
              <Select defaultValue="warning">
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-title">Alert Title</Label>
              <Input id="alert-title" defaultValue="Test Alert" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-message">Alert Message</Label>
              <Textarea 
                id="alert-message" 
                defaultValue="This is a test alert for system verification."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert}>
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StorageSettings() {
  const { toast } = useToast();
  const [autoAssign, setAutoAssign] = useState(true);
  const [defaultTemperature, setDefaultTemperature] = useState("4.0");
  const [maintenanceInterval, setMaintenanceInterval] = useState("30");
  
  // Load storage units
  const { data: storageUnits, isLoading } = useQuery<StorageUnit[]>({
    queryKey: ["/api/storage-units"],
  });
  
  const handleSaveStorage = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Storage settings have been updated successfully.",
    });
  };
  
  const handleBulkMaintenance = () => {
    // In a real implementation, this would schedule maintenance for all units
    toast({
      title: "Maintenance scheduled",
      description: "Scheduled maintenance has been set for all storage units.",
    });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Storage Configuration</CardTitle>
          <CardDescription>Configure storage unit settings and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-assign" 
              checked={autoAssign}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') setAutoAssign(checked);
              }}
            />
            <Label htmlFor="auto-assign">
              Automatically assign storage units when registering new deceased
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="default-temp">Default Temperature (°C)</Label>
              <Input 
                id="default-temp" 
                type="number"
                value={defaultTemperature}
                onChange={(e) => setDefaultTemperature(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Default temperature setting for new storage units
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenance-interval">Maintenance Interval (days)</Label>
              <Input 
                id="maintenance-interval" 
                type="number"
                value={maintenanceInterval}
                onChange={(e) => setMaintenanceInterval(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                How often storage units should undergo maintenance
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveStorage}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Storage Units Status</CardTitle>
            <CardDescription>Current status of all storage units</CardDescription>
          </div>
          <Button onClick={handleBulkMaintenance}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Schedule Bulk Maintenance
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit ID</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageUnits && storageUnits.length > 0 ? (
                  storageUnits.slice(0, 5).map(unit => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono">{unit.unitNumber}</TableCell>
                      <TableCell>{unit.section}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          unit.status === "available" ? "bg-success bg-opacity-10 text-success" : 
                          unit.status === "occupied" ? "bg-accent bg-opacity-10 text-accent" : 
                          "bg-warning bg-opacity-10 text-warning"
                        }`}>
                          {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{unit.temperature ? `${unit.temperature}°C` : "N/A"}</TableCell>
                      <TableCell>
                        {unit.lastMaintenance ? 
                          format(new Date(unit.lastMaintenance), "MMM d, yyyy") : 
                          "Never"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Temperature updated",
                                description: `Temperature for unit ${unit.unitNumber} has been updated.`,
                              });
                            }}
                          >
                            <Thermometer className="h-4 w-4 mr-1" />
                            Update Temp
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Maintenance scheduled",
                                description: `Maintenance for unit ${unit.unitNumber} has been scheduled.`,
                              });
                            }}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Maintenance
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No storage units found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {storageUnits && storageUnits.length > 5 && (
            <div className="mt-4 text-right">
              <Button variant="link">View All Storage Units</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NotificationSettings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  
  const [notifyTemperature, setNotifyTemperature] = useState(true);
  const [notifyStorage, setNotifyStorage] = useState(true);
  const [notifyUnclaimed, setNotifyUnclaimed] = useState(true);
  const [notifyMaintenance, setNotifyMaintenance] = useState(false);
  
  const [adminEmail, setAdminEmail] = useState("admin@memorialhospital.org");
  const [techEmail, setTechEmail] = useState("tech@memorialhospital.org");
  
  const handleSaveNotifications = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Notification settings have been updated successfully.",
    });
  };
  
  const handleTestNotification = () => {
    // In a real implementation, this would send a test notification
    toast({
      title: "Test notification sent",
      description: "A test notification has been sent to the configured channels.",
    });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Notification Methods</CardTitle>
          <CardDescription>Configure how notifications are delivered</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive alerts and notifications via email
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive urgent alerts via SMS text message
                </p>
              </div>
              <Switch 
                id="sms-notifications" 
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <p className="text-sm text-gray-500">
                  Show notifications in the web application
                </p>
              </div>
              <Switch 
                id="desktop-notifications" 
                checked={desktopNotifications}
                onCheckedChange={setDesktopNotifications}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-temperature" 
                  checked={notifyTemperature}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') setNotifyTemperature(checked);
                  }}
                />
                <Label htmlFor="notify-temperature">Temperature alerts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-storage" 
                  checked={notifyStorage}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') setNotifyStorage(checked);
                  }}
                />
                <Label htmlFor="notify-storage">Storage capacity alerts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-unclaimed" 
                  checked={notifyUnclaimed}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') setNotifyUnclaimed(checked);
                  }}
                />
                <Label htmlFor="notify-unclaimed">Unclaimed body retention alerts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-maintenance" 
                  checked={notifyMaintenance}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') setNotifyMaintenance(checked);
                  }}
                />
                <Label htmlFor="notify-maintenance">Maintenance reminders</Label>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Recipients</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator Email</Label>
                <Input 
                  id="admin-email" 
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Primary administrative contact
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tech-email">Technical Support Email</Label>
                <Input 
                  id="tech-email" 
                  type="email"
                  value={techEmail}
                  onChange={(e) => setTechEmail(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  For technical and maintenance alerts
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleTestNotification}>
            <Bell className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
          
          <Button onClick={handleSaveNotifications}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
          <CardDescription>Configure when notifications are sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Daily Summary Report</Label>
            <Select defaultValue="end_of_day">
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start_of_day">Start of day (8:00 AM)</SelectItem>
                <SelectItem value="mid_day">Mid-day (12:00 PM)</SelectItem>
                <SelectItem value="end_of_day">End of day (5:00 PM)</SelectItem>
                <SelectItem value="never">Don't send</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Daily summary of mortuary activity
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Weekly Report</Label>
            <Select defaultValue="friday">
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="never">Don't send</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Weekly comprehensive report
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Critical Alert Quiet Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="time" defaultValue="22:00" />
              <Input type="time" defaultValue="06:00" />
            </div>
            <p className="text-sm text-gray-500">
              Only send emergency alerts during quiet hours
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveNotifications}>
            <Save className="w-4 h-4 mr-2" />
            Save Schedule
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
