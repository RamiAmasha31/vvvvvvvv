import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export default async function handler(req, res) {
  const { callId, userId } = req.body;
  try {
    if (!callId || !userId) {
      return res
        .status(400)
        .json({ error: "Call ID and User ID are required" });
    }

    const meetingQuery = query(
      collection(db, "meetings"),
      where("callId", "==", callId)
    );
    const querySnapshot = await getDocs(meetingQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const meetingDoc = querySnapshot.docs[0];
    const meetingRef = meetingDoc.ref;
    const meetingData = meetingDoc.data();
    const participants = meetingData.participants || [];

    if (!participants.includes(userId)) {
      participants.push(userId);
      await updateDoc(meetingRef, { participants });
    }

    res.status(200).json({ success: "Participant added successfully" });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}