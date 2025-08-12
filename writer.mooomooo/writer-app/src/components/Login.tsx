import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

interface LoginProps {
  onSuccess: (credential: string) => void;
}

export function Login({ onSuccess }: LoginProps) {
  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      onSuccess(credentialResponse.credential);
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-bg-secondary rounded-xl">
              <PenLine className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Writer</h1>
          <p className="text-secondary">Sign in to start writing</p>
        </div>

        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-secondary mb-4">
                Continue with your Google account to access all features
              </p>
            </div>

            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                  size="large"
                  width="280"
                />
              </div>
            </GoogleOAuthProvider>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}