import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RepriceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PassengerPrice {
  name: string;
  price: number;
}

interface PriceComparison {
  oldTotal: number;
  newTotal: number;
  passengers: {
    name: string;
    oldPrice: number;
    newPrice: number;
  }[];
}

type ModalStep = 'check' | 'reprice' | 'result';

export const RepriceModal: React.FC<RepriceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [pnrInput, setPnrInput] = useState('');
  const [customerType, setCustomerType] = useState('VFR');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<ModalStep>('check');
  const [originalPrice, setOriginalPrice] = useState<PassengerPrice[]>([]);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleClose = () => {
    setPnrInput('');
    setCustomerType('VFR');
    setStep('check');
    setOriginalPrice([]);
    setPriceComparison(null);
    setShowDetails(false);
    onClose();
  };

  const parsePriceText = (priceText: string): PassengerPrice[] => {
    const passengers: PassengerPrice[] = [];
    
    // Nếu có GRAND TOTAL
    if (/GRAND TOTAL KRW/i.test(priceText)) {
      const totalMatch = priceText.match(/GRAND TOTAL KRW\s+(\d+)/i);
      const totalPrice = totalMatch ? parseInt(totalMatch[1]) : 0;
      const paxMatches = [...priceText.matchAll(/^\s*\d*\.?\s*([A-Z\/\s]+?\([A-Z/0-9]+\))/gmi)];
      for (const match of paxMatches) {
        passengers.push({
          name: match[1].trim(),
          price: totalPrice
        });
      }
      return passengers;
    }
  
    // Trường hợp parse theo từng dòng
    const lines = priceText.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*\d+\s+\.?\d+\s*I?\s+([\w\/\s\(\)\+\-]+?)\s+KRW\s+(\d+)/);
      if (match) {
        passengers.push({
          name: match[1].trim(),
          price: parseInt(match[2])
        });
      }
    }
    
    return passengers;
  };

  const comparePrices = (oldPriceText: string, newPriceText: string): PriceComparison => {
    const oldPassengers = parsePriceText(oldPriceText);
    const newPassengers = parsePriceText(newPriceText);
    
    const oldTotal = oldPassengers.reduce((sum, p) => sum + p.price, 0);
    const newTotal = newPassengers.reduce((sum, p) => sum + p.price, 0);
    
    const passengers = oldPassengers.map(oldP => {
      const matchingNewPassenger = newPassengers.find(newP => newP.name === oldP.name);
      return {
        name: oldP.name,
        oldPrice: oldP.price,
        newPrice: matchingNewPassenger?.price || 0
      };
    });
    
    return { oldTotal, newTotal, passengers };
  };

  const handleCheck = async () => {
    const pnr = pnrInput.trim().toUpperCase();
    
    if (pnr.length !== 6) {
      toast.error('Mã PNR phải gồm 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://thuhongtour.com/beginReprice?pnr=${pnr}`
      );
      
      const data = await response.json();
      
      // Check if response contains "IGNORED - {PNR}"
      const responseText = data.model?.output?.crypticResponse?.response || '';
      const isSuccess = responseText.includes(`IGNORED - ${pnr}`);
      
      if (isSuccess && data.pricegoc) {
        const prices = parsePriceText(data.pricegoc);
        setOriginalPrice(prices);
        
        // Auto-detect customer type from pricegoc
        if (data.pricegoc.includes('RSTU')) {
          setCustomerType('STU');
        } else {
          setCustomerType('VFR');
        }
        
        setStep('reprice');
        toast.success('Kiểm tra PNR thành công');
      } else {
        toast.error('Kiểm tra PNR thất bại');
      }
    } catch (error) {
      console.error('Error checking PNR:', error);
      toast.error('Lỗi kết nối');
    }

    setIsLoading(false);
  };

  const handleReprice = async () => {
    const pnr = pnrInput.trim().toUpperCase();
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://thuhongtour.com/reprice?pnr=${pnr}&doituong=${customerType}`
      );
      
      const data = await response.json();
      
      const responseText = JSON.stringify(data).toUpperCase();
      const isSuccess = responseText.includes('TRANSACTION COMPLETE');
      
      if (isSuccess && data.pricegoc && data.pricemoi) {
        const comparison = comparePrices(data.pricegoc, data.pricemoi);
        setPriceComparison(comparison);
        setStep('result');
        toast.success('Reprice thành công');
      } else {
        toast.error('Reprice thất bại');
      }
    } catch (error) {
      console.error('Error repricing:', error);
      toast.error('Lỗi kết nối');
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    setPnrInput('');
    setCustomerType('VFR');
    setStep('check');
    setOriginalPrice([]);
    setPriceComparison(null);
    setShowDetails(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-primary">
            Reprice PNR
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="pnr-input">Mã PNR</Label>
            <Input
              id="pnr-input"
              placeholder="Nhập mã PNR (6 ký tự)"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="mt-1"
              disabled={isLoading || step !== 'check'}
              maxLength={6}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Mỗi PNR gồm 6 ký tự. Ví dụ: FM4NJ6
            </p>
          </div>

          {step === 'check' && (
            <Button
              onClick={handleCheck}
              disabled={isLoading || pnrInput.trim().length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                'Check'
              )}
            </Button>
          )}

          {step === 'reprice' && (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Thông tin giá gốc:</h3>
                <div className="space-y-2">
                  {originalPrice.map((passenger, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{passenger.name}</span>
                      <span className="font-semibold">{passenger.price.toLocaleString()} KRW</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t flex justify-between font-bold">
                    <span>Tổng:</span>
                    <span>{originalPrice.reduce((sum, p) => sum + p.price, 0).toLocaleString()} KRW</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="customer-type">Đối Tượng</Label>
                <Select 
                  value={customerType} 
                  onValueChange={setCustomerType}
                  disabled={isLoading}
                >
                  <SelectTrigger id="customer-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADT">ADT</SelectItem>
                    <SelectItem value="VFR">VFR</SelectItem>
                    <SelectItem value="STU">STU</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Nhập lại
                </Button>
                <Button
                  onClick={handleReprice}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Reprice'
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'result' && priceComparison && (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Kết quả Reprice:</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Giá cũ: </span>
                      <span className="font-semibold">
                        {priceComparison.oldTotal.toLocaleString()} KRW
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Giá mới: </span>
                      <span className="font-semibold">
                        {priceComparison.newTotal.toLocaleString()} KRW
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold px-3 py-1 rounded ${
                        priceComparison.newTotal < priceComparison.oldTotal
                          ? 'bg-green-100 text-green-700'
                          : priceComparison.newTotal > priceComparison.oldTotal
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {priceComparison.newTotal < priceComparison.oldTotal
                        ? `↓ ${(priceComparison.oldTotal - priceComparison.newTotal).toLocaleString()} KRW`
                        : priceComparison.newTotal > priceComparison.oldTotal
                        ? `↑ ${(priceComparison.newTotal - priceComparison.oldTotal).toLocaleString()} KRW`
                        : '= Không đổi'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Ẩn chi tiết' : 'Chi tiết'}
                  </Button>
                </div>

                {showDetails && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground grid grid-cols-3 gap-2 pb-2 border-b">
                      <div>Tên khách</div>
                      <div className="text-right">Giá cũ</div>
                      <div className="text-right">Giá mới</div>
                    </div>
                    {priceComparison.passengers.map((passenger, pIndex) => (
                      <div
                        key={pIndex}
                        className="text-xs grid grid-cols-3 gap-2 py-1 hover:bg-muted/50 rounded"
                      >
                        <div className="font-medium">{passenger.name}</div>
                        <div className="text-right text-muted-foreground">
                          {passenger.oldPrice.toLocaleString()} KRW
                        </div>
                        <div className="text-right text-muted-foreground">
                          {passenger.newPrice.toLocaleString()} KRW
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleReset}
                className="w-full"
              >
                Reprice PNR khác
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
