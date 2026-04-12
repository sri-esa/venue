import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../../config/firebase";

export const requestFCMToken = async (venueId: string, staffId: string) => {
  try {
    const messaging = getMessaging(app);
    // [VENUE-CONFIG] VAPID Key would be injected via env variables
    const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_KEY ?? '' });

    if (currentToken) {
      console.log('FCM Registration Token received:', currentToken);
      // Pushing to backend to trigger topic subscribes under the hood
      fetch('/api/staff/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, venueId, staffId })
      }).catch(err => console.warn('Mocked fetch failed (Expected in dev)', err));
    } else {
      console.log('No registration token available.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
};

export const listenForegroundFCM = () => {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground. ', payload);
      // Example hook into react-hot-toast could go here
    });
  } catch (e) {
    // Suppress expected initialization failures when running without localhost SSL or config
  }
}
