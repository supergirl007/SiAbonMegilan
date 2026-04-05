import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';

export default function Login() {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login state
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register state
  const [regNip, setRegNip] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login berhasil');
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        toast.error(data.message || 'Login gagal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: regNip, name: regName, email: regEmail, password: regPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pendaftaran berhasil, silakan login');
        setRegNip('');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setView('login');
      } else {
        toast.error(data.message || 'Pendaftaran gagal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email reset password telah dikirim');
        setForgotEmail('');
        setView('login');
      } else {
        toast.error(data.message || 'Gagal mengirim email');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8">
        
        <div className="flex flex-col items-center mb-8">
          {/* Logo Joko Tingkir Placeholder */}
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 text-center">
            {view === 'login' ? 'Selamat Datang Kembali!' : view === 'register' ? 'Buat Akun Baru' : 'Lupa Kata Sandi'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            {view === 'login' ? 'Masuk untuk mengakses dasbor Anda' : view === 'register' ? 'Daftar untuk mulai menggunakan aplikasi' : 'Masukkan email untuk mereset kata sandi Anda'}
          </p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nip">Nomor Induk Pegawai (NIP)</Label>
              <Input 
                id="nip" 
                type="text" 
                placeholder="-Masukkan NIP-" 
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-300"
                >
                  Ingat saya
                </label>
              </div>
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                Lupa kata sandi?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-xl text-md font-semibold mt-2" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              Belum punya akun?{' '}
              <button 
                type="button" 
                onClick={() => setView('register')}
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                Daftar
              </button>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regNip">Nomor Induk Pegawai (NIP)</Label>
              <Input 
                id="regNip" 
                type="text" 
                placeholder="-Masukkan NIP-" 
                value={regNip}
                onChange={(e) => setRegNip(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regName">Nama Lengkap</Label>
              <Input 
                id="regName" 
                type="text" 
                placeholder="Nama Lengkap" 
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regEmail">Email</Label>
              <Input 
                id="regEmail" 
                type="email" 
                placeholder="email@puskesmas.com" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">Kata Sandi</Label>
              <Input 
                id="regPassword" 
                type="password" 
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-xl text-md font-semibold mt-4" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
              Sudah punya akun?{' '}
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                Masuk
              </button>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input 
                id="forgotEmail" 
                type="email" 
                placeholder="email@puskesmas.com" 
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-xl text-md font-semibold mt-4" 
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Email Reset'}
            </Button>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
              Kembali ke{' '}
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                Masuk
              </button>
            </div>
          </form>
        )}
      </div>
      
      <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        © 2026 Alielafroh. All rights reserved.
      </footer>
    </div>
  );
}
