import React, { useState } from 'react';
import { X, Plane, Users, Copy, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { BookingModal } from './BookingModal';

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

interface SearchData {
  tripType: 'OW' | 'RT';
  oneWayFee: number;
  roundTripFeeVietjet: number;
  roundTripFeeVNA: number;
  roundTripFeeOther: number;
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
}

interface OtherAirlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherFlights: FlightResult[];
  searchData: SearchData | null;
  onBookingSuccess?: (pnr: string) => void;
}

// Airline configuration for display names and grouping
const LEFT_COLUMN_AIRLINES = ['OZ', 'TW', 'LJ', 'BX']; // Asian, Tway, Jin Air, Air Busan
const RIGHT_COLUMN_AIRLINES = ['KE', '7C', 'YP', 'RS']; // Korean Air, Jeju, Premia, Air Seoul

const AIRLINE_NAMES: Record<string, string> = {
  'OZ': 'Asiana Airlines',
  'TW': 'Tway Air',
  'LJ': 'Jin Air',
  'BX': 'Air Busan',
  'KE': 'Korean Air',
  '7C': 'Jeju Air',
  'YP': 'Premia',
  'RS': 'Air Seoul',
};

const AIRLINE_COLORS: Record<string, string> = {
  'OZ': 'bg-orange-500',
  'TW': 'bg-pink-500',
  'LJ': 'bg-yellow-600',
  'BX': 'bg-cyan-500',
  'KE': 'bg-blue-600',
  '7C': 'bg-orange-600',
  'YP': 'bg-purple-500',
  'RS': 'bg-teal-500',
};

const AIRLINE_BAGGAGE: Record<string, { carryOn: string; checked?: string }> = {
  '7C': { carryOn: '10kg', checked: '15kg' },
  'YP': { carryOn: '10kg', checked: '23kg' },
  'LJ': { carryOn: '10kg', checked: '15kg' },
  'TW': { carryOn: '10kg' },
  'KE': { carryOn: '10kg', checked: '23kg' },
  'OZ': { carryOn: '10kg', checked: '23kg' },
  'RS': { carryOn: '10kg', checked: '15kg' },
  'BX': { carryOn: '10kg', checked: '15kg' },
};

export const OtherAirlinesModal: React.FC<OtherAirlinesModalProps> = ({
  isOpen,
  onClose,
  otherFlights,
  searchData,
  onBookingSuccess
}) => {
  const [expandedDetails, setExpandedDetails] = useState<{ [key: string]: boolean }>({});
  const [expandedItinerary, setExpandedItinerary] = useState<{ [key: string]: boolean }>({});
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);

  const formatPriceForDisplay = (price: number) => {
    const roundedPrice = Math.round(price / 100) * 100;
    return new Intl.NumberFormat('de-DE').format(roundedPrice);
  };

  const formatPriceForCopy = (price: number) => {
    const roundedPrice = Math.round(price / 100) * 100;
    return new Intl.NumberFormat('de-DE').format(roundedPrice);
  };

  const formatDate = (dateStr: string) => {
    const [day, month] = dateStr.split('/');
    return `${day}/${month}`;
  };

  const calculateFinalPrice = (originalPrice: string, flightResult?: FlightResult) => {
    const basePrice = parseInt(originalPrice);
    if (!searchData) return basePrice;

    let finalPrice = basePrice;

    if (searchData.tripType === 'OW') {
      finalPrice += searchData.oneWayFee;
    } else {
      finalPrice += searchData.roundTripFeeOther || 0;
    }

    // Apply discount tiers for Other airlines
    const isOneWay = searchData.tripType === 'OW';
    if (basePrice > (searchData.otherThreshold5 || 0) && (searchData.otherThreshold5 || 0) > 0) {
      finalPrice -= isOneWay ? (searchData.otherDiscountOW5 || 0) : (searchData.otherDiscountRT5 || 0);
    } else if (basePrice > (searchData.otherThreshold4 || 0) && (searchData.otherThreshold4 || 0) > 0) {
      finalPrice -= isOneWay ? (searchData.otherDiscountOW4 || 0) : (searchData.otherDiscountRT4 || 0);
    } else if (basePrice > (searchData.otherThreshold3 || 0) && (searchData.otherThreshold3 || 0) > 0) {
      finalPrice -= isOneWay ? (searchData.otherDiscountOW3 || 0) : (searchData.otherDiscountRT3 || 0);
    } else if (basePrice > (searchData.otherThreshold2 || 0) && (searchData.otherThreshold2 || 0) > 0) {
      finalPrice -= isOneWay ? (searchData.otherDiscountOW2 || 0) : (searchData.otherDiscountRT2 || 0);
    } else if (basePrice > (searchData.otherThreshold1 || 0) && (searchData.otherThreshold1 || 0) > 0) {
      finalPrice -= isOneWay ? (searchData.otherDiscountOW1 || 0) : (searchData.otherDiscountRT1 || 0);
    }

    return finalPrice;
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

  const getFlightsByAirline = (airlineCode: string) => {
    return otherFlights.filter(flight => {
      const outbound = flight['chiều_đi'] || flight['chiều đi'];
      return outbound?.hãng === airlineCode;
    }).sort((a, b) => {
      const aPrice = parseInt(a['thông_tin_chung'].giá_vé);
      const bPrice = parseInt(b['thông_tin_chung'].giá_vé);
      return aPrice - bPrice;
    });
  };

  const getTicketTypeDisplay = (loaiVe: string) => loaiVe;

  const getTicketClassSummary = (result: FlightResult) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    if (!outbound) return '';
    const outboundClass = getTicketTypeDisplay(outbound.loại_vé);
    if (inbound) {
      const inboundClass = getTicketTypeDisplay(inbound.loại_vé);
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
    if (inbound) {
      return isDirectOutbound && isDirectInbound ? 'Bay thẳng' : 'Nối chuyến';
    } else {
      return isDirectOutbound ? 'Bay thẳng' : 'Nối chuyến';
    }
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

    const hang = outbound.hãng;
    const finalPrice = calculateFinalPrice(result['thông_tin_chung'].giá_vé, result);
    const lines: string[] = [];

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

    const airline = AIRLINE_BAGGAGE[hang];
    const airlineName = AIRLINE_NAMES[hang] || hang;
    if (airline) {
      const checkedText = airline.checked ? `, ${airline.checked} ký gửi` : ', ký gửi tuỳ gói';
      lines.push(`${airlineName} ${airline.carryOn} xách tay${checkedText}, giá vé = ${formatPriceForCopy(finalPrice)}w`);
    } else {
      lines.push(`${hang} 10kg xách tay, giá vé = ${formatPriceForCopy(finalPrice)}w`);
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
    setSelectedFlight(result);
    setBookingModalOpen(true);
  };

  const renderFlightCard = (result: FlightResult, keyPrefix: string, index: number) => {
    const outbound = result['chiều đi'] || result['chiều_đi'];
    const inbound = result['chiều về'] || result['chiều_về'];
    if (!outbound) return null;

    const hang = outbound.hãng;
    const finalPrice = calculateFinalPrice(result['thông_tin_chung'].giá_vé, result);
    const copyTemplate = generateCopyTemplate(result);
    const ticketClassSummary = getTicketClassSummary(result);
    const flightTypeLabel = getFlightTypeLabel(result);
    const isDirect = isDirectFlight(result);
    const isConnecting = isConnectingFlight(result);
    const cardKey = `${keyPrefix}-${index}`;
    const shouldShowCopyTemplate = isDirect && !isConnecting;

    return (
      <div
        key={cardKey}
        className="bg-white rounded-lg shadow-md overflow-hidden mb-2 border-2 border-yellow-500 shadow-yellow-200"
      >
        <div className="p-2">
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-700">
                Khung giờ {index + 1}:
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${AIRLINE_COLORS[hang] || 'bg-gray-500'}`}>
                  {hang}
                </span>
                <div className="text-base font-bold text-gray-800">
                  {formatPriceForDisplay(finalPrice)} KRW
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium leading-tight">
              {ticketClassSummary} - <span className={`${isDirect ? 'text-blue-600 font-bold text-sm' : 'text-red-600 font-bold text-sm underline'}`}>
                {flightTypeLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-600">
                <Users className="w-3 h-3 mr-1" />
                Còn {result['thông_tin_chung'].số_ghế_còn} ghế
                <button
                  onClick={() => setExpandedDetails(prev => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 ml-2"
                >
                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${expandedDetails[cardKey] ? 'rotate-180' : ''}`} />
                  Chi tiết
                </button>
              </div>
            </div>
            {expandedDetails[cardKey] && (
              <div className="text-xs text-gray-600 space-y-0.5 mt-1 p-1.5 bg-gray-50 rounded">
                <div>Giá gốc: {formatPriceForDisplay(parseInt(result['thông_tin_chung'].giá_vé_gốc))} KRW</div>
                <div>Phí nhiên liệu: {formatPriceForDisplay(parseInt(result['thông_tin_chung'].phí_nhiên_liệu))} KRW</div>
                {searchData && (
                  <div>Phí xuất vé: {formatPriceForDisplay(searchData.tripType === 'OW' ? searchData.oneWayFee : searchData.roundTripFeeOther)} KRW</div>
                )}
              </div>
            )}
          </div>

          {isConnecting && (
            <div className="mb-2">
              <button
                onClick={() => setExpandedItinerary(prev => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                className="flex items-center text-xs font-semibold text-blue-800 hover:text-blue-600 mb-1"
              >
                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${expandedItinerary[cardKey] ? 'rotate-180' : ''}`} />
                Hành trình bay chi tiết
              </button>
              {expandedItinerary[cardKey] && (
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
              <div className="bg-gray-50 p-2 rounded font-sans font-medium whitespace-pre-line min-h-[60px] text-xl text-black">
                {copyTemplate}
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end">
            <button
              onClick={() => handleBooking(result)}
              className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <span className="text-xs font-medium">Giữ Vé</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAirlineSection = (airlineCode: string) => {
    const flights = getFlightsByAirline(airlineCode);
    const airlineName = AIRLINE_NAMES[airlineCode] || airlineCode;
    const bgColor = AIRLINE_COLORS[airlineCode] || 'bg-gray-500';

    return (
      <div key={airlineCode} className="mb-4">
        <div className="flex items-center mb-2">
          <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold mr-2`}>{airlineCode}</span>
          <h4 className="text-sm font-semibold text-gray-700">{airlineName} ({flights.length})</h4>
        </div>
        {flights.length > 0 ? (
          <div className="space-y-2">
            {flights.map((flight, index) => renderFlightCard(flight, airlineCode, index))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Không có chuyến bay</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-yellow-600 flex items-center">
              <Plane className="w-6 h-6 mr-2" />
              Các hãng hàng không khác ({otherFlights.length} chuyến bay)
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Left Column: Asian, Tway, Jin Air, Air Busan */}
            <div className="border-r lg:border-r lg:pr-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 bg-gray-100 p-2 rounded">Cột 1</h3>
              {LEFT_COLUMN_AIRLINES.map(airline => renderAirlineSection(airline))}
            </div>

            {/* Right Column: Korean Air, Jeju, Premia, Air Seoul */}
            <div className="lg:pl-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 bg-gray-100 p-2 rounded">Cột 2</h3>
              {RIGHT_COLUMN_AIRLINES.map(airline => renderAirlineSection(airline))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedFlight && (
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
          onBookingSuccess={onBookingSuccess}
        />
      )}
    </>
  );
};
