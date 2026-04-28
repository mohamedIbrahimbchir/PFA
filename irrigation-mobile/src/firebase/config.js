import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyD2bjSnb33YCVPvCnjXGM1euKL6O-9ma7A',
  authDomain: 'projet-pfa-9cd13.firebaseapp.com',
  databaseURL: 'https://projet-pfa-9cd13-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'projet-pfa-9cd13',
  storageBucket: 'projet-pfa-9cd13.firebasestorage.app',
  messagingSenderId: '653226749936',
  appId: '1:653226749936:web:b564e59801cb2aa590f735',
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
