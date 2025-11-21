import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import * as Icons from "lucide-react";

// Lista de ícones mais usados para tipos de ativos
const ASSET_ICONS = [
  "Laptop", "Monitor", "Keyboard", "Mouse", "Smartphone", "Tablet",
  "HardDrive", "Server", "Database", "Cpu", "MemoryStick", "Usb",
  "Printer", "Scanner", "Projector", "Camera", "Headphones", "Mic",
  "Router", "Wifi", "Cable", "Phone", "Watch", "Gamepad",
  "Car", "Truck", "Package", "Box", "Archive", "FolderOpen",
  "FileText", "BookOpen", "Wrench", "Hammer", "Scissors", "Paintbrush",
  "Briefcase", "ShoppingCart", "Home", "Building", "Factory", "Warehouse",
  "Zap", "Flame", "Droplet", "Wind", "CloudRain", "Sun",
];

interface IconPickerProps {
  value?: string;
  onChange?: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = ASSET_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (iconName: string) => {
    onChange?.(iconName);
    setOpen(false);
  };

  const SelectedIcon = value && (Icons as any)[value] ? (Icons as any)[value] : Icons.Package;

  return (
    <div className="space-y-2">
      <Label>Ícone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start gap-2"
          >
            <SelectedIcon className="h-4 w-4" />
            <span className="flex-1 text-left">{value || "Selecione um ícone"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ícone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-6 gap-2 p-3">
              {filteredIcons.map((iconName) => {
                const IconComponent = (Icons as any)[iconName];
                if (!IconComponent) return null;

                return (
                  <Button
                    key={iconName}
                    variant={value === iconName ? "default" : "ghost"}
                    className="h-12 w-full p-2"
                    onClick={() => handleSelect(iconName)}
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          {filteredIcons.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum ícone encontrado
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
