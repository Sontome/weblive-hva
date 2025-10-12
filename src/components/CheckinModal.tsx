import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

interface ParsedData {
  ho: string;
  ten: string;
  ngaysinh: string;
  gioitinh: string;
  cccd: string;
  sohochieu: string;
  ngayhethan: string;
}

interface OCRRawData {
  hoten: string;
  ngaysinh: string;
  gioitinh: string;
  cccd: string;
  sohochieu: string;
  ngayhethan: string;
}

interface OCRResult {
  filename: string;
  result: {
    parsed: OCRRawData;
  };
}

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({ isOpen, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [editableData, setEditableData] = useState<ParsedData[]>([]);
  const [pnr, setPnr] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleUploadAndOCR = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file ảnh');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('https://thuhongtour.com/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setOcrResults(result.data);
        setEditableData(result.data.map((item: OCRResult) => {
          const parsed = item.result.parsed;
          const nameParts = parsed.hoten.trim().split(' ');
          const ho = nameParts[0] || '';
          const ten = nameParts.slice(1).join(' ') || '';
          
          return {
            ...parsed,
            ho,
            ten
          };
        }));
        toast.success(`Đã xử lý ${result.count} ảnh thành công`);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Lỗi khi xử lý ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof ParsedData, value: string) => {
    setEditableData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const handleContinue = () => {
    if (!pnr || pnr.length !== 6) {
      toast.error('Vui lòng nhập mã PNR (6 ký tự)');
      return;
    }

    // TODO: Implement next step in the flow
    console.log('Continue with data:', { pnr, passengers: editableData });
    toast.info('Chức năng tiếp theo sẽ được triển khai');
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setOcrResults([]);
    setEditableData([]);
    setPnr('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Check-in Hành Khách</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          {editableData.length === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="files">Chọn ảnh CMND/CCCD/Hộ chiếu</Label>
                <Input
                  id="files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="mt-2"
                />
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Đã chọn {selectedFiles.length} file
                  </p>
                )}
              </div>

              <Button
                onClick={handleUploadAndOCR}
                disabled={isProcessing || selectedFiles.length === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Tải lên và xử lý
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results Form Section */}
          {editableData.length > 0 && (
            <div className="space-y-6">
              {editableData.map((data, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Hành khách {index + 1}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`ho-${index}`}>Họ</Label>
                      <Input
                        id={`ho-${index}`}
                        value={data.ho}
                        onChange={(e) => handleFieldChange(index, 'ho', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ten-${index}`}>Tên</Label>
                      <Input
                        id={`ten-${index}`}
                        value={data.ten}
                        onChange={(e) => handleFieldChange(index, 'ten', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ngaysinh-${index}`}>Ngày sinh</Label>
                      <Input
                        id={`ngaysinh-${index}`}
                        value={data.ngaysinh}
                        onChange={(e) => handleFieldChange(index, 'ngaysinh', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`gioitinh-${index}`}>Giới tính</Label>
                      <Input
                        id={`gioitinh-${index}`}
                        value={data.gioitinh}
                        onChange={(e) => handleFieldChange(index, 'gioitinh', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`sohochieu-${index}`}>Số hộ chiếu</Label>
                      <Input
                        id={`sohochieu-${index}`}
                        value={data.sohochieu}
                        onChange={(e) => handleFieldChange(index, 'sohochieu', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ngayhethan-${index}`}>Ngày hết hạn</Label>
                      <Input
                        id={`ngayhethan-${index}`}
                        value={data.ngayhethan}
                        onChange={(e) => handleFieldChange(index, 'ngayhethan', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* PNR Input */}
              <div>
                <Label htmlFor="pnr">Mã PNR (6 ký tự)</Label>
                <Input
                  id="pnr"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="VD: FBBKLG"
                  className="mt-1"
                />
              </div>

              {/* Continue Button */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditableData([]);
                    setOcrResults([]);
                    setSelectedFiles([]);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Tải lại ảnh
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1"
                >
                  Tiếp tục
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
