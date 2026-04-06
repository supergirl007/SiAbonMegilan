import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Plus, Upload, Trash2, Users, TrendingUp, Clock, CalendarDays, Award, AlertTriangle, Timer } from "lucide-react";
import ExcelJS from 'exceljs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

export default function AdminAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "harian";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const [generalSettings, setGeneralSettings] = useState<any>({});
  const puskesmasName = generalSettings.companyName || "Puskesmas Sehat";
  const pimpinanName = generalSettings.pimpinanName || "Dr. Budi Santoso";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.generalSettings) {
            setGeneralSettings(data.generalSettings);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        const savedGeneral = localStorage.getItem('generalSettings');
        if (savedGeneral) {
          setGeneralSettings(JSON.parse(savedGeneral));
        }
      }
    };
    fetchSettings();
  }, []);

  // State for Absensi Bulanan
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  // Generate dates array for the table header
  const getDatesInRange = (start: string, end: string) => {
    const dateArray = [];
    let currentDate = new Date(start);
    const stopDate = new Date(end);
    while (currentDate <= stopDate) {
      dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  const dates = getDatesInRange(startDate, endDate);

  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch('/api/attendance');
        if (response.ok) {
          const data = await response.json();
          setAttendanceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      }
    };
    fetchAttendance();
  }, []);

  // Process attendance data for Harian
  const processedHarian = attendanceData.filter(a => a.date === date).map(a => ({
    nama: a.name,
    nip: a.nip,
    kantor: a.location, // In a real app, map coordinates to office name
    shift: "-", // Determine shift based on time
    status: a.status,
    jamMasuk: a.type === 'in' ? a.time : "-",
    jamKeluar: a.type === 'out' ? a.time : "-"
  }));

  // Fallback to mock if empty for demonstration
  const displayHarian = processedHarian.length > 0 ? processedHarian : [
    { nama: "Admin User", nip: "123456", kantor: "Kantor Induk", shift: "Pagi", status: "Hadir", jamMasuk: "07:45", jamKeluar: "-" }
  ];

  // Mock data for Absensi Bulanan
  const mockBulanan = [
    { nama: "Admin User", nip: "123456", totalHours: "120 jam", attendance: { [firstDayOfMonth]: "M", [new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0]]: "M", [new Date(today.getFullYear(), today.getMonth(), 3).toISOString().split('T')[0]]: "S" } },
    { nama: "Regular User", nip: "654321", totalHours: "105 jam", attendance: { [firstDayOfMonth]: "M", [new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0]]: "C", [new Date(today.getFullYear(), today.getMonth(), 3).toISOString().split('T')[0]]: "M" } }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'M': return 'text-emerald-600 font-medium';
      case 'C': return 'text-amber-600 font-medium';
      case 'S': return 'text-blue-600 font-medium';
      case 'D': return 'text-purple-600 font-medium';
      default: return 'text-slate-400';
    }
  };

  // State for Hari Libur
  const [holidays, setHolidays] = useState<{id: string, date: string, name: string}[]>([
    { id: "1", date: `${today.getFullYear()}-01-01`, name: "Tahun Baru Masehi" },
    { id: "2", date: `${today.getFullYear()}-08-17`, name: "Hari Kemerdekaan RI" }
  ]);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  const handleAddHoliday = () => {
    if (newHolidayDate && newHolidayName) {
      setHolidays([...holidays, { id: Date.now().toString(), date: newHolidayDate, name: newHolidayName }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewHolidayDate("");
      setNewHolidayName("");
      setIsAddHolidayOpen(false);
    }
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const handleDownloadTemplate = () => {
    // Create a simple CSV content for the template
    const csvContent = "data:text/csv;charset=utf-8,Tanggal (YYYY-MM-DD),Keterangan\n2026-01-01,Tahun Baru Masehi\n2026-08-17,Hari Kemerdekaan RI";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_hari_libur.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State for Pengumuman
  const [announcements, setAnnouncements] = useState<{id: string, title: string, content: string, date: string, expiryDate: string, isActive: boolean}[]>([
    { id: "1", title: "Rapat Bulanan", content: "Rapat bulanan akan diadakan pada hari Jumat.", date: "2026-04-01", expiryDate: "2026-04-10", isActive: true }
  ]);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementExpiry, setNewAnnouncementExpiry] = useState("");

  const handleAddAnnouncement = () => {
    if (newAnnouncementTitle && newAnnouncementContent && newAnnouncementExpiry) {
      setAnnouncements([{
        id: Date.now().toString(),
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        date: new Date().toISOString().split('T')[0],
        expiryDate: newAnnouncementExpiry,
        isActive: true
      }, ...announcements]);
      setNewAnnouncementTitle("");
      setNewAnnouncementContent("");
      setNewAnnouncementExpiry("");
      setIsAddAnnouncementOpen(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleToggleAnnouncementStatus = (id: string) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const addSignature = (worksheet: ExcelJS.Worksheet, startRow: number, colIndex: number) => {
    worksheet.getCell(startRow + 2, colIndex).value = `Kepala ${puskesmasName}`;
    worksheet.getCell(startRow + 2, colIndex).alignment = { horizontal: 'center' };
    
    worksheet.getCell(startRow + 6, colIndex).value = `(${pimpinanName})`;
    worksheet.getCell(startRow + 6, colIndex).alignment = { horizontal: 'center' };
  };

  const handleDownloadHarian = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Absensi Harian');

    // Add Title
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `Data Absensi Harian - ${puskesmasName}`;
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add Headers
    worksheet.getRow(3).values = ['Nama Karyawan', 'NIP', 'Kantor', 'Shift', 'Status', 'Jam Masuk', 'Jam Keluar'];
    worksheet.getRow(3).font = { bold: true };

    // Add Data
    displayHarian.forEach((row, index) => {
      worksheet.addRow([row.nama, row.nip, row.kantor, row.shift, row.status, row.jamMasuk, row.jamKeluar]);
    });

    // Add Signature
    const lastRow = worksheet.lastRow ? worksheet.lastRow.number : 3;
    addSignature(worksheet, lastRow, 6); // Signature on the 6th column (Jam Masuk)

    // Adjust column widths
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    worksheet.getColumn(1).width = 25; // Nama Karyawan

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Absensi_Harian_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadBulanan = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Absensi Bulanan');

    // Add Title
    worksheet.mergeCells(1, 1, 1, dates.length + 3);
    worksheet.getCell('A1').value = `Data Absensi Bulanan (${startDate} s/d ${endDate}) - ${puskesmasName}`;
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add Headers
    const headerRow = ['Nama Karyawan', 'NIP', 'Total Jam Kerja'];
    dates.forEach(date => {
      headerRow.push(new Date(date).getDate().toString());
    });
    worksheet.getRow(3).values = headerRow;
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).alignment = { horizontal: 'center' };

    // Add Data
    mockBulanan.forEach((emp) => {
      const rowData = [emp.nama, emp.nip, emp.totalHours];
      dates.forEach(date => {
        rowData.push(emp.attendance[date as keyof typeof emp.attendance] || '-');
      });
      const row = worksheet.addRow(rowData);
      
      // Center align the attendance status
      for (let i = 4; i <= dates.length + 3; i++) {
        row.getCell(i).alignment = { horizontal: 'center' };
      }
    });

    // Add Legend
    const lastRow = worksheet.lastRow ? worksheet.lastRow.number : 3;
    worksheet.getCell(lastRow + 2, 1).value = 'Keterangan:';
    worksheet.getCell(lastRow + 3, 1).value = 'M = Masuk/Hadir';
    worksheet.getCell(lastRow + 4, 1).value = 'C = Cuti';
    worksheet.getCell(lastRow + 5, 1).value = 'S = Sakit';
    worksheet.getCell(lastRow + 6, 1).value = 'D = Dinas Luar';

    // Add Signature
    // Place signature on the right side of the table
    const signatureCol = Math.max(4, dates.length + 1);
    addSignature(worksheet, lastRow, signatureCol);

    // Adjust column widths
    worksheet.getColumn(1).width = 25; // Nama Karyawan
    worksheet.getColumn(2).width = 15; // NIP
    worksheet.getColumn(3).width = 15; // Total Jam Kerja
    for (let i = 4; i <= dates.length + 3; i++) {
      worksheet.getColumn(i).width = 5; // Date columns
    }

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Absensi_Bulanan_${startDate}_${endDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Absensi</h1>
        <p className="text-sm text-slate-500">Kelola data absensi, persetujuan izin, dan hari libur.</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsContent value="harian" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Absensi Harian</CardTitle>
              <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadHarian}>
                <Download className="h-4 w-4" />
                Ekspor Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input type="date" className="w-auto" />
                <Input placeholder="Cari Nama Karyawan..." className="max-w-sm" />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Kantor</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayHarian.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.nama}</TableCell>
                        <TableCell>{row.nip}</TableCell>
                        <TableCell>{row.kantor}</TableCell>
                        <TableCell>{row.shift}</TableCell>
                        <TableCell><span className={getStatusColor(row.status === "Hadir" ? "M" : row.status)}>{row.status}</span></TableCell>
                        <TableCell>{row.jamMasuk}</TableCell>
                        <TableCell>{row.jamKeluar}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulanan" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Absensi Bulanan</CardTitle>
              <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadBulanan}>
                <Download className="h-4 w-4" />
                Ekspor Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Tanggal Awal</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-auto" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Tanggal Akhir</label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-auto" 
                  />
                </div>
                <Button className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Tampilkan
                </Button>
              </div>
              
              <div className="rounded-md border overflow-x-auto relative">
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-slate-50 z-20 border-r min-w-[150px]">Nama Karyawan</TableHead>
                      <TableHead className="sticky left-[150px] bg-slate-50 z-20 border-r min-w-[100px]">NIP</TableHead>
                      <TableHead className="sticky left-[250px] bg-slate-50 z-20 border-r min-w-[120px]">Total Jam Kerja</TableHead>
                      {dates.map(date => {
                        const d = new Date(date);
                        return (
                          <TableHead key={date} className="text-center px-2 min-w-[40px] border-r">
                            {d.getDate()}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBulanan.map(emp => (
                      <TableRow key={emp.nip}>
                        <TableCell className="sticky left-0 bg-white z-10 border-r font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{emp.nama}</TableCell>
                        <TableCell className="sticky left-[150px] bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{emp.nip}</TableCell>
                        <TableCell className="sticky left-[250px] bg-white z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{emp.totalHours}</TableCell>
                        {dates.map(date => {
                          const status = emp.attendance[date as keyof typeof emp.attendance] || '-';
                          return (
                            <TableCell key={date} className="text-center px-2 border-r">
                               <span className={getStatusColor(status)}>{status}</span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><span className="font-bold text-emerald-600">M</span> = Masuk/Hadir</span>
                <span className="flex items-center gap-1"><span className="font-bold text-amber-600">C</span> = Cuti</span>
                <span className="flex items-center gap-1"><span className="font-bold text-blue-600">S</span> = Sakit</span>
                <span className="flex items-center gap-1"><span className="font-bold text-purple-600">D</span> = Dinas Luar</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analisa" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Sidebar: Filters */}
            <div className="w-full md:w-64 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select defaultValue={new Date().getMonth().toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Select defaultValue={new Date().getFullYear().toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Terapkan Filter</Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content: Dashboard */}
            <div className="flex-1 space-y-6">
              {/* Top Row: Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Total Karyawan Aktif</p>
                        <h3 className="text-3xl font-bold text-slate-900">124</h3>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600 mb-1">Tingkat Kehadiran</p>
                        <h3 className="text-3xl font-bold text-slate-900">94.2%</h3>
                      </div>
                      <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-rose-600 mb-1">Tingkat Keterlambatan</p>
                        <h3 className="text-3xl font-bold text-slate-900">8.5%</h3>
                      </div>
                      <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-600 mb-1">Rata-rata Hadir Harian</p>
                        <h3 className="text-3xl font-bold text-slate-900">116 <span className="text-sm font-normal text-slate-500">Org/Hari</span></h3>
                      </div>
                      <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <CalendarDays className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Row 1: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tren Absensi (Hadir & Terlambat)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { date: '1', hadir: 115, terlambat: 10 }, { date: '5', hadir: 118, terlambat: 8 },
                          { date: '10', hadir: 120, terlambat: 5 }, { date: '15', hadir: 112, terlambat: 15 },
                          { date: '20', hadir: 119, terlambat: 7 }, { date: '25', hadir: 122, terlambat: 4 },
                          { date: '30', hadir: 117, terlambat: 9 }
                        ]}>
                          <defs>
                            <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Area type="monotone" dataKey="hadir" name="Hadir Tepat Waktu" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
                          <Area type="monotone" dataKey="terlambat" name="Terlambat" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTerlambat)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performa Unit Kerja (Kehadiran %)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Poli Umum', rate: 96 }, { name: 'Poli Gigi', rate: 92 },
                          { name: 'KIA', rate: 98 }, { name: 'Apotek', rate: 89 },
                          { name: 'Tata Usaha', rate: 95 }, { name: 'UGD', rate: 99 }
                        ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="rate" name="Tingkat Kehadiran (%)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Row 2: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribusi Status Kehadiran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { week: 'Minggu 1', hadir: 95, cuti: 2, sakit: 1, dinas: 2 },
                          { week: 'Minggu 2', hadir: 92, cuti: 3, sakit: 3, dinas: 2 },
                          { week: 'Minggu 3', hadir: 96, cuti: 1, sakit: 1, dinas: 2 },
                          { week: 'Minggu 4', hadir: 94, cuti: 2, sakit: 2, dinas: 2 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="hadir" name="Hadir (%)" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                          <Line type="monotone" dataKey="cuti" name="Cuti (%)" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                          <Line type="monotone" dataKey="sakit" name="Sakit (%)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                          <Line type="monotone" dataKey="dinas" name="Dinas Luar (%)" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Analisa Keterlambatan (Durasi)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { week: 'Minggu 1', '0-15m': 12, '16-30m': 5, '30-60m': 2, '>60m': 0 },
                          { week: 'Minggu 2', '0-15m': 15, '16-30m': 8, '30-60m': 3, '>60m': 1 },
                          { week: 'Minggu 3', '0-15m': 8, '16-30m': 3, '30-60m': 1, '>60m': 0 },
                          { week: 'Minggu 4', '0-15m': 10, '16-30m': 4, '30-60m': 2, '>60m': 0 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="0-15m" stackId="a" fill="#fbbf24" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="16-30m" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="30-60m" stackId="a" fill="#ea580c" />
                          <Bar dataKey=">60m" stackId="a" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row: Wall of Fame */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-emerald-200 shadow-sm">
                  <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-4">
                    <CardTitle className="text-base flex items-center text-emerald-800">
                      <Award className="h-5 w-5 mr-2 text-emerald-600" />
                      Early Birds (Top 5)
                    </CardTitle>
                    <p className="text-xs text-emerald-600/80">Kedatangan paling konsisten awal</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-emerald-100">
                      {[
                        { name: "Budi Santoso", dept: "UGD", time: "06:45" },
                        { name: "Siti Aminah", dept: "Poli Umum", time: "06:50" },
                        { name: "Ahmad Fauzi", dept: "Tata Usaha", time: "06:52" },
                        { name: "Dewi Lestari", dept: "Apotek", time: "06:55" },
                        { name: "Rina Wati", dept: "KIA", time: "06:58" }
                      ].map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-emerald-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{person.name}</p>
                              <p className="text-xs text-slate-500">{person.dept}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">{person.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-rose-200 shadow-sm">
                  <CardHeader className="bg-rose-50 border-b border-rose-100 pb-4">
                    <CardTitle className="text-base flex items-center text-rose-800">
                      <AlertTriangle className="h-5 w-5 mr-2 text-rose-600" />
                      Frequent Late
                    </CardTitle>
                    <p className="text-xs text-rose-600/80">Perlu peningkatan kedisiplinan</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-rose-100">
                      {[
                        { name: "Joko Widodo", dept: "Poli Gigi", count: "12x" },
                        { name: "Agus Setiawan", dept: "Tata Usaha", count: "9x" },
                        { name: "Sri Mulyani", dept: "Apotek", count: "7x" },
                        { name: "Hendra Gunawan", dept: "Poli Umum", count: "6x" },
                        { name: "Maya Sari", dept: "KIA", count: "5x" }
                      ].map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-rose-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{person.name}</p>
                              <p className="text-xs text-slate-500">{person.dept}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-rose-600">{person.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 shadow-sm">
                  <CardHeader className="bg-amber-50 border-b border-amber-100 pb-4">
                    <CardTitle className="text-base flex items-center text-amber-800">
                      <Timer className="h-5 w-5 mr-2 text-amber-600" />
                      Early Runners
                    </CardTitle>
                    <p className="text-xs text-amber-600/80">Pulang lebih awal dari jadwal</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-amber-100">
                      {[
                        { name: "Rudi Hermawan", dept: "Tata Usaha", count: "8x" },
                        { name: "Nina Marlina", dept: "Poli Gigi", count: "6x" },
                        { name: "Eko Prasetyo", dept: "Apotek", count: "5x" },
                        { name: "Dian Sastro", dept: "Poli Umum", count: "4x" },
                        { name: "Fajar Siddiq", dept: "UGD", count: "3x" }
                      ].map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-amber-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{person.name}</p>
                              <p className="text-xs text-slate-500">{person.dept}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-amber-600">{person.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="persetujuan">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Permintaan Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-slate-500">Belum ada permintaan izin.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Hari Libur Nasional</CardTitle>
              <div className="flex gap-2">
                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger render={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Import Excel
                    </Button>
                  } />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Data Hari Libur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Format File</Label>
                        <p className="text-sm text-slate-500">
                          Pastikan file Excel/CSV Anda sesuai dengan format yang ditentukan. Anda dapat mengunduh contoh format di bawah ini.
                        </p>
                        <Button variant="secondary" onClick={handleDownloadTemplate} className="w-full flex items-center justify-center gap-2">
                          <Download className="h-4 w-4" />
                          Unduh Contoh Format
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Upload File</Label>
                        <Input id="file-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsImportOpen(false)}>Batal</Button>
                      <Button onClick={() => setIsImportOpen(false)}>Import Data</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                  <DialogTrigger render={
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Tambah Hari Libur
                    </Button>
                  } />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Hari Libur Nasional</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="holiday-date">Tanggal</Label>
                        <Input 
                          id="holiday-date" 
                          type="date" 
                          value={newHolidayDate}
                          onChange={(e) => setNewHolidayDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="holiday-name">Keterangan</Label>
                        <Input 
                          id="holiday-name" 
                          placeholder="Contoh: Idul Fitri" 
                          value={newHolidayName}
                          onChange={(e) => setNewHolidayName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddHolidayOpen(false)}>Batal</Button>
                      <Button onClick={handleAddHoliday} disabled={!newHolidayDate || !newHolidayName}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data hari libur.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Tanggal</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right w-[100px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidays.map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">
                            {new Date(holiday.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{holiday.name}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteHoliday(holiday.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengumuman">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pengumuman</CardTitle>
              <Dialog open={isAddAnnouncementOpen} onOpenChange={setIsAddAnnouncementOpen}>
                <DialogTrigger render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Buat Pengumuman
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Pengumuman Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="announcement-title">Judul Pengumuman</Label>
                      <Input 
                        id="announcement-title" 
                        placeholder="Contoh: Rapat Evaluasi Bulanan" 
                        value={newAnnouncementTitle}
                        onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="announcement-content">Isi Pengumuman</Label>
                      <Input 
                        id="announcement-content" 
                        placeholder="Detail pengumuman..." 
                        value={newAnnouncementContent}
                        onChange={(e) => setNewAnnouncementContent(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="announcement-expiry">Tanggal Kadaluarsa</Label>
                      <Input 
                        id="announcement-expiry" 
                        type="date" 
                        value={newAnnouncementExpiry}
                        onChange={(e) => setNewAnnouncementExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAnnouncementOpen(false)}>Batal</Button>
                    <Button onClick={handleAddAnnouncement} disabled={!newAnnouncementTitle || !newAnnouncementContent || !newAnnouncementExpiry}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada pengumuman.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal Dibuat</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Isi</TableHead>
                        <TableHead>Kadaluarsa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(announcement.date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="font-medium">{announcement.title}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{announcement.content}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(announcement.expiryDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {announcement.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleToggleAnnouncementStatus(announcement.id)}
                              >
                                {announcement.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
