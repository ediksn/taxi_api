import * as admin from 'firebase-admin';
var serviceAccount = require('../firebase.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://apolo-taxi-547f9.firebaseio.com'
});
export const db = admin.database();
export const mongoUrl = 'mongodb://127.0.0.1:27017/taxi'
export const SECRET_TOKEN = 'taxi324n95lu11ma19ve20is'