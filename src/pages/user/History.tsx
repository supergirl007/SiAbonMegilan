import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserHistory() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="p-4 space-y-6">
      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Riwayat Absensi</h1>
        <p className="text-sm text-slate-400">Pantau kehadiran Anda bulan ini.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-50">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border-0 w-full flex justify-center p-4"
            classNames={{
              day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-500 focus:text-white",
              day_today: "bg-slate-800 text-emerald-400",
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Detail Tanggal: {date?.toLocaleDateString('id-ID')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">Jam Masuk</span>
            <span className="font-medium text-emerald-400">07:45</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">Jam Keluar</span>
            <span className="font-medium text-blue-400">16:05</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status</span>
            <span className="font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Hadir Tepat Waktu</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
