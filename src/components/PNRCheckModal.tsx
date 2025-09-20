import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Download, FileText } from 'lucide-react';

interface PNRCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PNRFile {
  url: string;
  name: string;
  blob?: Blob;
}

export const PNRCheckModal = ({ isOpen, onClose }: PNRCheckModalProps) => {
  const [pnrCode, setPnrCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<PNRFile[]>([]);

  const handleClose = () => {
    setPnrCode('');
    setFiles([]);
    onClose();
  };

  const handleCheck = async () => {
    if (!pnrCode.trim()) {
      toast.error('Vui lòng nhập mã PNR');
      return;
    }

    setIsLoading(true);
    setFiles([]);

    try {
      // First API call to get file list
      const listResponse = await fetch(`https://thuhongtour.com/list-pnr/${pnrCode.trim()}`);
      const listResult = await listResponse.json();

      if (!listResult.files || !Array.isArray(listResult.files)) {
        toast.error('Không tìm thấy file cho mã PNR này');
        setIsLoading(false);
        return;
      }

      toast.success(`Tìm thấy ${listResult.files.length} file PDF`);

      // Fetch each PDF file
      const pdfFiles: PNRFile[] = [];
      for (const fileUrl of listResult.files) {
        try {
          const fileResponse = await fetch(fileUrl);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            const fileName = fileUrl.split('/').pop() || 'document.pdf';
            pdfFiles.push({
              url: fileUrl,
              name: fileName,
              blob: blob
            });
          }
        } catch (error) {
          console.error('Error fetching file:', fileUrl, error);
        }
      }

      setFiles(pdfFiles);
      if (pdfFiles.length === 0) {
        toast.error('Không thể tải xuống file PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra khi kiểm tra PNR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy URL vào clipboard');
  };

  const handleDownload = (file: PNRFile) => {
    if (file.blob) {
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kiểm tra mã PNR</DialogTitle>
          <DialogDescription>
            Nhập mã PNR để xem và tải xuống mặt vé PDF
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="pnr">Mã PNR</Label>
              <Input
                id="pnr"
                value={pnrCode}
                onChange={(e) => setPnrCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã PNR (6 ký tự)"
                maxLength={6}
                className="uppercase"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCheck} 
                disabled={isLoading || !pnrCode.trim()}
                className="whitespace-nowrap"
              >
                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Danh sách file PDF ({files.length})</h3>
              <div className="grid gap-3">
                {files.map((file, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-sm">{file.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUrl(file.url)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          disabled={!file.blob}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Tải xuống
                        </Button>
                      </div>
                    </div>
                    
                    {file.blob && (
                      <div className="mt-3">
                        <iframe
                          src={URL.createObjectURL(file.blob)}
                          className="w-full h-96 border rounded"
                          title={`PDF Preview ${index + 1}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
