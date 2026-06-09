import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";/*
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
*/

function Login() {
  return <h1>Login Page</h1>;
}

function Dashboard() {
  return <h1>Dashboard</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;