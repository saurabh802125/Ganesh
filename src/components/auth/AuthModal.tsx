
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { AuthService } from '@/services/AuthService';

interface AuthModalProps {
  onLoginSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'login' | 'register'>('login');

  const handleSuccess = () => {
    setIsOpen(false);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          {AuthService.isAuthenticated() ? 'Account' : 'Sign In'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {view === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess} 
            onRegisterClick={() => setView('register')} 
          />
        ) : (
          <RegisterForm 
            onSuccess={handleSuccess} 
            onLoginClick={() => setView('login')} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
