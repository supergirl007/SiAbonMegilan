import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import ExcelJS from 'exceljs';

export default function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // State for General Settings
  const [generalSettings, setGeneralSettings] = useState({
    appName: "Si Abon Megilan",
    companyName: "Puskesmas Sehat",
    pimpinanName: "Dr. Budi Santoso",
    email: "info@puskesmas.com",
    address: "Jl. Kesehatan No. 1"
  });
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // State for Absensi Settings
  const [absensiSettings, setAbsensiSettings] = useState({
    tolerance: "15"
  });
  const [isSavingAbsensi, setIsSavingAbsensi] = useState(false);

  // State for Leave Settings
  const [leaveSettings, setLeaveSettings] = useState({
    autoApprove: "0"
  });
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedGeneral = localStorage.getItem('generalSettings');
    if (savedGeneral) {
      setGeneralSettings(JSON.parse(savedGeneral));
    }
    const savedAbsensi = localStorage.getItem('absensiSettings');
    if (savedAbsensi) {
      setAbsensiSettings(JSON.parse(savedAbsensi));
    }
    const savedLeave = localStorage.getItem('leaveSettings');
    if (savedLeave) {
      setLeaveSettings(JSON.parse(savedLeave));
    }
  }, []);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleAbsensiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAbsensiSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleLeaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLeaveSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveGeneral = () => {
    setIsSavingGeneral(true);
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    setTimeout(() => {
      setIsSavingGeneral(false);
      toast.success("Pengaturan Umum berhasil disimpan!");
    }, 800);
  };

  const handleSaveAbsensi = () => {
    setIsSavingAbsensi(true);
    localStorage.setItem('absensiSettings', JSON.stringify(absensiSettings));
    setTimeout(() => {
      setIsSavingAbsensi(false);
      toast.success("Pengaturan Absensi berhasil disimpan!");
    }, 800);
  };

  const handleSaveLeave = () => {
    setIsSavingLeave(true);
    localStorage.setItem('leaveSettings', JSON.stringify(leaveSettings));
    setTimeout(() => {
      setIsSavingLeave(false);
      toast.success("Pengaturan Izin & Cuti berhasil disimpan!");
    }, 800);
  };

  const handleExportUsers = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data User');
    worksheet.addRow(['ID', 'Nama', 'Email', 'Role']);
    worksheet.addRow(['1', 'Admin User', 'admin@puskesmas.com', 'Admin']);
    worksheet.addRow(['2', 'Regular User', 'user@puskesmas.com', 'User']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_User_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data User berhasil diekspor!");
  };

  const handleExportAbsensi = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Absensi');
    worksheet.addRow(['Tanggal', 'Nama', 'Status', 'Jam Masuk']);
    worksheet.addRow(['2026-04-01', 'Admin User', 'Hadir', '07:45']);
    worksheet.addRow(['2026-04-01', 'Regular User', 'Hadir', '07:50']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Absensi_Semua_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data Absensi berhasil diekspor!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sistem</h1>
        <p className="text-sm text-slate-500">Pengaturan aplikasi dan manajemen data.</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Atur informasi dasar aplikasi dan instansi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="appName">Nama Aplikasi</Label>
                <Input id="appName" value={generalSettings.appName} onChange={handleGeneralChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nama Puskesmas/Perusahaan</Label>
                <Input id="companyName" value={generalSettings.companyName} onChange={handleGeneralChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pimpinanName">Nama Kepala Puskesmas/Pimpinan</Label>
                <Input id="pimpinanName" value={generalSettings.pimpinanName} onChange={handleGeneralChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Puskesmas/Perusahaan</Label>
                <Input id="email" type="email" value={generalSettings.email} onChange={handleGeneralChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat</Label>
                <Input id="address" value={generalSettings.address} onChange={handleGeneralChange} />
              </div>
              <Button className="mt-4" onClick={handleSaveGeneral} disabled={isSavingGeneral}>
                {isSavingGeneral ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absensi">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Absensi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="tolerance">Toleransi Keterlambatan (Menit)</Label>
                <Input id="tolerance" type="number" value={absensiSettings.tolerance} onChange={handleAbsensiChange} />
              </div>
              <Button className="mt-4" onClick={handleSaveAbsensi} disabled={isSavingAbsensi}>
                {isSavingAbsensi ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Izin & Cuti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="autoApprove">Auto-Approve (Hari)</Label>
                <Input id="autoApprove" type="number" value={leaveSettings.autoApprove} onChange={handleLeaveChange} />
                <p className="text-xs text-slate-500">Set 0 untuk menonaktifkan auto-approve.</p>
              </div>
              <Button className="mt-4" onClick={handleSaveLeave} disabled={isSavingLeave}>
                {isSavingLeave ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Data</CardTitle>
              <CardDescription>Import dan export data sistem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleExportUsers}>Export Data User (Excel)</Button>
                <Button variant="outline" onClick={handleExportAbsensi}>Export Data Absensi (Excel)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
