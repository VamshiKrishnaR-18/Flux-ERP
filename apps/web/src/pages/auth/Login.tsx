import { SignIn } from "@clerk/clerk-react";
import { useDemoMode } from "../../context/DemoModeContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SignIn 
        routing="path" 
        path="/login" 
        signUpUrl="/register"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
