import React, { useState } from 'react';
import { Plane, Clock, Users, Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { BookingModal } from './BookingModal';
import { VNABookingModal } from './VNABookingModal';
import { OtherAirlinesModal } from './OtherAirlinesModal';
import { Button } from './ui/button';

interface FlightLeg {
  hãng: string;
  id: string;
  nơi_đi: string;
  nơi_đến: string;
  giờ_cất_cánh: string;
  ngày_cất_cánh: string;
  thời_gian_bay: string;
  thời_gian_chờ: string;
  giờ_hạ_cánh: string;
  ngày_hạ_cánh: string;
  số_điểm_dừng: string;
  điểm_dừng_1: string;
  điểm_dừng_2: string;
  loại_vé: string;
  BookingKey?: string;
}

interface VNAFlightLeg {
  hãng: string;
  id: string;
  nơi_đi: string;
  nơi_đến: string;
  giờ_cất_cánh: string;
  ngày_cất_cánh: string;
  thời_gian_bay: string;
  thời_gian_chờ: string;
  giờ_hạ_cánh: string;
  ngày_hạ_cánh: string;
  số_điểm_dừng: string;
  điểm_dừng_1: string;
  điểm_dừng_2: string;
  loại_vé: string;
}

interface FlightInfo {
  giá_vé: string;
  giá_vé_gốc: string;
  phí_nhiên_liệu: string;
  thuế_phí_công_cộng: string;
  số_ghế_còn: string;
  hành_lý_vna: string;
}

interface FlightResult {
  'chiều đi'?: FlightLeg;
  'chiều về'?: FlightLeg;
  'chiều_đi'?: VNAFlightLeg;
  'chiều_về'?: VNAFlightLeg;
  'thông_tin_chung': FlightInfo;
}

interface FlightResultsProps {
  results: FlightResult[];
  vjetResults: FlightResult[];
  vnaResults: FlightResult[];
  isLoading: boolean;
  selectedAirline: 'all' | 'VJ' | 'VNA';
  selectedFlightType: 'all' | 'direct' | 'connecting';
  searchData?: {
    tripType: 'OW' | 'RT';
    oneWayFee: number;
    roundTripFeeVietjet: number;
    roundTripFeeVNA: number;
    roundTripFeeOther: number;
    // VNA thresholds and discounts (5 tiers)
    vnaThreshold1: number;
    vnaDiscountOW1: number;
    vnaDiscountRT1: number;
    vnaThreshold2: number;
    vnaDiscountOW2: number;
    vnaDiscountRT2: number;
    vnaThreshold3: number;
    vnaDiscountOW3: number;
    vnaDiscountRT3: number;
    vnaThreshold4: number;
    vnaDiscountOW4: number;
    vnaDiscountRT4: number;
    vnaThreshold5: number;
    vnaDiscountOW5: number;
    vnaDiscountRT5: number;
    // Vietjet thresholds and discounts (5 tiers)
    vietjetThreshold1: number;
    vietjetDiscountOW1: number;
    vietjetDiscountRT1: number;
    vietjetThreshold2: number;
    vietjetDiscountOW2: number;
    vietjetDiscountRT2: number;
    vietjetThreshold3: number;
    vietjetDiscountOW3: number;
    vietjetDiscountRT3: number;
    vietjetThreshold4: number;
    vietjetDiscountOW4: number;
    vietjetDiscountRT4: number;
    vietjetThreshold5: number;
    vietjetDiscountOW5: number;
    vietjetDiscountRT5: number;
    // Other airlines thresholds and discounts (5 tiers)
    otherThreshold1: number;
    otherDiscountOW1: number;
    otherDiscountRT1: number;
    otherThreshold2: number;
    otherDiscountOW2: number;
    otherDiscountRT2: number;
    otherThreshold3: number;
    otherDiscountOW3: number;
    otherDiscountRT3: number;
    otherThreshold4: number;
    otherDiscountOW4: number;
    otherDiscountRT4: number;
    otherThreshold5: number;
    otherDiscountOW5: number;
    otherDiscountRT5: number;
  } | null;
  apiStatus: { vj: string; vna: string };
  searchMessages?: string[];
  hasSearched?: boolean;
  vietjetDomesticError?: boolean;
  onVJBookingSuccess?: (pnr: string) => void;
  onVNABookingSuccess?: (pnr: string) => void;
}

// Airline names for display
const AIRLINE_NAMES: Record<string, string> = {
  'OZ': 'Asiana',
  'TW': 'Tway',
  'LJ': 'Jin Air',
  'BX': 'Air Busan',
  'KE': 'Korean Air',
  '7C': 'Jeju',
  'YP': 'Premia',
  'RS': 'Air Seoul',
};

const FlightResults: React.FC<FlightResultsProps> = ({ 
  results, 
  vjetResults,
  vnaResults,
  isLoading, 
  selectedAirline, 
  selectedFlightType,
  searchData,
  apiStatus,
  searchMessages = [],
  hasSearched = false,
  vietjetDomesticError = false,
  onVJBookingSuccess,
  onVNABookingSuccess
}) => {
  const [expandedDetails, setExpandedDetails] = useState<{ [key: number]: boolean }>({});
  const [expandedItinerary, setExpandedItinerary] = useState<{ [key: number]: boolean }>({});
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [vnaBookingModalOpen, setVnaBookingModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [otherAirlinesModalOpen, setOtherAirlinesModalOpen] = useState(false);

  const toggleDetails = (index: number) => {
    setExpandedDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleItinerary = (index: number) => {
    setExpandedItinerary(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('ko-KR').format(parseInt(price));
  };

  const formatPriceForCopy = (price: number) => {
    // Round to nearest hundred
    const roundedPrice = Math.round(price / 100) * 100;
    // Format with dots as thousand separators
    return new Intl.NumberFormat('de-DE').format(roundedPrice);
  };

  const formatPriceForDisplay = (price: number) => {
    // Round to nearest hundred and format with dots
    const roundedPrice = Math.round(price / 100) * 100;
    return new Intl.NumberFormat('de-DE').format(roundedPrice);
  };

  const calculateFinalPrice = (originalPrice: string, flightResult?: any) => {
    const basePrice = parseInt(originalPrice);
    if (!searchData) return basePrice;
  
    let finalPrice = basePrice;
  
    // Xác định hãng bay
    let isVNA = false;
    let isVJ = false;
    let isOther = false;
    if (flightResult && flightResult['chiều_đi']) {
      const hang = flightResult['chiều_đi'].hãng;
      isVNA = hang === 'VNA';
      isVJ = hang === 'VJ';
      isOther = !isVNA && !isVJ;
    }

    if (searchData.tripType === 'OW') {
      finalPrice += searchData.oneWayFee;
    } else {
      if (isVNA) {
        finalPrice += searchData.roundTripFeeVNA;
      } else if (isVJ) {
        finalPrice += searchData.roundTripFeeVietjet;
      } else {
        finalPrice += searchData.roundTripFeeOther || 0;
      }
    }
  
    // Áp dụng discount nếu vượt threshold (5 tiers)
    const isOneWay = searchData.tripType === 'OW';
    if (isVNA) {
      if (basePrice > (searchData.vnaThreshold5 || 0) && (searchData.vnaThreshold5 || 0) > 0) {
        const discount = isOneWay ? (searchData.vnaDiscountOW5 || 0) : (searchData.vnaDiscountRT5 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vnaThreshold4 || 0) && (searchData.vnaThreshold4 || 0) > 0) {
        const discount = isOneWay ? (searchData.vnaDiscountOW4 || 0) : (searchData.vnaDiscountRT4 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vnaThreshold3 || 0) && (searchData.vnaThreshold3 || 0) > 0) {
        const discount = isOneWay ? (searchData.vnaDiscountOW3 || 0) : (searchData.vnaDiscountRT3 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vnaThreshold2 || 0) && (searchData.vnaThreshold2 || 0) > 0) {
        const discount = isOneWay ? (searchData.vnaDiscountOW2 || 0) : (searchData.vnaDiscountRT2 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vnaThreshold1 || 0) && (searchData.vnaThreshold1 || 0) > 0) {
        const discount = isOneWay ? (searchData.vnaDiscountOW1 || 0) : (searchData.vnaDiscountRT1 || 0);
        finalPrice -= discount;
      }
    } else if (isVJ) {
      if (basePrice > (searchData.vietjetThreshold5 || 0) && (searchData.vietjetThreshold5 || 0) > 0) {
        const discount = isOneWay ? (searchData.vietjetDiscountOW5 || 0) : (searchData.vietjetDiscountRT5 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vietjetThreshold4 || 0) && (searchData.vietjetThreshold4 || 0) > 0) {
        const discount = isOneWay ? (searchData.vietjetDiscountOW4 || 0) : (searchData.vietjetDiscountRT4 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vietjetThreshold3 || 0) && (searchData.vietjetThreshold3 || 0) > 0) {
        const discount = isOneWay ? (searchData.vietjetDiscountOW3 || 0) : (searchData.vietjetDiscountRT3 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vietjetThreshold2 || 0) && (searchData.vietjetThreshold2 || 0) > 0) {
        const discount = isOneWay ? (searchData.vietjetDiscountOW2 || 0) : (searchData.vietjetDiscountRT2 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.vietjetThreshold1 || 0) && (searchData.vietjetThreshold1 || 0) > 0) {
        const discount = isOneWay ? (searchData.vietjetDiscountOW1 || 0) : (searchData.vietjetDiscountRT1 || 0);
        finalPrice -= discount;
      }
    } else {
      // Other airlines
      if (basePrice > (searchData.otherThreshold5 || 0) && (searchData.otherThreshold5 || 0) > 0) {
        const discount = isOneWay ? (searchData.otherDiscountOW5 || 0) : (searchData.otherDiscountRT5 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.otherThreshold4 || 0) && (searchData.otherThreshold4 || 0) > 0) {
        const discount = isOneWay ? (searchData.otherDiscountOW4 || 0) : (searchData.otherDiscountRT4 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.otherThreshold3 || 0) && (searchData.otherThreshold3 || 0) > 0) {
        const discount = isOneWay ? (searchData.otherDiscountOW3 || 0) : (searchData.otherDiscountRT3 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.otherThreshold2 || 0) && (searchData.otherThreshold2 || 0) > 0) {
        const discount = isOneWay ? (searchData.otherDiscountOW2 || 0) : (searchData.otherDiscountRT2 || 0);
        finalPrice -= discount;
      } else if (basePrice > (searchData.otherThreshold1 || 0) && (searchData.otherThreshold1 || 0) > 0) {
        const discount = isOneWay ? (searchData.otherDiscountOW1 || 0) : (searchData.otherDiscountRT1 || 0);
        finalPrice -= discount;
      }
    }
  
    return finalPrice;
  };

  const formatDate = (dateStr: string) => {
    const [day, month] = dateStr.split('/');
    return `${day}/${month}`;
  };

  const formatFlightTime = (timeStr: string) => {
    if (!timeStr.includes(':')) {
      const totalMinutes = parseInt(timeStr);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return timeStr;
  };

  const getTicketTypeDisplay = (loaiVe: string, isVJ: boolean) => {
    if (!isVJ) {
      return loaiVe; // Return actual ticket class for VNA
    }
    // For VietJet, keep existing logic
    switch (loaiVe) {
      case 'ECO':
        return 'ECO';
      case 'L':
      case 'T':
      case 'H':
        return 'ECO';
      default:
        return loaiVe === 'ECO' ? 'ECO' : 'DELUXE';
    }
  };

  const getTicketClassSummary = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return '';
    
    const isVJ = outbound.hãng === 'VJ';
    const outboundClass = getTicketTypeDisplay(outbound.loại_vé, isVJ);
    
    if (inbound) {
      const inboundClass = getTicketTypeDisplay(inbound.loại_vé, isVJ);
      return `Khứ hồi: ${outboundClass}-${inboundClass}`;
    } else {
      return `Một chiều: ${outboundClass}`;
    }
  };

  const getFlightTypeLabel = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return '';
    
    const isDirectOutbound = outbound.số_điểm_dừng === '0';
    const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
    
    // For round trip
    if (inbound) {
      if (isDirectOutbound && isDirectInbound) {
        return 'Bay thẳng';
      } else {
        return 'Nối chuyến';
      }
    } else {
      // For one way
      return isDirectOutbound ? 'Bay thẳng' : 'Nối chuyến';
    }
  };

  const isDirectFlight = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return false;
    
    const isDirectOutbound = outbound.số_điểm_dừng === '0';
    const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
    
    return isDirectOutbound && isDirectInbound;
  };

  const isConnectingFlight = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return false;
    
    const hasConnectingOutbound = outbound.số_điểm_dừng === '1';
    const hasConnectingInbound = inbound && inbound.số_điểm_dừng === '1';
    
    return hasConnectingOutbound || hasConnectingInbound;
  };

  const renderFlightPath = (leg: FlightLeg | VNAFlightLeg) => {
    if (leg.số_điểm_dừng === '0') {
      return `${leg.nơi_đi} → ${leg.nơi_đến}`;
    } else if (leg.số_điểm_dừng === '1') {
      return `${leg.nơi_đi} → ${leg.điểm_dừng_1} → ${leg.nơi_đến}`;
    }
    return `${leg.nơi_đi} → ${leg.nơi_đến}`;
  };

  const renderDetailedFlightSegments = (leg: FlightLeg | VNAFlightLeg) => {
    if (leg.số_điểm_dừng === '0') {
      return (
        <div className="text-sm text-blue-700">
          <div>{leg.nơi_đi} → {leg.nơi_đến}: {leg.giờ_cất_cánh} ngày {formatDate(leg.ngày_cất_cánh)}</div>
        </div>
      );
    } else if (leg.số_điểm_dừng === '1') {
      return (
        <div className="text-sm text-blue-700 space-y-1">
          <div>Chặng 1: {leg.nơi_đi} → {leg.điểm_dừng_1}: {leg.giờ_cất_cánh} ngày {formatDate(leg.ngày_cất_cánh)} (<span className="text-red-500">chờ {leg.thời_gian_chờ}</span>)</div>
          <div>Chặng 2: {leg.điểm_dừng_1} → {leg.nơi_đến}: {leg.giờ_hạ_cánh} ngày {formatDate(leg.ngày_hạ_cánh)}</div>
        </div>
      );
    }
    return null;
  };

  const generateCopyTemplate = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return '';

    const isVNA = outbound.hãng === 'VNA';
    const isVJ = outbound.hãng === 'VJ';
    const hang = outbound.hãng
    const finalPrice = calculateFinalPrice(result['thông_tin_chung'].giá_vé, result);
    const baggageType = result['thông_tin_chung'].hành_lý_vna;
    
    const lines: string[] = [];
    const airlineConfig: Record<
      string,
      {
        name: string;
        carryOn: string;
        checked?: string;
      }
    > = {
      '7C': { name: 'Jeju Air', carryOn: '10kg', checked: '15kg' },
      'YP': { name: 'Premia Air', carryOn: '10kg', checked: '23kg' },
      'LJ': { name: 'Jin Air', carryOn: '10kg', checked: '15kg' },
      'TW': { name: 'Tway Air', carryOn: '10kg' }, // ký gửi ko cố định
      'KE': { name: 'Korean Air', carryOn: '10kg', checked: '23kg' },
      'OZ': { name: 'Asiana Airlines', carryOn: '10kg', checked: '23kg' },
      'RS': { name: 'Air Seoul', carryOn: '10kg', checked: '15kg' },
      'BX': { name: 'Air Busan', carryOn: '10kg', checked: '15kg' },
    };
    // For connecting flights, show all segments with proper times
    if (outbound.số_điểm_dừng === '1') {
      lines.push(`${outbound.nơi_đi}-${outbound.điểm_dừng_1} ${outbound.giờ_cất_cánh} ngày ${formatDate(outbound.ngày_cất_cánh)}`);
      lines.push(`${outbound.điểm_dừng_1}-${outbound.nơi_đến} ${outbound.giờ_hạ_cánh} ngày ${formatDate(outbound.ngày_hạ_cánh)}`);
      
      if (inbound && inbound.số_điểm_dừng === '1') {
        lines.push(`${inbound.nơi_đi}-${inbound.điểm_dừng_1} ${inbound.giờ_cất_cánh} ngày ${formatDate(inbound.ngày_cất_cánh)}`);
        lines.push(`${inbound.điểm_dừng_1}-${inbound.nơi_đến} ${inbound.giờ_hạ_cánh} ngày ${formatDate(inbound.ngày_hạ_cánh)}`);
      }
    } else {
      lines.push(`${outbound.nơi_đi}-${outbound.nơi_đến} ${outbound.giờ_cất_cánh} ngày ${formatDate(outbound.ngày_cất_cánh)}`);
      
      if (inbound) {
        lines.push(`${inbound.nơi_đi}-${inbound.nơi_đến} ${inbound.giờ_cất_cánh} ngày ${formatDate(inbound.ngày_cất_cánh)}`);
      }
    }
    
    // Airline specific baggage info
    if (isVNA && (baggageType === 'VFR' || baggageType === 'ADT')) {
      if (baggageType === 'ADT') {
        lines.push(`VNairlines 10kg xách tay, 23kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`);
      } else {
        lines.push(`VNairlines 10kg xách tay, 46kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`);
      }
    } else if (isVJ) {
      lines.push(`Vietjet 7kg xách tay, 20kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`);
    } else {
      const airline = airlineConfig[hang];
    
      if (airline) {
        const checkedText = airline.checked
          ? `, ${airline.checked} ký gửi`
          : ', ký gửi tuỳ gói';
    
        lines.push(
          `${airline.name} ${airline.carryOn} xách tay${checkedText}, giá vé = ${formatPriceForCopy(finalPrice)}w`
        );
      } else {
        // hãng lạ chưa khai báo
        lines.push(
          `${hang} 10kg xách tay, giá vé = ${formatPriceForCopy(finalPrice)}w`
        );
      }
    }
    
    return lines.join('\n');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã copy thông tin chuyến bay');
    } catch (error) {
      toast.error('Không thể copy, vui lòng thử lại');
    }
  };

  const handleBooking = (result: FlightResult) => {
    console.log('Selected flight for booking:', result);
    setSelectedFlight(result);
    setBookingModalOpen(true);
  };

  const handleVNABooking = (result: FlightResult) => {
    console.log('Selected VNA flight for booking:', result);
    setSelectedFlight(result);
    setVnaBookingModalOpen(true);
  };

  const formatDateForVNA = (dateStr: string) => {
    // Convert "17/04/2026" to "17APR"
    const [day, month] = dateStr.split('/');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = parseInt(month) - 1;
    return `${day}${monthNames[monthIndex]}`;
  };

  const renderFlightCard = (result: FlightResult, index: number, flightNumber: number) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    
    if (!outbound) return null;

    const isVNA = outbound.hãng === 'VNA';
    const isVJ = outbound.hãng === 'VJ';
    const isOtherAirline = outbound.hãng !== 'VNA' && outbound.hãng !== 'VJ';
    const finalPrice = calculateFinalPrice(result['thông_tin_chung'].giá_vé, result);
    const copyTemplate = generateCopyTemplate(result);
    const ticketClassSummary = getTicketClassSummary(result);
    const flightTypeLabel = getFlightTypeLabel(result);
    const isDirect = isDirectFlight(result);
    const isConnecting = isConnectingFlight(result);
    const baggageType = result['thông_tin_chung'].hành_lý_vna;
    
    // Only show copy template for direct flights - HIDE for connecting flights
    const shouldShowCopyTemplate = isDirect && !isConnecting;

    // Determine text color based on baggage type
    const getCopyTextColor = () => {
      if (!isVJ && baggageType === 'ADT') {
        return 'text-red-600'; // Red for ADT
      }
      return 'text-black'; // Black for others
    };

    return (
      <div
        key={index}
        className={`
          bg-white rounded-lg shadow-md overflow-hidden mb-2 border
          ${isOtherAirline ? 'border-2 border-yellow-500 shadow-yellow-200' : 'border-gray-200'}
        `}
      >
        <div className="p-2">
          {/* Flight Info Section - More compact */}
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-700">
                Khung giờ {flightNumber}:
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${isVNA ? 'bg-blue-500' : 'bg-red-500'}`}>
                  {outbound.hãng}
                </span>
                <div className="text-base font-bold text-gray-800">
                  {formatPriceForDisplay(finalPrice)} KRW
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium leading-tight">
              {ticketClassSummary} - <span className={`${
                isDirect 
                  ? 'text-blue-600 font-bold text-sm' 
                  : 'text-red-600 font-bold text-sm underline'
              }`}>
                {flightTypeLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-600">
                <Users className="w-3 h-3 mr-1" />
                Còn {result['thông_tin_chung'].số_ghế_còn} ghế
                <button
                  onClick={() => toggleDetails(index)}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 ml-2"
                >
                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${expandedDetails[index] ? 'rotate-180' : ''}`} />
                  Chi tiết
                </button>
              </div>
            </div>
            {expandedDetails[index] && (
              <div className="text-xs text-gray-600 space-y-0.5 mt-1 p-1.5 bg-gray-50 rounded">
                <div>Giá gốc: {formatPriceForDisplay(parseInt(result['thông_tin_chung'].giá_vé_gốc))} KRW</div>
                <div>Phí nhiên liệu: {formatPriceForDisplay(parseInt(result['thông_tin_chung'].phí_nhiên_liệu))} KRW</div>
                {searchData && (
                  <div>Phí xuất vé: {formatPriceForDisplay(searchData.tripType === 'OW' ? searchData.oneWayFee : (outbound.hãng === 'VNA' ? searchData.roundTripFeeVNA : searchData.roundTripFeeVietjet))} KRW</div>
                )}
              </div>
            )}
          </div>

          {/* Show "Hành trình bay chi tiết" for ALL connecting flights */}
          {isConnecting && (
            <div className="mb-2">
              <button
                onClick={() => toggleItinerary(index)}
                className="flex items-center text-xs font-semibold text-blue-800 hover:text-blue-600 mb-1"
              >
                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${expandedItinerary[index] ? 'rotate-180' : ''}`} />
                Hành trình bay chi tiết
              </button>
              {expandedItinerary[index] && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div className="space-y-1 text-blue-700">
                    <div>
                      <div className="font-medium">Chiều đi:</div>
                      {renderDetailedFlightSegments(outbound)}
                    </div>
                    {inbound && (
                      <div>
                        <div className="font-medium">Chiều về:</div>
                        {renderDetailedFlightSegments(inbound)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* For flights that don't show copy template, show basic flight info */}
          {!shouldShowCopyTemplate && !isConnecting && (
            <div className="mb-2">
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="font-semibold text-gray-800 mb-1">Thông tin chuyến bay:</div>
                <div className="space-y-0.5 text-gray-700">
                  <div>Hành trình: {renderFlightPath(outbound)}</div>
                  {inbound && (
                    <div>Chiều về: {renderFlightPath(inbound)}</div>
                  )}
                  <div>Loại vé: {outbound.loại_vé}</div>
                  <div>Giá vé: {formatPriceForDisplay(finalPrice)} KRW</div>
                </div>
              </div>
            </div>
          )}

          {/* Copy Template Section - Only for direct flights */}
          {shouldShowCopyTemplate && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-gray-700">Thông tin gửi khách</h5>
                <button
                  onClick={() => copyToClipboard(copyTemplate)}
                  className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-xs font-medium">Copy</span>
                </button>
              </div>
              <div className={`bg-gray-50 p-2 rounded font-sans font-medium whitespace-pre-line min-h-[60px] text-xl ${getCopyTextColor()}`}>
                {copyTemplate}
              </div>
            </div>
          )}

          {/* Booking Button - Only for VietJet flights */}
          {!isVNA && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handleBooking(result)}
                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                <span className="text-xs font-medium">Giữ Vé</span>
              </button>
            </div>
          )}

          {/* Booking Button - For VNA flights */}
          {isVNA && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handleVNABooking(result)}
                className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                <span className="text-xs font-medium">Giữ Vé</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLoadingSpinner = () => (
    <div className="flex items-center justify-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );

  const renderNoFlightsMessage = (airline: string) => {
    if (airline === 'VietJet' && vietjetDomesticError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="font-bold text-red-600 text-lg">
            VIETJET CHƯA CẬP NHẬT CÁC CHUYẾN BAY NỘI ĐỊA
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="font-bold text-red-600 text-lg">
          {airline === 'VietJet' ? 'KHÔNG CÓ CHUYẾN BAY VIETJET' : 'KHÔNG CÓ CHUYẾN BAY VIETNAMAIRLINES'}
        </p>
      </div>
    );
  };

  if (isLoading && vjetResults.length === 0 && vnaResults.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-base text-gray-600">Đang tìm kiếm chuyến bay...</span>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center py-8">
          <p className="text-base text-gray-600">Nhập thông tin tìm kiếm để bắt đầu</p>
        </div>
      </div>
    );
  }

  // Filter results based on selected filters - NO SORTING, just filtering
  const getFilteredVjetResults = () => {
    // If there's a domestic error, don't show any Vietjet results
    if (vietjetDomesticError) return [];
    
    // VietJet is not affected by flight type filter - always show all
    if (selectedAirline === 'VNA') return [];
    if (selectedAirline === 'all' || selectedAirline === 'VJ') return vjetResults;
    return [];
  };

  const getFilteredVnaResults = () => {
    if (selectedAirline === 'VJ') return [];
    
    // Filter to only include VNA flights (exclude Other airlines like 7C, OZ, etc.)
    let filtered = vnaResults.filter(result => {
      const outbound = result['chiều_đi'];
      return outbound?.hãng === 'VNA';
    });
    
    // Apply flight type filter only to VNA
    if (selectedFlightType !== 'all') {
      filtered = filtered.filter(result => {
        const outbound = result['chiều_đi'];
        const inbound = result['chiều_về'];
        
        const isDirectOutbound = outbound && outbound.số_điểm_dừng === '0';
        const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
        const isDirect = isDirectOutbound && isDirectInbound;
        
        if (selectedFlightType === 'direct' && !isDirect) return false;
        if (selectedFlightType === 'connecting' && isDirect) return false;
        
        return true;
      });
    }
    
    // SORTING for VNA: Bay thẳng first, then VFR, then ADT, then others by price
    filtered = filtered.sort((a, b) => {
      const aOutbound = a['chiều_đi'];
      const bOutbound = b['chiều_đi'];
      const aInbound = a['chiều_về'];
      const bInbound = b['chiều_về'];
      
      // Check if direct flight
      const aIsDirectOutbound = aOutbound && aOutbound.số_điểm_dừng === '0';
      const aIsDirectInbound = !aInbound || aInbound.số_điểm_dừng === '0';
      const aIsDirect = aIsDirectOutbound && aIsDirectInbound;
      
      const bIsDirectOutbound = bOutbound && bOutbound.số_điểm_dừng === '0';
      const bIsDirectInbound = !bInbound || bInbound.số_điểm_dừng === '0';
      const bIsDirect = bIsDirectOutbound && bIsDirectInbound;
      
      // 1. Bay thẳng lên trước
      if (aIsDirect && !bIsDirect) return -1;
      if (!aIsDirect && bIsDirect) return 1;
      
      // 2. Sắp xếp theo loại hành lý: VFR trước, ADT sau, các loại khác cuối
      const aBaggageType = a['thông_tin_chung'].hành_lý_vna;
      const bBaggageType = b['thông_tin_chung'].hành_lý_vna;
      
      const getBaggagePriority = (type: string) => {
        if (type === 'VFR') return 1; // VFR (46kg) first
        if (type === 'ADT') return 2; // ADT (23kg) second
        return 3; // Others last
      };
      
      const aPriority = getBaggagePriority(aBaggageType);
      const bPriority = getBaggagePriority(bBaggageType);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // 3. Sắp xếp theo giá vé tăng dần
      const aPrice = parseInt(a['thông_tin_chung'].giá_vé);
      const bPrice = parseInt(b['thông_tin_chung'].giá_vé);
      
      return aPrice - bPrice;
    });
    
    if (selectedAirline === 'all' || selectedAirline === 'VNA') return filtered;
    return [];
  };

  // Get Other Airlines (not VJ and not VNA)
  const getOtherAirlinesResults = () => {
    return vnaResults.filter(result => {
      const outbound = result['chiều_đi'];
      const hang = outbound?.hãng;
      return hang && hang !== 'VNA' && hang !== 'VJ';
    }).sort((a, b) => {
      const aPrice = parseInt(a['thông_tin_chung'].giá_vé);
      const bPrice = parseInt(b['thông_tin_chung'].giá_vé);
      return aPrice - bPrice;
    });
  };

  // Get cheapest Other airline flight
  const getCheapestOtherFlight = () => {
    const otherFlights = getOtherAirlinesResults();
    if (otherFlights.length === 0) return null;
    return otherFlights[0]; // Already sorted by price
  };

  const otherAirlinesFlights = getOtherAirlinesResults();
  const cheapestOtherFlight = getCheapestOtherFlight();

  const filteredVjetResults = getFilteredVjetResults();
  const filteredVnaResults = getFilteredVnaResults();
  const totalResults = filteredVjetResults.length + filteredVnaResults.length;

  // Check for VNA direct flights for special handling (only VNA, exclude other airlines)
  const getVNADirectFlights = () => {
    if (selectedAirline === 'VJ') return [];
    
    return vnaResults.filter(result => {
      const outbound = result['chiều_đi'];
      const inbound = result['chiều_về'];
      
      // Only VNA flights
      if (outbound?.hãng !== 'VNA') return false;
      
      const isDirectOutbound = outbound && outbound.số_điểm_dừng === '0';
      const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
      return isDirectOutbound && isDirectInbound;
    });
  };

  const getVNAConnectingFlights = () => {
    if (selectedAirline === 'VJ') return [];
    
    let connecting = vnaResults.filter(result => {
      const outbound = result['chiều_đi'];
      const inbound = result['chiều_về'];
      
      // Only VNA flights
      if (outbound?.hãng !== 'VNA') return false;
      
      const isDirectOutbound = outbound && outbound.số_điểm_dừng === '0';
      const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
      const isDirect = isDirectOutbound && isDirectInbound;
      return !isDirect;
    });

    // Sort connecting flights the same way as regular VNA flights
    return connecting.sort((a, b) => {
      const aBaggageType = a['thông_tin_chung'].hành_lý_vna;
      const bBaggageType = b['thông_tin_chung'].hành_lý_vna;
      
      const getBaggagePriority = (type: string) => {
        if (type === 'VFR') return 1;
        if (type === 'ADT') return 2;
        return 3;
      };
      
      const aPriority = getBaggagePriority(aBaggageType);
      const bPriority = getBaggagePriority(bBaggageType);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      const aPrice = parseInt(a['thông_tin_chung'].giá_vé);
      const bPrice = parseInt(b['thông_tin_chung'].giá_vé);
      
      return aPrice - bPrice;
    });
  };

  const vnaDirectFlights = getVNADirectFlights();
  const vnaConnectingFlights = getVNAConnectingFlights();

  if (totalResults === 0 && !isLoading && (apiStatus.vj !== 'pending' || apiStatus.vna !== 'pending')) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center py-8">
          <p className="text-base text-gray-600">Không tìm thấy chuyến bay nào</p>
          {searchMessages.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchMessages.map((message, index) => (
                <p key={index} className="text-red-600 font-medium">{message}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show in columns when "all" is selected, otherwise show single column
  if (selectedAirline === 'all') {
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Kết quả tìm kiếm ({totalResults} chuyến bay)
        </h3>
        
        {/* Cheapest Other Airlines Banner */}
        {cheapestOtherFlight && (
          <div 
            onClick={() => setOtherAirlinesModalOpen(true)}
            className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm font-bold">OTHER</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Giá rẻ nhất hãng khác: <span className="font-bold text-yellow-700">{AIRLINE_NAMES[(cheapestOtherFlight['chiều_đi'] as VNAFlightLeg)?.hãng] || (cheapestOtherFlight['chiều_đi'] as VNAFlightLeg)?.hãng}</span>
                  </p>
                  <p className="text-lg font-bold text-yellow-600">
                    {formatPriceForDisplay(calculateFinalPrice(cheapestOtherFlight['thông_tin_chung'].giá_vé, cheapestOtherFlight))} KRW
                  </p>
                </div>
              </div>
              <div className="text-yellow-600 flex items-center text-sm font-medium">
                Xem {otherAirlinesFlights.length} vé hãng khác →
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* VietJet Column */}
          <div>
            <div className="flex items-center mb-3">
              <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold mr-2">VJ</span>
              <h4 className="text-base font-semibold text-red-500">Vietjet ({filteredVjetResults.length})</h4>
            </div>
            <div className="space-y-3">
              {filteredVjetResults.length > 0 ? (
                filteredVjetResults.map((result, index) => renderFlightCard(result, index, index + 1))
              ) : apiStatus.vj === 'pending' ? (
                renderLoadingSpinner()
              ) : (
                renderNoFlightsMessage('VietJet')
              )}
            </div>
          </div>

          {/* Vietnam Airlines Column */}
          <div>
            <div className="flex items-center mb-3">
              <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-semibold mr-2">VNA</span>
              <h4 className="text-base font-semibold text-blue-500">Vietnam Airlines ({filteredVnaResults.length})</h4>
            </div>

            {/* Show red message if no direct flights but have connecting flights */}
            {vnaDirectFlights.length === 0 && vnaConnectingFlights.length > 0 && selectedFlightType === 'all' && (
              <div className="mb-3">
                <p className="text-red-600 font-bold text-lg text-center bg-red-50 p-2 rounded">
                  KHÔNG CÓ CHUYẾN BAY THẲNG, THAM KHẢO GIÁ CHUYẾN BAY NỐI CHUYẾN
                </p>
              </div>
            )}

            <div className="space-y-3">
              {filteredVnaResults.length > 0 ? (
                filteredVnaResults.map((result, index) => renderFlightCard(result, index, index + 1))
              ) : apiStatus.vna === 'pending' ? (
                renderLoadingSpinner()
              ) : (
                renderNoFlightsMessage('Vietnam Airlines')
              )}
            </div>
          </div>
        </div>

        {/* Other Airlines Modal */}
        <OtherAirlinesModal
          isOpen={otherAirlinesModalOpen}
          onClose={() => setOtherAirlinesModalOpen(false)}
          otherFlights={otherAirlinesFlights}
          searchData={searchData}
          onBookingSuccess={onVJBookingSuccess}
        />

        {/* Booking Modal for two-column view */}
        {selectedFlight && (
          <>
            <BookingModal
              isOpen={bookingModalOpen}
              onClose={() => {
                setBookingModalOpen(false);
                setSelectedFlight(null);
              }}
              bookingKey={(selectedFlight['chiều đi'] as FlightLeg)?.BookingKey || (selectedFlight['chiều_đi'] as FlightLeg)?.BookingKey || ''}
              bookingKeyReturn={(selectedFlight['chiều về'] as FlightLeg)?.BookingKey || (selectedFlight['chiều_về'] as FlightLeg)?.BookingKey}
              tripType={searchData?.tripType || 'OW'}
              departureAirport={(selectedFlight['chiều đi'] as FlightLeg)?.nơi_đi || (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đi || ''}
              maxSeats={parseInt(selectedFlight['thông_tin_chung'].số_ghế_còn)}
              onBookingSuccess={onVJBookingSuccess}
            />
            
            <VNABookingModal
              isOpen={vnaBookingModalOpen}
              onClose={() => {
                setVnaBookingModalOpen(false);
                setSelectedFlight(null);
              }}
              flightInfo={{
                dep: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đi || '',
                arr: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đến || '',
                depdate: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.ngày_cất_cánh || '',
                deptime: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.giờ_cất_cánh || '',
                arrdate: (selectedFlight['chiều_về'] as VNAFlightLeg)?.ngày_cất_cánh || undefined,
                arrtime: (selectedFlight['chiều_về'] as VNAFlightLeg)?.giờ_cất_cánh,
                tripType: searchData?.tripType || 'OW'
              }}
              maxSeats={parseInt(selectedFlight['thông_tin_chung'].số_ghế_còn)}
              onBookingSuccess={onVNABookingSuccess}
            />
          </>
        )}
      </div>
    );
  }

  // Single column view for specific airline
  const singleColumnResults = selectedAirline === 'VJ' ? filteredVjetResults : filteredVnaResults;
  
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Kết quả tìm kiếm ({singleColumnResults.length} chuyến bay)
      </h3>

      {/* Cheapest Other Airlines Banner for VNA view */}
      {selectedAirline === 'VNA' && cheapestOtherFlight && (
        <div 
          onClick={() => setOtherAirlinesModalOpen(true)}
          className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm font-bold">OTHER</span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Giá rẻ nhất hãng khác: <span className="font-bold text-yellow-700">{AIRLINE_NAMES[(cheapestOtherFlight['chiều_đi'] as VNAFlightLeg)?.hãng] || (cheapestOtherFlight['chiều_đi'] as VNAFlightLeg)?.hãng}</span>
                </p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatPriceForDisplay(calculateFinalPrice(cheapestOtherFlight['thông_tin_chung'].giá_vé, cheapestOtherFlight))} KRW
                </p>
              </div>
            </div>
            <div className="text-yellow-600 flex items-center text-sm font-medium">
              Xem {otherAirlinesFlights.length} vé hãng khác →
            </div>
          </div>
        </div>
      )}
      
      {/* Show red message for VNA single column if no direct flights but have connecting flights */}
      {selectedAirline === 'VNA' && vnaDirectFlights.length === 0 && vnaConnectingFlights.length > 0 && selectedFlightType === 'all' && (
        <div className="mb-3">
          <p className="text-red-600 font-bold text-lg text-center bg-red-50 p-2 rounded">
            KHÔNG CÓ CHUYẾN BAY THẲNG, THAM KHẢO GIÁ CHUYẾN BAY NỐI CHUYẾN
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {singleColumnResults.map((result, index) => renderFlightCard(result, index, index + 1))}
      </div>

      {/* Other Airlines Modal */}
      <OtherAirlinesModal
        isOpen={otherAirlinesModalOpen}
        onClose={() => setOtherAirlinesModalOpen(false)}
        otherFlights={otherAirlinesFlights}
        searchData={searchData}
        onBookingSuccess={onVJBookingSuccess}
      />

      {/* Booking Modals */}
      {selectedFlight && (
        <>
          <BookingModal
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedFlight(null);
            }}
            bookingKey={(selectedFlight['chiều đi'] as FlightLeg)?.BookingKey || (selectedFlight['chiều_đi'] as FlightLeg)?.BookingKey || ''}
            bookingKeyReturn={(selectedFlight['chiều về'] as FlightLeg)?.BookingKey || (selectedFlight['chiều_về'] as FlightLeg)?.BookingKey}
            tripType={searchData?.tripType || 'OW'}
            departureAirport={(selectedFlight['chiều đi'] as FlightLeg)?.nơi_đi || (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đi || ''}
            maxSeats={parseInt(selectedFlight['thông_tin_chung'].số_ghế_còn)}
            onBookingSuccess={onVJBookingSuccess}
          />
          
          <VNABookingModal
            isOpen={vnaBookingModalOpen}
            onClose={() => {
              setVnaBookingModalOpen(false);
              setSelectedFlight(null);
            }}
            flightInfo={{
              dep: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đi || '',
              arr: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.nơi_đến || '',
              depdate: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.ngày_cất_cánh || '',
              deptime: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.giờ_cất_cánh || '',
              arrdate: (selectedFlight['chiều_về'] as VNAFlightLeg)?.ngày_cất_cánh || undefined,
              arrtime: (selectedFlight['chiều_về'] as VNAFlightLeg)?.giờ_cất_cánh,
              tripType: searchData?.tripType || 'OW'
            }}
            maxSeats={parseInt(selectedFlight['thông_tin_chung'].số_ghế_còn)}
            onBookingSuccess={onVNABookingSuccess}
          />
        </>
      )}
    </div>
  );
};

export default FlightResults;
