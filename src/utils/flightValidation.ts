// Helper function to check if route should skip Vietjet (no Korean airports involved)
export const shouldSkipVietjet = (departure: string, arrival: string) => {
  const koreanAirports = ['ICN', 'PUS', 'TAE'];
  
  // If neither departure nor arrival is a Korean airport, skip Vietjet
  const hasKoreanAirport = koreanAirports.includes(departure) || koreanAirports.includes(arrival);
  
  return !hasKoreanAirport;
};

// Keep the old function for backward compatibility (deprecated)
export const isDomesticVietnamRoute = (departure: string, arrival: string) => {
  const koreanAirports = ['ICN', 'PUS', 'TAE'];
  const vietnamAirports = ['HAN', 'SGN', 'DAD', 'HPH', 'CXR', 'HUI', 'VDH', 'TBB', 'UIH', 'DLI'];
  
  const hasKoreanAirport = koreanAirports.includes(departure) || koreanAirports.includes(arrival);
  const hasVietnamAirport = vietnamAirports.includes(departure) || vietnamAirports.includes(arrival);
  
  // If both departure and arrival are Vietnam airports and no Korean airport involved
  return vietnamAirports.includes(departure) && vietnamAirports.includes(arrival) && !hasKoreanAirport;
};
