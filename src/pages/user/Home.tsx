import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';

import { format } from 'date-fns';

export default function UserHome() {
  const webcamRef = useRef<Webcam>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locations, setLocations] = useState<{ id: string; desa: string; kecamatan: string; kabupaten: string; coordinates: string; radius: number }[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [canRefresh, setCanRefresh] = useState(false);
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
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

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
          const today = format(new Date(), 'yyyy-MM-dd');
          const userAtt = data.filter((a: any) => a.nip === userData.nip && a.date === today);
          
          const inRecord = userAtt.find((a: any) => a.type === 'in');
          const outRecord = userAtt.find((a: any) => a.type === 'out');
          const leaveRecord = userAtt.find((a: any) => ['izin', 'sakit', 'Cuti'].includes(a.type));
          
          if (leaveRecord) {
            setLeaveType(leaveRecord.type);
          }
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (hasCheckedIn && !hasCheckedOut && shiftEndTime) {
      const calculateCountdown = () => {
        const now = new Date();
        const [endHour, endMinute] = shiftEndTime.split(':').map(Number);
        
        let shiftEnd = new Date();
        shiftEnd.setHours(endHour, endMinute, 0, 0);
        
        const activeShift = shifts.find(s => s.isActive) || shifts[0];
        if (activeShift && activeShift.crossesMidnight) {
          const [startHour] = activeShift.startTime.split(':').map(Number);
          if (now.getHours() >= startHour) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
        }
        
        const diff = shiftEnd.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdown('00:00:00');
        }
      };
      
      calculateCountdown();
      interval = setInterval(calculateCountdown, 1000);
    }
    
    return () => clearInterval(interval);
  }, [hasCheckedIn, hasCheckedOut, shiftEndTime, shifts]);

  const fetchLocation = () => {
    setIsLocating(true);
    setCanRefresh(false);
    setError(null);
    
    const timer = setTimeout(() => {
        if (isLocating) {
            setCanRefresh(true);
        }
    }, 10000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timer);
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          setLocation({ lat: userLat, lng: userLng, accuracy });
          
          let detectedAddress = `${userLat.toFixed(5)}, ${userLng.toFixed(5)}`;
          let addressLower = '';
          let fullAddressLower = '';

          try {
            const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            let googleMapsSuccess = false;

            if (googleMapsApiKey) {
              try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLat},${userLng}&key=${googleMapsApiKey}`);
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                  const result = data.results[0];
                  fullAddressLower = result.formatted_address.toLowerCase();
                  
                  const components = result.address_components;
                  const getComponent = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name;
                  
                  const village = getComponent('administrative_area_level_4') || getComponent('locality');
                  const district = getComponent('administrative_area_level_3');
                  const regency = getComponent('administrative_area_level_2');
                  const state = getComponent('administrative_area_level_1');
                  const country = getComponent('country');
                  
                  const parts = [];
                  if (village) parts.push(village.toLowerCase().startsWith('desa') || village.toLowerCase().startsWith('kelurahan') ? village : `Desa ${village}`);
                  if (district) parts.push(district.toLowerCase().startsWith('kec') ? district : `Kec. ${district}`);
                  if (regency) parts.push(regency);
                  if (state) parts.push(state);
                  if (country) parts.push(country);
                  
                  detectedAddress = parts.length > 0 ? parts.join(', ') : result.formatted_address;
                  googleMapsSuccess = true;
                } else {
                  console.warn("Google Maps Geocoding failed, falling back to Nominatim", data);
                }
              } catch (gmapErr) {
                console.warn("Google Maps Geocoding error, falling back to Nominatim", gmapErr);
              }
            }
            
            if (!googleMapsSuccess) {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`);
              if (!response.ok) throw new Error("Nominatim request failed");
              const data = await response.json();
              
              if (data && data.display_name) {
                detectedAddress = data.display_name;
                fullAddressLower = data.display_name.toLowerCase();
                
                if (data.address) {
                  const parts = [];
                  if (data.address.village) parts.push(`Desa ${data.address.village}`);
                  else if (data.address.town) parts.push(data.address.town);
                  else if (data.address.city) parts.push(data.address.city);
                  
                  const district = data.address.district || data.address.suburb;
                  if (district) {
                    parts.push(district.toLowerCase().startsWith('kec') ? district : `Kec. ${district}`);
                  }
                  
                  const regency = data.address.county || data.address.city_district;
                  if (regency) {
                    parts.push(regency.toLowerCase().startsWith('kab') || regency.toLowerCase().startsWith('kota') ? regency : `Kabupaten ${regency}`);
                  }
                  
                  if (data.address.state) parts.push(data.address.state);
                  if (data.address.country) parts.push(data.address.country);
                  
                  if (parts.length > 0) {
                    detectedAddress = parts.join(', ');
                  }
                }
              }
            }
            addressLower = detectedAddress.toLowerCase();
          } catch (err) {
            console.error('Geocoding error:', err);
            // Don't set error state here, we still have coordinates to check
          }
          
          setAddress(detectedAddress);
          
          const officeAddress = user?.office?.toLowerCase() || '';
          const officeAddress2 = user?.office2?.toLowerCase() || '';
          
          let withinRange = false;

          // Cek berdasarkan jarak koordinat ke lokasi-lokasi yang sesuai dengan unit kerja user
          withinRange = locations.some(loc => {
            if (!loc.coordinates) return false;
            
            // Hanya cek lokasi yang namanya sesuai dengan office atau office2 user
            const locNameLower = (loc.desa || loc.name || '').toLowerCase();
            const isUserLocation = (officeAddress && locNameLower === officeAddress) || 
                                   (officeAddress2 && locNameLower === officeAddress2);
            
            if (!isUserLocation) return false;

            const [lat, lng] = loc.coordinates.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return false;
            const distance = getDistance(userLat, userLng, lat, lng);
            return distance <= (loc.radius || 100);
          });

          // Check if within range of main office (Kantor Induk)
          if (!withinRange && settings?.generalSettings?.mainLocation) {
            const [mainLat, mainLng] = settings.generalSettings.mainLocation.split(',').map(Number);
            if (!isNaN(mainLat) && !isNaN(mainLng)) {
              const distanceToMain = getDistance(userLat, userLng, mainLat, mainLng);
              if (distanceToMain <= 100) {
                withinRange = true;
              }
            }
          }

          setIsWithinRange(withinRange);
          if (!withinRange) {
              setError('Anda berada di luar jangkauan lokasi kerja.');
          }
          setIsLocating(false);
        },
        (err) => {
          clearTimeout(timer);
          console.error("Geolocation error:", err);
          setError(`Gagal mendapatkan lokasi (${err.message}). Pastikan GPS aktif dan izin diberikan.`);
          setIsLocating(false);
          setCanRefresh(true);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      clearTimeout(timer);
      setError('Geolocation tidak didukung oleh browser ini.');
      setIsLocating(false);
      setCanRefresh(true);
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
          date: format(new Date(), 'yyyy-MM-dd'),
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
          {leaveType ? (
            <Alert className="bg-teal-950/50 border-teal-900 text-teal-400">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <AlertDescription className="text-lg font-medium text-center py-4">
                {leaveType === 'sakit' && "Semoga lekas sembuh dan diberikan kesehatan seperti sediakala. Aamiin"}
                {leaveType === 'izin' && "Semoga segala urusannya dimudahkan"}
                {leaveType === 'Cuti' && "Semoga hari - hari cuti anda bermanfaat"}
              </AlertDescription>
            </Alert>
          ) : hasCheckedIn && !canCheckOut && !hasCheckedOut ? (
            <Alert className="bg-teal-950/50 border-teal-900 text-teal-400 flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="w-8 h-8 text-teal-500 mb-2" />
              <AlertDescription className="text-center space-y-4">
                <p>Anda telah melakukan absen MASUK pada <strong>{checkInTime}</strong></p>
                <p>Silahkan Absen Pulang pada Jam <strong>{shiftEndTime}</strong></p>
                <div className="mt-4">
                  <p className="text-sm text-teal-500/80 mb-1">Waktu Menuju Absen Pulang:</p>
                  <p className="text-5xl font-mono font-bold text-white tracking-wider">{countdown}</p>
                </div>
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
                    disabled={isLocating && !canRefresh}
                    className="h-8 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 shrink-0"
                  >
                    {isLocating && !canRefresh ? 'Mencari...' : 'Refresh'}
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
