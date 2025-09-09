import { VNAFlightSearchRequest, FlightSearchData } from '../types/flight';

export const searchVietnamAirlinesFlights = async (
  searchData: FlightSearchData,
  directFlightsOnly: boolean = true,
  isRetry: boolean = false,
  overrideRequestData?: Partial<VNAFlightSearchRequest> // thêm option để override
) => {
  let requestData: VNAFlightSearchRequest = {
    dep0: searchData.departure,
    arr0: searchData.arrival,
    depdate0: searchData.departureDate,
    activedVia: "0",
    activedIDT: "ADT,VFR",
    adt: searchData.adults.toString(),
    chd: searchData.children.toString(),
    inf: searchData.infants.toString(),
    page: "1",
    sochieu: searchData.tripType,
    filterTimeSlideMin0: "5",
    filterTimeSlideMax0: "2355",
    filterTimeSlideMin1: "5",
    filterTimeSlideMax1: "2355",
    session_key: ""
  };

  if (searchData.tripType === 'RT' && searchData.returnDate) {
    requestData.depdate1 = searchData.returnDate;
  }

  // Gộp override vào requestData nếu có
  if (overrideRequestData) {
    requestData = { ...requestData, ...overrideRequestData };
  }

  try {
    const response = await fetch('https://thuhongtour.com/vna/check-ve-v2', {
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

    console.log('=== VNA DEBUG UPDATED ===');
    console.log('Raw VNA response:', data);

    // Nếu body null thì retry 1 lần với session_key + activedVia mới
    if (!isRetry && (data.body === "null" || data.body === null)) {
      console.log('VNA: body null, retry with session_key and activedVia 0,1,2');
      return await searchVietnamAirlinesFlights(
        searchData,
        directFlightsOnly,
        true,
        {
          session_key: data.session_key || "",
          activedVia: "0,1,2"
        }
      );
    }

    console.log('VNA status_code:', data.status_code);
    console.log('VNA body type:', typeof data.body);
    console.log('VNA flights count from API:', data.body ? data.body.length : 0);
    console.log('DirectFlightsOnly parameter:', directFlightsOnly);

    if (!data.body || data.body.length === 0) {
      console.log('VNA: No flights found, returning 404 status');
      return {
        status_code: 404,
        body: [],
        error: 'No flights found'
      };
    }

    return {
      ...data,
      status_code: data.status_code || 200
    };
  } catch (error) {
    console.error('Error searching VNA flights:', error);
    throw error;
  }
};
