import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Mock Database (In-Memory for Prototype)
  const db = {
    users: [
      { id: 1, nip: '123456', name: 'Admin User', email: 'admin@puskesmas.com', role: 'admin', password: 'password', office: 'Kantor Induk', group: 'Superadmin' },
      { id: 2, nip: '654321', name: 'Regular User', email: 'user@puskesmas.com', role: 'user', password: 'password', office: 'Pustu A' },
    ],
    employees: [
      { id: '1', name: 'Admin User', nip: '123456', office: 'Kantor Induk', email: 'admin@puskesmas.com', gender: 'Laki-laki', cluster: 'Klaster 1', unit: 'Manajemen' },
      { id: '2', name: 'Regular User', nip: '654321', office: 'Pustu A', email: 'user@puskesmas.com', gender: 'Perempuan', cluster: 'Klaster 2', unit: 'Pustu' }
    ],
    attendance: [],
    locations: [
      { id: 1, name: 'Kantor Induk', lat: -7.000517, lng: 112.391503, radius: 500 },
    ],
    settings: {
      appName: 'Si Abon Megilan',
      companyName: 'Puskesmas Kalitengah',
      headName: 'dr. Sesanti',
      address: 'Jl. Mahkota No 100 Desa Dibee Kec. Kalitengah Kab. Lamongan',
      mainLocation: '-7.000517, 112.391503',
      tolerance: 15,
    }
  };

  // Google Spreadsheet Setup
  let doc: GoogleSpreadsheet | null = null;
  let isDocLoaded = false;
  
  // Cache for spreadsheet data
  const cache: { [key: string]: { data: any; timestamp: number } } = {};
  const CACHE_DURATION = 60 * 1000; // 1 minute cache
  if (process.env.SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      console.log('Attempting to connect to Google Sheets...');
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      isDocLoaded = true;
      console.log('Google Spreadsheet connected successfully:', doc.title);
    } catch (error) {
      console.error('Failed to connect to Google Spreadsheet:', error);
      doc = null;
    }
  } else {
    console.warn('Google Sheets environment variables are missing.');
  }

  // Helper to get or create sheet
  async function getSheet(title: string) {
    if (!doc) {
      console.error(`Cannot get sheet '${title}': Spreadsheet not connected.`);
      return null;
    }
    try {
      // Ensure doc is loaded
      if (!isDocLoaded) {
        await doc.loadInfo();
        isDocLoaded = true;
      }
      const sheet = doc.sheetsByTitle[title];
      if (!sheet) {
        console.error(`Sheet '${title}' not found in spreadsheet.`);
        return null;
      }
      return sheet;
    } catch (error) {
      console.error(`Error getting sheet ${title}:`, error);
      return null;
    }
  }

  // Helper to get or create sheet
  async function getOrCreateSheet(title: string, headerValues: string[]) {
    let sheet = await getSheet(title);
    if (!sheet && doc) {
      sheet = await doc.addSheet({ title, headerValues });
    } else if (sheet) {
      try {
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        let headersChanged = false;
        const newHeaders = [...currentHeaders];
        for (const header of headerValues) {
          if (!newHeaders.includes(header)) {
            newHeaders.push(header);
            headersChanged = true;
          }
        }
        if (headersChanged) {
          await sheet.setHeaderRow(newHeaders);
        }
      } catch (e) {
        // If sheet is empty, loadHeaderRow might throw. Set headers directly.
        await sheet.setHeaderRow(headerValues);
      }
    }
    return sheet;
  }

  // API Routes

  // --- Employees API ---
  app.get('/api/employees', async (req, res) => {
    if (doc) {
      try {
        if (cache['employees'] && Date.now() - cache['employees'].timestamp < CACHE_DURATION) {
          return res.json(cache['employees'].data);
        }
        const sheet = await getOrCreateSheet('Employees', ['id', 'name', 'nip', 'office', 'office2', 'email', 'gender', 'cluster', 'unit', 'password']);
        if (sheet) {
          const rows = await sheet.getRows();
          const employees = rows.map(row => ({
            id: row.get('id'),
            name: row.get('name'),
            nip: row.get('nip'),
            office: row.get('office'),
            office2: row.get('office2'),
            email: row.get('email'),
            gender: row.get('gender'),
            cluster: row.get('cluster'),
            unit: row.get('unit'),
            password: row.get('password')
          }));
          cache['employees'] = { data: employees, timestamp: Date.now() };
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
        const sheet = await getOrCreateSheet('Employees', ['id', 'name', 'nip', 'office', 'office2', 'email', 'gender', 'cluster', 'unit', 'password']);
        if (sheet) {
          await sheet.addRow({
            ...employee,
            office2: employee.office2 || ''
          });
          delete cache['employees'];
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
        const sheet = await getSheet('Employees');
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
        if (cache['admins'] && Date.now() - cache['admins'].timestamp < CACHE_DURATION) {
          return res.json(cache['admins'].data);
        }
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
          cache['admins'] = { data: admins, timestamp: Date.now() };
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
          delete cache['admins'];
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
        const sheet = await getSheet('Admins');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => String(r.get('id')) === String(id));
          if (rowToDelete) {
            await rowToDelete.delete();
            delete cache['admins'];
          }
        }
      } catch (error) {
        console.error('Error deleting admin from spreadsheet:', error);
      }
    }
    res.json({ success: true, message: 'Admin berhasil dihapus' });
  });

  app.put('/api/admins/:id', async (req, res) => {
    const { id } = req.params;
    const admin = req.body;
    if (doc) {
      try {
        const sheet = await getSheet('Admins');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToUpdate = rows.find(r => String(r.get('id')) === String(id));
          if (rowToUpdate) {
            rowToUpdate.set('name', admin.name);
            rowToUpdate.set('nip', admin.nip);
            rowToUpdate.set('email', admin.email);
            rowToUpdate.set('phone', admin.phone);
            rowToUpdate.set('group', admin.group);
            rowToUpdate.set('isActive', admin.isActive.toString());
            rowToUpdate.set('access', JSON.stringify(admin.access));
            if (admin.password) rowToUpdate.set('password', admin.password);
            await rowToUpdate.save();
            delete cache['admins'];
          }
        }
      } catch (error) {
        console.error('Error updating admin in spreadsheet:', error);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui admin di spreadsheet' });
      }
    }
    res.json({ success: true, message: 'Admin berhasil diperbarui' });
  });

  // --- Auth API ---
  app.post('/api/login', async (req, res) => {
    const nip = (req.body.nip || '').trim();
    const password = (req.body.password || '').trim();
    console.log(`Login attempt for NIP: ${nip}`);
    
    let user = null;
    if (doc) {
      try {
        // Check Admins first
        const adminSheet = await getSheet('Admins');
        if (adminSheet) {
          const rows = await adminSheet.getRows();
          const row = rows.find(r => (r.get('nip') || '').trim() === nip && (r.get('password') || '').trim() === password && r.get('isActive') === 'true');
          if (row) {
            let access = [];
            try {
              access = JSON.parse(row.get('access'));
            } catch (e) {}
            user = { 
              id: row.get('id'), 
              nip: (row.get('nip') || '').trim(), 
              name: row.get('name'), 
              role: 'admin',
              group: row.get('group'),
              access
            };
            console.log('Admin found:', user.name);
          }
        }

        // If not admin, check Users
        if (!user) {
          const userSheet = await getSheet('Users');
          if (userSheet) {
            const rows = await userSheet.getRows();
            const row = rows.find(r => (r.get('nip') || '').trim() === nip && (r.get('password') || '').trim() === password);
            if (row) {
              user = { id: row.get('id'), nip: (row.get('nip') || '').trim(), name: row.get('name'), role: row.get('role'), office: row.get('office'), office2: row.get('office2') };
              console.log('User found:', user.name);
            }
          }
        }
      } catch (error) {
        console.error('Error logging in from spreadsheet:', error);
        // Add more context to the error
        console.error('Spreadsheet configuration might be invalid or sheet missing.');
      }
    }
    
    if (!user) {
      user = db.users.find(u => u.nip === nip && u.password === password);
      if (user) console.log('User found in mock DB:', user.name);
    }

    if (user) {
      res.json({ success: true, user });
    } else {
      console.log('Login failed: User not found or incorrect password');
      res.status(401).json({ success: false, message: 'NIP atau Password salah' });
    }
  });

  app.post('/api/register', async (req, res) => {
    const { nip, name, email, password, gender, cluster, unit, desa, office2 } = req.body;
    
    // 1. Validate NIP against Employees data
    let isValidEmployee = false;
    if (doc) {
      try {
        const empSheet = await getSheet('Employees');
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
        const userSheet = await getOrCreateSheet('Users', ['id', 'nip', 'name', 'email', 'role', 'password', 'gender', 'cluster', 'unit', 'office', 'office2']);
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
      unit,
      office: desa,
      office2: office2 || ''
    };

    // Save to Google Spreadsheet if configured
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Users', ['id', 'nip', 'name', 'email', 'role', 'password', 'gender', 'cluster', 'unit', 'office', 'office2']);
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
            location: (() => {
              try { return JSON.parse(row.get('location')); }
              catch (e) { return row.get('location'); }
            })(),
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
          // Google Sheets cell limit is 50,000 characters.
          // Base64 images can easily exceed this.
          let photoUrlToSave = attendanceData.photoUrl || '';
          if (photoUrlToSave.length > 49000) {
             // If it's too large, we can't save the full image in a single cell.
             // Ideally, save to cloud storage and store URL. For now, truncate or store a placeholder.
             photoUrlToSave = 'Image too large to save in spreadsheet';
             console.warn('Attendance photoUrl exceeded 50000 characters, replacing with placeholder.');
          }

          await sheet.addRow({
            id: Date.now().toString(),
            ...attendanceData,
            photoUrl: photoUrlToSave,
            location: typeof attendanceData.location === 'object' ? JSON.stringify(attendanceData.location) : attendanceData.location
          });
        }
      } catch (error) {
        console.error('Error saving attendance to spreadsheet:', error);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan absensi ke spreadsheet. Mungkin ukuran foto terlalu besar.' });
      }
    } else {
      db.attendance.push({ id: Date.now().toString(), ...attendanceData } as any);
    }

    res.json({ success: true, message: 'Absensi berhasil dicatat' });
  });

  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    let foundUser = null;
    let userType = '';

    if (doc) {
      try {
        // Check Admins
        const adminSheet = await getSheet('Admins');
        if (adminSheet) {
          const rows = await adminSheet.getRows();
          const admin = rows.find(r => r.get('email') === email);
          if (admin) {
            foundUser = { id: admin.get('id'), name: admin.get('name'), email: admin.get('email') };
            userType = 'admin';
          }
        }

        // Check Employees if not found
        if (!foundUser) {
          const empSheet = await getSheet('Employees');
          if (empSheet) {
            const rows = await empSheet.getRows();
            const emp = rows.find(r => r.get('email') === email);
            if (emp) {
              foundUser = { id: emp.get('id'), name: emp.get('name'), email: emp.get('email') };
              userType = 'employee';
            }
          }
        }
        
        // Check Users if not found
        if (!foundUser) {
          const userSheet = await getSheet('Users');
          if (userSheet) {
            const rows = await userSheet.getRows();
            const user = rows.find(r => r.get('email') === email);
            if (user) {
              foundUser = { id: user.get('id'), name: user.get('name'), email: user.get('email') };
              userType = 'user';
            }
          }
        }
      } catch (error) {
        console.error('Error checking email in spreadsheet:', error);
      }
    }

    if (!foundUser) {
      const user = db.users.find(u => u.email === email);
      if (user) {
        foundUser = user;
        userType = 'user';
      } else {
        const emp = db.employees.find(e => e.email === email);
        if (emp) {
          foundUser = emp;
          userType = 'employee';
        }
      }
    }

    if (!foundUser) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'Jika email terdaftar, tautan reset telah dikirim.' });
    }

    // Generate a simple token (in a real app, use a secure random token and save it to DB with expiration)
    const token = Buffer.from(`${foundUser.id}:${userType}:${Date.now()}`).toString('base64');
    
    // Save token to spreadsheet
    if (doc) {
      try {
        const resetSheet = await getOrCreateSheet('PasswordResets', ['token', 'userId', 'userType', 'expiresAt']);
        if (resetSheet) {
          await resetSheet.addRow({
            token,
            userId: foundUser.id,
            userType,
            expiresAt: Date.now() + 3600000 // 1 hour
          });
        }
      } catch (error) {
        console.error('Error saving reset token:', error);
      }
    }

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Si Abon Megilan <onboarding@resend.dev>',
          to: foundUser.email,
          subject: 'Reset Password - Si Abon Megilan',
          html: `<p>Halo ${foundUser.name},</p><p>Klik tautan berikut untuk mereset password Anda:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>`,
        });
      } catch (error) {
        console.error('Error sending email via Resend:', error);
        return res.status(500).json({ success: false, message: 'Gagal mengirim email. Pastikan API Key Resend valid.' });
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${foundUser.email}, Subject: Reset Password, Link: ${resetLink}`);
      // For testing without Resend API key, we return the link in the response (only in dev!)
      return res.json({ success: true, message: 'Email reset password telah dikirim (Mock Mode)', mockLink: resetLink });
    }

    res.json({ success: true, message: 'Email reset password telah dikirim' });
  });

  app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token dan password baru wajib diisi' });
    }

    let userId = '';
    let userType = '';
    let isValidToken = false;

    if (doc) {
      try {
        const resetSheet = await getSheet('PasswordResets');
        if (resetSheet) {
          const rows = await resetSheet.getRows();
          const tokenRow = rows.find(r => r.get('token') === token);
          
          if (tokenRow) {
            const expiresAt = parseInt(tokenRow.get('expiresAt'));
            if (Date.now() > expiresAt) {
              return res.status(400).json({ success: false, message: 'Token reset password telah kedaluwarsa' });
            }
            userId = tokenRow.get('userId');
            userType = tokenRow.get('userType');
            isValidToken = true;
            
            // Delete used token
            await tokenRow.delete();
          }
        }
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }

    // Fallback to decoding token if not using spreadsheet (for mock DB)
    if (!isValidToken) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        if (parts.length === 3) {
          userId = parts[0];
          userType = parts[1];
          const timestamp = parseInt(parts[2]);
          if (Date.now() - timestamp < 3600000) {
            isValidToken = true;
          } else {
            return res.status(400).json({ success: false, message: 'Token reset password telah kedaluwarsa' });
          }
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Token tidak valid' });
      }
    }

    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Token tidak valid' });
    }

    // Update password
    let passwordUpdated = false;
    if (doc) {
      try {
        let sheetName = '';
        if (userType === 'admin') sheetName = 'Admins';
        else if (userType === 'employee') sheetName = 'Employees';
        else if (userType === 'user') sheetName = 'Users';

        if (sheetName) {
          const sheet = await getSheet(sheetName);
          if (sheet) {
            const rows = await sheet.getRows();
            const userRow = rows.find(r => r.get('id') === userId);
            if (userRow) {
              userRow.set('password', newPassword);
              await userRow.save();
              passwordUpdated = true;
              
              // Clear cache
              if (sheetName === 'Admins') delete cache['admins'];
              if (sheetName === 'Employees') delete cache['employees'];
            }
          }
        }
      } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui password' });
      }
    }

    if (!passwordUpdated) {
      // Update mock DB
      if (userType === 'admin' || userType === 'user') {
        const user = db.users.find(u => u.id.toString() === userId);
        if (user) {
          user.password = newPassword;
          passwordUpdated = true;
        }
      } else if (userType === 'employee') {
        const emp = db.employees.find(e => e.id === userId);
        if (emp) {
          (emp as any).password = newPassword;
          passwordUpdated = true;
        }
      }
    }

    if (passwordUpdated) {
      res.json({ success: true, message: 'Password berhasil diperbarui' });
    } else {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }
  });

  app.get('/api/users', (req, res) => {
    res.json(db.users.map(u => ({ id: u.id, nip: u.nip, name: u.name, role: u.role })));
  });

  // --- Locations API ---
  app.get('/api/locations', async (req, res) => {
    if (doc) {
      try {
        if (cache['locations'] && Date.now() - cache['locations'].timestamp < CACHE_DURATION) {
          return res.json(cache['locations'].data);
        }
        const sheet = await getOrCreateSheet('Locations', ['id', 'name', 'desa', 'kecamatan', 'kabupaten', 'coordinates', 'radius']);
        if (sheet) {
          const rows = await sheet.getRows();
          const locations = rows.map(row => ({
            id: row.get('id'),
            desa: row.get('desa') || row.get('name') || '',
            kecamatan: row.get('kecamatan') || '',
            kabupaten: row.get('kabupaten') || '',
            coordinates: row.get('coordinates'),
            radius: row.get('radius') || 500
          }));
          cache['locations'] = { data: locations, timestamp: Date.now() };
          return res.json(locations);
        }
      } catch (error) {
        console.error('Error fetching locations from spreadsheet:', error);
      }
    }
    res.json([
      { id: "1", desa: "Kantor Induk", kecamatan: "", kabupaten: "", coordinates: "-7.1234, 112.1234", radius: 500 },
      { id: "2", desa: "Pustu A", kecamatan: "", kabupaten: "", coordinates: "-7.1235, 112.1235", radius: 500 }
    ]);
  });

  app.post('/api/locations', async (req, res) => {
    const location = req.body;
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Locations', ['id', 'name', 'desa', 'kecamatan', 'kabupaten', 'coordinates', 'radius']);
        if (sheet) {
          await sheet.addRow({
            id: Date.now().toString(),
            name: location.desa || '',
            desa: location.desa || '',
            kecamatan: location.kecamatan || '',
            kabupaten: location.kabupaten || '',
            coordinates: location.coordinates || '',
            radius: location.radius || 500
          });
          delete cache['locations'];
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
        const sheet = await getSheet('Locations');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => String(r.get('id')) === String(id));
          if (rowToDelete) {
            await rowToDelete.delete();
            delete cache['locations'];
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
        const sheet = await getSheet('Shifts');
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

  app.put('/api/shifts/:id', async (req, res) => {
    const { id } = req.params;
    const shift = req.body;
    if (doc) {
      try {
        const sheet = await getSheet('Shifts');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToUpdate = rows.find(r => String(r.get('id')) === String(id));
          if (rowToUpdate) {
            rowToUpdate.set('name', shift.name);
            rowToUpdate.set('startTime', shift.startTime);
            rowToUpdate.set('endTime', shift.endTime);
            rowToUpdate.set('crossesMidnight', shift.crossesMidnight.toString());
            rowToUpdate.set('isActive', shift.isActive.toString());
            await rowToUpdate.save();
          }
        }
      } catch (error) {
        console.error('Error updating shift in spreadsheet:', error);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui shift di spreadsheet' });
      }
    }
    res.json({ success: true, message: 'Shift berhasil diperbarui' });
  });

  // --- Announcements API ---
  app.get('/api/announcements', async (req, res) => {
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Announcements', ['id', 'title', 'content', 'date', 'expiryDate', 'isActive']);
        if (sheet) {
          const rows = await sheet.getRows();
          const announcements = rows.map(row => ({
            id: row.get('id'),
            title: row.get('title'),
            content: row.get('content'),
            date: row.get('date'),
            expiryDate: row.get('expiryDate'),
            isActive: row.get('isActive') === 'true'
          }));
          return res.json(announcements);
        }
      } catch (error) {
        console.error('Error fetching announcements from spreadsheet:', error);
      }
    }
    res.json([]);
  });

  app.post('/api/announcements', async (req, res) => {
    const announcement = req.body;
    if (doc) {
      try {
        const sheet = await getOrCreateSheet('Announcements', ['id', 'title', 'content', 'date', 'expiryDate', 'isActive']);
        if (sheet) {
          await sheet.addRow({
            ...announcement,
            isActive: announcement.isActive.toString(),
            date: announcement.date || new Date().toISOString().split('T')[0]
          });
        }
      } catch (error) {
        console.error('Error saving announcement to spreadsheet:', error);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan pengumuman' });
      }
    }
    res.json({ success: true, message: 'Pengumuman berhasil ditambahkan' });
  });

  app.put('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    if (doc) {
      try {
        const sheet = await getSheet('Announcements');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToUpdate = rows.find(r => r.get('id') === id);
          if (rowToUpdate) {
            rowToUpdate.set('isActive', isActive.toString());
            await rowToUpdate.save();
          }
        }
      } catch (error) {
        console.error('Error updating announcement:', error);
        return res.status(500).json({ success: false, message: 'Gagal update pengumuman' });
      }
    }
    res.json({ success: true, message: 'Pengumuman diupdate' });
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    if (doc) {
      try {
        const sheet = await getSheet('Announcements');
        if (sheet) {
          const rows = await sheet.getRows();
          const rowToDelete = rows.find(r => r.get('id') === id);
          if (rowToDelete) {
            await rowToDelete.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
        return res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman' });
      }
    }
    res.json({ success: true, message: 'Pengumuman dihapus' });
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
          
          // Google Sheets cell limit is 50,000 characters.
          // If value is a large object (like generalSettings with appLogo), we might need to handle it carefully.
          // For now, we stringify it. If it fails, we catch the error.
          const stringifiedValue = JSON.stringify(value);
          
          if (existingRow) {
            existingRow.set('value', stringifiedValue);
            await existingRow.save();
          } else {
            await sheet.addRow({ key, value: stringifiedValue });
          }
        }
      } catch (error) {
        console.error('Error saving settings to spreadsheet:', error);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan ke spreadsheet. Mungkin ukuran data terlalu besar (misal: gambar logo).' });
      }
    }
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
