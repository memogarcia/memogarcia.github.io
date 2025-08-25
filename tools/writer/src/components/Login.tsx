import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
  onSuccess: (userInfo: { email: string; name: string; picture: string }) => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onSuccess({
        email,
        name,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`
      });
    }
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
          <form onSubmit={handleSimpleLogin} className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-secondary mb-4">
                Enter your details to start writing
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start Writing
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Your data is stored locally in your browser
          </p>
        </div>
      </motion.div>
    </div>
  );
}