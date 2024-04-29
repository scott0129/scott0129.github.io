import { getAuth } from "firebase/auth";
import app from "../FirebaseApp";
import { useNavigate } from "react-router-dom";

function LogoutComponent() {
  const navigate = useNavigate();

  return (
    <>
      <button style={{margin: '1em'}} onClick={() => {
        getAuth(app).signOut().then(() => {
          console.log("User signed out successfully");
          navigate('/');
        }).catch((error) => {
          console.error("Error signing out: ", error);
        });
      }}>Sign Out</button>
    </>
  );
}

export default LogoutComponent