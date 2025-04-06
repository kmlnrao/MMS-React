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
  const getIconColor = () => {
    switch (color) {
      case "accent":
        return "text-[#1976d2]";
      case "success":
        return "text-[#4caf50]";
      case "warning":
        return "text-[#ff9800]";
      case "error":
        return "text-[#f44336]";
      default:
        return "text-[#1976d2]";
    }
  };

  const getIcon = () => {
    const colorClass = getIconColor();
    switch (icon) {
      case "document":
        return <FileText className={`w-8 h-8 ${colorClass}`} />;
      case "chart":
        return <BarChart3 className={`w-8 h-8 ${colorClass}`} />;
      case "clock":
        return <Clock className={`w-8 h-8 ${colorClass}`} />;
      case "alert":
        return <AlertTriangle className={`w-8 h-8 ${colorClass}`} />;
      default:
        return <FileText className={`w-8 h-8 ${colorClass}`} />;
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
        return "text-[#4caf50]";
      case "decrease":
        return "text-[#f44336]";
      default:
        return "text-[#ff9800]";
    }
  };

  const getBgColor = () => {
    switch (color) {
      case "accent":
        return "bg-[#e3f2fd]";
      case "success":
        return "bg-[#e8f5e9]";
      case "warning":
        return "bg-[#fff3e0]";
      case "error":
        return "bg-[#ffebee]";
      default:
        return "bg-[#e3f2fd]";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
      <div className={cn(`p-3 rounded-full ${getBgColor()} mr-4`)}>
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
