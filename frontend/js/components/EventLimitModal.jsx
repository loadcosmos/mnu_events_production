import React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { AlertCircle, MessageSquare, DollarSign } from 'lucide-react';

export default function EventLimitModal({ isOpen, onClose, limitInfo }) {
  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Hello! I would like to purchase additional event slots. Current: ${limitInfo?.currentEvents || 0}/${limitInfo?.limit || 1}`
    );
    window.open(`https://wa.me/77779998877?text=${message}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <DialogTitle>Event Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p>
              You have reached your event limit:{' '}
              <strong>
                {limitInfo?.currentEvents || 0} out of {limitInfo?.limit || 1} active events
              </strong>
            </p>
            <p>
              To create more events, you can purchase additional event slots for{' '}
              <strong className="text-blue-400">
                {new Intl.NumberFormat('ru-KZ', {
                  style: 'currency',
                  currency: 'KZT',
                  minimumFractionDigits: 0,
                }).format(limitInfo?.additionalSlotPrice || 3000)}
              </strong>{' '}
              per slot.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-400 mb-1">Package Options:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 1 additional slot: 3,000 ₸</li>
                <li>• 5 slots package: 14,000 ₸ (save 1,000 ₸)</li>
                <li>• 10 slots package: 27,000 ₸ (save 3,000 ₸)</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleContactSupport} className="w-full sm:w-auto">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
