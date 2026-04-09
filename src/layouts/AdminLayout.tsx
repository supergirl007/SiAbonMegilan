import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, Clock, Settings, LogOut, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [appName, setAppName] = useState("Si Abon Megilan");
  const [appLogo, setAppLogo] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.generalSettings?.appName) {
            setAppName(data.generalSettings.appName);
          }
          if (data.generalSettings?.appLogo) {
            setAppLogo(data.generalSettings.appLogo);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isPathActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header & Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center mr-8">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="h-8 w-8 mr-2 object-contain" />
                ) : (
                  <Activity className="h-8 w-8 text-emerald-600 mr-2" />
                )}
                <span className="font-bold text-xl text-slate-900 tracking-tight">{appName}</span>
              </div>
              
              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isPathActive('/admin') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </div>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center focus:outline-none ${
                    isPathActive('/admin/attendance') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Clock className="mr-2 h-4 w-4" />
                    Absensi
                    <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=harian" className="w-full cursor-pointer" />}>
                      Absen Harian
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=bulanan" className="w-full cursor-pointer" />}>
                      Absensi Bulanan
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=analisa" className="w-full cursor-pointer" />}>
                      Analisa Data
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=persetujuan" className="w-full cursor-pointer" />}>
                      Persetujuan Izin
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=holidays" className="w-full cursor-pointer" />}>
                      Hari Libur
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/attendance?tab=pengumuman" className="w-full cursor-pointer" />}>
                      Pengumuman
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center focus:outline-none ${
                    isPathActive('/admin/employees') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Users className="mr-2 h-4 w-4" />
                    Master Data
                    <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem render={<Link to="/admin/employees?tab=karyawan" className="w-full cursor-pointer" />}>
                      Karyawan
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/employees?tab=lokasi" className="w-full cursor-pointer" />}>
                      Alamat Kantor
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/employees?tab=shift" className="w-full cursor-pointer" />}>
                      Shift
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/employees?tab=admin" className="w-full cursor-pointer" />}>
                      Administrator
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center focus:outline-none ${
                    isPathActive('/admin/settings') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Sistem
                    <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem render={<Link to="/admin/settings?tab=general" className="w-full cursor-pointer" />}>
                      General
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/settings?tab=absensi" className="w-full cursor-pointer" />}>
                      Absensi
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/settings?tab=leave" className="w-full cursor-pointer" />}>
                      Leave & Time off
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link to="/admin/settings?tab=data" className="w-full cursor-pointer" />}>
                      Data Management
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            {/* Mobile Menu Button & User Profile */}
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 -mr-2">
                    <Menu className="h-6 w-6" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem render={<Link to="/admin" className="w-full cursor-pointer" />}>
                      <LayoutDashboard className="mr-2 h-4 w-4"/> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Absensi</DropdownMenuLabel>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=harian" className="w-full cursor-pointer pl-6" />}>Absen Harian</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=bulanan" className="w-full cursor-pointer pl-6" />}>Absensi Bulanan</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=analisa" className="w-full cursor-pointer pl-6" />}>Analisa Data</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=persetujuan" className="w-full cursor-pointer pl-6" />}>Persetujuan Izin</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=holidays" className="w-full cursor-pointer pl-6" />}>Hari Libur</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/attendance?tab=pengumuman" className="w-full cursor-pointer pl-6" />}>Pengumuman</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Master Data</DropdownMenuLabel>
                      <DropdownMenuItem render={<Link to="/admin/employees?tab=karyawan" className="w-full cursor-pointer pl-6" />}>Karyawan</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/employees?tab=lokasi" className="w-full cursor-pointer pl-6" />}>Alamat Kantor</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/employees?tab=shift" className="w-full cursor-pointer pl-6" />}>Shift</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/employees?tab=admin" className="w-full cursor-pointer pl-6" />}>Administrator</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Sistem</DropdownMenuLabel>
                      <DropdownMenuItem render={<Link to="/admin/settings?tab=general" className="w-full cursor-pointer pl-6" />}>General</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/settings?tab=absensi" className="w-full cursor-pointer pl-6" />}>Absensi</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/settings?tab=leave" className="w-full cursor-pointer pl-6" />}>Leave & Time off</DropdownMenuItem>
                      <DropdownMenuItem render={<Link to="/admin/settings?tab=data" className="w-full cursor-pointer pl-6" />}>Data Management</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {user.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.nip}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
