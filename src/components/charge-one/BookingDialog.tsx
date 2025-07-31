
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Station } from '@/lib/types';
import { format } from 'date-fns';

interface BookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onConfirm: (date: Date, time: string) => void;
}

export default function BookingDialog({ isOpen, onOpenChange, station, onConfirm }: BookingDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('');

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
        slots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  const handleConfirm = () => {
    if (date && time) {
        onConfirm(date, time);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Slot at {station?.name}</DialogTitle>
          <DialogDescription>
            Select a date and time for your charging session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                    className="rounded-md border"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="time-slot">Time Slot</Label>
                <Select value={time} onValueChange={setTime}>
                    <SelectTrigger id="time-slot">
                        <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!date || !time}>
                Confirm Booking
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
