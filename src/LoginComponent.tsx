import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebaseConfig'
import { useState } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

const functions = getFunctions(app);
if (window.location.hostname === "localhost") {
  console.log("Connecting to localhost firebase emulator")
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
const auth = getAuth(app);

const LoginComponent = () => {
  const [groupChatName, setGroupChatName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [errorMessage, setErrorMessage] = useState('')

  const authenticate = async () => {

    const authenticateUser = httpsCallable(functions, 'authenticateuser')

    try {
      setErrorMessage('');
      const result: any = await authenticateUser({groupChatName, firstName});
      const token = result.data.token;
      await signInWithCustomToken(auth, token);
      console.log("Sign-in successful!");
    } catch (e) {
      if (e instanceof FirebaseError && e.code == 'functions/failed-precondition') {
        setErrorMessage('Couldn\'t log you in. Are you sure you typed in the group chat correctly?');
      } else {
        setErrorMessage('Unknown error. Contact Scotto');
        console.error(e);
      }
    }

    const user = auth.currentUser;
    console.log('User is logged in:', user);
  }

  return (
    <div>
      <label>First Name </label>
      <input type="text" id="firstName" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
      />
      <br/>
      <label>Group Chat Name </label>
      <input type="text" id="groupChatName" 
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
      />
      <br/>
      <button onClick={(authenticate)}>Press Me</button>
    {errorMessage && (
      <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginTop: '10px' }}>
        {errorMessage}
      </div>
    )}
    </div>
  );
};

export default LoginComponent;
