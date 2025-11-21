import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PokerCardProps {
  value: string | number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PokerCard({ value, selected, onClick, className }: PokerCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:scale-105",
        selected && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-center p-6">
        <span className="text-3xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}
