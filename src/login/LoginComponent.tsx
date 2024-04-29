import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import app from '../FirebaseApp'
import { FC, useState } from 'react';
import { getAuth, signInWithCustomToken, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import './style.css'

const functions = getFunctions(app);
if (window.location.hostname === "localhost") {
  console.log("Connecting to localhost firebase emulator")
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
const auth = getAuth(app);

interface LoginComponentProps {
  onLoginSuccess?: () => void; // Callback prop for successful login
}

const LoginComponent: FC<LoginComponentProps> = ({ onLoginSuccess }) => {
  const [groupChatName, setGroupChatName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [errorMessage, setErrorMessage] = useState('')

  // useEffect(() => {
  //   // Listen for changes to the user's authentication state
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //   });

  //   // Clean up the subscription on unmount
  //   return () => unsubscribe();
  // }, [])

  const capitalize = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }

  const authenticate = async () => {

    const authenticateUser = httpsCallable(functions, 'authenticateuser')

    try {
      setErrorMessage('');
      const result: any = await authenticateUser({groupChatName, firstName});
      const token = result.data.token;
      await signInWithCustomToken(auth, token).then(async (credentials) => {
        await updateProfile(credentials.user, {displayName: capitalize(firstName)});
      });
      console.log("Sign-in successful!");
      if (onLoginSuccess) {
        onLoginSuccess(); // Invoke the callback on successful login
      }
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
    <>
    <div className='card-body form-group'>
      <div className='label-input-container'>
        <label htmlFor='firstName'>First Name </label>
        <input type="text" id='firstName' 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className='label-input-container'>
        <label htmlFor='groupChatName'>Group Chat Name </label>
        <input type="text" id="groupChatName" 
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
        />
      </div>
      <button onClick={(authenticate)}>Log In</button>
      {errorMessage && (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginTop: '10px' }}>
          {errorMessage}
        </div>
      )}
    </div>
    </>
  );
};

export default LoginComponent;
