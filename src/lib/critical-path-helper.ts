/**
 * Critical Path Method (CPM) Helper
 *
 * Implementa o método do caminho crítico para análise de cronograma de projetos
 * conforme as práticas do PMI (Project Management Institute).
 *
 * Conceitos implementados:
 * - Early Start (ES): Data mais cedo que uma atividade pode começar
 * - Early Finish (EF): Data mais cedo que uma atividade pode terminar
 * - Late Start (LS): Data mais tarde que uma atividade pode começar sem atrasar o projeto
 * - Late Finish (LF): Data mais tarde que uma atividade pode terminar sem atrasar o projeto
 * - Total Float (TF): Folga total = LS - ES ou LF - EF
 * - Free Float (FF): Folga livre = ES(sucessor) - EF(tarefa)
 * - Critical Path: Caminho com folga total = 0
 */

export interface CPMTask {
  id: string;
  title: string;
  start_date: string;
  due_date: string;
  dependencies?: string[];
  duration?: number; // em dias

  // Campos calculados pelo CPM
  earlyStart?: Date;
  earlyFinish?: Date;
  lateStart?: Date;
  lateFinish?: Date;
  totalFloat?: number;
  freeFloat?: number;
  isCritical?: boolean;
}

export interface CPMResult {
  tasks: Map<string, CPMTask>;
  criticalPath: string[];
  projectDuration: number;
  projectEndDate: Date;
}

/**
 * Calcula a duração em dias úteis entre duas datas
 */
function calculateDuration(startDate: Date, endDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / msPerDay);
}

/**
 * Adiciona dias úteis a uma data
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Forward Pass: Calcula Early Start (ES) e Early Finish (EF)
 */
function forwardPass(tasks: Map<string, CPMTask>, projectStartDate: Date): void {
  const processed = new Set<string>();

  function processTask(taskId: string): void {
    if (processed.has(taskId)) return;

    const task = tasks.get(taskId);
    if (!task) return;

    // Processar dependências primeiro
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!processed.has(depId)) {
          processTask(depId);
        }
      }

      // ES = máximo dos EF das dependências
      let maxEF = projectStartDate;
      for (const depId of task.dependencies) {
        const dep = tasks.get(depId);
        if (dep && dep.earlyFinish) {
          if (dep.earlyFinish > maxEF) {
            maxEF = dep.earlyFinish;
          }
        }
      }
      task.earlyStart = maxEF;
    } else {
      // Tarefa sem dependências começa na data de início do projeto
      task.earlyStart = projectStartDate;
    }

    // Calcular duração se não estiver definida
    if (!task.duration) {
      const start = new Date(task.start_date);
      const end = new Date(task.due_date);
      task.duration = calculateDuration(start, end);
    }

    // EF = ES + Duration
    task.earlyFinish = addDays(task.earlyStart, task.duration);

    processed.add(taskId);
  }

  // Processar todas as tarefas
  for (const taskId of tasks.keys()) {
    processTask(taskId);
  }
}

/**
 * Backward Pass: Calcula Late Start (LS) e Late Finish (LF)
 */
function backwardPass(tasks: Map<string, CPMTask>, projectEndDate: Date): void {
  const processed = new Set<string>();

  // Criar mapa de sucessores
  const successors = new Map<string, string[]>();
  for (const [taskId, task] of tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        if (!successors.has(depId)) {
          successors.set(depId, []);
        }
        successors.get(depId)!.push(taskId);
      }
    }
  }

  function processTask(taskId: string): void {
    if (processed.has(taskId)) return;

    const task = tasks.get(taskId);
    if (!task) return;

    const taskSuccessors = successors.get(taskId) || [];

    // Processar sucessores primeiro
    if (taskSuccessors.length > 0) {
      for (const succId of taskSuccessors) {
        if (!processed.has(succId)) {
          processTask(succId);
        }
      }

      // LF = mínimo dos LS dos sucessores
      let minLS: Date | null = null;
      for (const succId of taskSuccessors) {
        const succ = tasks.get(succId);
        if (succ && succ.lateStart) {
          if (!minLS || succ.lateStart < minLS) {
            minLS = succ.lateStart;
          }
        }
      }
      task.lateFinish = minLS || projectEndDate;
    } else {
      // Tarefa sem sucessores termina na data de fim do projeto
      task.lateFinish = projectEndDate;
    }

    // LS = LF - Duration
    task.lateStart = addDays(task.lateFinish, -(task.duration || 0));

    processed.add(taskId);
  }

  // Processar todas as tarefas em ordem reversa
  const taskIds = Array.from(tasks.keys());
  for (let i = taskIds.length - 1; i >= 0; i--) {
    processTask(taskIds[i]);
  }
}

/**
 * Calcula as folgas (floats) e identifica o caminho crítico
 */
function calculateFloatsAndCriticalPath(tasks: Map<string, CPMTask>): string[] {
  const criticalTasks: string[] = [];

  // Criar mapa de sucessores para calcular folga livre
  const successors = new Map<string, string[]>();
  for (const [taskId, task] of tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        if (!successors.has(depId)) {
          successors.set(depId, []);
        }
        successors.get(depId)!.push(taskId);
      }
    }
  }

  for (const [taskId, task] of tasks) {
    if (!task.earlyStart || !task.lateStart || !task.earlyFinish || !task.lateFinish) {
      continue;
    }

    // Total Float = LS - ES ou LF - EF
    const totalFloatDays = calculateDuration(task.earlyStart, task.lateStart);
    task.totalFloat = totalFloatDays;

    // Free Float = ES(sucessor mais cedo) - EF(tarefa)
    const taskSuccessors = successors.get(taskId) || [];
    if (taskSuccessors.length > 0) {
      let minSuccessorES: Date | null = null;
      for (const succId of taskSuccessors) {
        const succ = tasks.get(succId);
        if (succ && succ.earlyStart) {
          if (!minSuccessorES || succ.earlyStart < minSuccessorES) {
            minSuccessorES = succ.earlyStart;
          }
        }
      }
      if (minSuccessorES) {
        task.freeFloat = calculateDuration(task.earlyFinish, minSuccessorES);
      } else {
        task.freeFloat = 0;
      }
    } else {
      task.freeFloat = task.totalFloat; // Tarefa final
    }

    // Tarefa crítica: Total Float = 0 (ou muito próximo de 0)
    task.isCritical = task.totalFloat <= 0;

    if (task.isCritical) {
      criticalTasks.push(taskId);
    }
  }

  return criticalTasks;
}

/**
 * Executa o algoritmo CPM completo
 */
export function calculateCriticalPath(tasks: CPMTask[]): CPMResult {
  const taskMap = new Map<string, CPMTask>();

  // Converter array para map
  for (const task of tasks) {
    taskMap.set(task.id, { ...task });
  }

  // Encontrar data de início do projeto (menor data de início)
  let projectStartDate = new Date();
  for (const task of tasks) {
    const startDate = new Date(task.start_date);
    if (startDate < projectStartDate) {
      projectStartDate = startDate;
    }
  }

  // Forward Pass
  forwardPass(taskMap, projectStartDate);

  // Encontrar data de fim do projeto (maior EF)
  let projectEndDate = projectStartDate;
  for (const task of taskMap.values()) {
    if (task.earlyFinish && task.earlyFinish > projectEndDate) {
      projectEndDate = task.earlyFinish;
    }
  }

  // Backward Pass
  backwardPass(taskMap, projectEndDate);

  // Calcular folgas e identificar caminho crítico
  const criticalPath = calculateFloatsAndCriticalPath(taskMap);

  // Calcular duração do projeto
  const projectDuration = calculateDuration(projectStartDate, projectEndDate);

  return {
    tasks: taskMap,
    criticalPath,
    projectDuration,
    projectEndDate
  };
}

/**
 * Ordena as tarefas do caminho crítico em ordem cronológica
 */
export function sortCriticalPath(criticalPath: string[], tasks: Map<string, CPMTask>): string[] {
  return criticalPath.sort((a, b) => {
    const taskA = tasks.get(a);
    const taskB = tasks.get(b);

    if (!taskA?.earlyStart || !taskB?.earlyStart) return 0;

    return taskA.earlyStart.getTime() - taskB.earlyStart.getTime();
  });
}

/**
 * Formata a folga para exibição
 */
export function formatFloat(days: number): string {
  if (days === 0) return '0 dias';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

/**
 * Retorna a cor baseada no nível de criticidade (folga)
 */
export function getFloatColor(totalFloat: number): string {
  if (totalFloat === 0) return '#ef4444'; // Crítico (vermelho)
  if (totalFloat <= 2) return '#f59e0b'; // Quase crítico (laranja)
  if (totalFloat <= 5) return '#eab308'; // Atenção (amarelo)
  return '#10b981'; // Folga confortável (verde)
}
