import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BodyReleaseRequest, DeceasedPatient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ReleaseApprovalProps {
  release: BodyReleaseRequest;
  patient: DeceasedPatient;
  onComplete: () => void;
}

// Define the form schema
const formSchema = z.object({
  identityVerified: z.boolean().refine(value => value, {
    message: "Identity verification is required",
  }),
  approvalStatus: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
  transferredTo: z.string().min(3, "Transfer destination is required"),
  releaseDate: z.string().min(1, "Release date is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReleaseApproval({ release, patient, onComplete }: ReleaseApprovalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identityVerified: release.identityVerified,
      approvalStatus: "approved",
      notes: release.notes || "",
      transferredTo: release.transferredTo || "",
      releaseDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });
  
  // Update release mutation
  const updateReleaseMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string date to ISO string
      const formattedValues = {
        ...values,
        releaseDate: new Date(values.releaseDate).toISOString(),
      };
      
      const res = await apiRequest("PATCH", `/api/releases/${release.id}`, formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Release request processed successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to process release: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    updateReleaseMutation.mutate(values);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Body Release Approval</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-neutral-light bg-opacity-50 p-4 rounded-md">
          <h3 className="font-medium text-lg mb-2">Patient Information</h3>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-gray-600">ID:</dt>
            <dd className="font-mono">{patient.mrNumber}</dd>
            
            <dt className="text-gray-600">Name:</dt>
            <dd>{patient.fullName}</dd>
            
            <dt className="text-gray-600">Age/Gender:</dt>
            <dd>{patient.age}y, {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}</dd>
            
            <dt className="text-gray-600">Date of Death:</dt>
            <dd>{format(new Date(patient.dateOfDeath), "MMM d, yyyy")}</dd>
            
            <dt className="text-gray-600">Cause:</dt>
            <dd>{patient.causeOfDeath}</dd>
          </dl>
        </div>
        
        <div className="bg-neutral-light bg-opacity-50 p-4 rounded-md">
          <h3 className="font-medium text-lg mb-2">Release Request Details</h3>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-gray-600">Requested By:</dt>
            <dd>Staff ID: {release.requestedById}</dd>
            
            <dt className="text-gray-600">Request Date:</dt>
            <dd>{format(new Date(release.requestDate), "MMM d, yyyy")}</dd>
            
            <dt className="text-gray-600">Next of Kin:</dt>
            <dd>{release.nextOfKinName}</dd>
            
            <dt className="text-gray-600">Relation:</dt>
            <dd>{release.nextOfKinRelation}</dd>
            
            <dt className="text-gray-600">Contact:</dt>
            <dd>{release.nextOfKinContact}</dd>
          </dl>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="identityVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm the identity of the next of kin has been verified
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="releaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Release Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="transferredTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Destination</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Funeral home or other entity" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      placeholder="Any additional information or special instructions"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => form.setValue("approvalStatus", "rejected")}
              disabled={updateReleaseMutation.isPending}
              className="px-6"
            >
              Reject Request
            </Button>
            <Button 
              type="submit" 
              disabled={updateReleaseMutation.isPending}
              className="px-6"
            >
              {updateReleaseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve Release
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
