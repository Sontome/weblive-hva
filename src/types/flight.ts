
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
  vnaDiscount1: number;
  vnaThreshold2: number;
  vnaDiscount2: number;
  vietjetThreshold1: number;
  vietjetDiscount1: number;
  vietjetThreshold2: number;
  vietjetDiscount2: number;
}
