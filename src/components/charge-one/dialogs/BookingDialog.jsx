
"use client";

import { useState, useEffect } from 'react';
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
import { isToday, set } from 'date-fns';

export default function BookingDialog({ isOpen, onOpenChange, station, onConfirm }) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    const generateTimeSlots = () => {
      const now = new Date();
      const slots = [];
      const isBookingForToday = isToday(date);
      
      let startHour = 0;
      let startMinute = 0;

      if (isBookingForToday) {
        startHour = now.getHours();
        // Round up to the next 30-minute interval
        if (now.getMinutes() < 30) {
          startMinute = 30;
        } else {
          startHour += 1;
          startMinute = 0;
        }
      }

      for (let i = startHour; i < 24; i++) {
        const baseDate = set(new Date(), { hours: i, minutes: 0, seconds: 0, milliseconds: 0 });
        
        if (i === startHour && startMinute === 30) {
          // If starting from xx:30
           slots.push(`${i.toString().padStart(2, '0')}:30`);
        } else {
          // Starting from xx:00
          slots.push(`${i.toString().padStart(2, '0')}:00`);
          slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
      }
      return slots;
    };
    
    setTimeSlots(generateTimeSlots());
    // Reset time when date changes
    setTime('');
  }, [date]);
  
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
                    <SelectTrigger id="time-slot" disabled={timeSlots.length === 0}>
                        <SelectValue placeholder={timeSlots.length > 0 ? "Select a time" : "No available slots today"} />
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
