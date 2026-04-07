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

  const stats = [
    { title: "Total Karyawan", value: "124", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Hadir Hari Ini", value: "112", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Terlambat", value: "5", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Belum Absen", value: "7", icon: UserX, color: "text-red-600", bg: "bg-red-100" },
  ];

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
            <CardTitle>Permintaan Izin Menunggu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 text-center py-8">
              Tidak ada permintaan izin baru.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Karyawan Belum Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 text-center py-8">
              Semua karyawan shift pagi telah checkout.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
