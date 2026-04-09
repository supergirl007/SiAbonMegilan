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

  const [user, setUser] = useState<{name: string, nip: string, office: string, office2?: string} | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [shiftEndTime, setShiftEndTime] = useState<string | null>(null);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, setRes, attRes, shiftRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/settings'),
          fetch('/api/attendance'),
          fetch('/api/shifts')
        ]);
        
        if (locRes.ok) {
          const data = await locRes.json();
          setLocations(data);
        }
        if (setRes.ok) {
          const data = await setRes.json();
          setSettings(data);
        }
        if (shiftRes.ok) {
          const data = await shiftRes.json();
          setShifts(data);
        }
        if (attRes.ok) {
          const data = await attRes.json();
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const today = new Date().toISOString().split('T')[0];
          const userAtt = data.filter((a: any) => a.nip === userData.nip && a.date === today);
          
          const inRecord = userAtt.find((a: any) => a.type === 'in');
          const outRecord = userAtt.find((a: any) => a.type === 'out');
          
          if (inRecord) {
            setHasCheckedIn(true);
            setCheckInTime(inRecord.time);
          }
          if (outRecord) {
            setHasCheckedOut(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (hasCheckedIn && !hasCheckedOut) {
      if (shifts.length > 0) {
        const activeShift = shifts.find(s => s.isActive) || shifts[0];
        if (activeShift) {
          setShiftEndTime(activeShift.endTime);
          
          const now = new Date();
          const [endHour, endMinute] = activeShift.endTime.split(':').map(Number);
          
          let shiftEnd = new Date();
          shiftEnd.setHours(endHour, endMinute, 0, 0);
          
          if (activeShift.crossesMidnight) {
            const [startHour] = activeShift.startTime.split(':').map(Number);
            if (now.getHours() >= startHour) {
              shiftEnd.setDate(shiftEnd.getDate() + 1);
            }
          }
          
          const minCheckOut = new Date(shiftEnd.getTime() - 10 * 60000); // 10 mins before
          const maxCheckOut = new Date(shiftEnd.getTime() + 2 * 3600000); // 2 hours after
          
          if (now >= minCheckOut && now <= maxCheckOut) {
            setCanCheckOut(true);
          } else {
            setCanCheckOut(false);
          }
        }
      } else {
        // Fallback if no shifts are defined
        setShiftEndTime("16:00");
        setCanCheckOut(true);
      }
    }
  }, [hasCheckedIn, hasCheckedOut, shifts]);

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
            
            const addressLower = detectedAddress.toLowerCase();
            const officeAddress = user?.office?.toLowerCase() || '';
            const officeAddress2 = user?.office2?.toLowerCase() || '';
            
            let withinRange = false;

            // 1. Jika alamat terdeteksi mengandung nama Kantor 1 atau Kantor 2, langsung izinkan absen tanpa cek koordinat
            if ((officeAddress && addressLower.includes(officeAddress)) || 
                (officeAddress2 && addressLower.includes(officeAddress2))) {
              withinRange = true;
            } else {
              // 2. Jika tidak, cek berdasarkan jarak koordinat ke lokasi-lokasi yang ada
              withinRange = locations.some(loc => {
                const [lat, lng] = loc.coordinates.split(',').map(Number);
                const distance = getDistance(userLat, userLng, lat, lng);
                return distance <= loc.radius;
              });
            }

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

    // Compress image to ensure it fits in Google Sheets (limit 50k chars)
    const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5)); // 50% quality
        };
      });
    };

    const compressedImageSrc = await compressImage(imageSrc);

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
          type: hasCheckedIn ? 'out' : 'in',
          location: { lat: location.lat, lng: location.lng, address: address },
          status: 'Hadir',
          photoUrl: compressedImageSrc,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Gagal melakukan absen');
      }
      alert('Absensi berhasil dan terkirim ke Database Kepegawaian');
      window.location.href = '/user/history';
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat absen.');
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
            {hasCheckedIn ? (canCheckOut ? 'Absen Pulang' : 'Status Absensi') : 'Absen Masuk'}
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
          {hasCheckedIn && !canCheckOut && !hasCheckedOut ? (
            <Alert className="bg-teal-950/50 border-teal-900 text-teal-400">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <AlertDescription>
                Anda telah melakukan absen MASUK pada {checkInTime}, Silahkan Absen Pulang pada Jam {shiftEndTime}.
              </AlertDescription>
            </Alert>
          ) : hasCheckedOut ? (
            <Alert className="bg-teal-950/50 border-teal-900 text-teal-400">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <AlertDescription>
                Anda telah menyelesaikan absensi untuk hari ini.
              </AlertDescription>
            </Alert>
          ) : (
            <>
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
                  screenshotQuality={0.5}
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
                {isAbsenting ? 'Memproses...' : !isWithinRange ? 'Ajukan Izin' : (hasCheckedIn ? 'Absen Pulang' : 'Absen Masuk')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
