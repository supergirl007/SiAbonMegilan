import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [employeeData, setEmployeeData] = useState<any>(null);

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

  return (
    <div className="p-4 space-y-6">
      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Profil Saya</h1>
      </div>

      <div className="flex flex-col items-center space-y-4 mt-8">
        <Avatar className="h-24 w-24 border-4 border-slate-800">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback className="bg-emerald-900 text-emerald-400 text-2xl">
            {user.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{user.name || 'Nama Pegawai'}</h2>
          <p className="text-emerald-400 font-medium">{user.nip || 'NIP Pegawai'}</p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-50 mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Kantor / Penempatan</p>
            <p className="font-medium">{employeeData?.office || 'Puskesmas Induk'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Unit</p>
            <p className="font-medium">{employeeData?.unit || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Email</p>
            <p className="font-medium">{employeeData?.email || user.email || 'pegawai@puskesmas.com'}</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
        Ubah Password
      </Button>
    </div>
  );
}
