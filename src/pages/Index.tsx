
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FlightSearchForm from '../components/FlightSearchForm';
import FlightResults from '../components/FlightResults';
import AirlineFilter from '../components/AirlineFilter';
import FlightTypeFilter from '../components/FlightTypeFilter';
import LowFareChart from '../components/LowFareChart';
import { CustomerTypeModal } from '../components/CustomerTypeModal';
import { EmailTicketModal } from '../components/EmailTicketModal';
import { PNRCheckModal } from '../components/PNRCheckModal';
import { CheckinModal } from '../components/CheckinModal';
import { RepriceModal } from '../components/RepriceModal';
import { VJTicketModal } from '../components/VJTicketModal';
import { VNATicketModal } from '../components/VNATicketModal';
import { Button } from '@/components/ui/button';
import { searchAllFlights } from '../services/flightService';
import { searchLowFare, LowFareDay } from '../services/lowfareService';
import { shouldSkipVietjet } from '../utils/flightValidation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePriceConfigs } from '@/hooks/usePriceConfigs';

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
  vnaDiscountOW1: number;
  vnaDiscountRT1: number;
  vnaThreshold2: number;
  vnaDiscountOW2: number;
  vnaDiscountRT2: number;
  vnaThreshold3: number;
  vnaDiscountOW3: number;
  vnaDiscountRT3: number;
  vietjetThreshold1: number;
  vietjetDiscountOW1: number;
  vietjetDiscountRT1: number;
  vietjetThreshold2: number;
  vietjetDiscountOW2: number;
  vietjetDiscountRT2: number;
  vietjetThreshold3: number;
  vietjetDiscountOW3: number;
  vietjetDiscountRT3: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { configs: priceConfigs, isLoading: configsLoading } = usePriceConfigs();
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPNRModal, setShowPNRModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRepriceModal, setShowRepriceModal] = useState(false);
  const [showVJTicketModal, setShowVJTicketModal] = useState(false);
  const [vjTicketInitialPNR, setVjTicketInitialPNR] = useState<string | undefined>(undefined);
  const [showVNATicketModal, setShowVNATicketModal] = useState(false);
  const [vnaTicketInitialPNR, setVnaTicketInitialPNR] = useState<string | undefined>(undefined);
  
  // Low fare chart state
  const [lowFareDeparture, setLowFareDeparture] = useState<LowFareDay[]>([]);
  const [lowFareReturn, setLowFareReturn] = useState<LowFareDay[]>([]);
  const [isLoadingLowFare, setIsLoadingLowFare] = useState(false);
  const [lastSearchData, setLastSearchData] = useState<FlightSearchData | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsLoggedIn(true);
      setIsCheckingAuth(false);
      setShowCustomerModal(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  // Fetch low fare data from VietJet
  const fetchLowFareData = async (data: FlightSearchData) => {
    setIsLoadingLowFare(true);
    setLowFareDeparture([]);
    setLowFareReturn([]);
    
    try {
      const result = await searchLowFare(
        data.departure,
        data.arrival,
        data.tripType,
        data.departureDate,
        data.returnDate
      );
      
      if (result.status_code === '200' && result.body) {
        setLowFareDeparture(result.body.chiều_đi || []);
        setLowFareReturn(result.body.chiều_về || []);
      }
    } catch (error) {
      console.error('Error fetching low fare data:', error);
    } finally {
      setIsLoadingLowFare(false);
    }
  };

  // Handle search with selected dates from low fare chart
  const handleSearchWithDates = (departureDate: string, returnDate: string) => {
    if (!lastSearchData) return;
    
    const newSearchData: FlightSearchData = {
      ...lastSearchData,
      departureDate,
      returnDate,
      tripType: returnDate ? 'RT' : 'OW',
    };
    
    handleSearch(newSearchData);
  };


  const handleSearch = async (searchData: FlightSearchData) => {
    console.log('Searching with data:', searchData);
    setIsLoading(true);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSearchData(searchData);
    setLastSearchData(searchData);
    setApiStatus({ vj: 'pending', vna: 'pending' });
    setSearchMessages([]);
    setHasSearched(true);
    
    const skipVietjet = shouldSkipVietjet(searchData.departure, searchData.arrival);
    setVietjetDomesticError(skipVietjet);
    
    // Fetch low fare data (don't wait for it to complete)
    fetchLowFareData(searchData);

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

  const handleSelectCustomerType = (type: 'page' | 'live' | 'custom') => {
    setCustomerType(type);
    setShowCustomerModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCustomerType(null);
    setShowCustomerModal(false);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSearchData(null);
    setHasSearched(false);
    navigate('/auth');
  };

  // Combine results whenever results change
  React.useEffect(() => {
    if (vjetResults.length > 0 || vnaResults.length > 0) {
      combineResults();
    }
  }, [vjetResults, vnaResults]);

  // Show loading while checking auth
  if (isCheckingAuth || configsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
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
      <RepriceModal
        isOpen={showRepriceModal}
        onClose={() => setShowRepriceModal(false)}
      />
      <VJTicketModal
        isOpen={showVJTicketModal}
        onClose={() => {
          setShowVJTicketModal(false);
          setVjTicketInitialPNR(undefined);
        }}
        initialPNR={vjTicketInitialPNR}
      />
      <VNATicketModal
        isOpen={showVNATicketModal}
        onClose={() => {
          setShowVNATicketModal(false);
          setVnaTicketInitialPNR(undefined);
        }}
        initialPNR={vnaTicketInitialPNR}
      />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
            <Button
              onClick={() => setShowVJTicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé VJ
            </Button>
            <Button
              onClick={() => setShowVNATicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé VNA
            </Button>
            <Button
              onClick={() => setShowRepriceModal(true)}
              variant="action-reprice"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              💰 Reprice
            </Button>
            <Button
              onClick={() => setShowCheckinModal(true)}
              variant="action-checkin"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              ✅ Check-in
            </Button>
            <Button
              onClick={() => setShowEmailModal(true)}
              variant="action-email"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              📧 Email
            </Button>
            <Button
              onClick={() => setShowPNRModal(true)}
              variant="action-image"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Ảnh vé
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} customerType={customerType} priceConfigs={priceConfigs} />
        
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
        
        {/* Low Fare Chart - show after first search */}
        {hasSearched && (lowFareDeparture.length > 0 || lowFareReturn.length > 0) && (
          <LowFareChart
            departureData={lowFareDeparture}
            returnData={lowFareReturn}
            tripType={searchData?.tripType || 'OW'}
            onSearchWithDates={handleSearchWithDates}
            isLoading={isLoading}
            initialDepartureDate={searchData?.departureDate}
            initialReturnDate={searchData?.returnDate}
          />
        )}
        
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
          onVJBookingSuccess={(pnr) => {
            setVjTicketInitialPNR(pnr);
            setShowVJTicketModal(true);
          }}
          onVNABookingSuccess={(pnr) => {
            setVnaTicketInitialPNR(pnr);
            setShowVNATicketModal(true);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
