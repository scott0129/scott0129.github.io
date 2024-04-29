import { useEffect, useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'
import app from '../FirebaseApp';
import CounterComponent from '../CounterComponent'; // Import the counter component
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginComponent from '../login/LoginComponent';
import { useNavigate } from 'react-router-dom';
import LogoutComponent from '../login/LogoutComponent';

const auth = getAuth(app);

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);


  return (
    <>
      <div>
        <img src="https://www.svgrepo.com/show/396385/face-exhaling.svg" className="logo" alt="Vite logo" />
      </div>

      <h1>Whose Cough?</h1>


      { user ? 
      <>
        <h3>Welcome Back {user.displayName}!</h3>
        <button onClick={() => { navigate('/profile') }}>Go to upload page</button>
        <LogoutComponent/>
        <CounterComponent/>
        <p className="read-the-docs">
          ^ That's kind of a fun counter, everyone on this website sees the same count.
        </p>
      </>
      :
      <>
        <h4>To log in, give me your first name and the group chat this was posted in.</h4>
        <p>(Leave blank if this was a DM)</p>
        <LoginComponent onLoginSuccess={() => { navigate('profile') }}/>
        <p className="read-the-docs">
          Look ma, a website
        </p>
      </>
      }

    </>
  )
}

function LoggedInUI() {
  return (
    <>
    </>
  );
}

export default Home
