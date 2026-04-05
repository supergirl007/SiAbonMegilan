import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmployees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "karyawan";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // State for Employees
  const [employees, setEmployees] = useState<{id: string, name: string, nip: string, office: string, email: string, password?: string, gender?: string, cluster?: string, unit?: string}[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpNip, setNewEmpNip] = useState("");
  const [newEmpOffice, setNewEmpOffice] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpGender, setNewEmpGender] = useState("");
  const [newEmpCluster, setNewEmpCluster] = useState("");
  const [newEmpUnit, setNewEmpUnit] = useState("");

  // State for Locations
  const [locations, setLocations] = useState<{id: string, name: string, coordinates: string}[]>([]);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCoords, setNewLocCoords] = useState("");

  // State for Shifts
  const [shifts, setShifts] = useState<{id: string, name: string, startTime: string, endTime: string, crossesMidnight: boolean, isActive: boolean}[]>([]);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("");
  const [newShiftEnd, setNewShiftEnd] = useState("");
  const [newShiftCrossesMidnight, setNewShiftCrossesMidnight] = useState(false);

  // State for Admins
  const [admins, setAdmins] = useState<{id: string, name: string, nip: string, email: string, phone: string, group: string, isActive: boolean, access: string[]}[]>([]);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminNip, setNewAdminNip] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminGroup, setNewAdminGroup] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminAccess, setNewAdminAccess] = useState<string[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem('employeesData');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      // Default mock data
      setEmployees([
        { id: "1", name: "Admin User", nip: "123456", office: "Kantor Induk", email: "admin@puskesmas.com" },
        { id: "2", name: "Regular User", nip: "654321", office: "Pustu A", email: "user@puskesmas.com" }
      ]);
    }

    const savedLocations = localStorage.getItem('locationsData');
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    } else {
      setLocations([
        { id: "1", name: "Kantor Induk", coordinates: "-7.1234, 112.1234" },
        { id: "2", name: "Pustu A", coordinates: "-7.1235, 112.1235" }
      ]);
    }

    const savedShifts = localStorage.getItem('shiftsData');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    } else {
      setShifts([
        { id: "1", name: "Pagi", startTime: "08:00", endTime: "16:00", crossesMidnight: false, isActive: true },
        { id: "2", name: "Malam", startTime: "20:00", endTime: "04:00", crossesMidnight: true, isActive: true }
      ]);
    }

    const savedAdmins = localStorage.getItem('adminsData');
    if (savedAdmins) {
      setAdmins(JSON.parse(savedAdmins));
    } else {
      setAdmins([
        { id: "1", name: "Super Admin", nip: "000000", email: "super@admin.com", phone: "081234567890", group: "Superadmin", isActive: true, access: ["Absensi", "Master Data", "Sistem"] }
      ]);
    }
  }, []);

  const handleAddEmployee = () => {
    if (newEmpName && newEmpNip && newEmpOffice && newEmpEmail && newEmpGender && newEmpCluster && newEmpUnit) {
      const newEmployee = {
        id: Date.now().toString(),
        name: newEmpName,
        nip: newEmpNip,
        office: newEmpOffice,
        email: newEmpEmail,
        gender: newEmpGender,
        cluster: newEmpCluster,
        unit: newEmpUnit,
        password: "123456" // Default password
      };
      
      const updatedEmployees = [...employees, newEmployee];
      setEmployees(updatedEmployees);
      localStorage.setItem('employeesData', JSON.stringify(updatedEmployees));
      
      toast.success("Karyawan berhasil ditambahkan dengan password default: 123456");
      
      setNewEmpName("");
      setNewEmpNip("");
      setNewEmpOffice("");
      setNewEmpEmail("");
      setNewEmpGender("");
      setNewEmpCluster("");
      setNewEmpUnit("");
      setIsAddEmployeeOpen(false);
    } else {
      toast.error("Mohon lengkapi semua data");
    }
  };

  const handleDeleteEmployee = (id: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    setEmployees(updatedEmployees);
    localStorage.setItem('employeesData', JSON.stringify(updatedEmployees));
    toast.success("Karyawan berhasil dihapus");
  };

  const handleAddLocation = () => {
    if (newLocName && newLocCoords) {
      const newLocation = {
        id: Date.now().toString(),
        name: newLocName,
        coordinates: newLocCoords
      };
      const updatedLocations = [...locations, newLocation];
      setLocations(updatedLocations);
      localStorage.setItem('locationsData', JSON.stringify(updatedLocations));
      toast.success("Lokasi berhasil ditambahkan");
      setNewLocName("");
      setNewLocCoords("");
      setIsAddLocationOpen(false);
    } else {
      toast.error("Mohon lengkapi semua data");
    }
  };

  const handleDeleteLocation = (id: string) => {
    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    localStorage.setItem('locationsData', JSON.stringify(updatedLocations));
    toast.success("Lokasi berhasil dihapus");
  };

  const handleAddShift = () => {
    if (newShiftName && newShiftStart && newShiftEnd) {
      const newShift = {
        id: Date.now().toString(),
        name: newShiftName,
        startTime: newShiftStart,
        endTime: newShiftEnd,
        crossesMidnight: newShiftCrossesMidnight,
        isActive: true
      };
      const updatedShifts = [...shifts, newShift];
      setShifts(updatedShifts);
      localStorage.setItem('shiftsData', JSON.stringify(updatedShifts));
      toast.success("Shift berhasil ditambahkan");
      setNewShiftName("");
      setNewShiftStart("");
      setNewShiftEnd("");
      setNewShiftCrossesMidnight(false);
      setIsAddShiftOpen(false);
    } else {
      toast.error("Mohon lengkapi semua data shift");
    }
  };

  const handleDeleteShift = (id: string) => {
    const updatedShifts = shifts.filter(shift => shift.id !== id);
    setShifts(updatedShifts);
    localStorage.setItem('shiftsData', JSON.stringify(updatedShifts));
    toast.success("Shift berhasil dihapus");
  };

  const handleToggleShiftStatus = (id: string) => {
    const updatedShifts = shifts.map(shift => shift.id === id ? { ...shift, isActive: !shift.isActive } : shift);
    setShifts(updatedShifts);
    localStorage.setItem('shiftsData', JSON.stringify(updatedShifts));
    toast.success("Status shift berhasil diubah");
  };

  const handleAddAdmin = () => {
    if (newAdminName && newAdminNip && newAdminEmail && newAdminPassword && newAdminGroup && newAdminPhone) {
      const newAdmin = {
        id: Date.now().toString(),
        name: newAdminName,
        nip: newAdminNip,
        email: newAdminEmail,
        password: newAdminPassword,
        group: newAdminGroup,
        phone: newAdminPhone,
        isActive: true,
        access: newAdminAccess
      };
      const updatedAdmins = [...admins, newAdmin];
      setAdmins(updatedAdmins);
      localStorage.setItem('adminsData', JSON.stringify(updatedAdmins));
      toast.success("Admin berhasil ditambahkan");
      setNewAdminName("");
      setNewAdminNip("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminGroup("");
      setNewAdminPhone("");
      setNewAdminAccess([]);
      setIsAddAdminOpen(false);
    } else {
      toast.error("Mohon lengkapi semua data admin");
    }
  };

  const handleDeleteAdmin = (id: string) => {
    const updatedAdmins = admins.filter(admin => admin.id !== id);
    setAdmins(updatedAdmins);
    localStorage.setItem('adminsData', JSON.stringify(updatedAdmins));
    toast.success("Admin berhasil dihapus");
  };

  const handleToggleAdminStatus = (id: string) => {
    const updatedAdmins = admins.map(admin => admin.id === id ? { ...admin, isActive: !admin.isActive } : admin);
    setAdmins(updatedAdmins);
    localStorage.setItem('adminsData', JSON.stringify(updatedAdmins));
    toast.success("Status admin berhasil diubah");
  };

  const handleAccessToggle = (menu: string) => {
    setNewAdminAccess(prev => 
      prev.includes(menu) ? prev.filter(item => item !== menu) : [...prev, menu]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-500">Kelola data karyawan, lokasi, shift, dan administrator.</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsContent value="karyawan">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kelola Tenaga Kerja</CardTitle>
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Karyawan
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp-name">Nama Lengkap</Label>
                      <Input 
                        id="emp-name" 
                        placeholder="Masukkan nama lengkap" 
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-nip">NIP</Label>
                      <Input 
                        id="emp-nip" 
                        placeholder="Masukkan NIP" 
                        value={newEmpNip}
                        onChange={(e) => setNewEmpNip(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emp-gender">Jenis Kelamin</Label>
                        <Select value={newEmpGender} onValueChange={setNewEmpGender}>
                          <SelectTrigger id="emp-gender">
                            <SelectValue placeholder="Pilih Jenis Kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emp-cluster">Klaster</Label>
                        <Select value={newEmpCluster} onValueChange={setNewEmpCluster}>
                          <SelectTrigger id="emp-cluster">
                            <SelectValue placeholder="Pilih Klaster" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Klaster 1">Klaster 1</SelectItem>
                            <SelectItem value="Klaster 2">Klaster 2</SelectItem>
                            <SelectItem value="Klaster 3">Klaster 3</SelectItem>
                            <SelectItem value="Klaster 4">Klaster 4</SelectItem>
                            <SelectItem value="Klaster 5">Klaster 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-unit">Unit kerja/Unit Layanan</Label>
                      <Select value={newEmpUnit} onValueChange={setNewEmpUnit}>
                        <SelectTrigger id="emp-unit">
                          <SelectValue placeholder="Pilih Unit Kerja" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manajemen">Manajemen</SelectItem>
                          <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                          <SelectItem value="UGD/Rawat Inap">UGD/Rawat Inap</SelectItem>
                          <SelectItem value="Poned">Poned</SelectItem>
                          <SelectItem value="Pustu">Pustu</SelectItem>
                          <SelectItem value="Polindes">Polindes</SelectItem>
                          <SelectItem value="Ponkesdes">Ponkesdes</SelectItem>
                          <SelectItem value="Armada">Armada</SelectItem>
                          <SelectItem value="Kebersihan">Kebersihan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-office">Alamat Kantor</Label>
                      <Select value={newEmpOffice} onValueChange={setNewEmpOffice}>
                        <SelectTrigger id="emp-office">
                          <SelectValue placeholder="Pilih Alamat Kantor" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(loc => (
                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-email">Email</Label>
                      <Input 
                        id="emp-email" 
                        type="email"
                        placeholder="email@puskesmas.com" 
                        value={newEmpEmail}
                        onChange={(e) => setNewEmpEmail(e.target.value)}
                      />
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
                      <strong>Catatan:</strong> Password default untuk karyawan baru adalah <strong>123456</strong>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>Batal</Button>
                    <Button onClick={handleAddEmployee}>Simpan ke Database</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data karyawan.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>L/P</TableHead>
                        <TableHead>Klaster</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Alamat Kantor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell>{emp.nip}</TableCell>
                          <TableCell>{emp.gender === "Laki-laki" ? "L" : emp.gender === "Perempuan" ? "P" : "-"}</TableCell>
                          <TableCell>{emp.cluster || "-"}</TableCell>
                          <TableCell>{emp.unit || "-"}</TableCell>
                          <TableCell>{emp.office}</TableCell>
                          <TableCell>{emp.email}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteEmployee(emp.id)}
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

        <TabsContent value="lokasi">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pengaturan Lokasi Kantor</CardTitle>
              <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
                <DialogTrigger render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Lokasi
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Lokasi Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="loc-name">Nama Desa / Lokasi</Label>
                      <Input 
                        id="loc-name" 
                        placeholder="Contoh: Desa Sukamaju" 
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loc-coords">Koordinat (Google Maps)</Label>
                      <Input 
                        id="loc-coords" 
                        placeholder="Contoh: -7.123456, 112.123456" 
                        value={newLocCoords}
                        onChange={(e) => setNewLocCoords(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">Koordinat ini akan digunakan untuk validasi jarak saat absensi.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddLocationOpen(false)}>Batal</Button>
                    <Button onClick={handleAddLocation}>Simpan ke Database</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data lokasi.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Desa / Lokasi</TableHead>
                        <TableHead>Koordinat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell>{loc.coordinates}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteLocation(loc.id)}
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

        <TabsContent value="shift">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Konfigurasi Jadwal Kerja</CardTitle>
              <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
                <DialogTrigger render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Shift
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Shift Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="shift-name">Nama Shift</Label>
                      <Input 
                        id="shift-name" 
                        placeholder="Contoh: Pagi, Malam" 
                        value={newShiftName}
                        onChange={(e) => setNewShiftName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shift-start">Jam Awal</Label>
                        <Input 
                          id="shift-start" 
                          type="time"
                          value={newShiftStart}
                          onChange={(e) => setNewShiftStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shift-end">Jam Akhir</Label>
                        <Input 
                          id="shift-end" 
                          type="time"
                          value={newShiftEnd}
                          onChange={(e) => setNewShiftEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="crosses-midnight" 
                        checked={newShiftCrossesMidnight}
                        onCheckedChange={(checked) => setNewShiftCrossesMidnight(checked as boolean)}
                      />
                      <Label htmlFor="crosses-midnight" className="text-sm font-normal">
                        Melewati hari (besok) - Centang jika jam akhir berada di hari berikutnya.
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddShiftOpen(false)}>Batal</Button>
                    <Button onClick={handleAddShift}>Simpan ke Database</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data shift kerja.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Shift</TableHead>
                        <TableHead>Jam Awal</TableHead>
                        <TableHead>Jam Akhir</TableHead>
                        <TableHead>Melewati Hari</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.name}</TableCell>
                          <TableCell>{shift.startTime}</TableCell>
                          <TableCell>{shift.endTime}</TableCell>
                          <TableCell>{shift.crossesMidnight ? "Ya" : "Tidak"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                              {shift.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleShiftStatus(shift.id)}
                            >
                              {shift.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteShift(shift.id)}
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

        <TabsContent value="admin">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pengaturan Hak Akses</CardTitle>
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Admin
                  </Button>
                } />
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tambah Administrator Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-name">Nama User</Label>
                        <Input 
                          id="admin-name" 
                          placeholder="Masukkan nama" 
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-nip">NIP/NIK</Label>
                        <Input 
                          id="admin-nip" 
                          placeholder="Masukkan NIP/NIK" 
                          value={newAdminNip}
                          onChange={(e) => setNewAdminNip(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input 
                          id="admin-email" 
                          type="email"
                          placeholder="email@puskesmas.com" 
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-phone">No Telepon</Label>
                        <Input 
                          id="admin-phone" 
                          placeholder="0812..." 
                          value={newAdminPhone}
                          onChange={(e) => setNewAdminPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input 
                          id="admin-password" 
                          type="password"
                          placeholder="••••••••" 
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-group">Group Akses</Label>
                        <Select value={newAdminGroup} onValueChange={setNewAdminGroup}>
                          <SelectTrigger id="admin-group">
                            <SelectValue placeholder="Pilih Group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Superadmin">Superadmin</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-base">Pengaturan Hak Akses Menu</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {["Dashboard", "Absensi", "Master Data", "Sistem", "Laporan"].map((menu) => (
                          <div key={menu} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`access-${menu}`} 
                              checked={newAdminAccess.includes(menu)}
                              onCheckedChange={() => handleAccessToggle(menu)}
                            />
                            <Label htmlFor={`access-${menu}`} className="font-normal cursor-pointer">
                              {menu}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>Batal</Button>
                    <Button onClick={handleAddAdmin}>Simpan ke Database</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data administrator.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIP/NIK</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.nip}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.group === 'Superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {admin.group}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                              {admin.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdminStatus(admin.id)}
                            >
                              {admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAdmin(admin.id)}
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
      </Tabs>
    </div>
  );
}
