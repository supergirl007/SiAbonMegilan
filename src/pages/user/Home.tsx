import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';

export default function UserHome() {
  const webcamRef = useRef<Webcam>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string; coordinates: string }[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [isAbsenting, setIsAbsenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      }
    };
    fetchLocations();

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
            
            // Check if within range of any location by checking keyword match
            const withinRange = locations.some(loc => {
              return detectedAddress.toLowerCase().includes(loc.name.toLowerCase());
            });
            setIsWithinRange(withinRange);
            if (!withinRange) setError('Anda berada di luar jangkauan lokasi kerja.');
          } catch (err) {
            setError('Gagal memvalidasi lokasi.');
          }
          setIsLocating(false);
        },
        (err) => {
          setError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini.');
      setIsLocating(false);
    }
  }, [locations]);

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

          <div className="flex flex-col gap-1 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500" />
              {isLocating ? 'Mencari lokasi...' : location ? `Lokasi: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Lokasi tidak ditemukan'}
            </div>
            {location && (
              <div className="pl-6 text-xs">
                Akurasi: {location.accuracy.toFixed(1)} meter | Status: Aktif
              </div>
            )}
          </div>

          <Button
            onClick={() => isWithinRange ? handleAbsen() : window.location.href = '/user/history?tab=izin'}
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
