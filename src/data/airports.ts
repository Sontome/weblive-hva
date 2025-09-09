
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export const airports: Airport[] = [
  // Sân bay Hàn Quốc
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "Korea" },
  { code: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "Korea" },
  { code: "PUS", name: "Busan Gimhae International Airport", city: "Busan", country: "Korea" },
  { code: "CJU", name: "Jeju International Airport", city: "Jeju", country: "Korea" },
  { code: "TAE", name: "Daegu International Airport", city: "Daegu", country: "Korea" },
  
  // Sân bay Việt Nam
  { code: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam" },
  { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam" },
  { code: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam" },
  { code: "HPH", name: "Cat Bi International Airport", city: "Hai Phong", country: "Vietnam" },
  { code: "CXR", name: "Cam Ranh International Airport", city: "Nha Trang", country: "Vietnam" },
  { code: "HUI", name: "Phu Bai International Airport", city: "Hue", country: "Vietnam" },
  { code: "VDH", name: "Dong Hoi Airport", city: "Dong Hoi", country: "Vietnam" },
  { code: "TBB", name: "Tuy Hoa Airport", city: "Tuy Hoa", country: "Vietnam" },
  { code: "UIH", name: "Phu Cat Airport", city: "Quy Nhon", country: "Vietnam" },
  { code: "DLI", name: "Lien Khuong Airport", city: "Dalat", country: "Vietnam" },
];
