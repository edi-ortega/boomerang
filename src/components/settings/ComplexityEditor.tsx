import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, Trash2, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ComplexityValue {
  value: string;
  label: string;
}

interface TypeInfo {
  name: string;
  default: ComplexityValue[];
}

const typeInfo: Record<string, TypeInfo> = {
  fibonacci: {
    name: "Fibonacci",
    default: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "5", label: "5" },
      { value: "8", label: "8" },
      { value: "13", label: "13" },
      { value: "21", label: "21" },
      { value: "34", label: "34" },
      { value: "?", label: "?" },
      { value: "∞", label: "∞" }
    ]
  },
  tshirt: {
    name: "T-Shirt Sizing",
    default: [
      { value: "XS", label: "XS - Extra Pequeno" },
      { value: "S", label: "S - Pequeno" },
      { value: "M", label: "M - Médio" },
      { value: "L", label: "L - Grande" },
      { value: "XL", label: "XL - Extra Grande" },
      { value: "XXL", label: "XXL - Extra Extra Grande" },
      { value: "?", label: "?" }
    ]
  },
  power_of_2: {
    name: "Potências de 2",
    default: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "4", label: "4" },
      { value: "8", label: "8" },
      { value: "16", label: "16" },
      { value: "32", label: "32" },
      { value: "?", label: "?" },
      { value: "∞", label: "∞" }
    ]
  },
  linear: {
    name: "Linear/Sequência",
    default: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7" },
      { value: "8", label: "8" },
      { value: "9", label: "9" },
      { value: "10", label: "10" }
    ]
  }
};

interface ComplexityEditorProps {
  type: keyof typeof typeInfo;
  initialValues?: ComplexityValue[];
  onClose: () => void;
  onSave: (values: ComplexityValue[]) => void;
}

export default function ComplexityEditor({ type, initialValues, onClose, onSave }: ComplexityEditorProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<ComplexityValue[]>([]);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const getCurrentTypeInfo = () => typeInfo[type] || typeInfo.fibonacci;

  useEffect(() => {
    const currentTypeInfo = getCurrentTypeInfo();
    
    if (initialValues && Array.isArray(initialValues) && initialValues.length > 0) {
      const formattedValues = initialValues.map(v => {
        if (typeof v === 'object' && v.value !== undefined) {
          return v;
        }
        return { value: String(v), label: String(v) };
      });
      setValues(formattedValues);
    } else {
      setValues(currentTypeInfo.default);
    }
  }, [initialValues, type]);

  const handleAddValue = () => {
    if (!newValue.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O valor é obrigatório.",
      });
      return;
    }

    const isDuplicate = values.some(v => v.value === newValue.trim());
    if (isDuplicate) {
      toast({
        title: "Valor duplicado",
        description: "Este valor já existe na escala.",
      });
      return;
    }

    setValues([...values, {
      value: newValue.trim(),
      label: newLabel.trim() || newValue.trim()
    }]);
    setNewValue("");
    setNewLabel("");
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    const currentTypeInfo = getCurrentTypeInfo();
    setValues(currentTypeInfo.default);
  };

  const handleSave = () => {
    if (values.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um valor.",
        variant: "destructive"
      });
      return;
    }
    onSave(values);
  };

  const currentTypeInfo = getCurrentTypeInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Editor de Escala - {currentTypeInfo.name}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Current Values */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Valores Atuais</h3>
            <div className="flex flex-wrap gap-2">
              {values.map((val, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm px-3 py-1 flex items-center gap-2"
                >
                  <span>{val.label}</span>
                  <button
                    onClick={() => handleRemoveValue(index)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Add New Value */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Adicionar Novo Valor</h3>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Valor (ex: 21)"
                className="flex-1"
              />
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (opcional)"
                className="flex-1"
              />
              <Button onClick={handleAddValue} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
