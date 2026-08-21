import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOflXPShPL9ZMoJDYmYEWRohwKbwjcFRo",
  authDomain: "varahi-eat.firebaseapp.com",
  projectId: "varahi-eat",
  storageBucket: "varahi-eat.firebasestorage.app",
  messagingSenderId: "1021696467859",
  appId: "1:1021696467859:web:ea5657ca9768788d823e66"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);