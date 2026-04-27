export const getWeeksInMonth = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Find the first Monday on or before the 1st of the month
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const diffFirst = firstDayOfMonth.getDate() - firstDayOfWeek + (firstDayOfWeek === 0 ? -6 : 1);
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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstDayOfMonth.getDay();
  const diff = firstDayOfMonth.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const firstMonday = new Date(year, month, diff);

  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

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
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstDayOfMonth.getDay();
  const diff = firstDayOfMonth.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const firstMonday = new Date(year, month, diff);
  
  const diffTime = now.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  const totalWeeks = Math.min(5, getWeeksInMonth(year, month));
  return Math.max(1, Math.min(totalWeeks, weekNumber));
};
