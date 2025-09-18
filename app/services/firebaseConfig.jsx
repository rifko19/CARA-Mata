// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore, FieldValue } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDYEbiAccK4TjlgJ0Y5Za5oQ72QiM4bxKU",
    authDomain: "cara-mata.firebaseapp.com",
    projectId: "cara-mata",
    storageBucket: "cara-mata.firebasestorage.app",
    messagingSenderId: "544680919535",
    appId: "1:544680919535:web:f79e55ada1e1d388e2361a",
    measurementId: "G-QSPTZRLXYS"
    };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=initializeAuth(app,{
    persistence:getReactNativePersistence(ReactNativeAsyncStorage)
})

export const firestore = getFirestore(app);

const analytics = getAnalytics(app);