import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {logger} from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import {DocumentData} from 'firebase-admin/firestore';

admin.initializeApp();

exports.helloworld = onCall((request) => {
  const text = request.data.text;
  logger.info('Logs!');
  return `Hello ${text}!`;
});

exports.authenticateuser = onCall(async ({data}) => {
  /**
   * Gets the "groupChatName" and "firstName" of the user to see if it matches any existing entry.
   * If so, return an authenticated token.
   */
  let groupChatName: string = data.groupChatName;
  let firstName: string = data.firstName;

  // Reduce to lowercase letters and strip out anything that is not a lowercase letter.
  groupChatName = groupChatName.toLowerCase().replace(/[^a-z]/g, '');
  firstName = firstName.toLowerCase().replace(/[^a-z]/g, '');

  // Get firestore 'Users' collection and all group chats that have the name
  const usersRef = admin.firestore().collection('Users');
  const snapshot = await usersRef.where('groupChats', 'array-contains', groupChatName).get();

  let foundUser: DocumentData | null = null;

  snapshot.forEach((doc) => {
    const user = doc;
    const userData = user.data();
    if (userData.nicknames.includes(firstName)) {
      foundUser = user;
    }
  });

  if (foundUser != null) {
    // Cast to bypass typescript type checking and get the document id.
    foundUser = foundUser as DocumentData;
    const userId = foundUser.id;
    logger.debug(foundUser);
    logger.debug(userId);

    // Generate a custom token for the user
    const customToken = await admin.auth().createCustomToken(userId);
    return {token: customToken};
  } else {
    throw new HttpsError('failed-precondition', 'Are you sure you typed in your name and group chat correctly?');
  }
});
