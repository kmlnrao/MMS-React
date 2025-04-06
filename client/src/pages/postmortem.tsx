import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Postmortem, DeceasedPatient, User } from "@shared/schema";
import { Loader2, Plus, Calendar, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Postmortem() {
  const { toast } = useToast();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedPostmortem, setSelectedPostmortem] = useState<Postmortem | null>(null);
  
  // Load data
  const { data: postmortems, isLoading: isLoadingPostmortems } = useQuery<Postmortem[]>({
    queryKey: ["/api/postmortems"],
  });
  
  const { data: patients, isLoading: isLoadingPatients } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Available patients for scheduling (those without a postmortem)
  const availablePatients = patients?.filter(patient => 
    !postmortems?.some(p => p.deceasedId === patient.id)
  );
  
  // Schedule form schema
  const scheduleFormSchema = z.object({
    deceasedId: z.number({
      required_error: "Please select a patient",
    }),
    scheduledDate: z.string().min(1, "Please select a date and time"),
    assignedToId: z.number({
      required_error: "Please select a medical examiner",
    }),
    isForensic: z.boolean().default(false),
    notes: z.string().optional(),
    status: z.string().default("scheduled"),
  });
  
  // Update form schema
  const updateFormSchema = z.object({
    findings: z.string().min(1, "Findings are required"),
    status: z.enum(["in_progress", "completed", "cancelled"]),
    completedDate: z.string().optional(),
    notes: z.string().optional(),
  });
  
  // Create forms
  const scheduleForm = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      isForensic: false,
      status: "scheduled",
    },
  });
  
  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      findings: "",
      status: "in_progress",
    },
  });
  
  // Set form values when editing
  React.useEffect(() => {
    if (selectedPostmortem) {
      updateForm.reset({
        findings: selectedPostmortem.findings || "",
        status: selectedPostmortem.status === "scheduled" ? "in_progress" : selectedPostmortem.status,
        completedDate: selectedPostmortem.completedDate 
          ? format(new Date(selectedPostmortem.completedDate), "yyyy-MM-dd'T'HH:mm") 
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: selectedPostmortem.notes || "",
      });
    }
  }, [selectedPostmortem, updateForm]);
  
  // Schedule postmortem mutation
  const schedulePostmortemMutation = useMutation({
    mutationFn: async (values: z.infer<typeof scheduleFormSchema>) => {
      const formattedValues = {
        ...values,
        scheduledDate: new Date(values.scheduledDate).toISOString(),
      };
      
      const res = await apiRequest("POST", "/api/postmortems", formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Postmortem scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/postmortems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowScheduleDialog(false);
      scheduleForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule postmortem: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update postmortem mutation
  const updatePostmortemMutation = useMutation({
    mutationFn: async (values: z.infer<typeof updateFormSchema>) => {
      if (!selectedPostmortem) return;
      
      const formattedValues = {
        ...values,
        completedDate: values.status === "completed" && values.completedDate
          ? new Date(values.completedDate).toISOString()
          : undefined,
      };
      
      const res = await apiRequest("PATCH", `/api/postmortems/${selectedPostmortem.id}`, formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Postmortem updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/postmortems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowUpdateDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update postmortem: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onScheduleSubmit = (values: z.infer<typeof scheduleFormSchema>) => {
    schedulePostmortemMutation.mutate(values);
  };
  
  const onUpdateSubmit = (values: z.infer<typeof updateFormSchema>) => {
    updatePostmortemMutation.mutate(values);
  };
  
  const handleUpdatePostmortem = (postmortem: Postmortem) => {
    setSelectedPostmortem(postmortem);
    setShowUpdateDialog(true);
  };
  
  // Column definitions for postmortems
  const postmortemsColumns: ColumnDef<Postmortem & { patient?: DeceasedPatient, assignedTo?: User }>[] = [
    {
      accessorKey: "deceasedId",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original.patient;
        return patient ? (
          <div>
            <div className="font-medium">{patient.fullName}</div>
            <div className="text-xs text-gray-500">{patient.mrNumber}</div>
          </div>
        ) : `ID: ${row.original.deceasedId}`;
      },
    },
    {
      accessorKey: "scheduledDate",
      header: "Scheduled Date",
      cell: ({ row }) => {
        const date = row.original.scheduledDate;
        return date ? format(new Date(date), "MMM d, yyyy 'at' h:mm a") : "Not scheduled";
      },
    },
    {
      accessorKey: "assignedToId",
      header: "Assigned To",
      cell: ({ row }) => {
        const user = row.original.assignedTo;
        return user ? user.fullName : "Unassigned";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "isForensic",
      header: "Type",
      cell: ({ row }) => row.original.isForensic ? "Forensic" : "Standard",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const postmortem = row.original;
        
        // Actions based on status
        if (postmortem.status === "scheduled") {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent"
              onClick={() => handleUpdatePostmortem(postmortem)}
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              Start
            </Button>
          );
        } else if (postmortem.status === "in_progress") {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-success"
              onClick={() => handleUpdatePostmortem(postmortem)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          );
        } else {
          return (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleUpdatePostmortem(postmortem)}
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              View
            </Button>
          );
        }
      },
    },
  ];
  
  // Prepare postmortem data with patient and user information
  const postmortemsWithDetails = postmortems?.map(postmortem => {
    const patient = patients?.find(p => p.id === postmortem.deceasedId);
    const assignedTo = users?.find(u => u.id === postmortem.assignedToId);
    return { ...postmortem, patient, assignedTo };
  }) || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Postmortem Management</h1>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Postmortem
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Postmortems</CardTitle>
              <CardDescription>View and manage all postmortem examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPostmortems || isLoadingPatients || isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={postmortemsColumns} 
                  data={postmortemsWithDetails} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Postmortems</CardTitle>
              <CardDescription>Upcoming postmortem examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPostmortems || isLoadingPatients || isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={postmortemsColumns} 
                  data={postmortemsWithDetails.filter(p => p.status === "scheduled")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="in_progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Postmortem examinations currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPostmortems || isLoadingPatients || isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={postmortemsColumns} 
                  data={postmortemsWithDetails.filter(p => p.status === "in_progress")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Completed postmortem examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPostmortems || isLoadingPatients || isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={postmortemsColumns} 
                  data={postmortemsWithDetails.filter(p => p.status === "completed")} 
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Schedule Postmortem Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Postmortem</DialogTitle>
            <DialogDescription>Schedule a new postmortem examination</DialogDescription>
          </DialogHeader>
          
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="deceasedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePatients && availablePatients.length > 0 ? (
                          availablePatients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.fullName} ({patient.mrNumber})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No available patients</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={scheduleForm.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={scheduleForm.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medical examiner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users && users.length > 0 ? (
                          users
                            .filter(user => user.role === "medical_staff" || user.role === "admin")
                            .map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="" disabled>No staff available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={scheduleForm.control}
                name="isForensic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        This is a forensic examination
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={scheduleForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or instructions"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowScheduleDialog(false);
                    scheduleForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={schedulePostmortemMutation.isPending}
                >
                  {schedulePostmortemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Update Postmortem Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPostmortem?.status === "scheduled" ? "Start Postmortem" : 
               selectedPostmortem?.status === "in_progress" ? "Complete Postmortem" : 
               "Postmortem Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedPostmortem?.patient ? 
                `Patient: ${selectedPostmortem.patient.fullName} (${selectedPostmortem.patient.mrNumber})` : 
                "Update postmortem details"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Findings</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed examination findings"
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {updateForm.watch("status") === "completed" && (
                <FormField
                  control={updateForm.control}
                  name="completedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={updateForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={selectedPostmortem?.status === "completed" || selectedPostmortem?.status === "cancelled"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                >
                  Close
                </Button>
                {(selectedPostmortem?.status !== "completed" && selectedPostmortem?.status !== "cancelled") && (
                  <Button
                    type="submit"
                    disabled={updatePostmortemMutation.isPending}
                  >
                    {updatePostmortemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {updateForm.watch("status") === "completed" ? "Complete" : 
                     updateForm.watch("status") === "cancelled" ? "Cancel" : "Update"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
