import { useEffect, useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'
import app from '../FirebaseApp';
import CounterComponent from '../CounterComponent'; // Import the counter component
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginComponent from '../login/LoginComponent';
import { useNavigate } from 'react-router-dom';

const auth = getAuth(app);

function Home() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for changes to the user's authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [])


  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      {user == null ? <LoginComponent onLoginSuccess={() => { navigate('/profile'); }}/> : <LoggedInUI/>}

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function LoggedInUI() {
  return (
    <>
      <h1>Welcome Back!</h1>
      <button onClick={() => {
        getAuth(app).signOut().then(() => {
          console.log("User signed out successfully");
        }).catch((error) => {
          console.error("Error signing out: ", error);
        });
      }}>Sign Out</button>
      <CounterComponent />
    </>
  );
}

export default Home
