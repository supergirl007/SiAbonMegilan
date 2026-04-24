import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';
import { checkAndFireAlarm } from '@/utils/alarm';

import { format } from 'date-fns';

export default function UserHome() {
  const navigate = useNavigate();
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [nextShift, setNextShift] = useState<any>(null);
  const [checkInCountdown, setCheckInCountdown] = useState<string>('');
  const [canCheckIn, setCanCheckIn] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, setRes, attRes, shiftRes, annRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/settings'),
          fetch('/api/attendance'),
          fetch('/api/shifts'),
          fetch('/api/announcements')
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
        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.filter((a: any) => a.isActive));
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
        const activeShifts = shifts.filter(s => s.isActive);
        let targetShift = activeShifts[0] || shifts[0];
        
        if (activeShifts.length > 1 && checkInTime) {
          let inHour = 0;
          let inMin = 0;
          const timeMatch = checkInTime.match(/(\d+)[.:](\d+)/);
          
          if (timeMatch) {
            inHour = parseInt(timeMatch[1], 10);
            inMin = parseInt(timeMatch[2], 10);
            
            const lowerTime = checkInTime.toLowerCase();
            if (lowerTime.includes('pm') && inHour < 12) {
              inHour += 12;
            } else if (lowerTime.includes('am') && inHour === 12) {
              inHour = 0;
            }
          }
          
          if (!isNaN(inHour) && !isNaN(inMin)) {
            const checkInMinutes = inHour * 60 + inMin;
            let minDiff = Infinity;

            activeShifts.forEach(shift => {
              const [startHour, startMin] = shift.startTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              let diff = Math.abs(checkInMinutes - startMinutes);
              if (diff > 720) diff = 1440 - diff;
              if (diff < minDiff) {
                minDiff = diff;
                targetShift = shift;
              }
            });
          }
        }

        if (targetShift) {
          setShiftEndTime(targetShift.endTime);
          
          const now = new Date();
          const [endHour, endMinute] = targetShift.endTime.split(':').map(Number);
          const [startHour] = targetShift.startTime.split(':').map(Number);
          
          let shiftEnd = new Date();
          shiftEnd.setHours(endHour, endMinute, 0, 0);
          
          // Handle cross-midnight shifts properly
          if (startHour > endHour) {
            // Jika jam sekarang >= jam masuk (contoh 22:00 > 20:00), maka shift berakhirmya BESOK
            // Jika jam sekarang <= jam masuk, itu berarti kita sudah berada di hari berikutnya sebelum shift selesai
            if (now.getHours() >= startHour - 2) { 
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
  }, [hasCheckedIn, hasCheckedOut, shifts, checkInTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Timer untuk Absen Masuk (jika belum absen masuk)
    if (!hasCheckedIn && shifts.length > 0) {
      const isCountdownEnabled = settings?.absensiSettings?.enableCountdown !== false;
      
      const activeShifts = shifts.filter(s => s.isActive);
      const calculateCheckInCountdown = () => {
        if (!isCountdownEnabled) {
          setCanCheckIn(true);
          setCheckInCountdown('');
          return;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let upcomingShift = null;
        let minTimeDiff = Infinity;
        let upcomingShiftStart = new Date();

        activeShifts.forEach(shift => {
          const [startHour, startMin] = shift.startTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          
          let shiftStart = new Date();
          shiftStart.setHours(startHour, startMin, 0, 0);

          // Jika jam shift lebih kecil dari jam sekarang, asumsikan itu untuk shift yang akan datang (mungkin besok)
          // Kecuali jika selisihnya dekat (pagi ke pagi)
          let diff = startMinutes - currentMinutes;
          
          // Memperhitungkan pergantian hari / shift selanjutnya
          if (diff < -120) { 
             // asumsikan sudah lewat 2 jam, maka shift ini untuk besok
             diff += 1440;
             shiftStart.setDate(shiftStart.getDate() + 1);
          }

          if (diff >= -120 && diff < minTimeDiff) {
             minTimeDiff = diff;
             upcomingShift = shift;
             upcomingShiftStart = shiftStart;
          }
        });

        if (upcomingShift) {
          setNextShift(upcomingShift);
          
          // Alarm logic
          const diffMsStart = upcomingShiftStart.getTime() - now.getTime();
          if (diffMsStart <= 10 * 60000 && diffMsStart > 9 * 60000) {
            checkAndFireAlarm(
              'Pengingat Absensi', 
              'Shift Anda akan mulai dalam 10 menit. Jangan lupa absen masuk!', 
              'masuk_10'
            );
          }

          if (diffMsStart <= -15 * 60000 && diffMsStart > -16 * 60000 && !hasCheckedIn) {
            const day = now.getDay();
            if (day >= 1 && day <= 5) {
              checkAndFireAlarm(
                'Peringatan Keterlambatan', 
                'Anda belum absen masuk dan shift sudah berjalan 15 menit!', 
                'telat_15'
              );
            }
          }

          // Izinkan absen masuk mulai 60 menit sebelum shift dimulai
          const minCheckIn = new Date(upcomingShiftStart.getTime() - 60 * 60000); 
          const diffMs = minCheckIn.getTime() - now.getTime();

          if (diffMs > 0) {
            setCanCheckIn(false);
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            setCheckInCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setCanCheckIn(true);
            setCheckInCountdown('');
          }
        }
      };

      calculateCheckInCountdown();
      interval = setInterval(calculateCheckInCountdown, 1000);
    }
    
    // Timer untuk Absen Pulang (jika sudah absen masuk)
    if (hasCheckedIn && !hasCheckedOut && shiftEndTime) {
      const calculateCountdown = () => {
        const activeShifts = shifts.filter(s => s.isActive);
        let targetShift = activeShifts[0] || shifts[0];
        
        if (activeShifts.length > 1 && checkInTime) {
          let inHour = 0;
          let inMin = 0;
          const timeMatch = checkInTime.match(/(\d+)[.:](\d+)/);
          
          if (timeMatch) {
            inHour = parseInt(timeMatch[1], 10);
            inMin = parseInt(timeMatch[2], 10);
            
            const lowerTime = checkInTime.toLowerCase();
            if (lowerTime.includes('pm') && inHour < 12) {
              inHour += 12;
            } else if (lowerTime.includes('am') && inHour === 12) {
              inHour = 0;
            }
          }
          
          if (!isNaN(inHour) && !isNaN(inMin)) {
            const checkInMinutes = inHour * 60 + inMin;
            let minDiff = Infinity;

            activeShifts.forEach(shift => {
              const [startHour, startMin] = shift.startTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              let diff = Math.abs(checkInMinutes - startMinutes);
              if (diff > 720) diff = 1440 - diff;
              if (diff < minDiff) {
                minDiff = diff;
                targetShift = shift;
              }
            });
          }
        }
        
        if (!targetShift) return;

        const now = new Date();
        const [endHour, endMinute] = targetShift.endTime.split(':').map(Number);
        const [startHour] = targetShift.startTime.split(':').map(Number);
        
        let shiftEnd = new Date();
        shiftEnd.setHours(endHour, endMinute, 0, 0);
        
        if (startHour > endHour) {
          if (now.getHours() >= startHour - 2) {
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
  }, [hasCheckedIn, hasCheckedOut, shiftEndTime, shifts, checkInTime, settings]);

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
          
          console.log(`Detected Location: Lat ${userLat}, Lng ${userLng}, Accuracy ${accuracy}m`);
          
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
                  // Find a result that explicitly contains administrative_area_level_4 (desa/kelurahan)
                  const villageResult = data.results.find((r: any) => 
                    r.address_components.some((c: any) => c.types.includes('administrative_area_level_4'))
                  ) || data.results[0];
                  
                  const result = villageResult;
                  fullAddressLower = result.formatted_address.toLowerCase();
                  
                  const components = result.address_components;
                  const getComponent = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name;
                  
                  const village = getComponent('administrative_area_level_4') || getComponent('locality') || getComponent('sublocality');
                  const district = getComponent('administrative_area_level_3');
                  const regency = getComponent('administrative_area_level_2');
                  const state = getComponent('administrative_area_level_1');

                  const parts = [];
                  if (village) parts.push(village.toLowerCase().startsWith('desa') || village.toLowerCase().startsWith('kel') ? village : `Desa ${village}`);
                  if (district) parts.push(district.toLowerCase().startsWith('kec') ? district : `Kecamatan ${district}`);
                  if (regency) parts.push(regency);
                  if (state) parts.push(state);
                  
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
                  // Remove road data to focus on regional area
                  const village = data.address.village || data.address.hamlet || data.address.suburb || data.address.town;
                  const district = data.address.district || data.address.city_district;
                  const regency = data.address.county || data.address.city || data.address.region;
                  const state = data.address.state;

                  if (village) {
                    parts.push(village.toLowerCase().startsWith('desa') || village.toLowerCase().startsWith('kel') ? village : `Desa ${village}`);
                  }
                  if (district) {
                    parts.push(district.toLowerCase().startsWith('kec') ? district : `Kecamatan ${district}`);
                  }
                  if (regency) {
                    parts.push(regency.toLowerCase().startsWith('kab') || regency.toLowerCase().startsWith('kota') ? regency : `Kabupaten ${regency}`);
                  }
                  if (state) {
                    parts.push(state);
                  }
                  
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
          const locationNameLower = detectedAddress.toLowerCase();
          
          let withinRange = false;
          let closestDistance = Infinity;
          let activeRadius = 100;

          // 1. Cek berdasarkan kecocokan nama alamat (Name-based Approval)
          // Jika lokasi terdeteksi (alamat dari geocoding) mengandung nama kantor, izinkan terlepas dari jarak
          if (
            (officeAddress && (locationNameLower.includes(officeAddress) || officeAddress.includes(locationNameLower))) ||
            (officeAddress2 && (locationNameLower.includes(officeAddress2) || officeAddress2.includes(locationNameLower)))
          ) {
            withinRange = true;
          }

          // 2. Cek berdasarkan jarak koordinat ke lokasi (Coordinate-based Approval)
          // Hanya jika pendekatan nama (Name-based) gagal
          if (!withinRange) {
            withinRange = locations.some(loc => {
              if (!loc.coordinates) return false;
              
              // Hanya cek lokasi yang namanya sesuai dengan office atau office2 user
              const locNameLower = (loc.desa || loc.name || '').toLowerCase();
              const isUserLocation = 
                (officeAddress && (locNameLower.includes(officeAddress) || officeAddress.includes(locNameLower))) || 
                (officeAddress2 && (locNameLower.includes(officeAddress2) || officeAddress2.includes(locNameLower)));
              
              if (!isUserLocation) return false;

              const [lat, lng] = loc.coordinates.split(',').map(Number);
              if (isNaN(lat) || isNaN(lng)) return false;
              const distance = getDistance(userLat, userLng, lat, lng);
              
              if (distance < closestDistance) {
                closestDistance = distance;
                activeRadius = loc.radius || 100;
              }
              
              return distance <= (loc.radius || 100);
            });
          }

          // Check if within range of main office (Kantor Induk)
          if (!withinRange && settings?.generalSettings?.mainLocation) {
            const [mainLat, mainLng] = settings.generalSettings.mainLocation.split(',').map(Number);
            if (!isNaN(mainLat) && !isNaN(mainLng)) {
              const distanceToMain = getDistance(userLat, userLng, mainLat, mainLng);
              if (distanceToMain < closestDistance) {
                closestDistance = distanceToMain;
                activeRadius = 100;
              }
              if (distanceToMain <= 100) {
                withinRange = true;
              }
            }
          }

          setIsWithinRange(withinRange);
          if (!withinRange) {
              if (closestDistance !== Infinity) {
                setError(`Berada di luar jangkauan radius (Jarak: ${Math.round(closestDistance)}m, Radius diizinkan: ${activeRadius}m). Akurasi GPS Anda: ${Math.round(accuracy)}m.`);
              } else {
                setError('Lokasi kerja tidak ditemukan di sistem atau pengaturan koordinat tidak valid.');
              }
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
      
      // Re-fetch attendance data to update UI instead of redirecting
      const attRes = await fetch('/api/attendance');
      if (attRes.ok) {
        const data = await attRes.json();
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const today = format(new Date(), 'yyyy-MM-dd');
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
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat absen.');
    } finally {
      setIsAbsenting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center transition-colors">
      <div className="w-full max-w-md space-y-4">
        {announcements.length > 0 && (
          <div className="space-y-2">
            {announcements.map((ann) => (
              <Alert key={ann.id} className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200">
                <AlertDescription>
                  <strong className="block mb-1 text-blue-900 dark:text-blue-100">{ann.title}</strong>
                  {ann.content}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
          <CardHeader>
            <CardTitle className="text-teal-600 dark:text-teal-400 text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6" />
              {hasCheckedIn ? (canCheckOut ? 'Absen Pulang' : 'Status Absensi') : 'Absen Masuk'}
            </CardTitle>
            {user && (
              <div className="text-slate-600 dark:text-slate-300 text-sm mt-2 space-y-1">
                <p><strong>Nama:</strong> {user.name}</p>
                <p><strong>NIP:</strong> {user.nip}</p>
                <p><strong>Kantor 1:</strong> {user.office}</p>
                {user.office2 && <p><strong>Kantor 2:</strong> {user.office2}</p>}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {leaveType ? (
              <Alert className="bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-500" />
                <AlertDescription className="text-lg font-medium text-center py-4">
                  {leaveType === 'sakit' && "Semoga lekas sembuh dan diberikan kesehatan seperti sediakala. Aamiin"}
                  {leaveType === 'izin' && "Semoga segala urusannya dimudahkan"}
                  {leaveType === 'Cuti' && "Semoga hari - hari cuti anda bermanfaat"}
                </AlertDescription>
              </Alert>
            ) : hasCheckedIn && !canCheckOut && !hasCheckedOut ? (
              <Alert className="bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400 flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="w-8 h-8 text-teal-600 dark:text-teal-500 mb-2" />
                <AlertDescription className="text-center space-y-4">
                  <p>Anda telah melakukan absen MASUK pada <strong>{checkInTime}</strong></p>
                  <p>Silahkan Absen Pulang pada Jam <strong>{shiftEndTime}</strong></p>
                  <div className="mt-4">
                    <p className="text-sm text-teal-600/80 dark:text-teal-500/80 mb-1">Waktu Menuju Absen Pulang:</p>
                    <p className="text-5xl font-mono font-bold text-slate-800 dark:text-white tracking-wider">{countdown}</p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : hasCheckedOut ? (
              <Alert className="bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-500" />
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
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!hasCheckedIn && checkInCountdown && !canCheckIn && (
                  <Alert className="bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400">
                    <AlertDescription className="text-center">
                      <p className="mb-2">Shift berikutnya: <strong>{nextShift?.name} ({nextShift?.startTime})</strong></p>
                      <p className="text-xs mb-1">Waktu menuju pembukaan absen masuk:</p>
                      <p className="text-3xl font-mono font-bold tracking-wider text-slate-800 dark:text-teal-100">{checkInCountdown}</p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-500 shrink-0" />
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{isLocating ? 'Mencari lokasi...' : address ? `Lokasi: ${address}` : 'Lokasi tidak ditemukan'}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchLocation} 
                      disabled={isLocating && !canRefresh}
                      className="h-8 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 shrink-0"
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
                  onClick={() => isWithinRange ? handleAbsen() : navigate('/user/leave')}
                  disabled={!location || isAbsenting || (!canCheckIn && !hasCheckedIn && isWithinRange)}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all disabled:opacity-50"
                >
                  {isAbsenting ? 'Memproses...' : !isWithinRange ? 'Ajukan Izin' : (hasCheckedIn ? 'Absen Pulang' : (canCheckIn ? 'Absen Masuk' : 'Belum Waktunya'))}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
