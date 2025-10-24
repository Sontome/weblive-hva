import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, User } from 'lucide-react';

interface VJTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChieuBay {
  departure: string;
  arrival: string;
  departurename: string;
  arrivalname: string;
  loaive: string;
  giocatcanh: string;
  ngaycatcanh: string;
  giohacanh: string;
  ngayhacanh: string;
  thoigianbay: string;
  sohieumaybay: string;
}

interface Passenger {
  lastName: string;
  firstName: string;
  phonenumber: string;
  email: string;
}

interface PNRData {
  pnr: string;
  status: string;
  hang: string;
  tongbillgiagoc: number;
  currency: string;
  paymentstatus: boolean;
  hanthanhtoan: string;
  chieudi?: ChieuBay;
  chieuve?: ChieuBay;
  passengers: Passenger[];
}

export const VJTicketModal: React.FC<VJTicketModalProps> = ({ isOpen, onClose }) => {
  const [pnr, setPnr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pnrData, setPnrData] = useState<PNRData | null>(null);

  const handleCheck = async () => {
    if (!pnr.trim()) {
      toast.error('Vui lòng nhập PNR');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://thuhongtour.com/vj/checkpnr?pnr=${pnr.trim()}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Không thể kiểm tra PNR');
      }

      const data = await response.json();
      
      if (data.status === 'OK') {
        setPnrData(data);
        toast.success('Lấy thông tin PNR thành công');
      } else {
        toast.error('PNR không hợp lệ');
      }
    } catch (error) {
      console.error('Error checking PNR:', error);
      toast.error('Có lỗi xảy ra khi kiểm tra PNR');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ' + currency;
  };

  const handleClose = () => {
    setPnr('');
    setPnrData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        

        <div className="space-y-6">
          {/* PNR Input Section */}
          {!pnrData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pnr">Mã đặt chỗ (PNR)</Label>
                <Input
                  id="pnr"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  placeholder="Nhập PNR"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCheck();
                    }
                  }}
                />
              </div>
              <Button onClick={handleCheck} disabled={isLoading} className="w-full">
                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </Button>
            </div>
          )}

          {/* PNR Data Display */}
          {pnrData && (
            <div className="space-y-5">
              {/* PNR Header */}
              <div className="text-2xl font-bold text-gray-800">
                Mã đặt chỗ {pnrData.pnr}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pnrData.pnr, 'PNR')}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Payment Warning */}
              {!pnrData.paymentstatus && (
                <div className="px-4 py-3 rounded" style={{ backgroundColor: '#fffad6' }}>
                  <p className="text-lg text-black font-semibold">
                    Vui lòng thanh toán trước <span className="text-red-600">{pnrData.hanthanhtoan}</span> sau thời hạn trên vé sẽ bị hủy.
                  </p>
                </div>
              )}
              {!pnrData.paymentstatus && (
                <div className="px-4 py-3 rounded" style={{ backgroundColor: '#fffad6' }}>
                  <p className="text-lg text-black font-semibold">
                    Tổng tiền: <span className="text-red-600">{pnrData.tongbillgiagoc}</span> <span className="text-gray-800">{pnrData.currency}</span> 
                  </p>
                </div>
              )}

              {/* Passenger Information */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 font-bold text-lg text-gray-700  ">
                  Thông tin hành khách
                </div>
                <div className="p-4 space-y-4">
                  {pnrData.passengers.map((passenger, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-200">
                        <div className="flex items-center gap-3 text-black">
                          <User className="h-5 w-5" />
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="font-semibold text-lg">Người lớn:</span>
                            <span className="font-semibold text-lg">{passenger.lastName} {passenger.firstName}</span>
                            {index === 0 && <span className="font-semibold text-lg">(Người đại diện)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
                        {passenger.phonenumber && (
                          <div>
                            <span className="text-lg">Số điện thoại: </span>
                            <span className="font-semibold text-lg">{passenger.phonenumber}</span>
                          </div>
                        )}
                        {passenger.email && (
                          <div className="flex gap-2">
                            <span className="text-lg">Địa chỉ email: </span>
                            <span className="font-semibold text-lg break-all">{passenger.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flight Information */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 font-semibold text-lg   ">
                  Thông tin chuyến bay
                </div>
                <div className="p-4">
                  <div className="max-w-2xl mx-auto space-y-4">
                  {/* Outbound Flight */}
                  {pnrData.chieudi && (
                    <div>
                      <div className="border rounded-t-lg overflow-hidden">
                        <div className="px-4 py-3 font-bold text-lg text-gray-700" style={{ backgroundColor: '#c9efff' }}>
                          Chặng 1
                        </div>
                      </div>
                      <div className="border border-t-0 rounded-b-lg p-4">
                        <div className="mb-2 text-lg font-semibold text-gray-800">
                          {(() => {
                            const dateStr = pnrData.chieudi.ngaycatcanh
                            const parts = dateStr.includes('/')
                              ? dateStr.split('/')
                              : dateStr.split('-').reverse() // nếu là dạng yyyy-mm-dd thì đảo ngược lại
                        
                            const date = new Date(parts[2], parts[1] - 1, parts[0])
                            const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                            const dayName = weekdays[date.getDay()]
                        
                            return `${dayName}, ${parts.join('/')}`
                          })()}
                        </div>
                        <div className="flex justify-between items-center max-w-2xl">
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-gray-800">{pnrData.chieudi.departure}</div>
                            <div className="text-lg ">{pnrData.chieudi.departurename}</div>
                            <div className="text-lg font-bold mt-1 text-gray-800">{pnrData.chieudi.giocatcanh}</div>
                          </div>
                          <div className="flex-1 text-center px-4">
                            <div className="text-sm text-gray-600 font-semibold mb-2">{(() => {
                              const t = pnrData.chieudi.thoigianbay;
                              if (!t) return "";
                              const [gio, phut] = t.split(":");
                              return `${gio} giờ ${phut} phút`;
                            })()}</div>
                            <div class="relative h-8">
                              <div class=" w-full absolute "></div>
                              <img
                                src="https://raw.githubusercontent.com/Sontome/icon/refs/heads/main/flyiconVJ.svg"
                                alt="plane icon"
                                class="absolute  left-1/2 transform -translate-x-1/2"
                              />
                            </div>
                            <div className="text-sm text-gray-600  font-semibold">{pnrData.chieudi.sohieumaybay}</div>
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-2xl font-bold text-gray-800">{pnrData.chieudi.arrival}</div>
                            <div className="text-lg ">{pnrData.chieudi.arrivalname}</div>
                            <div className="text-lg font-bold mt-1 text-gray-800">{pnrData.chieudi.giohacanh}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return Flight */}
                  {pnrData.chieuve && Object.keys(pnrData.chieuve).length > 0 && (
                    <div className="mt-4">
                      <div className="border rounded-t-lg overflow-hidden">
                        <div className="px-4 py-3 font-bold text-lg text-gray-700" style={{ backgroundColor: '#c9efff' }}>
                          Chặng 2
                        </div>
                      </div>
                      <div className="border border-t-0 rounded-b-lg p-4">
                         <div className="mb-2 text-lg font-semibold text-gray-800">
                          {(() => {
                            const dateStr = pnrData.chieuve.ngaycatcanh
                            const parts = dateStr.includes('/')
                              ? dateStr.split('/')
                              : dateStr.split('-').reverse() // nếu là dạng yyyy-mm-dd thì đảo ngược lại
                        
                            const date = new Date(parts[2], parts[1] - 1, parts[0])
                            const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                            const dayName = weekdays[date.getDay()]
                        
                            return `${dayName}, ${parts.join('/')}`
                          })()}
                        </div>
                        <div className="flex justify-between items-center max-w-2xl">
                          <div className="flex-1">
                            <div className="text-2xl font-bold text-gray-800">{pnrData.chieuve.departure}</div>
                            <div className="text-lg ">{pnrData.chieuve.departurename}</div>
                            <div className="text-lg font-bold mt-1 text-gray-800">{pnrData.chieuve.giocatcanh}</div>
                          </div>
                          <div className="flex-1 text-center px-4">
                            <div className="text-sm text-gray-600 font-semibold mb-2">{(() => {
                              const t = pnrData.chieuve.thoigianbay;
                              if (!t) return "";
                              const [gio, phut] = t.split(":");
                              return `${gio} giờ ${phut} phút`;
                            })()}</div>
                            <div class="relative h-8">
                              <div class=" w-full absolute "></div>
                              <img
                                src="https://raw.githubusercontent.com/Sontome/icon/refs/heads/main/flyiconVJ.svg"
                                alt="plane icon"
                                class="absolute  left-1/2 transform -translate-x-1/2"
                              />
                            </div>
                            <div className="text-sm text-gray-600  font-semibold ">{pnrData.chieuve.sohieumaybay}</div>
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-2xl font-bold text-gray-800">{pnrData.chieuve.arrival}</div>
                            <div className="text-lg">{pnrData.chieuve.arrivalname}</div>
                            <div className="text-lg font-bold mt-1 text-gray-800">{pnrData.chieuve.giohacanh}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setPnrData(null);
                    setPnr('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Kiểm tra PNR khác
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
