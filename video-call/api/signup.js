//api/signup.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import bcrypt from "bcrypt";
import { StreamChat } from "stream-chat";
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
/**
 * Handles user signup by creating a new user record in Firestore, hashing the user's password, and generating a Stream Chat token.
 *
 * @function handler
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 *
 * @returns {void} Returns a JSON response.
 * - **Success:**
 *   - Status 201 with a success message indicating user creation.
 * - **Errors:**
 *   - 400: When `email` or `password` is missing.
 *   - 500: When an internal server error occurs during user creation, password hashing, or token generation.
 *
 * @throws {Object}
 * - 500: If there is an issue during user record creation, password hashing, or token generation.
 */
const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

export default async function handler(req, res) {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = email.split("@")[0];
    const tokenResponse = await serverClient.createToken(userId);

    await addDoc(collection(db, "users"), {
      userId,
      password: hashedPassword,
      email,
      token: tokenResponse,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
