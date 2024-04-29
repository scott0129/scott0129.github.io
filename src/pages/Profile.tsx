import { useEffect, useState } from 'react'
import app from '../FirebaseApp';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { ListResult, deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import { AudioRecorder } from 'react-audio-voice-recorder';
import LogoutComponent from '../login/LogoutComponent';
import trashCan from '/trash-can.svg'
import './profile.css'


const auth = getAuth(app);
const storage = getStorage(app);

class CoughFile {
  url: string;
  refPath: string;

  constructor(url: string, refPath: string) {
    this.url = url;
    this.refPath = refPath;
  }
}


function Profile() {
  const [uid, setUid] = useState<string | null>(null);
  const [coughUploads, setCoughUploads] = useState<CoughFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [goodCoughURL, setGoodCoughURL] = useState<string | null>(null)
  const [badCoughURL, setBadCoughURL] = useState<string | null>(null)
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

  // Fetch example coughs from Firebase Storage
  useEffect(() => {
    const fetchExampleCoughs = async () => {
      try {
        const goodCoughURL = await getDownloadURL(ref(storage, `/example-coughs/good-cough-1.webm`));
        const badCoughURL = await getDownloadURL(ref(storage, `/example-coughs/bad-cough-1.webm`));
        setGoodCoughURL(goodCoughURL);
        setBadCoughURL(badCoughURL)
      } catch (error) {
        console.error("Error fetching example cough files: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchExampleCoughs();
    }
  }, [uid]);

  // Fetch audio files from Firebase Storage
  useEffect(() => {
    const fetchFiles = async () => {
      const storageRef = ref(storage, `/user/${uid}/coughs`);
      try {
        const result: ListResult = await listAll(storageRef);
        const coughFiles = await Promise.all(result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return new CoughFile(url, itemRef.fullPath);
        }));
        setCoughUploads(coughFiles);
      } catch (error) {
        console.error("Error fetching files: ", error);
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

  const deleteCough = async (path: string) => {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    setRefreshCoughFiles(!refreshCoughFiles);
  }

  const uploadCough = () => {
    if (!audioBlob) {
      console.error("No audio blob available to upload.");
      return;
    }

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
      <h1>Cough Time</h1>

      { !(goodCoughURL && badCoughURL) ? <p>Loading examples...</p> :
      <span style={{ display: 'flex', flexDirection: 'row', overflow: 'scroll', boxShadow: '3px 3px 3px black', border: '1px solid silver'}}>
        <div className='example-card'>
          <h4>Good cough example:</h4>
          <p>Not a lot of vocalization, not a lot of silence.</p>
          <audio src={goodCoughURL!} controls>
            <button>Play</button>
          </audio>
        </div>
        <div className='example-card'>
          <h4>Bad cough example:</h4>
          <p>Too much vocalization, sorta immediately obvious who it is.</p>
          <audio src={badCoughURL!} controls={true}></audio>
        </div>
      </span>
      }

      <h3>Record and upload your cough: </h3>
      { !audioBlobUrl ?  
      <>
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
      </>
      : 
      <>
        <audio src={audioBlobUrl} controls={true} />
        <span>
          <button style={{ margin: '0.5em' }} onClick={() => { uploadCough() }}>Upload</button>
          <button style={{ margin: '0.5em' }} onClick={() => { setAudioBlob(null); setAudioBlobUrl(null); }}>Record Again</button>
        </span>
      </>
      }

      <hr/>
      <h4>Your Uploaded Coughs:</h4>
      { loading && <p>Loading files...</p> }
      { coughUploads.length === 0 ? 
        <p>None so far!</p> :
        <>
          {coughUploads.map((coughFile) => (
            <div style={{display: 'flex'}} key={coughFile.url}>
              <audio src={coughFile.url} controls={true}/>
              <button className='trash-can' onClick={() => {deleteCough(coughFile.refPath)}}><img src={trashCan}/></button>
            </div>
          ))}
        </>
      }
      <LogoutComponent/>
      <p className="read-the-docs">
        If you're on your phone this is probably a little ugly sorry.
      </p>
    </>
  )
}


export default Profile
