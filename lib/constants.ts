const getDaysOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Dom) to 6 (Sáb)
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  
  const days = [];
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      name: dayNames[i],
      date: d.getDate().toString().padStart(2, '0'),
      fullDate: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    });
  }
  return days;
};

export const DAYS_OF_WEEK = getDaysOfWeek();
