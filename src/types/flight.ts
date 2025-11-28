
export interface FlightSearchRequest {
  dep0: string;
  arr0: string;
  depdate0: string;
  depdate1?: string;
  adt: string;
  chd: string;
  inf: string;
  sochieu: string;
}

export interface VNAFlightSearchRequest extends FlightSearchRequest {
  activedVia: string;
  activedIDT: string;
  page: string;
  filterTimeSlideMin0: string;
  filterTimeSlideMax0: string;
  filterTimeSlideMin1: string;
  filterTimeSlideMax1: string;
  session_key: string;
}

export interface FlightSearchData {
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
