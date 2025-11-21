import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProjectHierarchyModalProps {
  open: boolean;
  onClose: () => void;
  project?: any;
}

export default function ProjectHierarchyModal({ open, onClose, project }: ProjectHierarchyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Hierarquia do Projeto</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Visualização de hierarquia em desenvolvimento</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
