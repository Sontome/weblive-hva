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

interface PNRResult {
  pnr: string;
  status: 'success' | 'failed' | 'pending';
  message?: string;
}

export const RepriceModal: React.FC<RepriceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [pnrInput, setPnrInput] = useState('');
  const [customerType, setCustomerType] = useState('VFR');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PNRResult[]>([]);

  const handleClose = () => {
    setPnrInput('');
    setCustomerType('VFR');
    setResults([]);
    onClose();
  };

  const parsePNRs = (input: string): string[] => {
    // Split by comma, semicolon, or whitespace and filter out empty strings
    return input
      .split(/[,;\s]+/)
      .map(pnr => pnr.trim().toUpperCase())
      .filter(pnr => pnr.length === 6);
  };

  const handleReprice = async () => {
    const pnrs = parsePNRs(pnrInput);
    
    if (pnrs.length === 0) {
      toast.error('Vui lòng nhập ít nhất một mã PNR hợp lệ (6 ký tự)');
      return;
    }

    setIsLoading(true);
    const initialResults: PNRResult[] = pnrs.map(pnr => ({
      pnr,
      status: 'pending',
    }));
    setResults(initialResults);

    // Process each PNR
    for (let i = 0; i < pnrs.length; i++) {
      const pnr = pnrs[i];
      
      try {
        const response = await fetch(
          `https://thuhongtour.com/reprice?pnr=${pnr}&doituong=${customerType}`
        );
        
        const data = await response.json();
        
        // Check if response contains "TRANSACTION COMPLETE"
        const responseText = JSON.stringify(data).toUpperCase();
        const isSuccess = responseText.includes('TRANSACTION COMPLETE');
        
        setResults(prev => 
          prev.map((result, idx) => 
            idx === i 
              ? { 
                  ...result, 
                  status: isSuccess ? 'success' : 'failed',
                  message: isSuccess ? 'Thành công' : 'Thất bại'
                }
              : result
          )
        );

        if (isSuccess) {
          toast.success(`PNR ${pnr}: Thành công`);
        } else {
          toast.error(`PNR ${pnr}: Thất bại`);
        }
      } catch (error) {
        console.error(`Error repricing ${pnr}:`, error);
        setResults(prev => 
          prev.map((result, idx) => 
            idx === i 
              ? { 
                  ...result, 
                  status: 'failed',
                  message: 'Lỗi kết nối'
                }
              : result
          )
        );
        toast.error(`PNR ${pnr}: Lỗi kết nối`);
      }
    }

    setIsLoading(false);
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
              placeholder="Nhập các mã PNR (phân cách bằng dấu phẩy, khoảng trắng hoặc dấu chấm phẩy)"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Mỗi PNR gồm 6 ký tự. Ví dụ: DFIH2M, ABC123, XYZ789
            </p>
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

          <Button
            onClick={handleReprice}
            disabled={isLoading || !pnrInput.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận'
            )}
          </Button>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Kết quả:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      result.status === 'success'
                        ? 'bg-green-100 border border-green-300'
                        : result.status === 'failed'
                        ? 'bg-gray-100 border border-gray-300'
                        : 'bg-yellow-100 border border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          result.status === 'success'
                            ? 'bg-green-500'
                            : result.status === 'failed'
                            ? 'bg-gray-400'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <span className="font-semibold">{result.pnr}</span>
                    </div>
                    <div className="text-sm">
                      {result.status === 'pending' && (
                        <span className="text-yellow-700">Đang xử lý...</span>
                      )}
                      {result.status === 'success' && (
                        <span className="text-green-700">{result.message}</span>
                      )}
                      {result.status === 'failed' && (
                        <span className="text-gray-700">{result.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
