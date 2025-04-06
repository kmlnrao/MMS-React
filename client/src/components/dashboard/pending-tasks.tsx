import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PendingTasksProps {
  tasks: Task[];
}

export default function PendingTasks({ tasks }: PendingTasksProps) {
  const { toast } = useToast();
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-error bg-opacity-10 text-error";
      case "medium":
        return "bg-warning bg-opacity-10 text-warning";
      case "routine":
        return "bg-info bg-opacity-10 text-info";
      default:
        return "bg-neutral-medium bg-opacity-10 text-neutral-dark";
    }
  };
  
  const handleTaskAction = (id: number) => {
    updateTaskMutation.mutate({ id, status: "in_progress" });
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-neutral-medium">
        <CardTitle>Pending Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-neutral-medium">
        {tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="p-4 hover:bg-neutral-light">
              <div className="flex justify-between mb-1">
                <h3 className="font-medium text-sm">{task.title}</h3>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", getPriorityBadgeColor(task.priority))}>
                  {task.priority === "urgent" ? "Urgent" : 
                   task.priority === "medium" ? "Medium" : "Routine"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{task.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Assigned to: {task.assignedToId ? `Staff #${task.assignedToId}` : 'Unassigned'}
                </span>
                <Button 
                  className="text-xs px-3 py-1 bg-accent text-white rounded-md hover:bg-accent-light"
                  onClick={() => handleTaskAction(task.id)}
                  disabled={updateTaskMutation.isPending}
                >
                  {task.title.toLowerCase().includes("approve") ? "Process" : 
                   task.title.toLowerCase().includes("schedule") ? "Schedule" :
                   task.title.toLowerCase().includes("check") ? "Start" : 
                   task.title.toLowerCase().includes("follow") ? "Contact" : "Start"}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No pending tasks
          </div>
        )}
      </CardContent>
      <div className="px-4 py-3 border-t border-neutral-medium">
        <Link href="/tasks">
          <Button variant="outline" className="w-full py-2 text-sm text-accent border border-accent rounded-md hover:bg-accent hover:text-white transition-colors">
            View All Tasks
          </Button>
        </Link>
      </div>
    </Card>
  );
}
