import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Camera, MapPin, CheckCircle2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UserHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState<'in' | 'out' | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const [attendance, setAttendance] = useState({
    in: null as string | null,
    out: null as string | null,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
          setShowCamera(true);
        },
        (error) => {
          toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setIsLocating(false);
        }
      );
    } else {
      toast.error('Browser tidak mendukung Geolocation');
      setIsLocating(false);
    }
  };

  const handleAbsenClick = (type: 'in' | 'out') => {
    setActionType(type);
    handleLocation();
  };

  const captureAndSubmit = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && location) {
      // Here you would normally send the data to the backend
      // For prototype, we just update local state
      const timeString = format(new Date(), 'HH:mm');
      setAttendance(prev => ({ ...prev, [actionType!]: timeString }));
      toast.success(`Absen ${actionType === 'in' ? 'Masuk' : 'Keluar'} berhasil!`);
      setShowCamera(false);
      setActionType(null);
    }
  };

  if (showCamera) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-emerald-500/50 relative">
          {/* @ts-expect-error react-webcam types require all props but they should be optional */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-auto"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button 
              onClick={captureAndSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="mt-6 text-slate-400"
          onClick={() => setShowCamera(false)}
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center min-h-full">
      {/* Header / Date */}
      <div className="w-full text-center mt-8 mb-12">
        <h2 className="text-emerald-400 font-medium tracking-widest uppercase text-sm mb-2">
          {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
        </h2>
        <div className="text-6xl font-light tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {format(currentTime, 'HH:mm:ss')}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-sm">
          <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Masuk</span>
          <span className={`text-2xl font-semibold ${attendance.in ? 'text-emerald-400' : 'text-slate-600'}`}>
            {attendance.in || '--:--'}
          </span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-sm">
          <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Keluar</span>
          <span className={`text-2xl font-semibold ${attendance.out ? 'text-emerald-400' : 'text-slate-600'}`}>
            {attendance.out || '--:--'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-4 mt-auto mb-8">
        <Button
          onClick={() => handleAbsenClick('in')}
          disabled={!!attendance.in || isLocating}
          className={`w-full h-16 rounded-2xl text-lg font-medium transition-all duration-300 ${
            !attendance.in 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLocating && actionType === 'in' ? (
            <span className="flex items-center gap-2"><MapPin className="animate-bounce h-5 w-5" /> Mencari Lokasi...</span>
          ) : attendance.in ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Sudah Masuk</span>
          ) : (
            'Absen Masuk'
          )}
        </Button>

        <Button
          onClick={() => handleAbsenClick('out')}
          disabled={!attendance.in || !!attendance.out || isLocating}
          className={`w-full h-16 rounded-2xl text-lg font-medium transition-all duration-300 ${
            attendance.in && !attendance.out
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLocating && actionType === 'out' ? (
            <span className="flex items-center gap-2"><MapPin className="animate-bounce h-5 w-5" /> Mencari Lokasi...</span>
          ) : attendance.out ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Sudah Keluar</span>
          ) : (
            'Absen Keluar'
          )}
        </Button>
      </div>
    </div>
  );
}
