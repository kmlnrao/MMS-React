import { SystemAlert } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SystemAlertsProps {
  alerts: SystemAlert[];
}

export default function SystemAlerts({ alerts }: SystemAlertsProps) {
  const { toast } = useToast();
  
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/alerts/${id}`, { status: "acknowledged" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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

  const getAlertIcon = (severity: string, type: string) => {
    if (severity === "critical") {
      return <AlertCircle className="w-5 h-5 text-error mr-2 flex-shrink-0 mt-0.5" />;
    } else if (severity === "warning") {
      return <AlertTriangle className="w-5 h-5 text-warning mr-2 flex-shrink-0 mt-0.5" />;
    } else {
      return <Info className="w-5 h-5 text-info mr-2 flex-shrink-0 mt-0.5" />;
    }
  };
  
  const getAlertBackground = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-error bg-opacity-5 hover:bg-opacity-10";
      case "warning":
        return "bg-warning bg-opacity-5 hover:bg-opacity-10";
      default:
        return "hover:bg-neutral-light";
    }
  };
  
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  const handleAcknowledge = (id: number) => {
    acknowledgeAlertMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-neutral-medium">
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-neutral-medium">
        {alerts && alerts.length > 0 ? (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={cn("p-4", getAlertBackground(alert.severity))}
            >
              <div className="flex items-start">
                {getAlertIcon(alert.severity, alert.type)}
                <div>
                  <h3 className={cn(
                    "font-medium text-sm",
                    alert.severity === "critical" ? "text-error" :
                    alert.severity === "warning" ? "text-warning" : ""
                  )}>
                    {alert.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">{getTimeAgo(alert.createdAt)}</p>
                    {alert.status === "active" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgeAlertMutation.isPending}
                        className="text-xs py-0 px-2 h-6"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No active alerts
          </div>
        )}
      </CardContent>
      <div className="px-4 py-3 border-t border-neutral-medium">
        <Link href="/alerts">
          <Button variant="outline" className="w-full py-2 text-sm text-accent border border-accent rounded-md hover:bg-accent hover:text-white transition-colors">
            View All Alerts
          </Button>
        </Link>
      </div>
    </Card>
  );
}
