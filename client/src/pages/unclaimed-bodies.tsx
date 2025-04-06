import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { DeceasedPatient, Task } from "@shared/schema";
import { 
  Loader2, 
  AlertTriangle, 
  Clock,
  Phone,
  FileText,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import StatusBadge from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

export default function UnclaimedBodies() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DeceasedPatient | null>(null);
  
  // Load data
  const { data: patients, isLoading: isLoadingPatients } = useQuery<DeceasedPatient[]>({
    queryKey: ["/api/patients"],
  });
  
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter unclaimed bodies
  const unclaimedBodies = patients?.filter(patient => patient.status === "unclaimed") || [];
  
  // Find unclaimed bodies in date ranges
  const getUnclaimedInRange = (days: number) => {
    return unclaimedBodies.filter(patient => {
      const daysSinceRegistration = differenceInDays(
        new Date(), 
        new Date(patient.registrationDate)
      );
      return daysSinceRegistration <= days;
    });
  };
  
  // Create task form schema
  const taskFormSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    assignedToId: z.number().optional(),
    priority: z.enum(["urgent", "medium", "routine"]),
    dueDate: z.string().min(1, "Due date is required"),
    relatedEntityType: z.literal("deceased"),
    relatedEntityId: z.number(),
  });
  
  // Contact authorities form schema
  const contactFormSchema = z.object({
    authorityType: z.enum(["police", "social_services", "medical_examiner", "other"]),
    contactPerson: z.string().min(3, "Contact person must be at least 3 characters"),
    contactDetails: z.string().min(5, "Contact details must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
    notesAndOutcome: z.string().optional(),
  });
  
  // Create forms
  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"), // Tomorrow
      relatedEntityType: "deceased",
    },
  });
  
  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      authorityType: "police",
      contactPerson: "",
      contactDetails: "",
      message: "",
      notesAndOutcome: "",
    },
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (values: z.infer<typeof taskFormSchema>) => {
      // Format the due date
      const formattedValues = {
        ...values,
        dueDate: new Date(values.dueDate).toISOString(),
        status: "pending",
      };
      
      const res = await apiRequest("POST", "/api/tasks", formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowTaskDialog(false);
      taskForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const onTaskSubmit = (values: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(values);
  };
  
  const onContactSubmit = (values: z.infer<typeof contactFormSchema>) => {
    // In a real implementation, this would call an API to record the contact attempt
    // and potentially send emails or SMS messages
    
    // For now, create a task to document this contact
    const taskData = {
      title: `Contact with ${values.authorityType} regarding unclaimed body`,
      description: `Contacted ${values.contactPerson} (${values.authorityType}) about patient ${selectedPatient?.fullName}. ${values.notesAndOutcome ? `Outcome: ${values.notesAndOutcome}` : ''}`,
      priority: "medium" as const,
      dueDate: format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd'T'HH:mm"), // 1 week follow-up
      relatedEntityType: "deceased" as const,
      relatedEntityId: selectedPatient!.id,
      status: "pending" as const,
    };
    
    createTaskMutation.mutate(taskData);
    setShowContactDialog(false);
    contactForm.reset();
    
    toast({
      title: "Contact Logged",
      description: "The contact attempt has been documented.",
    });
  };
  
  const handleCreateTask = (patient: DeceasedPatient) => {
    setSelectedPatient(patient);
    taskForm.setValue("relatedEntityId", patient.id);
    taskForm.setValue("title", `Follow up on unclaimed body: ${patient.mrNumber}`);
    taskForm.setValue("description", `Follow up on unclaimed patient: ${patient.fullName} (${patient.mrNumber})`);
    setShowTaskDialog(true);
  };
  
  const handleContactAuthorities = (patient: DeceasedPatient) => {
    setSelectedPatient(patient);
    // Pre-fill message with patient details
    contactForm.setValue("message", 
      `This is regarding an unclaimed deceased patient at our facility:\n\n` +
      `Patient ID: ${patient.mrNumber}\n` +
      `Name: ${patient.fullName}\n` +
      `Age/Gender: ${patient.age}y, ${patient.gender}\n` +
      `Date of Death: ${format(new Date(patient.dateOfDeath), "MMMM d, yyyy")}\n` +
      `Cause of Death: ${patient.causeOfDeath}\n\n` +
      `The body has been unclaimed since ${format(new Date(patient.registrationDate), "MMMM d, yyyy")}. ` +
      `We are seeking assistance in identifying next of kin or determining appropriate disposition.`
    );
    setShowContactDialog(true);
  };
  
  // Column definitions for unclaimed bodies
  const unclaimedColumns: ColumnDef<DeceasedPatient>[] = [
    {
      accessorKey: "mrNumber",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("mrNumber")}</span>,
    },
    {
      accessorKey: "fullName",
      header: "Patient",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("fullName")}</div>
          <div className="text-xs text-gray-500">
            {row.original.age}y, {row.original.gender === 'male' ? 'Male' : row.original.gender === 'female' ? 'Female' : 'Other'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "registrationDate",
      header: "Unclaimed Since",
      cell: ({ row }) => {
        const date = new Date(row.getValue("registrationDate"));
        const days = differenceInDays(new Date(), date);
        return (
          <div>
            <div className="text-sm">{format(date, "MMM d, yyyy")}</div>
            <div className={`text-xs ${days > 21 ? "text-error" : days > 14 ? "text-warning" : "text-gray-500"}`}>
              {days} days
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "wardFrom",
      header: "Origin",
      cell: ({ row }) => row.getValue("wardFrom"),
    },
    {
      accessorKey: "causeOfDeath",
      header: "Cause of Death",
      cell: ({ row }) => {
        const cause = row.getValue("causeOfDeath") as string;
        return cause.length > 30 ? `${cause.substring(0, 30)}...` : cause;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original;
        const days = differenceInDays(new Date(), new Date(patient.registrationDate));
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent"
              onClick={() => handleContactAuthorities(patient)}
            >
              <Phone className="h-4 w-4 mr-1" />
              Contact
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={days > 21 ? "text-error" : "text-warning"}
              onClick={() => handleCreateTask(patient)}
            >
              <Clock className="h-4 w-4 mr-1" />
              Follow-up
            </Button>
          </div>
        );
      },
    },
  ];
  
  // Tasks related to unclaimed bodies
  const unclaimedTasks = tasks?.filter(task => 
    task.relatedEntityType === "deceased" && 
    task.status !== "completed" &&
    unclaimedBodies.some(patient => patient.id === task.relatedEntityId)
  ) || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-primary">Unclaimed Bodies Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-error" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/patients"] })}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            {unclaimedBodies.filter(p => 
              differenceInDays(new Date(), new Date(p.registrationDate)) > 21
            ).length} Legal Limit Approaching
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Unclaimed</CardTitle>
            <CardDescription>All unclaimed bodies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingPatients ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                unclaimedBodies.length
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Approaching Limit</CardTitle>
            <CardDescription>More than 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {isLoadingPatients ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                unclaimedBodies.filter(p => 
                  differenceInDays(new Date(), new Date(p.registrationDate)) > 14 &&
                  differenceInDays(new Date(), new Date(p.registrationDate)) <= 21
                ).length
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Legal Concern</CardTitle>
            <CardDescription>More than 21 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-error">
              {isLoadingPatients ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                unclaimedBodies.filter(p => 
                  differenceInDays(new Date(), new Date(p.registrationDate)) > 21
                ).length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Unclaimed</TabsTrigger>
          <TabsTrigger value="recent">Recent (0-14 days)</TabsTrigger>
          <TabsTrigger value="approaching">Approaching Limit (15-21 days)</TabsTrigger>
          <TabsTrigger value="critical">Critical ({'>'}21 days)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Unclaimed Bodies</CardTitle>
              <CardDescription>All deceased patients with unclaimed status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={unclaimedColumns} 
                  data={unclaimedBodies} 
                  searchColumn="fullName"
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
          
          {/* Follow-up Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Follow-up Tasks</CardTitle>
                <CardDescription>Tasks related to unclaimed bodies</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                View All Tasks <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : unclaimedTasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No active tasks for unclaimed bodies
                </div>
              ) : (
                <div className="space-y-4">
                  {unclaimedTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="border rounded-lg p-4 bg-neutral-light bg-opacity-30">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === "urgent" ? "bg-error bg-opacity-10 text-error" :
                          task.priority === "medium" ? "bg-warning bg-opacity-10 text-warning" :
                          "bg-info bg-opacity-10 text-info"
                        }`}>
                          {task.priority === "urgent" ? "Urgent" : 
                           task.priority === "medium" ? "Medium" : "Routine"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Due: {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "Not set"}</span>
                        <span>Assigned to: {task.assignedToId ? `Staff #${task.assignedToId}` : "Unassigned"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Unclaimed (0-14 days)</CardTitle>
              <CardDescription>Bodies unclaimed for less than 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={unclaimedColumns} 
                  data={unclaimedBodies.filter(p => 
                    differenceInDays(new Date(), new Date(p.registrationDate)) <= 14
                  )} 
                  searchColumn="fullName"
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approaching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approaching Limit (15-21 days)</CardTitle>
              <CardDescription>Bodies approaching legal time limit</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={unclaimedColumns} 
                  data={unclaimedBodies.filter(p => {
                    const days = differenceInDays(new Date(), new Date(p.registrationDate));
                    return days > 14 && days <= 21;
                  })} 
                  searchColumn="fullName"
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical ({'>'}21 days)</CardTitle>
              <CardDescription>Bodies exceeding recommended retention period</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <DataTable 
                  columns={unclaimedColumns} 
                  data={unclaimedBodies.filter(p => 
                    differenceInDays(new Date(), new Date(p.registrationDate)) > 21
                  )} 
                  searchColumn="fullName"
                  searchPlaceholder="Search by patient name..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Follow-up Task</DialogTitle>
            <DialogDescription>
              {selectedPatient && 
                `Create a follow-up task for ${selectedPatient.fullName} (${selectedPatient.mrNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="routine">Routine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={taskForm.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {user && (
                          <SelectItem value={user.id.toString()}>
                            {user.fullName} (You)
                          </SelectItem>
                        )}
                        {/* In a real implementation, there would be a list of staff members here */}
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
                  onClick={() => setShowTaskDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Contact Authorities Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Authorities</DialogTitle>
            <DialogDescription>
              {selectedPatient && 
                `Contact authorities regarding ${selectedPatient.fullName} (${selectedPatient.mrNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="authorityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="police">Police Department</SelectItem>
                        <SelectItem value="social_services">Social Services</SelectItem>
                        <SelectItem value="medical_examiner">Medical Examiner</SelectItem>
                        <SelectItem value="other">Other Authority</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name of person contacted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="contactDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Details</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Phone number, email, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message/Information Shared</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="notesAndOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes & Outcome</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Results of the communication" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Contact
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Guidelines Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Unclaimed Body Guidelines</CardTitle>
          <CardDescription>Legal and procedural guidelines for handling unclaimed bodies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>Legal Retention Periods</h4>
            <ul>
              <li><strong>0-14 days:</strong> Standard retention period for next of kin identification</li>
              <li><strong>15-21 days:</strong> Extended retention, requires management approval and active search for relatives</li>
              <li><strong>Beyond 21 days:</strong> Requires legal consultation and coordination with local authorities</li>
            </ul>
            
            <h4>Required Documentation</h4>
            <ul>
              <li>All contact attempts must be documented with date, time, and outcome</li>
              <li>A minimum of three contact attempts to different authorities is required before disposition</li>
              <li>Photographs and personal effects inventory must be maintained for at least 3 years</li>
            </ul>
            
            <h4>Disposition Options</h4>
            <ul>
              <li>Transfer to medical school (requires proper legal paperwork)</li>
              <li>Public burial through municipal services</li>
              <li>Cremation (requires approval from medical director and legal counsel)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
