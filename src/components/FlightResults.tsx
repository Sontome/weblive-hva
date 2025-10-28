import React, { useState } from 'react';
import { Plane, Clock, Users, Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { BookingModal } from './BookingModal';
import { VNABookingModal } from './VNABookingModal';
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
    vnaThreshold1: number;
    vnaDiscount1: number;
    vnaThreshold2: number;
    vnaDiscount2: number;
    vietjetThreshold1: number;
    vietjetDiscount1: number;
    vietjetThreshold2: number;
    vietjetDiscount2: number;
  } | null;
  apiStatus: { vj: string; vna: string };
  searchMessages?: string[];
  hasSearched?: boolean;
  vietjetDomesticError?: boolean;
  onVJBookingSuccess?: (pnr: string) => void;
  onVNABookingSuccess?: (pnr: string) => void;
}

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
  
    if (searchData.tripType === 'OW') {
      finalPrice += searchData.oneWayFee;
    } else {
      if (flightResult) {
        const outbound = flightResult['chiều_đi'];
        const isVNA = outbound && outbound.hãng === 'VNA';
        const roundTripFee = isVNA ? searchData.roundTripFeeVNA : searchData.roundTripFeeVietjet;
        finalPrice += roundTripFee;
      } else {
        finalPrice += searchData.roundTripFeeVietjet; // fallback
      }
    }
  
    // Xác định hãng bay
    let isVNA = false;
    if (flightResult && flightResult['chiều_đi']) {
      isVNA = flightResult['chiều_đi'].hãng === 'VNA';
    }
  
    // Áp dụng discount nếu vượt threshold
    if (isVNA) {
      if (basePrice > searchData.vnaThreshold2) {
        finalPrice -= searchData.vnaDiscount2;
      } else if (basePrice > searchData.vnaThreshold1) {
        finalPrice -= searchData.vnaDiscount1;
      }
    } else {
      if (basePrice > searchData.vietjetThreshold2) {
        finalPrice -= searchData.vietjetDiscount2;
      } else if (basePrice > searchData.vietjetThreshold1) {
        finalPrice -= searchData.vietjetDiscount1;
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

  const getTicketTypeDisplay = (loaiVe: string, isVNA: boolean) => {
    if (isVNA) {
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
    
    const isVNA = outbound.hãng === 'VNA';
    const outboundClass = getTicketTypeDisplay(outbound.loại_vé, isVNA);
    
    if (inbound) {
      const inboundClass = getTicketTypeDisplay(inbound.loại_vé, isVNA);
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
    const finalPrice = calculateFinalPrice(result['thông_tin_chung'].giá_vé, result);
    const baggageType = result['thông_tin_chung'].hành_lý_vna;
    
    let template = '';
    
    // For connecting flights, show all segments with proper times
    if (outbound.số_điểm_dừng === '1') {
      // Outbound segments - show both departure and arrival times correctly
      template += `${outbound.nơi_đi}-${outbound.điểm_dừng_1} ${outbound.giờ_cất_cánh} ngày ${formatDate(outbound.ngày_cất_cánh)}\n`;
      // For second segment, we need the actual departure time from transit point
      template += `${outbound.điểm_dừng_1}-${outbound.nơi_đến} ${outbound.giờ_hạ_cánh} ngày ${formatDate(outbound.ngày_hạ_cánh)}\n`;
      
      // Return segments (if exists)
      if (inbound && inbound.số_điểm_dừng === '1') {
        template += `${inbound.nơi_đi}-${inbound.điểm_dừng_1} ${inbound.giờ_cất_cánh} ngày ${formatDate(inbound.ngày_cất_cánh)}\n`;
        template += `${inbound.điểm_dừng_1}-${inbound.nơi_đến} ${inbound.giờ_hạ_cánh} ngày ${formatDate(inbound.ngày_hạ_cánh)}\n`;
      }
    } else {
      // Direct flights - keep existing format
      template += `${outbound.nơi_đi}-${outbound.nơi_đến} ${outbound.giờ_cất_cánh} ngày ${formatDate(outbound.ngày_cất_cánh)}\n`;
      
      if (inbound) {
        template += `${inbound.nơi_đi}-${inbound.nơi_đến} ${inbound.giờ_cất_cánh} ngày ${formatDate(inbound.ngày_cất_cánh)}\n`;
      }
    }
    
    // Airline specific baggage info - only for VFR and ADT
    if (isVNA && (baggageType === 'VFR' || baggageType === 'ADT')) {
      if (baggageType === 'ADT') {
        template += `VNairlines 10kg xách tay, 23kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`;
      } else {
        // VFR
        template += `VNairlines 10kg xách tay, 46kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`;
      }
    } else if (!isVNA) {
      // Template for Vietjet
      template += `Vietjet 7kg xách tay, 20kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`;
    } else {
      // For other VNA ticket types, just show basic info
      template += `VNairlines giá vé = ${formatPriceForCopy(finalPrice)}w`;
    }
    
    return template;
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
      if (isVNA && baggageType === 'ADT') {
        return 'text-red-600'; // Red for ADT
      }
      return 'text-black'; // Black for others
    };

    return (
      <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden mb-2 border">
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
    
    let filtered = vnaResults;
    
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

  const filteredVjetResults = getFilteredVjetResults();
  const filteredVnaResults = getFilteredVnaResults();
  const totalResults = filteredVjetResults.length + filteredVnaResults.length;

  // Check for VNA direct flights for special handling
  const getVNADirectFlights = () => {
    if (selectedAirline === 'VJ') return [];
    
    return vnaResults.filter(result => {
      const outbound = result['chiều_đi'];
      const inbound = result['chiều_về'];
      
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
                depdate: formatDateForVNA((selectedFlight['chiều_đi'] as VNAFlightLeg)?.ngày_cất_cánh || ''),
                deptime: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.giờ_cất_cánh || '',
                arrdate: (selectedFlight['chiều_về'] as VNAFlightLeg) ? formatDateForVNA((selectedFlight['chiều_về'] as VNAFlightLeg)?.ngày_cất_cánh || '') : undefined,
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
                depdate: formatDateForVNA((selectedFlight['chiều_đi'] as VNAFlightLeg)?.ngày_cất_cánh || ''),
                deptime: (selectedFlight['chiều_đi'] as VNAFlightLeg)?.giờ_cất_cánh || '',
                arrdate: (selectedFlight['chiều_về'] as VNAFlightLeg) ? formatDateForVNA((selectedFlight['chiều_về'] as VNAFlightLeg)?.ngày_cất_cánh || '') : undefined,
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
