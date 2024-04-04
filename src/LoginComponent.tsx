import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebaseConfig'
import { useState } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const functions = getFunctions(app);
const auth = getAuth(app);

const LoginComponent = () => {
  const [groupChatName, setGroupChatName] = useState('');
  const [firstName, setFirstName] = useState('');

  const authenticate = async () => {

    const authenticateUser = httpsCallable(functions, 'authenticateuser')

    try {
      const result: any = await authenticateUser({groupChatName, firstName});
      const token = result.data.token;
      await signInWithCustomToken(auth, token);
    } catch (e) {
      console.error(e)
    }

  }


  return (
    <div>
      <label>Group Chat Name</label>
      <input type="text" id="groupChatName" 
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
      />
      <br/>
      <label>First Name</label>
      <input type="text" id="firstName" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
      />
      <button onClick={(authenticate)}><h4>Press Me</h4></button>
    </div>
  );
};

export default LoginComponent;
