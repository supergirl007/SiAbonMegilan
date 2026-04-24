export const checkAndFireAlarm = (title: string, body: string, alarmId: string) => {
  const alarmEnabled = localStorage.getItem('alarmEnabled') !== 'false';
  if (!alarmEnabled) return;

  const lastFired = localStorage.getItem(`alarm_${alarmId}_fired`);
  const todayDate = new Date().toDateString();

  if (lastFired === todayDate) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/pwa-192x192.svg' });
    localStorage.setItem(`alarm_${alarmId}_fired`, todayDate);
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/pwa-192x192.svg' });
        localStorage.setItem(`alarm_${alarmId}_fired`, todayDate);
      }
    });
  }
};
