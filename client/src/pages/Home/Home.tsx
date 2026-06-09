import { useEffect, useState } from "react";
import api from "../../api/axios";

type ApiResponse = {
  message: string;
};

function Home() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    api
      .get<ApiResponse>("http://localhost:5000/")
      .then((res) => setMessage(res.data.message))
      .catch((err) => {
        console.error(err);
        setMessage("Failed to connect to backend");
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Home Page</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default Home;