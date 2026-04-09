import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';

export default function UserHome() {
  const webcamRef = useRef<Webcam>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locations, setLocations] = useState<{ id: string; desa: string; kecamatan: string; kabupaten: string; coordinates: string; radius: number }[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [isAbsenting, setIsAbsenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [address, setAddress] = useState<string>('');

  const [user, setUser] = useState<{name: string, nip: string, office: string} | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, setRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/settings')
        ]);
        
        if (locRes.ok) {
          const data = await locRes.json();
          setLocations(data);
        }
        if (setRes.ok) {
          const data = await setRes.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const fetchLocation = () => {
    setIsLocating(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          setLocation({ lat: userLat, lng: userLng, accuracy });
          
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`);
            const data = await response.json();
            const detectedAddress = data.display_name;
            setAddress(detectedAddress);
            
            // Check if within range of any location by checking keyword match AND distance
            let withinRange = locations.some(loc => {
              const [lat, lng] = loc.coordinates.split(',').map(Number);
              const distance = getDistance(userLat, userLng, lat, lng);
              // Check if address contains office address (desa)
              const addressLower = detectedAddress.toLowerCase();
              const officeAddress = user?.office?.toLowerCase() || '';
              const officeAddress2 = user?.office2?.toLowerCase() || '';
              return (addressLower.includes(loc.desa.toLowerCase()) || 
                      (officeAddress && addressLower.includes(officeAddress)) ||
                      (officeAddress2 && addressLower.includes(officeAddress2))) && distance <= loc.radius;
            });

            // Check if within range of main office (Kantor Induk)
            if (!withinRange && settings?.generalSettings?.mainLocation) {
              const [mainLat, mainLng] = settings.generalSettings.mainLocation.split(',').map(Number);
              const distanceToMain = getDistance(userLat, userLng, mainLat, mainLng);
              if (distanceToMain <= 100) {
                withinRange = true;
              }
            }

            setIsWithinRange(withinRange);
            if (withinRange) {
                // alert('Pengguna terdeteksi dan berada di dalam jangkauan wilayah kerja puskesmas');
            } else {
                setError('Anda berada di luar jangkauan lokasi kerja.');
            }
          } catch (err) {
            setError('Gagal memvalidasi lokasi.');
          }
          setIsLocating(false);
        },
        (err) => {
          setError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini.');
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, [locations, user, settings]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
  };

  const handleAbsen = async () => {
    if (!webcamRef.current || !location) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setIsAbsenting(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: user.nip || 'N/A',
          name: user.name || 'N/A',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: 'in',
          location: { lat: location.lat, lng: location.lng, address: address },
          status: 'Hadir',
          photoUrl: imageSrc,
        }),
      });

      if (!response.ok) throw new Error('Gagal melakukan absen');
      alert('Absen berhasil!');
    } catch (err) {
      setError('Terjadi kesalahan saat absen.');
    } finally {
      setIsAbsenting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-900 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
        <CardHeader>
          <CardTitle className="text-teal-400 text-2xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Absen Masuk
          </CardTitle>
          {user && (
            <div className="text-slate-300 text-sm mt-2 space-y-1">
              <p><strong>Nama:</strong> {user.name}</p>
              <p><strong>NIP:</strong> {user.nip}</p>
              <p><strong>Kantor 1:</strong> {user.office}</p>
              {user.office2 && <p><strong>Kantor 2:</strong> {user.office2}</p>}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/20">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full aspect-video object-cover"
              disablePictureInPicture={false}
              forceScreenshotSourceSize={false}
              imageSmoothing={true}
              mirrored={false}
              onUserMedia={() => {}}
              onUserMediaError={() => {}}
              screenshotQuality={1}
            />
            <div className="absolute inset-0 border-2 border-teal-500/50 pointer-events-none" />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
              <span className="flex-1">{isLocating ? 'Mencari lokasi...' : address ? `Lokasi: ${address}` : 'Lokasi tidak ditemukan'}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchLocation} 
                disabled={isLocating}
                className="h-8 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 shrink-0"
              >
                Refresh
              </Button>
            </div>
            {location && (
              <div className="pl-6 text-xs">
                Akurasi: {location.accuracy.toFixed(1)} meter | Status: Aktif
              </div>
            )}
          </div>

          <Button
            onClick={() => isWithinRange ? handleAbsen() : window.location.href = '/user/leave'}
            disabled={!location || isAbsenting}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all"
          >
            {isAbsenting ? 'Memproses...' : !isWithinRange ? 'Ajukan Izin' : 'Absen Masuk'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
