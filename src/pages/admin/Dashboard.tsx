import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [appName, setAppName] = useState("Si Abon Megilan");
  const [companyName, setCompanyName] = useState("Puskesmas Sehat");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.generalSettings?.appName) setAppName(data.generalSettings.appName);
          if (data.generalSettings?.companyName) setCompanyName(data.generalSettings.companyName);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const [stats, setStats] = useState([
    { title: "Total Karyawan", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Hadir Hari Ini", value: "0", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Terlambat", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Belum Absen", value: "0", icon: UserX, color: "text-red-600", bg: "bg-red-100" },
  ]);

  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [notCheckedOut, setNotCheckedOut] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, attRes, setRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/attendance'),
          fetch('/api/settings')
        ]);
        
        const employees = empRes.ok ? await empRes.json() : [];
        const attendance = attRes.ok ? await attRes.json() : [];
        
        if (setRes.ok) {
          const data = await setRes.json();
          if (data.generalSettings?.appName) setAppName(data.generalSettings.appName);
          if (data.generalSettings?.companyName) setCompanyName(data.generalSettings.companyName);
        }

        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter((a: any) => a.date === today);
        const presentToday = todayAttendance.filter((a: any) => a.type === 'in');
        
        // Simple logic for late: if time > 08:00
        const lateToday = presentToday.filter((a: any) => a.time > '08:00');
        
        setStats([
          { title: "Total Karyawan", value: employees.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Hadir Hari Ini", value: presentToday.length.toString(), icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
          { title: "Terlambat", value: lateToday.length.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Belum Absen", value: Math.max(0, employees.length - presentToday.length).toString(), icon: UserX, color: "text-red-600", bg: "bg-red-100" },
        ]);

        // Pending Leaves: type 'izin'/'sakit'/'Cuti' but status 'pending' (assuming status is 'pending' for new requests)
        setPendingLeaves(attendance.filter((a: any) => ['izin', 'sakit', 'Cuti'].includes(a.type) && a.status === 'pending'));

        // Not Checked Out: Checked in today, but no 'out' record
        const checkedInNips = presentToday.map((a: any) => a.nip);
        const checkedOutNips = todayAttendance.filter((a: any) => a.type === 'out').map((a: any) => a.nip);
        setNotCheckedOut(employees.filter((e: any) => checkedInNips.includes(e.nip) && !checkedOutNips.includes(e.nip)));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard {appName}</h1>
        <p className="text-sm text-slate-500">Ringkasan absensi hari ini untuk {companyName}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permintaan Izin Menunggu ({pendingLeaves.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length > 0 ? (
              <ul className="space-y-2">
                {pendingLeaves.map((leave, i) => (
                  <li key={i} className="text-sm text-slate-700">{leave.name} - {leave.type}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500 text-center py-8">
                Tidak ada permintaan izin baru.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Karyawan Belum Checkout ({notCheckedOut.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {notCheckedOut.length > 0 ? (
              <ul className="space-y-2">
                {notCheckedOut.map((emp, i) => (
                  <li key={i} className="text-sm text-slate-700">{emp.name}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500 text-center py-8">
                Semua karyawan shift pagi telah checkout.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
