import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios.get("http://localhost:5000/")
      .then(res => setMessage(res.data.message))
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      <h1>React + Node Setup</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;