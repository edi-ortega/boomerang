import React from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CircularProgress from "@/components/CircularProgress";
import { CheckCircle2, Clock, AlertCircle, Flag } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  progress?: number;
  status?: string;
  milestone_order?: number;
}

interface MilestoneTimelineViewProps {
  milestones: Task[];
  isTaskCompleted: (task: Task) => boolean;
}

export default function MilestoneTimelineView({ milestones, isTaskCompleted }: MilestoneTimelineViewProps) {
  const navigate = useNavigate();

  const getStatusInfo = (milestone: Task) => {
    const isCompleted = isTaskCompleted(milestone);
    const progress = milestone.progress || 0;
    
    if (isCompleted || progress >= 100) {
      return {
        color: "success",
        icon: CheckCircle2,
        label: "Concluído",
        gradient: "from-emerald-500 to-green-600"
      };
    } else if (milestone.status === 'in_progress' || progress > 0) {
      return {
        color: "info",
        icon: Clock,
        label: "Em Andamento",
        gradient: "from-blue-500 to-cyan-600"
      };
    } else if (milestone.due_date && new Date(milestone.due_date + 'T12:00:00') < new Date()) {
      return {
        color: "error",
        icon: AlertCircle,
        label: "Atrasado",
        gradient: "from-red-500 to-orange-600"
      };
    }
    
    return {
      color: "default",
      icon: Flag,
      label: "Pendente",
      gradient: "from-muted to-muted-foreground"
    };
  };

  const getBorderColor = (index: number) => {
    const colors = [
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-1))",
    ];
    return colors[index % colors.length];
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.milestone_order && b.milestone_order) {
      return a.milestone_order - b.milestone_order;
    }
    if (a.start_date && b.start_date) {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  if (sortedMilestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum marco encontrado para este projeto
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-10 px-4">
      <div className="relative min-w-max">
        {/* Horizontal timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" 
             style={{ zIndex: 0 }} />
        
        {/* Timeline dots on the line */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2"
             style={{ zIndex: 1 }}>
          {sortedMilestones.map((_, index) => (
            <div 
              key={index}
              className="w-2 h-2 rounded-full bg-border"
              style={{ 
                marginLeft: index === 0 ? '0' : 'auto',
                marginRight: index === sortedMilestones.length - 1 ? '0' : 'auto'
              }}
            />
          ))}
        </div>

        {/* Milestones */}
        <div className="relative flex justify-between items-center" style={{ minHeight: '340px' }}>
          {sortedMilestones.map((milestone, index) => {
            const isTop = index % 2 === 0;
            const progress = milestone.progress || 0;
            const statusInfo = getStatusInfo(milestone);
            const StatusIcon = statusInfo.icon;
            const borderColor = getBorderColor(index);

            return (
              <div key={milestone.id} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                {/* Connector line from timeline to content */}
                <div 
                  className="absolute w-0.5 bg-gradient-to-b from-border via-primary/30 to-border"
                  style={{
                    height: '40px',
                    top: isTop ? 'auto' : '50%',
                    bottom: isTop ? '50%' : 'auto',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }}
                />

                {/* Content container (alternating top/bottom) */}
                <div 
                  className={`absolute ${isTop ? 'bottom-[calc(50%+40px)]' : 'top-[calc(50%+40px)]'} flex flex-col items-center gap-2`}
                  style={{ zIndex: 2 }}
                >
                  {/* Circular Progress with Status Icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: index * 0.15,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                    className="relative cursor-pointer group"
                    onClick={() => navigate(createPageUrl(`/tasks/${milestone.id}`))}
                  >
                    {/* Glow effect */}
                    <div 
                      className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 bg-gradient-to-r ${statusInfo.gradient}`}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    
                    {/* Progress Circle Container */}
                    <div className="relative">
                      <CircularProgress 
                        value={progress}
                        max={100}
                        size={60}
                        strokeWidth={4}
                        showLabel={false}
                      />
                      
                      {/* Center Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                          className={`p-1 rounded-full bg-gradient-to-br ${statusInfo.gradient} shadow-lg mb-0.5`}
                        >
                          <StatusIcon className="w-3 h-3 text-white" />
                        </motion.div>
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.15 + 0.4 }}
                          className="text-xs font-bold text-foreground"
                        >
                          {Math.round(progress)}%
                        </motion.span>
                      </div>
                    </div>
                    
                    {/* Hover border effect */}
                    <div 
                      className="absolute inset-0 rounded-full border-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ borderColor }}
                    />
                  </motion.div>

                  {/* Text content with enhanced styling */}
                  <motion.div
                    initial={{ opacity: 0, y: isTop ? 20 : -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                    className="text-center max-w-[140px]"
                  >
                    {/* Status badge */}
                    <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 bg-gradient-to-r ${statusInfo.gradient} text-white shadow-sm`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusInfo.label}
                    </div>
                    
                    <h3 className="font-bold text-foreground mb-0.5 text-xs leading-tight">
                      {milestone.title}
                    </h3>
                    
                    {milestone.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {milestone.description}
                      </p>
                    )}
                    
                    {/* Date info */}
                    {milestone.due_date && (
                      <p className="text-[10px] text-primary font-medium mt-0.5">
                        {format(new Date(milestone.due_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
