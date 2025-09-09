
import { FlightSearchRequest, FlightSearchData } from '../types/flight';

export const searchVietJetFlights = async (searchData: FlightSearchData, directFlightsOnly: boolean = true) => {
  const requestData: FlightSearchRequest = {
    dep0: searchData.departure,
    arr0: searchData.arrival,
    depdate0: searchData.departureDate,
    adt: searchData.adults.toString(),
    chd: searchData.children.toString(),
    inf: searchData.infants.toString(),
    sochieu: searchData.tripType
  };

  if (searchData.tripType === 'RT' && searchData.returnDate) {
    requestData.depdate1 = searchData.returnDate;
  }

  try {
    const response = await fetch('https://thuhongtour.com/vj/check-ve-v2', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for direct flights only if requested
    if (directFlightsOnly && data.body && Array.isArray(data.body)) {
      const directFlights = data.body.filter((flight: any) => {
        const outbound = flight['chiều_đi'];
        const inbound = flight['chiều_về'];
        
        // Check if outbound is direct flight (no stops)
        const outboundDirect = outbound && outbound.số_điểm_dừng === '0';
        
        // For round trip, also check inbound
        if (searchData.tripType === 'RT' && inbound) {
          const inboundDirect = inbound.số_điểm_dừng === '0';
          return outboundDirect && inboundDirect;
        }
        
        return outboundDirect;
      });
      
      return {
        ...data,
        body: directFlights
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error searching VietJet flights:', error);
    throw error;
  }
};
