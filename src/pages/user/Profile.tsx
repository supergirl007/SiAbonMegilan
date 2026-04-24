import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [alarmEnabled, setAlarmEnabled] = useState(localStorage.getItem('alarmEnabled') !== 'false');

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const employees = await response.json();
          const currentEmployee = employees.find((emp: any) => emp.nip === user.nip);
          if (currentEmployee) {
            setEmployeeData(currentEmployee);
          }
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }
    };

    if (user.nip) {
      fetchEmployeeData();
    }
  }, [user.nip]);

  const handleToggleAlarm = (checked: boolean) => {
    setAlarmEnabled(checked);
    localStorage.setItem('alarmEnabled', String(checked));
    if (checked && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profil Saya</h1>
      </div>

      <div className="flex flex-col items-center space-y-4 mt-8">
        <Avatar className="h-24 w-24 border-4 border-slate-200 dark:border-slate-800">
          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-2xl">
            {user.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name || 'Nama Pegawai'}</h2>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">{user.nip || 'NIP Pegawai'}</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-slate-900 dark:text-slate-50">Alarm Pengingat Absensi</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pengingat 10 mnt sebelum & 15 mnt sesudah shift</p>
            </div>
            <Switch checked={alarmEnabled} onCheckedChange={handleToggleAlarm} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Kantor / Penempatan</p>
            <p className="font-medium">{employeeData?.office || 'Puskesmas Induk'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Unit</p>
            <p className="font-medium">{employeeData?.unit || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email</p>
            <p className="font-medium">{employeeData?.email || user.email || 'pegawai@puskesmas.com'}</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
        Ubah Password
      </Button>
    </div>
  );
}
