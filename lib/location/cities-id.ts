import { CitySearchResult } from '@/types';

export const POPULAR_CITIES: CitySearchResult[] = [
  // DKI Jakarta
  { id: 'jkt-pusat', name: 'Jakarta Pusat', adminName: 'DKI Jakarta', country: 'Indonesia', latitude: -6.1805, longitude: 106.8284, timezone: 'Asia/Jakarta' },
  { id: 'jkt-selatan', name: 'Jakarta Selatan', adminName: 'DKI Jakarta', country: 'Indonesia', latitude: -6.2615, longitude: 106.8106, timezone: 'Asia/Jakarta' },
  { id: 'jkt-timur', name: 'Jakarta Timur', adminName: 'DKI Jakarta', country: 'Indonesia', latitude: -6.2250, longitude: 106.9004, timezone: 'Asia/Jakarta' },
  { id: 'jkt-barat', name: 'Jakarta Barat', adminName: 'DKI Jakarta', country: 'Indonesia', latitude: -6.1683, longitude: 106.7589, timezone: 'Asia/Jakarta' },
  { id: 'jkt-utara', name: 'Jakarta Utara', adminName: 'DKI Jakarta', country: 'Indonesia', latitude: -6.1384, longitude: 106.8642, timezone: 'Asia/Jakarta' },
  
  // Jawa Barat & Banten
  { id: 'bdg', name: 'Bandung', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta' },
  { id: 'bgr', name: 'Bogor', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -6.5971, longitude: 106.8060, timezone: 'Asia/Jakarta' },
  { id: 'dpk', name: 'Depok', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -6.4025, longitude: 106.7942, timezone: 'Asia/Jakarta' },
  { id: 'bks', name: 'Bekasi', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -6.2383, longitude: 106.9756, timezone: 'Asia/Jakarta' },
  { id: 'tgr', name: 'Tangerang', adminName: 'Banten', country: 'Indonesia', latitude: -6.1783, longitude: 106.6319, timezone: 'Asia/Jakarta' },
  { id: 'tgr-sel', name: 'Tangerang Selatan', adminName: 'Banten', country: 'Indonesia', latitude: -6.2889, longitude: 106.7179, timezone: 'Asia/Jakarta' },
  { id: 'crb', name: 'Cirebon', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -6.7320, longitude: 108.5523, timezone: 'Asia/Jakarta' },
  { id: 'tsm', name: 'Tasikmalaya', adminName: 'Jawa Barat', country: 'Indonesia', latitude: -7.3274, longitude: 108.2207, timezone: 'Asia/Jakarta' },
  { id: 'srn', name: 'Serang', adminName: 'Banten', country: 'Indonesia', latitude: -6.1104, longitude: 106.1639, timezone: 'Asia/Jakarta' },

  // Jawa Tengah & DIY
  { id: 'smg', name: 'Semarang', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -6.9667, longitude: 110.4167, timezone: 'Asia/Jakarta' },
  { id: 'slo', name: 'Surakarta (Solo)', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -7.5755, longitude: 110.8243, timezone: 'Asia/Jakarta' },
  { id: 'jog', name: 'Yogyakarta', adminName: 'DI Yogyakarta', country: 'Indonesia', latitude: -7.7956, longitude: 110.3695, timezone: 'Asia/Jakarta' },
  { id: 'pwt', name: 'Purwokerto (Banyumas)', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -7.4243, longitude: 109.2302, timezone: 'Asia/Jakarta' },
  { id: 'tgl', name: 'Tegal', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -6.8797, longitude: 109.1256, timezone: 'Asia/Jakarta' },
  { id: 'pkl', name: 'Pekalongan', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -6.8886, longitude: 109.6753, timezone: 'Asia/Jakarta' },
  { id: 'kds', name: 'Kudus', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -6.8048, longitude: 110.8405, timezone: 'Asia/Jakarta' },
  { id: 'mgl', name: 'Magelang', adminName: 'Jawa Tengah', country: 'Indonesia', latitude: -7.4706, longitude: 110.2178, timezone: 'Asia/Jakarta' },

  // Jawa Timur
  { id: 'sby', name: 'Surabaya', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta' },
  { id: 'mlg', name: 'Malang', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -7.9666, longitude: 112.6326, timezone: 'Asia/Jakarta' },
  { id: 'sda', name: 'Sidoarjo', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -7.4726, longitude: 112.6675, timezone: 'Asia/Jakarta' },
  { id: 'kdr', name: 'Kediri', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -7.8480, longitude: 112.0178, timezone: 'Asia/Jakarta' },
  { id: 'mdo', name: 'Madiun', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -7.6298, longitude: 111.5239, timezone: 'Asia/Jakarta' },
  { id: 'jmr', name: 'Jember', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -8.1721, longitude: 113.6995, timezone: 'Asia/Jakarta' },
  { id: 'bwi', name: 'Banyuwangi', adminName: 'Jawa Timur', country: 'Indonesia', latitude: -8.2192, longitude: 114.3692, timezone: 'Asia/Jakarta' },

  // Sumatera
  { id: 'mdn', name: 'Medan', adminName: 'Sumatera Utara', country: 'Indonesia', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta' },
  { id: 'plb', name: 'Palembang', adminName: 'Sumatera Selatan', country: 'Indonesia', latitude: -2.9761, longitude: 104.7754, timezone: 'Asia/Jakarta' },
  { id: 'btm', name: 'Batam', adminName: 'Kepulauan Riau', country: 'Indonesia', latitude: 1.1301, longitude: 104.0529, timezone: 'Asia/Jakarta' },
  { id: 'pku', name: 'Pekanbaru', adminName: 'Riau', country: 'Indonesia', latitude: 0.5071, longitude: 101.4478, timezone: 'Asia/Jakarta' },
  { id: 'pdg', name: 'Padang', adminName: 'Sumatera Barat', country: 'Indonesia', latitude: -0.9471, longitude: 100.4172, timezone: 'Asia/Jakarta' },
  { id: 'blg', name: 'Bandar Lampung', adminName: 'Lampung', country: 'Indonesia', latitude: -5.3971, longitude: 105.2668, timezone: 'Asia/Jakarta' },
  { id: 'btj', name: 'Banda Aceh', adminName: 'Aceh', country: 'Indonesia', latitude: 5.5483, longitude: 95.3238, timezone: 'Asia/Jakarta' },
  { id: 'jmb', name: 'Jambi', adminName: 'Jambi', country: 'Indonesia', latitude: -1.6101, longitude: 103.6131, timezone: 'Asia/Jakarta' },
  { id: 'bgl', name: 'Bengkulu', adminName: 'Bengkulu', country: 'Indonesia', latitude: -3.7928, longitude: 102.2608, timezone: 'Asia/Jakarta' },
  { id: 'pkr', name: 'Pangkal Pinang', adminName: 'Bangka Belitung', country: 'Indonesia', latitude: -2.1316, longitude: 106.1169, timezone: 'Asia/Jakarta' },

  // Bali & Nusa Tenggara (WITA)
  { id: 'dps', name: 'Denpasar', adminName: 'Bali', country: 'Indonesia', latitude: -8.6705, longitude: 115.2126, timezone: 'Asia/Makassar' },
  { id: 'mtr', name: 'Mataram (Lombok)', adminName: 'Nusa Tenggara Barat', country: 'Indonesia', latitude: -8.5833, longitude: 116.1167, timezone: 'Asia/Makassar' },
  { id: 'kpg', name: 'Kupang', adminName: 'Nusa Tenggara Timur', country: 'Indonesia', latitude: -10.1772, longitude: 123.6070, timezone: 'Asia/Makassar' },

  // Kalimantan (WIB & WITA)
  { id: 'pnk', name: 'Pontianak', adminName: 'Kalimantan Barat', country: 'Indonesia', latitude: -0.0263, longitude: 109.3425, timezone: 'Asia/Pontianak' },
  { id: 'bjm', name: 'Banjarmasin', adminName: 'Kalimantan Selatan', country: 'Indonesia', latitude: -3.3194, longitude: 114.5908, timezone: 'Asia/Makassar' },
  { id: 'bpn', name: 'Balikpapan', adminName: 'Kalimantan Timur', country: 'Indonesia', latitude: -1.2379, longitude: 116.8529, timezone: 'Asia/Makassar' },
  { id: 'smd', name: 'Samarinda', adminName: 'Kalimantan Timur', country: 'Indonesia', latitude: -0.5016, longitude: 117.1537, timezone: 'Asia/Makassar' },
  { id: 'plk', name: 'Palangka Raya', adminName: 'Kalimantan Tengah', country: 'Indonesia', latitude: -2.2161, longitude: 113.9139, timezone: 'Asia/Jakarta' },
  { id: 'trr', name: 'Tarakan', adminName: 'Kalimantan Utara', country: 'Indonesia', latitude: 3.3273, longitude: 117.5785, timezone: 'Asia/Makassar' },
  { id: 'ikn', name: 'Nusantara (IKN)', adminName: 'Kalimantan Timur', country: 'Indonesia', latitude: -0.9634, longitude: 116.7083, timezone: 'Asia/Makassar' },

  // Sulawesi (WITA)
  { id: 'mks', name: 'Makassar', adminName: 'Sulawesi Selatan', country: 'Indonesia', latitude: -5.1477, longitude: 119.4327, timezone: 'Asia/Makassar' },
  { id: 'mnd', name: 'Manado', adminName: 'Sulawesi Utara', country: 'Indonesia', latitude: 1.4748, longitude: 124.8421, timezone: 'Asia/Makassar' },
  { id: 'pal', name: 'Palu', adminName: 'Sulawesi Tengah', country: 'Indonesia', latitude: -0.9003, longitude: 119.8780, timezone: 'Asia/Makassar' },
  { id: 'kdi', name: 'Kendari', adminName: 'Sulawesi Tenggara', country: 'Indonesia', latitude: -3.9985, longitude: 122.5126, timezone: 'Asia/Makassar' },
  { id: 'gto', name: 'Gorontalo', adminName: 'Gorontalo', country: 'Indonesia', latitude: 0.5435, longitude: 123.0568, timezone: 'Asia/Makassar' },
  { id: 'mmj', name: 'Mamuju', adminName: 'Sulawesi Barat', country: 'Indonesia', latitude: -2.6771, longitude: 118.8879, timezone: 'Asia/Makassar' },

  // Maluku & Papua (WIT)
  { id: 'amb', name: 'Ambon', adminName: 'Maluku', country: 'Indonesia', latitude: -3.6547, longitude: 128.1906, timezone: 'Asia/Jayapura' },
  { id: 'tnt', name: 'Ternate', adminName: 'Maluku Utara', country: 'Indonesia', latitude: 0.7893, longitude: 127.3610, timezone: 'Asia/Jayapura' },
  { id: 'jyp', name: 'Jayapura', adminName: 'Papua', country: 'Indonesia', latitude: -2.5916, longitude: 140.6690, timezone: 'Asia/Jayapura' },
  { id: 'srg', name: 'Sorong', adminName: 'Papua Barat Daya', country: 'Indonesia', latitude: -0.8762, longitude: 131.2558, timezone: 'Asia/Jayapura' },
  { id: 'mrk', name: 'Merauke', adminName: 'Papua Selatan', country: 'Indonesia', latitude: -8.4991, longitude: 140.4010, timezone: 'Asia/Jayapura' },

  // International Islamic Hubs / Major World Cities
  { id: 'mkk', name: 'Makkah (Mecca)', adminName: 'Makkah Province', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { id: 'mdh', name: 'Madinah (Medina)', adminName: 'Al Madinah', country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6111, timezone: 'Asia/Riyadh' },
  { id: 'kul', name: 'Kuala Lumpur', adminName: 'Federal Territory', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'sin', name: 'Singapore', adminName: 'Central Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { id: 'ist', name: 'Istanbul', adminName: 'Marmara', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'cai', name: 'Cairo', adminName: 'Cairo Governorate', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'dxb', name: 'Dubai', adminName: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'lon', name: 'London', adminName: 'Greater London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { id: 'tyo', name: 'Tokyo', adminName: 'Kanto', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'syd', name: 'Sydney', adminName: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
];

/**
 * Searches city list by query string matching name, province, or country
 */
export function searchLocalCities(query: string, limit: number = 8): CitySearchResult[] {
  if (!query || query.trim().length === 0) {
    return POPULAR_CITIES.slice(0, limit);
  }

  const cleanQuery = query.toLowerCase().trim();
  return POPULAR_CITIES.filter((city) => {
    return (
      city.name.toLowerCase().includes(cleanQuery) ||
      (city.adminName && city.adminName.toLowerCase().includes(cleanQuery)) ||
      city.country.toLowerCase().includes(cleanQuery)
    );
  }).slice(0, limit);
}
