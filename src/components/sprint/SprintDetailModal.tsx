import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SprintDetailModalProps {
  open: boolean;
  onClose: () => void;
  sprint?: any;
}

export default function SprintDetailModal({ open, onClose, sprint }: SprintDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sprint?.name || 'Detalhes do Sprint'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Detalhes do sprint em desenvolvimento</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
