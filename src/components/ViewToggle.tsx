import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewModeStore, ViewMode } from "@/stores/viewModeStore";

interface ViewToggleProps {
  className?: string;
}

export function ViewToggle({ className }: ViewToggleProps) {
  const { viewMode, setViewMode } = useViewModeStore();

  return (
    <div className={`flex items-center gap-1 border border-border rounded-lg p-1 ${className || ''}`}>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('grid')}
        className="h-8 w-8 p-0"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
