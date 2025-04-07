import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDeceasedPatientSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface RegistrationFormProps {
  onComplete: () => void;
  patientId?: number; // For editing existing patient
}

// Extend the schema with custom validations
const formSchema = insertDeceasedPatientSchema
  .omit({
    registeredById: true,
    registrationDate: true,
  })
  .extend({
    dateOfDeath: z.string().min(1, "Date of death is required"), // Changed from Date to string for form handling
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegistrationForm({ onComplete, patientId }: RegistrationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch storage units for assignment
  const { data: storageUnits } = useQuery({
    queryKey: ["/api/storage-units"],
  });
  
  const availableUnits = storageUnits?.filter(unit => unit.status === "available") || [];
  
  // Fetch patient data if editing
  const { data: existingPatient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });
  
  // Generate MR number
  const generateMrNumber = () => {
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `MR-${currentYear}-${randomNum}`;
  };
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mrNumber: generateMrNumber(),
      fullName: "",
      age: 0,
      gender: "male",
      dateOfDeath: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      causeOfDeath: "",
      wardFrom: "",
      attendingPhysician: "",
      notes: "",
      status: "registered",
      documents: [],
    },
  });
  
  // Set form values when editing
  React.useEffect(() => {
    if (existingPatient) {
      try {
        // Try to format the date properly, with error handling
        const dateObj = new Date(existingPatient.dateOfDeath);
        // Check if date is valid before formatting
        const dateOfDeath = !isNaN(dateObj.getTime()) 
          ? format(dateObj, "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"); // Fallback to current date/time
        
        form.reset({
          ...existingPatient,
          dateOfDeath,
        });
      } catch (error) {
        console.error("Error formatting date:", error);
        // Use current date as fallback if there's an error
        const currentDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");
        form.reset({
          ...existingPatient,
          dateOfDeath: currentDate,
        });
      }
    }
  }, [existingPatient, form]);
  
  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string date to ISO string
      const formattedValues = {
        ...values,
        dateOfDeath: new Date(values.dateOfDeath).toISOString(),
      };
      
      const res = await apiRequest("POST", "/api/patients", formattedValues);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Patient registered successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Create storage assignment if specified
      if (form.getValues("status") !== "registered") {
        createStorageAssignment(data.id);
      } else {
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to register patient: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string date to ISO string
      const formattedValues = {
        ...values,
        dateOfDeath: new Date(values.dateOfDeath).toISOString(),
      };
      
      const res = await apiRequest("PATCH", `/api/patients/${patientId}`, formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update patient: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Create storage assignment
  const storageAssignmentMutation = useMutation({
    mutationFn: async ({ deceasedId, storageUnitId }: { deceasedId: number; storageUnitId: number }) => {
      const res = await apiRequest("POST", "/api/storage-assignments", {
        deceasedId,
        storageUnitId,
        status: "active"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Storage assigned successfully",
      });
      
      // Invalidate storage queries
      queryClient.invalidateQueries({ queryKey: ["/api/storage-units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage-assignments"] });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign storage: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const createStorageAssignment = (deceasedId: number) => {
    // Get the storage unit ID from the selected unit
    const selectedUnit = form.getValues("storageUnitId");
    
    if (selectedUnit) {
      storageAssignmentMutation.mutate({
        deceasedId,
        storageUnitId: Number(selectedUnit)
      });
    } else {
      onComplete();
    }
  };
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (patientId) {
      updatePatientMutation.mutate(values);
    } else {
      createPatientMutation.mutate(values);
    }
  };
  
  if (isLoadingPatient) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{patientId ? "Edit Patient" : "New Patient Registration"}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="mrNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateOfDeath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time of Death</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Full Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="wardFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Hospital Ward</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="General Ward">General Ward</SelectItem>
                      <SelectItem value="Cardiac Unit">Cardiac Unit</SelectItem>
                      <SelectItem value="External/Other">External/Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="causeOfDeath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cause of Death</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Primary cause of death" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="attendingPhysician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attending Physician</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doctor's name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="pending_autopsy">Pending Autopsy</SelectItem>
                      <SelectItem value="autopsy_completed">Autopsy Completed</SelectItem>
                      <SelectItem value="pending_release">Pending Release</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="unclaimed">Unclaimed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("status") !== "registered" && (
              <FormField
                control={form.control}
                name="storageUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Storage Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select available unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.length > 0 ? (
                          availableUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.unitNumber} ({unit.section})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No available units</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      {...field} 
                      placeholder="Any additional information"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                createPatientMutation.isPending || 
                updatePatientMutation.isPending || 
                storageAssignmentMutation.isPending
              }
            >
              {(createPatientMutation.isPending || updatePatientMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {patientId ? "Update Patient" : "Register Patient"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
