import { SignUp } from "@clerk/clerk-react";
import { useDemoMode } from "../../context/DemoModeContext";
import { Navigate } from "react-router-dom";

export default function Register() {
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SignUp 
        routing="path" 
        path="/register" 
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
