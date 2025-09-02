import { Outlet } from "react-router-dom";

const SimpleLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Mada Brew Boss - Simple Layout</h1>
      </div>
      <Outlet />
    </div>
  );
};

export default SimpleLayout;
