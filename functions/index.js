const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

// The client SDK can only ever delete the *currently signed-in* Firebase
// Auth account, never someone else's — so when an admin deletes an
// employee/user in OdmorPro, that person's login would otherwise be
// orphaned forever (and permanently block re-using their email/username,
// since Firebase Auth still considers it taken). This callable function
// does the actual deletion with Admin SDK privileges.
exports.deleteAuthUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Morate biti prijavljeni.');
  }
  const uid = request.data && request.data.uid;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Nedostaje uid.');
  }
  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return { success: true, note: 'already deleted' };
    }
    throw new HttpsError('internal', err.message);
  }
});
