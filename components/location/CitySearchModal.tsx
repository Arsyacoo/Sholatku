'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CitySearchResult, UserLocation } from '@/types';
import {
  CITY_SEARCH_MIN_LENGTH,
  NOMINATIM_MIN_INTERVAL_MS,
  normalizeCityQuery,
  OSM_ATTRIBUTION_URL,
  searchOnlineCities,
} from '@/lib/location/geocoding';
import { POPULAR_CITIES, searchLocalCities } from '@/lib/location/cities-id';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectCity: (city: CitySearchResult) => void;
  onDetectLocation: () => void;
  isDetecting: boolean;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectCity,
  onDetectLocation,
  isDetecting,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>(POPULAR_CITIES.slice(0, 10));
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<'timeout' | 'network' | null>(null);
  const [isOnlineResult, setIsOnlineResult] = useState(false);
  const requestsRef = useRef<LatestRequestController | null>(null);
  if (!requestsRef.current) requestsRef.current = new LatestRequestController();
  const lastOnlineSearchAtRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      requestsRef.current?.cancel();
      setQuery('');
      setResults(POPULAR_CITIES.slice(0, 10));
      setSearchError(null);
      setIsSearching(false);
      setIsOnlineResult(false);
      return;
    }
  }, [isOpen]);

  // Typing only filters the bundled city list; Nominatim forbids search-as-you-type.
  useEffect(() => {
    if (!isOpen) return;
    const normalizedQuery = normalizeCityQuery(query);
    requestsRef.current?.cancel();
    setSearchError(null);
    setIsSearching(false);
    setIsOnlineResult(false);
    if (!normalizedQuery) {
      setResults(POPULAR_CITIES.slice(0, 10));
    } else {
      setResults(normalizedQuery.length < CITY_SEARCH_MIN_LENGTH ? [] : searchLocalCities(normalizedQuery, 8));
    }
    return () => requestsRef.current?.cancel();
  }, [isOpen, query]);

  const canSearchOnline = normalizeCityQuery(query).length >= CITY_SEARCH_MIN_LENGTH;

  const handleOnlineSearch = async () => {
    const now = Date.now();
    if (!canSearchOnline || isSearching || now - lastOnlineSearchAtRef.current < NOMINATIM_MIN_INTERVAL_MS) return;
    lastOnlineSearchAtRef.current = now;

    const request = requestsRef.current!.begin();
    setSearchError(null);
    setIsSearching(true);
    try {
      const nextResults = await searchOnlineCities(query, { signal: request.signal });
      if (request.isCurrent()) {
        setResults(nextResults);
        setIsOnlineResult(true);
      }
    } catch (error) {
      if (!request.isCurrent() || isNetworkRequestError(error, 'aborted')) return;
      setSearchError(isNetworkRequestError(error, 'timeout') ? 'timeout' : 'network');
    } finally {
      if (request.isCurrent()) setIsSearching(false);
      requestsRef.current?.finish(request);
    }
  };

  const handleSelect = (city: CitySearchResult) => {
    onSelectCity(city);
    onClose();
  };

  const handleDetect = () => {
    onDetectLocation();
    onClose();
  };

  const handleModalClose = () => {
    onClose();
    window.setTimeout(() => {
      document.querySelector<HTMLElement>('[aria-label="Ubah lokasi saat ini"]')?.focus();
    }, 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Pilih Lokasi Wilayah"
      maxWidth="md"
      returnFocusSelector='[aria-label="Ubah lokasi saat ini"]'
    >
      <div className="space-y-4">
        {/* GPS Auto-detect Button */}
        <Button
          variant="secondary"
          onClick={handleDetect}
          isLoading={isDetecting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-800"
        >
          <Navigation className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span>Gunakan Lokasi Otomatis (GPS)</span>
        </Button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-surface-200 dark:border-surface-800" />
          <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">atau cari kota / daerah</span>
          <div className="flex-grow border-t border-surface-200 dark:border-surface-800" />
        </div>

        {/* Search Input */}
        <form
          className="relative"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            void handleOnlineSearch();
          }}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama kota, kabupaten, atau provinsi..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
          )}
        </form>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {isSearching ? (
            <div className="text-center py-8 text-sm text-slate-500" aria-live="polite">
              Mencari lokasi...
            </div>
          ) : normalizeCityQuery(query).length > 0 && normalizeCityQuery(query).length < CITY_SEARCH_MIN_LENGTH ? (
            <div className="text-center py-8 text-sm text-slate-500">
              Ketik minimal {CITY_SEARCH_MIN_LENGTH} karakter untuk mencari lokasi.
            </div>
          ) : searchError ? (
            <div className="space-y-3 py-8 text-center text-sm text-slate-500" role="status">
              <p>
                {searchError === 'timeout'
                  ? 'Pencarian lokasi terlalu lama. Silakan coba lagi.'
                  : 'Layanan pencarian lokasi sedang tidak tersedia.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => void handleOnlineSearch()}>
                Coba Lagi
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              {isOnlineResult
                ? <>Tidak ditemukan kota dengan kata kunci &ldquo;{query}&rdquo;</>
                : <>&ldquo;{query}&rdquo; tidak ada di daftar kota. Tekan Enter untuk mencari secara online.</>}
            </div>
          ) : (
            results.map((city) => {
              const isSelected =
                Math.abs(city.latitude - currentLocation.latitude) < 0.05 &&
                Math.abs(city.longitude - currentLocation.longitude) < 0.05;

              return (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100 border border-primary-200 dark:border-primary-800'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <div className="font-semibold">{city.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {city.adminName ? `${city.adminName}, ` : ''}
                        {city.country}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {canSearchOnline && !isSearching && !isOnlineResult && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => void handleOnlineSearch()}>
            <Search className="h-3.5 w-3.5" />
            Cari &ldquo;{query.trim()}&rdquo; secara online
          </Button>
        )}
        {isOnlineResult && (
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            Data lokasi ©{' '}
            <a href={OSM_ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer" className="underline">
              OpenStreetMap contributors
            </a>
          </p>
        )}
      </div>
    </Modal>
  );
};
