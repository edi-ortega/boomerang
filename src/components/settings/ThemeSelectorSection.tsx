import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const themes = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Tema claro para ambientes bem iluminados',
    icon: Sun,
    preview: 'bg-gradient-to-br from-slate-50 to-slate-100',
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Tema escuro para reduzir cansaço visual',
    icon: Moon,
    preview: 'bg-gradient-to-br from-slate-900 to-slate-800',
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Usar configuração do sistema operacional',
    icon: Monitor,
    preview: 'bg-gradient-to-br from-slate-400 to-slate-500',
  },
];

export default function ThemeSelectorSection() {
  const { theme, setTheme } = useTheme();

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Tema ${themes.find(t => t.value === newTheme)?.label} selecionado!`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Aparência</h2>
        <p className="text-muted-foreground">
          Escolha o tema de cores que mais combina com você. A mudança é aplicada instantaneamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption, index) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;

          return (
            <motion.div
              key={themeOption.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectTheme(themeOption.value)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-3 rounded-lg ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{themeOption.label}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{themeOption.description}</CardDescription>
                    </div>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-primary">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Preview do tema */}
                  <div className="relative h-24 rounded-md overflow-hidden border border-border">
                    <div className={`w-full h-full ${themeOption.preview}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          {themeOption.value === 'light' && (
                            <div className="space-y-1">
                              <div className="h-2 w-20 bg-slate-300 rounded mx-auto"></div>
                              <div className="h-2 w-16 bg-slate-200 rounded mx-auto"></div>
                            </div>
                          )}
                          {themeOption.value === 'dark' && (
                            <div className="space-y-1">
                              <div className="h-2 w-20 bg-slate-600 rounded mx-auto"></div>
                              <div className="h-2 w-16 bg-slate-700 rounded mx-auto"></div>
                            </div>
                          )}
                          {themeOption.value === 'system' && (
                            <div className="flex gap-2">
                              <div className="space-y-1">
                                <div className="h-2 w-10 bg-slate-200 rounded"></div>
                                <div className="h-2 w-8 bg-slate-300 rounded"></div>
                              </div>
                              <div className="space-y-1">
                                <div className="h-2 w-10 bg-slate-700 rounded"></div>
                                <div className="h-2 w-8 bg-slate-600 rounded"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium inline-block">
                      Tema Ativo
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
