import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment,
  getFirestore,
} from "firebase/firestore";
import app from './FirebaseApp'

const db = getFirestore(app); // Initialize Firestore

const CounterComponent = () => {
  const [count, setCount] = useState<number>(0);
  const counterDocRef = doc(db, "counters", "counter1"); // Reference to a document in a "counters" collection

  // Fetch the current count value from Firestore
  const fetchCount = async () => {
    const docSnap = await getDoc(counterDocRef);
    if (docSnap.exists()) {
      setCount(docSnap.data().value); // Assume the count is stored in a field named 'value'
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    // Set up a real-time listener using onSnapshot
    const unsubscribe = onSnapshot(counterDocRef, (doc) => {
      if (doc.exists()) {
        setCount(doc.data().value); // Update count state if document changes
      } else {
        console.log("Document does not exist!");
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);


  // Increment count
  const incrementCount = async () => {
    await updateDoc(counterDocRef, {
      value: increment(1) // Use Firestore's increment to ensure atomic updates
    });
    fetchCount(); // Re-fetch count to reflect the updated value
  };

  // Decrement count
  const decrementCount = async () => {
    await updateDoc(counterDocRef, {
      value: increment(-1) // Decrement is just incrementing by a negative value
    });
    fetchCount(); // Re-fetch count to reflect the updated value
  };

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={incrementCount}>Increment</button>
      <button onClick={decrementCount}>Decrement</button>
    </div>
  );
};

export default CounterComponent;

