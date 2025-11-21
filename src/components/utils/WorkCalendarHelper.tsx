import { bmr } from "@/api/boomerangClient";

/**
 * WorkCalendarHelper - Cálculo de dias úteis e horas com base no calendário de trabalho
 */

// Cache para calendário e feriados
let cachedCalendar: any = null;
let cachedHolidays: any[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 300000; // 5 minutos

/**
 * Carrega o calendário de trabalho ativo do sistema
 */
const loadWorkCalendar = async () => {
  try {
    const now = Date.now();
    
    // Verificar cache
    if (cachedCalendar && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedCalendar;
    }

    const calendars = await bmr.entities.WorkCalendar.filter({
      is_active: true,
      is_default: true
    });

    if (calendars && calendars.length > 0) {
      cachedCalendar = calendars[0];
      cacheTimestamp = Date.now();
      return cachedCalendar;
    }

    // Calendário padrão se não encontrar
    cachedCalendar = {
      work_days: [1, 2, 3, 4, 5], // Segunda a Sexta
      hours_per_day: 8
    };
    cacheTimestamp = Date.now();
    return cachedCalendar;
  } catch (error) {
    console.error('[WorkCalendarHelper] Error loading work calendar:', error);
    return {
      work_days: [1, 2, 3, 4, 5],
      hours_per_day: 8
    };
  }
};

/**
 * Carrega os feriados ativos do sistema
 */
const loadHolidays = async () => {
  try {
    const now = Date.now();
    
    // Verificar cache
    if (cachedHolidays && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedHolidays;
    }

    const holidays = await bmr.entities.Holiday.filter({
      is_active: true
    });

    cachedHolidays = holidays || [];
    cacheTimestamp = Date.now();
    return cachedHolidays;
  } catch (error) {
    console.error('[WorkCalendarHelper] Error loading holidays:', error);
    return [];
  }
};

/**
 * Verifica se uma data é feriado
 */
const isHoliday = (date: Date, holidays: any[]) => {
  const dateStr = date.toISOString().split('T')[0];
  
  return holidays.some(holiday => {
    const holidayDate = holiday.date;
    
    // Feriado recorrente - compara apenas mês e dia
    if (holiday.is_recurring) {
      const holidayMonthDay = holidayDate.substring(5); // MM-DD
      const dateMonthDay = dateStr.substring(5);
      return holidayMonthDay === dateMonthDay;
    }
    
    // Feriado específico - compara data completa
    return holidayDate === dateStr;
  });
};

/**
 * Verifica se uma data é dia útil de acordo com o calendário
 */
const isWorkDay = (date: Date, workDays: number[]) => {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc
  return workDays.includes(dayOfWeek);
};

/**
 * Calcula o número de dias úteis entre duas datas
 * considerando o calendário de trabalho e feriados
 */
export const calculateWorkDays = async (startDate: string, endDate: string) => {
  try {
    const [calendar, holidays] = await Promise.all([
      loadWorkCalendar(),
      loadHolidays()
    ]);

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    let workDaysCount = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Verificar se é dia de trabalho configurado
      if (isWorkDay(currentDate, calendar.work_days)) {
        // Verificar se não é feriado
        if (!isHoliday(currentDate, holidays)) {
          workDaysCount++;
        }
      }
      
      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workDaysCount;
  } catch (error) {
    console.error('[WorkCalendarHelper] Error calculating work days:', error);
    return 0;
  }
};

/**
 * Calcula as horas totais de trabalho entre duas datas
 */
export const calculateWorkHours = async (startDate: string, endDate: string) => {
  try {
    const workDays = await calculateWorkDays(startDate, endDate);
    const calendar = await loadWorkCalendar();
    return workDays * calendar.hours_per_day;
  } catch (error) {
    console.error('[WorkCalendarHelper] Error calculating work hours:', error);
    return 0;
  }
};

/**
 * Adiciona dias úteis a uma data
 */
export const addWorkDays = async (startDate: string, daysToAdd: number) => {
  try {
    const [calendar, holidays] = await Promise.all([
      loadWorkCalendar(),
      loadHolidays()
    ]);

    const currentDate = new Date(startDate + 'T00:00:00');
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (isWorkDay(currentDate, calendar.work_days) && !isHoliday(currentDate, holidays)) {
        addedDays++;
      }
    }

    return currentDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('[WorkCalendarHelper] Error adding work days:', error);
    return startDate;
  }
};

/**
 * Retorna informações detalhadas sobre o cálculo de horas úteis
 */
export const getWorkCalculationDetails = async (startDate: string, endDate: string) => {
  try {
    const [calendar, holidays, workDays] = await Promise.all([
      loadWorkCalendar(),
      loadHolidays(),
      calculateWorkDays(startDate, endDate)
    ]);

    const totalHours = workDays * calendar.hours_per_day;
    
    // Calcular total de dias no período
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Contar feriados no período
    let holidaysInPeriod = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      if (isHoliday(currentDate, holidays) && isWorkDay(currentDate, calendar.work_days)) {
        holidaysInPeriod++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalDays,
      workDays,
      holidaysInPeriod,
      hoursPerDay: calendar.hours_per_day,
      totalHours,
      workDaysConfig: calendar.work_days,
      calendar
    };
  } catch (error) {
    console.error('[WorkCalendarHelper] Error getting calculation details:', error);
    return null;
  }
};

/**
 * Formata os dias da semana configurados
 */
export const formatWorkDays = (workDays: number[]) => {
  const daysMap: Record<number, string> = {
    0: 'Dom',
    1: 'Seg',
    2: 'Ter',
    3: 'Qua',
    4: 'Qui',
    5: 'Sex',
    6: 'Sáb'
  };
  
  return workDays.map(day => daysMap[day]).join(', ');
};

/**
 * Limpa o cache (útil para forçar reload)
 */
export const clearCache = () => {
  cachedCalendar = null;
  cachedHolidays = [];
  cacheTimestamp = null;
};
