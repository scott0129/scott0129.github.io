import { useEffect, useState } from 'react'
import app from '../FirebaseApp';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, getStorage, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import { AudioRecorder } from 'react-audio-voice-recorder';
import LogoutComponent from '../login/LogoutComponent';

const auth = getAuth(app);

function Profile() {
  const [uid, setUid] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [refreshCoughFiles, setRefreshCoughFiles] = useState(false);

  // Update uid when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch audio files from Firebase Storage
  useEffect(() => {
    const fetchFiles = async () => {
      const storage = getStorage(app);
      const storageRef = ref(storage, `/user/${uid}/coughs`);
      try {
        const result = await listAll(storageRef);
        const fileUrls = await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
        setFiles(fileUrls);
      } catch (error) {
        console.error("Error fetching files: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchFiles();
    }
  }, [uid, refreshCoughFiles]);

  const addAudioElement = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAudioBlobUrl(url);
    setAudioBlob(blob);
  };

  const uploadCough = () => {
    if (!audioBlob) {
      console.error("No audio blob available to upload.");
      return;
    }

    const storage = getStorage(app);
    const storageRef = ref(storage, `/user/${uid}/coughs/cough-${Date.now()}.webm`);

    const uploadTask = uploadBytesResumable(storageRef, audioBlob);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      }, 
      (error) => {
        console.error("Upload failed: ", error);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
        });
        // Toggle refreshCoughFiles state just to trigger reloading
        setRefreshCoughFiles(!refreshCoughFiles)
        setAudioBlobUrl(null);
        setAudioBlob(null);
      }
    );
  }

  return (
    <>
      <h1>Vite + React</h1>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <AudioRecorder
          onRecordingComplete={addAudioElement}
          audioTrackConstraints={{
            noiseSuppression: true,
            echoCancellation: true,
          }}
          onNotAllowedOrFound={(err) => console.table(err)}
          downloadFileExtension="webm"
          mediaRecorderOptions={{
            audioBitsPerSecond: 128000,
          }}
          showVisualizer={true}
        />
      </div>
      { !audioBlobUrl ? null : 
      <>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <h4 style={{ margin: '2em' }}>Your Recording:</h4>
          <audio src={audioBlobUrl} controls={true} />
          <button style={{ margin: '2em' }} onClick={() => { uploadCough() }}>Upload Cough</button>
        </span>
      </>
      }

      <h4>Your Coughs:</h4>
      { loading && <p>Loading files...</p> }
      { files.length === 0 ? 
        <p>No coughs uploaded!</p>:
        <ul>
          {files.map((fileUrl, index) => (
            <div><audio src={fileUrl} controls={true}>{index}</audio></div>
          ))}
        </ul>
      }
      <LogoutComponent/>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}


export default Profile
