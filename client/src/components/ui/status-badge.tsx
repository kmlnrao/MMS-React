import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "registered":
        return "bg-slate-100 text-slate-800";
      case "pending_autopsy":
        return "bg-info bg-opacity-10 text-info";
      case "autopsy_completed":
        return "bg-success bg-opacity-10 text-success";
      case "pending_release":
        return "bg-warning bg-opacity-10 text-warning";
      case "released":
        return "bg-success bg-opacity-10 text-success";
      case "unclaimed":
        return "bg-error bg-opacity-10 text-error";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "registered":
        return "Registered";
      case "pending_autopsy":
        return "Pending Autopsy";
      case "autopsy_completed":
        return "Autopsy Completed";
      case "pending_release":
        return "Pending Release";
      case "released":
        return "Released";
      case "unclaimed":
        return "Unclaimed";
      default:
        return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <span className={cn(
      "px-2 py-1 text-xs rounded-full inline-block", 
      getStatusStyles(), 
      className
    )}>
      {getStatusLabel()}
    </span>
  );
}
