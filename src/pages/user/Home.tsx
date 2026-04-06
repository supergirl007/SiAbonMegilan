import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';

export default function UserHome() {
  const webcamRef = useRef<Webcam>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string; coordinates: string }[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [isAbsenting, setIsAbsenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);

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
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLocation({ lat: userLat, lng: userLng });
          
          // Check if within range of any location
          const withinRange = locations.some(loc => {
            const [lat, lng] = loc.coordinates.split(',').map(Number);
            const distance = getDistance(userLat, userLng, lat, lng);
            return distance <= 100; // 100 meters threshold
          });
          setIsWithinRange(withinRange);
          if (!withinRange) setError('Anda berada di luar jangkauan lokasi kerja.');
          setIsLocating(false);
        },
        (err) => {
          setError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setIsLocating(false);
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini.');
      setIsLocating(false);
    }
  }, [locations]);

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

    setIsAbsenting(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          location,
          timestamp: new Date().toISOString(),
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
            />
            <div className="absolute inset-0 border-2 border-teal-500/50 pointer-events-none" />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-4 h-4 text-teal-500" />
            {isLocating ? 'Mencari lokasi...' : location ? `Lokasi: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Lokasi tidak ditemukan'}
          </div>

          <Button
            onClick={handleAbsen}
            disabled={!location || isAbsenting || !isWithinRange}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all"
          >
            {isAbsenting ? 'Memproses...' : !isWithinRange ? 'Di Luar Lokasi Kerja' : 'Absen Masuk'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
