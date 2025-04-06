import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingDown, 
  TrendingUp
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: "document" | "chart" | "clock" | "alert";
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  color: "accent" | "success" | "warning" | "error";
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = "neutral",
  color 
}: StatCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "document":
        return <FileText className={`w-8 h-8 text-${color}`} />;
      case "chart":
        return <BarChart3 className={`w-8 h-8 text-${color}`} />;
      case "clock":
        return <Clock className={`w-8 h-8 text-${color}`} />;
      case "alert":
        return <AlertTriangle className={`w-8 h-8 text-${color}`} />;
      default:
        return <FileText className={`w-8 h-8 text-${color}`} />;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="w-3 h-3 mr-1" />;
      case "decrease":
        return <TrendingDown className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-success";
      case "decrease":
        return "text-error";
      default:
        return "text-warning";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
      <div className={cn(`p-3 rounded-full bg-${color} bg-opacity-10 mr-4`)}>
        {getIcon()}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-medium text-primary">{value}</h3>
        {change && (
          <p className={cn("text-xs flex items-center mt-1", getChangeColor())}>
            {getChangeIcon()}
            <span>{change}</span>
          </p>
        )}
      </div>
    </div>
  );
}
