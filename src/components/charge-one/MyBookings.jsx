
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CalendarDays, X, MapPin } from 'lucide-react';
import { differenceInMinutes, format } from 'date-fns';

export default function MyBookings({ bookings, onCancelBooking, onSelectStation }) {

  const canCancel = (bookingTime) => {
    // Ensure bookingTime is a Date object before comparison
    const bookingDate = bookingTime instanceof Date ? bookingTime : bookingTime.toDate();
    return differenceInMinutes(bookingDate, new Date()) >= 15;
  };

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CalendarDays className="mx-auto h-12 w-12" />
            <p className="mt-4">You have no upcoming bookings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
        <CardDescription>Your upcoming charging sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map(booking => {
            const bookingTimeAsDate = booking.bookingTime.toDate ? booking.bookingTime.toDate() : booking.bookingTime;
            return (
              <div key={booking.id} className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold truncate">{booking.stationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(bookingTimeAsDate, "EEE, MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2">
                   <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onCancelBooking(booking)} 
                    disabled={!canCancel(bookingTimeAsDate)}
                    title={canCancel(bookingTimeAsDate) ? "Cancel Booking" : "Cannot cancel within 15 mins of start time"}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            )}
        )}
      </CardContent>
    </Card>
  );
}
