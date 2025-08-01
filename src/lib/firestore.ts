
"use server";

import { db } from './firebase-admin'; // Use server-side admin SDK
import { Timestamp } from 'firebase-admin/firestore';
import type { Station } from './types';

interface BookingData {
    userId: string;
    stationId: string;
    stationName: string;
    bookingTime: Date;
    createdAt: Date;
}

export const createBooking = async (
    userId: string, 
    station: Station, 
    bookingTime: Date
): Promise<string> => {
    try {
        const bookingsCollection = db.collection('bookings');
        const docRef = await bookingsCollection.add({
            userId: userId,
            stationId: station.id,
            stationName: station.name,
            bookingTime: Timestamp.fromDate(bookingTime),
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Could not create booking.");
    }
}

export const getUserBookings = async (userId: string): Promise<string[]> => {
    try {
        const bookingsCollection = db.collection('bookings');
        const q = bookingsCollection.where("userId", "==", userId);
        const querySnapshot = await q.get();
        
        const stationIds: string[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Assuming future bookings are what we care about showing
            if (data.bookingTime.toDate() > new Date()) {
                stationIds.push(data.stationId);
            }
        });
        return stationIds;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch user bookings.");
    }
}
