import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
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

  // API Routes
  app.post('/api/login', (req, res) => {
    const { nip, password } = req.body;
    const user = db.users.find(u => u.nip === nip && u.password === password);
    if (user) {
      res.json({ success: true, user: { id: user.id, nip: user.nip, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'NIP atau Password salah' });
    }
  });

  app.post('/api/register', async (req, res) => {
    const { nip, name, email, password } = req.body;
    
    // Check if user already exists
    if (db.users.find(u => u.nip === nip)) {
      return res.status(400).json({ success: false, message: 'NIP sudah terdaftar' });
    }

    const newUser = {
      id: db.users.length + 1,
      nip,
      name,
      email,
      role: 'user',
      password
    };

    db.users.push(newUser);

    // Save to Google Spreadsheet if configured
    if (doc) {
      try {
        let sheet = doc.sheetsByTitle['Users'];
        if (!sheet) {
          sheet = await doc.addSheet({ title: 'Users', headerValues: ['id', 'nip', 'name', 'email', 'role', 'password'] });
        }
        await sheet.addRow(newUser);
      } catch (error) {
        console.error('Error saving to spreadsheet:', error);
      }
    }

    res.json({ success: true, message: 'Pendaftaran berhasil' });
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

  app.get('/api/settings', (req, res) => {
    res.json(db.settings);
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
