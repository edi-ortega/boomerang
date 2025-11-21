import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SprintReportModalProps {
  open: boolean;
  onClose: () => void;
  sprint?: any;
}

export default function SprintReportModal({ open, onClose, sprint }: SprintReportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Relatório do Sprint</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Relatório do sprint em desenvolvimento</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
