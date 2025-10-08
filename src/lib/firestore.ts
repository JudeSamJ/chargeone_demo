"use server";

import { db } from "./firebase"; // Use client-side firebase
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import type { Station, Booking } from "./types";

export const createBooking = async (
  userId: string,
  station: Station,
  bookingTime: Date
): Promise<string> => {
  try {
    const bookingsCollection = collection(db, "bookings");
    const docRef = await addDoc(bookingsCollection, {
      userId: userId,
      stationId: station.id,
      stationName: station.name,
      bookingTime: Timestamp.fromDate(bookingTime),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Could not create booking.");
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const bookingsCollection = collection(db, "bookings");
    const q = query(
      bookingsCollection,
      where("userId", "==", userId),
      where("bookingTime", ">", Timestamp.now()), // Only get future bookings
      orderBy("bookingTime", "asc") // Order by the soonest
    );
    const querySnapshot = await getDocs(q);

    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        userId: data.userId,
        stationId: data.stationId,
        stationName: data.stationName,
        bookingTime: data.bookingTime.toDate(), // Correctly convert Timestamp to Date
        createdAt: data.createdAt.toDate(),
      });
    });
    return bookings;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw new Error("Could not fetch user bookings.");
  }
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    const bookingDocRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingDocRef);
  } catch (e) {
    console.error("Error deleting document: ", e);
    throw new Error("Could not cancel booking.");
  }
};
