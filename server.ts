import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mock Database (In-Memory for Prototype)
  const db = {
    users: [
      { id: 1, nip: '123456', name: 'Admin User', email: 'admin@puskesmas.com', role: 'admin', password: 'password' },
      { id: 2, nip: '654321', name: 'Regular User', email: 'user@puskesmas.com', role: 'user', password: 'password' },
    ],
    employees: [
      { id: '1', name: 'Admin User', nip: '123456', office: 'Kantor Induk', email: 'admin@puskesmas.com', gender: 'Laki-laki', cluster: 'Klaster 1', unit: 'Manajemen' },
      { id: '2', name: 'Regular User', nip: '654321', office: 'Pustu A', email: 'user@puskesmas.com', gender: 'Perempuan', cluster: 'Klaster 2', unit: 'Pustu' }
    ],
    attendance: [],
    locations: [
      { id: 1, name: 'Kantor Induk', lat: -7.250445, lng: 112.768845, radius: 300 },
    ],
    settings: {
      appName: 'Si Abon Megilan',
      companyName: 'Puskesmas Sehat',
      tolerance: 15,
    }
  };

  // Google Spreadsheet Setup
  let doc: GoogleSpreadsheet | null = null;
  if (process.env.SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      console.log('Google Spreadsheet connected:', doc.title);
    } catch (error) {
      console.error('Failed to connect to Google Spreadsheet:', error);
    }
  }

  // Helper to get or create sheet
  async function getOrCreateSheet(title: string, headerValues: string[]) {
    if (!doc) return null;
    let sheet = doc.sheetsByTitle[title];
    if (!sheet) {
      sheet = await doc.addSheet({ title, headerValues });
    }
    return sheet;
  }

  // API Routes

  // --- Employees API ---
  app.get('/api/employees', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Employees', ['id', 'name', 'nip', 'office', 'email', 'gender', 'cluster', 'unit', 'password']);
        if (sheet) {
          const rows = await sheet.getRows();
          const employees = rows.map(row => ({
            id: row.get('id'),
            name: row.get('name'),
            nip: row.get('nip'),
            office: row.get('office'),
            email: row.get('email'),
            gender: row.get('gender'),
            cluster: row.get('cluster'),
            unit: row.get('unit'),
            password: row.get('password')
          }));
          return res.json(employees);
        }
      } catch (error) {
        console.error('Error fetching employees from spreadsheet:', error);
      }
    }
    res.json(db.employees);
  });

  app.post('/api/employees', async (req, res) => {
    const employee = req.body;
    
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Employees', ['id', 'name', 'nip', 'office', 'email', 'gender', 'cluster', 'unit', 'password']);
        if (sheet) {
          await sheet.addRow(employee);
        }
      } catch (error) {
        console.error('Error saving employee to spreadsheet:', error);
      }
    } else {
      db.employees.push(employee);
    }
    res.json({ success: true, message: 'Karyawan berhasil ditambahkan' });
  });

  app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    if (doc) {
      try {
        const sheet = doc.sheetsByTitle['Employees'];
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => r.get('id') === id);
          if (rowToDelete) {
            await rowToDelete.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting employee from spreadsheet:', error);
      }
    } else {
      db.employees = db.employees.filter(e => e.id !== id);
    }
    res.json({ success: true, message: 'Karyawan berhasil dihapus' });
  });

  // --- Admins API ---
  app.get('/api/admins', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Admins', ['id', 'name', 'nip', 'email', 'phone', 'group', 'isActive', 'access', 'password']);
        if (sheet) {
          const rows = await sheet.getRows();
          const admins = rows.map(row => ({
            id: row.get('id'),
            name: row.get('name'),
            nip: row.get('nip'),
            email: row.get('email'),
            phone: row.get('phone'),
            group: row.get('group'),
            isActive: row.get('isActive') === 'true',
            access: row.get('access') ? JSON.parse(row.get('access')) : [],
            password: row.get('password')
          }));
          return res.json(admins);
        }
      } catch (error) {
        console.error('Error fetching admins from spreadsheet:', error);
      }
    }
    res.json([]);
  });

  app.post('/api/admins', async (req, res) => {
    const admin = req.body;
    
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Admins', ['id', 'name', 'nip', 'email', 'phone', 'group', 'isActive', 'access', 'password']);
        if (sheet) {
          await sheet.addRow({
            ...admin,
            isActive: admin.isActive.toString(),
            access: JSON.stringify(admin.access)
          });
        }
      } catch (error) {
        console.error('Error saving admin to spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Admin berhasil ditambahkan' });
  });

  app.delete('/api/admins/:id', async (req, res) => {
    const { id } = req.params;
    if (doc) {
      try {
        const sheet = doc.sheetsByTitle['Admins'];
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => r.get('id') === id);
          if (rowToDelete) {
            await rowToDelete.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting admin from spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Admin berhasil dihapus' });
  });

  // --- Auth API ---
  app.post('/api/login', async (req, res) => {
    const { nip, password } = req.body;
    
    let user = null;
    if (doc) {
      try {
        // Check Admins first
        const adminSheet = doc.sheetsByTitle['Admins'];
        if (adminSheet) {
          const rows = await adminSheet.getRows();
          const row = rows.find(r => r.get('nip') === nip && r.get('password') === password && r.get('isActive') === 'true');
          if (row) {
            user = { id: row.get('id'), nip: row.get('nip'), name: row.get('name'), role: 'admin' };
          }
        }

        // If not admin, check Users
        if (!user) {
          const userSheet = doc.sheetsByTitle['Users'];
          if (userSheet) {
            const rows = await userSheet.getRows();
            const row = rows.find(r => r.get('nip') === nip && r.get('password') === password);
            if (row) {
              user = { id: row.get('id'), nip: row.get('nip'), name: row.get('name'), role: row.get('role') };
            }
          }
        }
      } catch (error) {
        console.error('Error logging in from spreadsheet:', error);
      }
    }
    
    if (!user) {
      user = db.users.find(u => u.nip === nip && u.password === password);
    }

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'NIP atau Password salah' });
    }
  });

  app.post('/api/register', async (req, res) => {
    const { nip, name, email, password, gender, cluster, unit } = req.body;
    
    // 1. Validate NIP against Employees data
    let isValidEmployee = false;
    if (doc) {
      try {
        const empSheet = doc.sheetsByTitle['Employees'];
        if (empSheet) {
          const rows = await empSheet.getRows();
          isValidEmployee = rows.some(r => r.get('nip') === nip);
        }
      } catch (error) {
        console.error('Error validating employee NIP:', error);
      }
    }
    
    if (!isValidEmployee) {
      isValidEmployee = db.employees.some(e => e.nip === nip);
    }

    if (!isValidEmployee) {
      return res.status(400).json({ success: false, message: 'NIP tidak terdaftar sebagai karyawan. Hubungi Admin.' });
    }

    // 2. Check if user already exists
    let userExists = false;
    if (doc) {
      try {
        const userSheet = await getOrCreateSheet('Users', ['id', 'nip', 'name', 'email', 'role', 'password', 'gender', 'cluster', 'unit']);
        if (userSheet) {
          const rows = await userSheet.getRows();
          userExists = rows.some(r => r.get('nip') === nip);
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
      }
    } else {
      userExists = db.users.some(u => u.nip === nip);
    }

    if (userExists) {
      return res.status(400).json({ success: false, message: 'NIP sudah terdaftar sebagai user' });
    }

    const newUser = {
      id: Date.now().toString(),
      nip,
      name,
      email,
      role: 'user',
      password,
      gender,
      cluster,
      unit
    };

    // Save to Google Spreadsheet if configured
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Users', ['id', 'nip', 'name', 'email', 'role', 'password', 'gender', 'cluster', 'unit']);
        if (sheet) {
          await sheet.addRow(newUser);
        }
      } catch (error) {
        console.error('Error saving user to spreadsheet:', error);
      }
    } else {
      db.users.push(newUser as any);
    }

    res.json({ success: true, message: 'Pendaftaran berhasil' });
  });

  // --- Attendance API ---
  app.get('/api/attendance', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Attendance', ['id', 'nip', 'name', 'date', 'time', 'type', 'location', 'status', 'photoUrl']);
        if (sheet) {
          const rows = await sheet.getRows();
          const attendance = rows.map(row => ({
            id: row.get('id'),
            nip: row.get('nip'),
            name: row.get('name'),
            date: row.get('date'),
            time: row.get('time'),
            type: row.get('type'),
            location: row.get('location'),
            status: row.get('status'),
            photoUrl: row.get('photoUrl')
          }));
          return res.json(attendance);
        }
      } catch (error) {
        console.error('Error fetching attendance from spreadsheet:', error);
      }
    }
    res.json(db.attendance);
  });

  app.post('/api/attendance', async (req, res) => {
    const attendanceData = req.body;
    // attendanceData: { nip, name, date, time, type, location, status, photoUrl }
    
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Attendance', ['id', 'nip', 'name', 'date', 'time', 'type', 'location', 'status', 'photoUrl']);
        if (sheet) {
          await sheet.addRow({
            id: Date.now().toString(),
            ...attendanceData
          });
        }
      } catch (error) {
        console.error('Error saving attendance to spreadsheet:', error);
      }
    } else {
      db.attendance.push({ id: Date.now().toString(), ...attendanceData } as any);
    }

    res.json({ success: true, message: 'Absensi berhasil dicatat' });
  });

  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = db.users.find(u => u.email === email);

    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'Jika email terdaftar, tautan reset telah dikirim.' });
    }

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=mock-token-${user.id}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Si Abon Megilan <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset Password - Si Abon Megilan',
          html: `<p>Halo ${user.name},</p><p>Klik tautan berikut untuk mereset password Anda:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
        });
      } catch (error) {
        console.error('Error sending email via Resend:', error);
        return res.status(500).json({ success: false, message: 'Gagal mengirim email' });
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${user.email}, Subject: Reset Password, Link: ${resetLink}`);
    }

    res.json({ success: true, message: 'Email reset password telah dikirim' });
  });

  app.get('/api/users', (req, res) => {
    res.json(db.users.map(u => ({ id: u.id, nip: u.nip, name: u.name, role: u.role })));
  });

  // --- Locations API ---
  app.get('/api/locations', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Locations', ['id', 'name', 'coordinates']);
        if (sheet) {
          const rows = await sheet.getRows();
          const locations = rows.map(row => ({
            id: row.get('id'),
            name: row.get('name'),
            coordinates: row.get('coordinates')
          }));
          return res.json(locations);
        }
      } catch (error) {
        console.error('Error fetching locations from spreadsheet:', error);
      }
    }
    res.json([
      { id: "1", name: "Kantor Induk", coordinates: "-7.1234, 112.1234" },
      { id: "2", name: "Pustu A", coordinates: "-7.1235, 112.1235" }
    ]);
  });

  app.post('/api/locations', async (req, res) => {
    const location = req.body;
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Locations', ['id', 'name', 'coordinates']);
        if (sheet) {
          await sheet.addRow(location);
        }
      } catch (error) {
        console.error('Error saving location to spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Lokasi berhasil ditambahkan' });
  });

  app.delete('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    if (doc) {
      try {
        const sheet = doc.sheetsByTitle['Locations'];
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => r.get('id') === id);
          if (rowToDelete) {
            await rowToDelete.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting location from spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Lokasi berhasil dihapus' });
  });

  // --- Shifts API ---
  app.get('/api/shifts', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Shifts', ['id', 'name', 'startTime', 'endTime', 'crossesMidnight', 'isActive']);
        if (sheet) {
          const rows = await sheet.getRows();
          const shifts = rows.map(row => ({
            id: row.get('id'),
            name: row.get('name'),
            startTime: row.get('startTime'),
            endTime: row.get('endTime'),
            crossesMidnight: row.get('crossesMidnight') === 'true',
            isActive: row.get('isActive') === 'true'
          }));
          return res.json(shifts);
        }
      } catch (error) {
        console.error('Error fetching shifts from spreadsheet:', error);
      }
    }
    res.json([
      { id: "1", name: "Pagi", startTime: "08:00", endTime: "16:00", crossesMidnight: false, isActive: true },
      { id: "2", name: "Malam", startTime: "20:00", endTime: "04:00", crossesMidnight: true, isActive: true }
    ]);
  });

  app.post('/api/shifts', async (req, res) => {
    const shift = req.body;
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Shifts', ['id', 'name', 'startTime', 'endTime', 'crossesMidnight', 'isActive']);
        if (sheet) {
          await sheet.addRow({
            ...shift,
            crossesMidnight: shift.crossesMidnight.toString(),
            isActive: shift.isActive.toString()
          });
        }
      } catch (error) {
        console.error('Error saving shift to spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Shift berhasil ditambahkan' });
  });

  app.delete('/api/shifts/:id', async (req, res) => {
    const { id } = req.params;
    if (doc) {
      try {
        const sheet = doc.sheetsByTitle['Shifts'];
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => r.get('id') === id);
          if (rowToDelete) {
            await rowToDelete.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting shift from spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Shift berhasil dihapus' });
  });

  // --- Settings API ---
  app.get('/api/settings', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Settings', ['key', 'value']);
        if (sheet) {
          const rows = await sheet.getRows();
          const settings: any = {};
          rows.forEach(row => {
            try {
              settings[row.get('key')] = JSON.parse(row.get('value'));
            } catch (e) {
              settings[row.get('key')] = row.get('value');
            }
          });
          if (Object.keys(settings).length > 0) {
            return res.json(settings);
          }
        }
      } catch (error) {
        console.error('Error fetching settings from spreadsheet:', error);
      }
    }
    res.json(db.settings);
  });

  app.post('/api/settings', async (req, res) => {
    const { key, value } = req.body;
    db.settings = { ...db.settings, [key]: value };
    
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Settings', ['key', 'value']);
        if (sheet) {
          const rows = await sheet.getRows();
          const existingRow = rows.find(r => r.get('key') === key);
          if (existingRow) {
            existingRow.set('value', JSON.stringify(value));
            await existingRow.save();
          } else {
            await sheet.addRow({ key, value: JSON.stringify(value) });
          }
        }
      } catch (error) {
        console.error('Error saving settings to spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
