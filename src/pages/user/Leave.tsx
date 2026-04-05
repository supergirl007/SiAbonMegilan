import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function UserLeave() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Permintaan izin berhasil diajukan');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Pengajuan Izin</h1>
        <p className="text-sm text-slate-400">Ajukan izin tidak masuk kerja.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Formulir Izin</CardTitle>
          <CardDescription className="text-slate-400">Isi detail izin Anda di bawah ini.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-300">Jenis Izin</Label>
              <Select required>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-50">
                  <SelectValue placeholder="Pilih jenis izin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-50">
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="cuti">Cuti Tahunan</SelectItem>
                  <SelectItem value="izin">Izin Keperluan Pribadi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-300">Mulai Tanggal</Label>
                <Input id="startDate" type="date" required className="bg-slate-950 border-slate-800 text-slate-50 [color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-300">Sampai Tanggal</Label>
                <Input id="endDate" type="date" required className="bg-slate-950 border-slate-800 text-slate-50 [color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-300">Keterangan / Alasan</Label>
              <Input id="reason" placeholder="Tuliskan alasan..." required className="bg-slate-950 border-slate-800 text-slate-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-slate-300">Lampiran (Surat Dokter/Bukti)</Label>
              <Input id="attachment" type="file" className="bg-slate-950 border-slate-800 text-slate-50 file:text-emerald-400" />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Ajukan Izin'}
            </Button>
          </CardContent>
        </form>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-white mb-4">Riwayat Pengajuan</h3>
        <div className="space-y-3">
          <Card className="bg-slate-900 border-slate-800 text-slate-50">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">Sakit</p>
                <p className="text-xs text-slate-400">12 Mar 2026 - 13 Mar 2026</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Disetujui
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
