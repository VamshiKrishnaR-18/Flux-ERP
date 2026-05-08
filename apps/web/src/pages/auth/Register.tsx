import { SignUp } from "@clerk/clerk-react";

export default function Register() {
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
