// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCfpBmn3cdKP9vaGrDzKCB7oRPMSMx02tA",
  authDomain: "ecooy-5b791.firebaseapp.com",
  databaseURL: "https://ecooy-5b791-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ecooy-5b791",
  storageBucket: "ecooy-5b791.firebasestorage.app",
  messagingSenderId: "824859587278",
  appId: "1:824859587278:web:9a6b5a4485af41e70dd69f",
  measurementId: "G-LDCXYXPEXF"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // CAUTION: If the payload contains a 'notification' property, 
  // the Firebase SDK handles displaying the notification automatically 
  // when the app is in the background. 
  // Manual call to showNotification() here causes DUPLICATION.
  
  // We only show a manual notification if it's a "data-only" message
  // OR if we want to override the default behavior and the payload doesn't have a notification object.
  if (!payload.notification && payload.data) {
    const notificationTitle = payload.data.title || 'Nova Notificação';
    const notificationOptions = {
      body: payload.data.body || '',
      icon: payload.data.icon || '/firebase-logo.png',
      data: payload.data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
  
  // If payload.notification exists, do nothing here to avoid duplicates.
});
