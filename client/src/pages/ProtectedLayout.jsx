import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const ProtectedLayout = () => {
  return (
    <>
      <Navbar />
      <main className="p-6">
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedLayout;