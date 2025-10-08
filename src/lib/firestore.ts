
"use server";

import { initializeFirebase } from '@/firebase'; // Use client-side firebase
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import type { Station, Booking } from './types';

// This function needs to be called within a component or somewhere it can be initialized.
// For server actions, this is tricky. A better approach is to initialize it once.
// However, for this file, we'll initialize it on each call if needed.
function getDb() {
    const { firestore } = initializeFirebase();
    return firestore;
}

export const createBooking = async (
    userId: string, 
    station: Station, 
    bookingTime: Date
): Promise<string> => {
    try {
        const db = getDb();
        const bookingsCollection = collection(db, 'users', userId, 'bookings');
        const docRef = await addDoc(bookingsCollection, {
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

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    try {
        const db = getDb();
        const bookingsCollection = collection(db, 'users', userId, 'bookings');
        const q = query(
            bookingsCollection, 
            where("bookingTime", ">", Timestamp.now()), // Only get future bookings
            orderBy("bookingTime", "asc") // Order by the soonest
        );
        const querySnapshot = await getDocs(q);
        
        const bookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            bookings.push({
                id: doc.id,
                userId: userId, // The collection is nested, so userId is known
                stationId: data.stationId,
                stationName: data.stationName,
                bookingTime: data.bookingTime.toDate(),
                createdAt: data.createdAt.toDate(),
            });
        });
        return bookings;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not fetch user bookings.");
    }
}

export const cancelBooking = async (userId: string, bookingId: string): Promise<void> => {
    try {
        const db = getDb();
        const bookingDocRef = doc(db, 'users', userId, 'bookings', bookingId);
        await deleteDoc(bookingDocRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error("Could not cancel booking.");
    }
}
