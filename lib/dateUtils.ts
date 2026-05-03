export const REFERENCE_MONDAY = new Date(2024, 11, 30, 0, 0, 0, 0); // Monday, Dec 30, 2024

export const getWeeksInMonth = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Find the first Monday on or before the 1st of the month
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const diffFirst = firstDayOfMonth.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
  const firstMonday = new Date(year, month, diffFirst);

  // Find the last Sunday on or after the last day of the month
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const diffLast = lastDayOfMonth.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek);
  const lastSunday = new Date(year, month, diffLast);

  const diffTime = Math.abs(lastSunday.getTime() - firstMonday.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return Math.ceil((diffDays + 1) / 7);
};

export const getDaysForWeek = (weekNumber: number) => {
  // weekNumber is now an absolute number of weeks since REFERENCE_MONDAY
  const targetMonday = new Date(REFERENCE_MONDAY);
  targetMonday.setDate(REFERENCE_MONDAY.getDate() + (weekNumber) * 7);

  const days = [];
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    days.push({
      name: dayNames[i],
      date: d.getDate().toString().padStart(2, '0'),
      fullDate: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    });
  }
  return days;
};

export const getCurrentWeekNumber = () => {
  const now = new Date();
  
  // Find the Monday of the current week
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  const diffTime = currentMonday.getTime() - REFERENCE_MONDAY.getTime();
  const weeksPassed = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return weeksPassed;
};

export const getWeekLabel = (weekIndex: number) => {
  const targetMonday = new Date(REFERENCE_MONDAY);
  targetMonday.setDate(REFERENCE_MONDAY.getDate() + (weekIndex) * 7);
  
  // Get ISO week number
  const d = new Date(Date.UTC(targetMonday.getFullYear(), targetMonday.getMonth(), targetMonday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNo.toString();
};
