
import { FlightSearchData } from '../types/flight';
import { shouldSkipVietjet } from '../utils/flightValidation';
import { searchVietJetFlights } from './vietjetService';
import { searchVietnamAirlinesFlights } from './vietnamAirlinesService';

// Keep the original function names for backward compatibility
export const searchFlights = searchVietJetFlights;
export const searchVNAFlights = searchVietnamAirlinesFlights;

export const searchAllFlights = async (
  searchData: FlightSearchData,
  onVietJetResult?: (results: any) => void,
  onVNAResult?: (results: any) => void
) => {
  console.log('Starting flight search with priority for direct flights');
  
  // Check if this route should skip Vietjet (no Korean airports)
  const skipVietjet = shouldSkipVietjet(searchData.departure, searchData.arrival);
  
  const searchWithFallback = async (
    searchFn: (data: any, directOnly: boolean) => Promise<any>,
    airline: string,
    callback?: (results: any) => void
  ) => {
    try {
      // For routes without Korean airports, skip Vietjet and return error
      if (airline === 'VietJet' && skipVietjet) {
        console.log('Skipping VietJet for route without Korean airports');
        callback && callback({
          status_code: 503,
          body: [],
          airline: 'VJ',
          error: 'VIETJET CHƯA CẬP NHẬT CÁC CHUYẾN BAY NỘI ĐỊA',
          isDomesticError: true
        });
        return;
      }
      
      // First try: Direct flights only
      console.log(`Searching ${airline} direct flights first`);
      const directResults = await searchFn(searchData, true);
      
      if (directResults.status_code === 200 && directResults.body && directResults.body.length > 0) {
        console.log(`${airline} direct flights found:`, directResults.body.length);
        callback && callback({
          status_code: 200,
          body: directResults.body,
          airline: airline === 'VietJet' ? 'VJ' : 'VNA',
          flightType: 'direct'
        });
        return;
      }
      
      // Second try: All flights (including connecting)
      console.log(`No ${airline} direct flights, searching connecting flights`);
      const allResults = await searchFn(searchData, false);
      
      if (allResults.status_code === 200 && allResults.body && allResults.body.length > 0) {
        console.log(`${airline} connecting flights found:`, allResults.body.length);
        callback && callback({
          status_code: 200,
          body: allResults.body,
          airline: airline === 'VietJet' ? 'VJ' : 'VNA',
          flightType: 'connecting'
        });
      } else {
        console.log(`No ${airline} flights found`);
        callback && callback({
          status_code: 404,
          body: [],
          airline: airline === 'VietJet' ? 'VJ' : 'VNA',
          error: `Không có chuyến bay ${airline}`
        });
      }
    } catch (error) {
      console.error(`${airline} API failed:`, error);
      callback && callback({
        status_code: 500,
        body: [],
        airline: airline === 'VietJet' ? 'VJ' : 'VNA',
        error: `Lỗi API ${airline}`
      });
    }
  };

  // Search both airlines simultaneously
  await Promise.all([
    searchWithFallback(searchVietJetFlights, 'VietJet', onVietJetResult),
    searchWithFallback(searchVietnamAirlinesFlights, 'Vietnam Airlines', onVNAResult)
  ]);
};
