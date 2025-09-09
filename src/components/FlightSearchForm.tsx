import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronUp, ChevronDown, ChevronDown as ChevronDownIcon, RotateCcw, RotateCw, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FlightSearchData {
  departure: string;
  arrival: string;
  departureDate: string;
  returnDate: string;
  tripType: 'OW' | 'RT';
  adults: number;
  children: number;
  infants: number;
  oneWayFee: number;
  roundTripFeeVietjet: number;
  roundTripFeeVNA: number;
  vnaThreshold1: number;
  vnaDiscount1: number;
  vnaThreshold2: number;
  vnaDiscount2: number;
  vietjetThreshold1: number;
  vietjetDiscount1: number;
  vietjetThreshold2: number;
  vietjetDiscount2: number;
}

interface FlightSearchFormProps {
  onSearch: (data: FlightSearchData) => void;
  isLoading: boolean;
  customerType?: 'page' | 'live' | 'custom' | null;
}

// Airport codes with location names
const airportOptions = [
  { code: 'ICN', name: 'ICN (Seoul)' },
  { code: 'PUS', name: 'PUS (Busan)' },
  { code: 'TAE', name: 'TAE (Daegu)' },
  { code: 'HAN', name: 'HAN (Hà Nội)' },
  { code: 'SGN', name: 'SGN (TP Hồ Chí Minh)' },
  { code: 'DAD', name: 'DAD (Đà Nẵng)' },
  { code: 'HPH', name: 'HPH (Hải Phòng)' },
  { code: 'VCA', name: 'VCA (Cần Thơ)' },
  { code: 'CXR', name: 'CXR (Nha Trang – Cam Ranh)' },
  { code: 'DLI', name: 'DLI (Đà Lạt)' },
  { code: 'VDH', name: 'VDH (Đồng Hới – Quảng Bình)' },
  { code: 'BMV', name: 'BMV (Buôn Ma Thuột)' },
  { code: 'VII', name: 'VII (Vinh)' },
  { code: 'UIH', name: 'UIH (Quy Nhơn – Phù Cát)' },
  { code: 'THD', name: 'THD (Thanh Hóa – Thọ Xuân)' },
  { code: 'PQC', name: 'PQC (Phú Quốc)' },
  { code: 'PXU', name: 'PXU (Pleiku)' },
  { code: 'HUI', name: 'HUI (Huế – Phú Bài)' },
  { code: 'VCL', name: 'VCL (Tam Kỳ – Chu Lai)' },
  { code: 'CAH', name: 'CAH (Cà Mau)' },
  { code: 'DIN', name: 'DIN (Điện Biên)' },
  { code: 'VKG', name: 'VKG (Rạch Giá)' },
  { code: 'TBB', name: 'TBB (Tuy Hòa – Phú Yên)' },
  { code: 'VDO', name: 'VDO (Vân Đồn – Quảng Ninh)' }
];

const koreanAirports = ['ICN', 'PUS', 'TAE'];

const AirportSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  excludeCodes?: string[];
}> = ({ value, onChange, label, excludeCodes = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const availableOptions = airportOptions.filter(option => !excludeCodes.includes(option.code));
  const filteredOptions = availableOptions.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[selectedIndex].code);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
      setSelectedIndex(newIndex);
      // Scroll to selected item
      if (listRef.current) {
        const selectedElement = listRef.current.children[newIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(newIndex);
      // Scroll to selected item
      if (listRef.current) {
        const selectedElement = listRef.current.children[newIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOptions]);

  const selectedOption = airportOptions.find(option => option.code === value);
  const displayValue = selectedOption ? selectedOption.name : value;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-left flex items-center justify-between"
        >
          <span>{displayValue}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Gõ mã sân bay..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
              />
            </div>
            <div ref={listRef} className="overflow-y-auto" style={{ height: '360px' }}>
              {filteredOptions.map((option, index) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 text-sm ${
                    index === selectedIndex ? 'bg-blue-100' : ''
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FlightSearchForm: React.FC<FlightSearchFormProps> = ({ onSearch, isLoading, customerType: propCustomerType }) => {
  const [formData, setFormData] = useState<FlightSearchData>({
    departure: 'ICN',
    arrival: 'HAN',
    departureDate: '',
    returnDate: '',
    tripType: 'RT',
    adults: 1,
    children: 0,
    infants: 0,
    oneWayFee: 35000, // Default to "Khách PAGE"
    roundTripFeeVietjet: 20000, // Default for PAGE
    roundTripFeeVNA: 15000, // Default for PAGE
    vnaThreshold1: 0,
    vnaDiscount1: 0, // Default 0 for PAGE
    vnaThreshold2: 0,
    vnaDiscount2: 0, // Default 0 for PAGE
    vietjetThreshold1: 0,
    vietjetDiscount1: 0, // Default 0 for PAGE
    vietjetThreshold2: 0,
    vietjetDiscount2: 0 // Default 0 for PAGE
  });

  // State for DatePicker
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [departureOpen, setDepartureOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [customerType, setCustomerType] = useState<'page' | 'live'>('page');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [discountSectionOpen, setDiscountSectionOpen] = useState(false);

  // Refs for debounce / state sync / throttle
  const departureTimerRef = useRef<number | null>(null);
  const formDataRef = useRef(formData);
  const openThrottleRef = useRef<number>(0);
  const returnDateRef = useRef<HTMLInputElement>(null);

  // Keep a ref copy of latest formData for timers/closures
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update customer type when prop changes
  useEffect(() => {
    if (propCustomerType === 'custom') {
      setIsCustomMode(true);
    } else if (propCustomerType === 'page' || propCustomerType === 'live') {
      setCustomerType(propCustomerType);
      setIsCustomMode(false);
      if (propCustomerType === 'page') {
        setFormData(prev => ({ 
          ...prev, 
          oneWayFee: 35000, 
          roundTripFeeVietjet: 20000, 
          roundTripFeeVNA: 15000, 
          vnaThreshold1: 0,
          vnaDiscount1: 0,
          vnaThreshold2: 0,
          vnaDiscount2: 0,
          vietjetThreshold1: 0,
          vietjetDiscount1: 0,
          vietjetThreshold2: 0,
          vietjetDiscount2: 0
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          oneWayFee: 30000, 
          roundTripFeeVietjet: 10000, 
          roundTripFeeVNA: 10000, 
          vnaThreshold1: 500000,
          vnaDiscount1: 3000,
          vnaThreshold2: 700000,
          vnaDiscount2: 5000,
          vietjetThreshold1: 0,
          vietjetDiscount1: 0,
          vietjetThreshold2: 0,
          vietjetDiscount2: 0
        }));
      }
    }
  }, [propCustomerType]);

  // Set default departure date to today
  useEffect(() => {
    const todayDate = new Date();
    const today = format(todayDate, 'yyyy-MM-dd');
    setFormData(prev => ({ ...prev, departureDate: today }));
    setDepartureDate(todayDate);
  }, []);

  // Sync Date objects with string values
  useEffect(() => {
    if (departureDate) {
      const dateStr = format(departureDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, departureDate: dateStr }));
    }
  }, [departureDate]);

  useEffect(() => {
    if (returnDate) {
      const dateStr = format(returnDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, returnDate: dateStr }));
    } else {
      setFormData(prev => ({ ...prev, returnDate: '' }));
    }
  }, [returnDate]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (departureTimerRef.current) {
        window.clearTimeout(departureTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleSwapAirports = () => {
    setFormData(prev => ({
      ...prev,
      departure: prev.arrival,
      arrival: prev.departure
    }));
  };

  // Handle departure date change
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
    setDepartureOpen(false);

    // Reset return date if it's before departure date
    if (date && returnDate && returnDate < date) {
      setReturnDate(undefined);
    }

    // Open return date picker for round trip
    if (date && formData.tripType === 'RT') {
      setTimeout(() => {
        setReturnOpen(true);
      }, 100);
    }
  };

  // Handle return date change  
  const handleReturnDateChange = (date: Date | undefined) => {
    setReturnDate(date);
    setReturnOpen(false);
  };

  // Reset departure date and return date to today
  const handleResetDepartureDate = () => {
    const todayDate = new Date();
    setDepartureDate(todayDate);
    if (formData.tripType === 'RT') {
      setReturnDate(todayDate);
    }
  };

  const adjustFee = (type: 'oneWay' | 'roundTripVietjet' | 'roundTripVNA', direction: 'up' | 'down') => {
    if (!isCustomMode) return; // Only allow adjustment in custom mode

    setFormData(prev => {
      const key = type === 'oneWay' ? 'oneWayFee' :
        type === 'roundTripVietjet' ? 'roundTripFeeVietjet' : 'roundTripFeeVNA';
      // @ts-ignore
      const currentValue = prev[key];
      const newValue = direction === 'up' ? currentValue + 5000 : Math.max(0, currentValue - 5000);
      // @ts-ignore
      return { ...prev, [key]: newValue };
    });
  };

  const handleCustomerTypeChange = (type: 'page' | 'live') => {
    setCustomerType(type);
    setIsCustomMode(false); // Turn off custom mode when selecting preset customer type
    if (type === 'page') {
      setFormData(prev => ({ 
        ...prev, 
        oneWayFee: 35000, 
        roundTripFeeVietjet: 20000, 
        roundTripFeeVNA: 15000, 
        vnaThreshold1: 300000,
        vnaDiscount1: 0,
        vnaThreshold2: 500000,
        vnaDiscount2: 0,
        vietjetThreshold1: 300000,
        vietjetDiscount1: 0,
        vietjetThreshold2: 500000,
        vietjetDiscount2: 0
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        oneWayFee: 30000, 
        roundTripFeeVietjet: 10000, 
        roundTripFeeVNA: 10000, 
        vnaThreshold1: 300000,
        vnaDiscount1: 5000,
        vnaThreshold2: 500000,
        vnaDiscount2: 7000,
        vietjetThreshold1: 0,
        vietjetDiscount1: 0,
        vietjetThreshold2: 0,
        vietjetDiscount2: 0
      }));
    }
  };

  const handleCustomModeToggle = () => {
    setIsCustomMode(!isCustomMode);
  };

  // Reset form to initial state (except fees)
  const handleReset = () => {
    const todayDate = new Date();
    const today = format(todayDate, 'yyyy-MM-dd');
    setFormData(prev => ({
      ...prev,
      departure: 'ICN',
      arrival: 'HAN',
      departureDate: today,
      returnDate: '',
      tripType: 'RT',
      adults: 1,
      children: 0,
      infants: 0
      // Keep oneWayFee, roundTripFeeVietjet and roundTripFeeVNA unchanged
    }));
    setDepartureDate(todayDate);
    setReturnDate(undefined);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get excluded codes for destination based on departure
  const getExcludedCodes = () => {
    const excluded = [formData.departure]; // Exclude same airport

    // If departure is Korean airport, exclude all Korean airports from destination
    if (koreanAirports.includes(formData.departure)) {
      excluded.push(...koreanAirports.filter(code => code !== formData.departure));
    }

    return excluded;
  };

  // Get fee text color based on customer type and mode
  const getFeeTextColor = () => {
    if (isCustomMode) {
      return 'text-green-600'; // Green for custom mode
    } else if (customerType === 'page') {
      return 'text-blue-600'; // Blue for PAGE customers
    } else {
      return 'text-red-600'; // Red for LIVE customers
    }
  };

  // Custom formatter for calendar caption
  const customFormatters = {
    formatCaption: (date: Date) => {
      const month = format(date, 'MM');
      const year = format(date, 'yyyy');
      return `Th${month} ${year}`;
    }
  };

  // Get minimum date (today)
  const today = format(new Date(), 'yyyy-MM-dd');
  // Get minimum return date (departure date or today, whichever is later)
  const minReturnDate = formData.departureDate > today ? formData.departureDate : today;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      {/* Header and Customer Type Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Tìm chuyến bay</h2>

        <div className="flex items-center space-x-4">
          <h3 className="text-base font-semibold text-gray-800 ml-4">Phí xuất vé:</h3>

          {/* Customer Type Buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleCustomerTypeChange('page')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                customerType === 'page' && !isCustomMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Khách PAGE
            </button>
            <button
              type="button"
              onClick={() => handleCustomerTypeChange('live')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                customerType === 'live' && !isCustomMode
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Khách LIVE
            </button>
            <button
              type="button"
              onClick={handleCustomModeToggle}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                isCustomMode
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              TÙY CHỈNH
            </button>
          </div>

          {/* Fee Inputs */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Phí một chiều (₩)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.oneWayFee}
                  onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, oneWayFee: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className={`w-20 px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold ${
                    !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee('oneWay', 'up')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee('oneWay', 'down')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Khứ hồi VIETJET (₩)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.roundTripFeeVietjet}
                  onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, roundTripFeeVietjet: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className={`w-20 px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold ${
                    !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee('roundTripVietjet', 'up')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee('roundTripVietjet', 'down')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Khứ hồi VNA (₩)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.roundTripFeeVNA}
                  onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, roundTripFeeVNA: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className={`w-20 px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold ${
                    !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee('roundTripVNA', 'up')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee('roundTripVNA', 'down')}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Configuration - Collapsible */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Giảm giá theo mức vé</h4>
              <button
                type="button"
                onClick={() => setDiscountSectionOpen(!discountSectionOpen)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                <Settings className="w-3 h-3" />
                <span>{discountSectionOpen ? 'Ẩn' : 'Hiện'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${discountSectionOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {discountSectionOpen && (
               <div className="grid grid-cols-1 gap-6 items-start">
                {/* VNA Discounts */}
                <div>
                  <h5 className="w-full text-xs font-medium text-gray-600 mb-2">VNA</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">≥</span>
                      <input
                        type="number"
                        value={formData.vnaThreshold1}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vnaThreshold1: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-600">₩ trừ</span>
                      <input
                        type="number"
                        value={formData.vnaDiscount1}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vnaDiscount1: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${getFeeTextColor()}`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-500">₩</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">≥</span>
                      <input
                        type="number"
                        value={formData.vnaThreshold2}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vnaThreshold2: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-600">₩ trừ</span>
                      <input
                        type="number"
                        value={formData.vnaDiscount2}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vnaDiscount2: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${getFeeTextColor()}`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-500">₩</span>
                    </div>
                  </div>
                </div>

                {/* VIETJET Discounts */}
                <div>
                  <h5 className="w-full text-xs font-medium text-gray-600 mb-2">VIETJET</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">≥</span>
                      <input
                        type="number"
                        value={formData.vietjetThreshold1}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vietjetThreshold1: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-600">₩ trừ</span>
                      <input
                        type="number"
                        value={formData.vietjetDiscount1}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vietjetDiscount1: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${getFeeTextColor()}`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-500">₩</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">≥</span>
                      <input
                        type="number"
                        value={formData.vietjetThreshold2}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vietjetThreshold2: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-600">₩ trừ</span>
                      <input
                        type="number"
                        value={formData.vietjetDiscount2}
                        onChange={(e) => isCustomMode && setFormData(prev => ({ ...prev, vietjetDiscount2: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className={`w-16 px-1 py-1 border border-gray-300 rounded text-xs ${
                          !isCustomMode ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${getFeeTextColor()}`}
                        min="0"
                        disabled={!isCustomMode}
                      />
                      <span className="text-xs text-gray-500">₩</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main form layout - 3 columns */}
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* Column 1: Trip Type and Reset Button - Always visible */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại vé</label>
            <div className="space-y-2 mb-3">
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  value="OW"
                  checked={formData.tripType === 'OW'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripType: e.target.value as 'OW' | 'RT' }))}
                  className="mr-2"
                />
                Một chiều
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  value="RT"
                  checked={formData.tripType === 'RT'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripType: e.target.value as 'OW' | 'RT' }))}
                  className="mr-2"
                />
                Khứ hồi
              </label>
            </div>

            {/* Reset Button - Always visible with reduced width */}
            <button
              type="button"
              onClick={handleReset}
              className="w-1/2 bg-orange-500 text-white py-2 px-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-xs flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              NHẬP LẠI
            </button>
          </div>

          {/* Column 2: Airports and Dates */}
          <div className="col-span-7 space-y-3">
            {/* Airports Row */}
            <div className="grid grid-cols-2 gap-4 relative">
              <AirportSelect
                value={formData.departure}
                onChange={(value) => setFormData(prev => ({ ...prev, departure: value }))}
                label="Nơi đi"
              />

              <AirportSelect
                value={formData.arrival}
                onChange={(value) => setFormData(prev => ({ ...prev, arrival: value }))}
                label="Nơi đến"
                excludeCodes={getExcludedCodes()}
              />

              {/* Swap button positioned between the two fields */}
              <button
                type="button"
                onClick={handleSwapAirports}
                className="absolute left-1/2 top-8 transform -translate-x-1/2 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors z-10"
              >
                ⇄
              </button>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-4 relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Ngày đi</label>
                  <button
                    type="button"
                    onClick={handleResetDepartureDate}
                    className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                    title="Reset ngày đi về hôm nay"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
                <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                        !departureDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày đi</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={departureDate}
                       onSelect={handleDepartureDateChange}
                       disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                       defaultMonth={departureDate}
                       initialFocus
                       locale={vi}
                       formatters={customFormatters}
                       className="p-3 pointer-events-auto"
                     />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Only show return date when round trip is selected */}
              {formData.tripType === 'RT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày về</label>
                  <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                          !returnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày về</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={returnDate}
                         onSelect={handleReturnDateChange}
                         disabled={(date) => {
                           const minDate = departureDate || new Date(new Date().setHours(0, 0, 0, 0));
                           return date < minDate;
                         }}
                         defaultMonth={departureDate}
                         initialFocus
                         locale={vi}
                         formatters={customFormatters}
                         className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Passenger counts and Search button */}
          <div className="col-span-3 space-y-2">
            {/* Adults - full width */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Người lớn</label>
              <select
                value={formData.adults}
                onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Children and Infants - side by side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trẻ em</label>
                <select
                  value={formData.children}
                  onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Em bé</label>
                <select
                  value={formData.infants}
                  onChange={(e) => setFormData(prev => ({ ...prev, infants: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  {[0, 1, 2, 3].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button - positioned where infants used to be */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-white ${
                  isCustomMode
                    ? 'bg-green-500 hover:bg-green-600'
                    : customerType === 'page'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isLoading ? 'TÌM KIẾM...' : 'TÌM KIẾM'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchForm;
