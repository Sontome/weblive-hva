
import React, { useState } from 'react';
import FlightSearchForm from '../components/FlightSearchForm';
import FlightResults from '../components/FlightResults';
import AirlineFilter from '../components/AirlineFilter';
import FlightTypeFilter from '../components/FlightTypeFilter';
import { CustomerTypeModal } from '../components/CustomerTypeModal';
import { LoginForm } from '../components/LoginForm';
import { EmailTicketModal } from '../components/EmailTicketModal';
import { PNRCheckModal } from '../components/PNRCheckModal';
import { CheckinModal } from '../components/CheckinModal';
import { searchAllFlights } from '../services/flightService';
import { shouldSkipVietjet } from '../utils/flightValidation';
import { toast } from 'sonner';

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

const Index = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // Store all results for filtering
  const [vjetResults, setVjetResults] = useState([]);
  const [vnaResults, setVnaResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<'all' | 'VJ' | 'VNA'>('all');
  const [selectedFlightType, setSelectedFlightType] = useState<'all' | 'direct' | 'connecting'>('all');
  const [searchData, setSearchData] = useState<FlightSearchData | null>(null);
  const [apiStatus, setApiStatus] = useState({ vj: 'pending', vna: 'pending' });
  const [searchMessages, setSearchMessages] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [vietjetDomesticError, setVietjetDomesticError] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerType, setCustomerType] = useState<'page' | 'live' | 'custom' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPNRModal, setShowPNRModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  
  const playTingSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  };

  // Bỏ hết logic applyFilters(), chỉ combine kết quả
  const combineResults = () => {
    console.log('=== COMBINE RESULTS DEBUG ===');
    console.log('VjetResults count:', vjetResults.length);
    console.log('VnaResults count:', vnaResults.length);
    
    const combinedResults = [...vjetResults, ...vnaResults];
    console.log('Combined results count:', combinedResults.length);
    
    setSearchResults(combinedResults);
    setAllResults(combinedResults);
  };

  const handleSearch = async (searchData: FlightSearchData) => {
    console.log('Searching with data:', searchData);
    setIsLoading(true);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSearchData(searchData);
    setApiStatus({ vj: 'pending', vna: 'pending' });
    setSearchMessages([]);
    setHasSearched(true);
    
    const skipVietjet = shouldSkipVietjet(searchData.departure, searchData.arrival);
    setVietjetDomesticError(skipVietjet);

    let completedAPIs = 0;
    const totalAPIs = 2;

    const checkIfShouldStopLoading = () => {
      completedAPIs++;
      console.log(`Completed APIs: ${completedAPIs}/${totalAPIs}`);
      
      if (completedAPIs === totalAPIs) {
        console.log('Both APIs completed, stopping loading');
        setIsLoading(false);
      }
    };

    const onVietJetResult = (result: any) => {
      console.log('=== VIETJET RESULT DEBUG ===');
      console.log('VietJet result received:', result);
      
      if (result.isDomesticError) {
        setVietjetDomesticError(true);
        setApiStatus(prev => ({ ...prev, vj: 'domestic_error' }));
        toast.error(result.error, {
          style: {
            color: 'red',
            fontWeight: 'bold'
          }
        });
        checkIfShouldStopLoading();
        return;
      }
      
      playTingSound();
      
      if (result.status_code === 200 && result.body && result.body.length > 0) {
        console.log('VietJet flights from API:', result.body.length);
        console.log('Adding all VietJet flights without filtering');
        setVjetResults(result.body);
        setApiStatus(prev => ({ ...prev, vj: 'success' }));
        
        const flightTypeText = result.flightType === 'direct' ? 'bay thẳng' : 'nối chuyến';
        toast.success(`Tìm thấy ${result.body.length} chuyến bay VietJet (${flightTypeText})`);
      } else if (result.status_code === 404) {
        setApiStatus(prev => ({ ...prev, vj: 'no_flights' }));
        setSearchMessages(prev => [...prev, 'Không có chuyến bay VietJet']);
        toast.info('Không có chuyến bay VietJet cho tuyến này');
      } else {
        setApiStatus(prev => ({ ...prev, vj: 'error' }));
        setSearchMessages(prev => [...prev, 'Không có chuyến bay VietJet']);
        toast.error('Lỗi tìm kiếm VietJet');
      }
      
      checkIfShouldStopLoading();
    };

    const onVNAResult = (result: any) => {
      console.log('=== VNA RESULT DEBUG ===');
      console.log('VNA result received:', result);
      console.log('VNA flights from API:', result.body ? result.body.length : 0);
      
      playTingSound();
      
      if (result.status_code === 200 && result.body && result.body.length > 0) {
        console.log('Adding all VNA flights without filtering');
        setVnaResults(result.body);
        setApiStatus(prev => ({ ...prev, vna: 'success' }));
        
        // Kiểm tra có chuyến bay thẳng hay không
        const hasDirectFlights = result.body.some((flight: any) => {
          const outbound = flight['chiều_đi'];
          const inbound = flight['chiều_về'];
          
          const isDirectOutbound = outbound && outbound.số_điểm_dừng === '0';
          const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
          
          return isDirectOutbound && isDirectInbound;
        });
        
        console.log('Has direct flights:', hasDirectFlights);
        
        // Tự động tick chọn "Bay thẳng" nếu có chuyến bay thẳng, nếu không thì "Tất cả"
        if (hasDirectFlights) {
          setSelectedFlightType('direct');
          console.log('Auto-selected flight type: direct');
        } else {
          setSelectedFlightType('all');
          console.log('Auto-selected flight type: all');
        }
        
        const flightTypeText = result.flightType === 'direct' ? 'bay thẳng' : 'nối chuyến';
        toast.success(`Tìm thấy ${result.body.length} chuyến bay Vietnam Airlines (${flightTypeText})`);
      } else if (result.status_code === 404) {
        console.log('VNA: No flights found, setting empty results');
        setVnaResults([]); // Set empty array to ensure UI displays the no flights message
        setApiStatus(prev => ({ ...prev, vna: 'no_flights' }));
        toast.info('Không có chuyến bay Vietnam Airlines cho tuyến này');
      } else {
        console.log('VNA: Error occurred, setting empty results');
        setVnaResults([]); // Set empty array to ensure UI displays the no flights message
        setApiStatus(prev => ({ ...prev, vna: 'error' }));
        toast.error('Lỗi tìm kiếm Vietnam Airlines');
      }
      
      checkIfShouldStopLoading();
    };

    try {
      await searchAllFlights(searchData, onVietJetResult, onVNAResult);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm chuyến bay');
      setIsLoading(false);
    }
  };

  const handleAirlineChange = (airline: 'all' | 'VJ' | 'VNA') => {
    setSelectedAirline(airline);
  };

  const handleFlightTypeChange = (flightType: 'all' | 'direct' | 'connecting') => {
    setSelectedFlightType(flightType);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowCustomerModal(true);
  };

  const handleSelectCustomerType = (type: 'page' | 'live' | 'custom') => {
    setCustomerType(type);
    setShowCustomerModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomerType(null);
    setShowCustomerModal(false);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSearchData(null);
    setHasSearched(false);
  };

  // Combine results whenever results change
  React.useEffect(() => {
    if (vjetResults.length > 0 || vnaResults.length > 0) {
      combineResults();
    }
  }, [vjetResults, vnaResults]);

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <CustomerTypeModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomerType={handleSelectCustomerType}
      />
      <EmailTicketModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
      <PNRCheckModal
        isOpen={showPNRModal}
        onClose={() => setShowPNRModal(false)}
      />
      <CheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
      />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ✈️ Tìm kiếm vé máy bay
              </h1>
              <p className="text-gray-600 mt-2">
                Tìm kiếm và so sánh giá vé máy bay giữa Việt Nam và Hàn Quốc
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCheckinModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Check-in
              </button>
              <button
                onClick={() => setShowPNRModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Lấy ảnh mặt vé
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Gửi Email Mặt Vé
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                THOÁT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} customerType={customerType} />
        
        <div className="flex flex-wrap gap-4 mb-6">
          <AirlineFilter 
            selectedAirline={selectedAirline}
            onAirlineChange={handleAirlineChange}
          />
          <FlightTypeFilter
            selectedFlightType={selectedFlightType}
            onFlightTypeChange={handleFlightTypeChange}
          />
        </div>
        
        <FlightResults 
          results={searchResults} 
          vjetResults={vjetResults}
          vnaResults={vnaResults}
          isLoading={isLoading}
          selectedAirline={selectedAirline}
          selectedFlightType={selectedFlightType}
          searchData={searchData}
          apiStatus={apiStatus}
          searchMessages={searchMessages}
          hasSearched={hasSearched}
          vietjetDomesticError={vietjetDomesticError}
        />
      </div>
    </div>
  );
};

export default Index;
