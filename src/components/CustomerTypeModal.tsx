import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CustomerTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomerType: (type: 'page' | 'live' | 'custom') => void;
}

export const CustomerTypeModal: React.FC<CustomerTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomerType,
}) => {
  const handleSelectType = (type: 'page' | 'live' | 'custom') => {
    onSelectCustomerType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-primary">
            Chọn loại khách hàng
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-6">
          <Button
            variant="page-customer"
            size="lg"
            className="text-lg py-4"
            onClick={() => handleSelectType('page')}
          >
            Khách PAGE
          </Button>
          
          <Button
            variant="live-customer"
            size="lg"
            className="text-lg py-4"
            onClick={() => handleSelectType('live')}
          >
            Khách LIVE
          </Button>
          
          <Button
            variant="custom-price"
            size="lg"
            className="text-lg py-4"
            onClick={() => handleSelectType('custom')}
          >
            TÙY CHỈNH GIÁ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};