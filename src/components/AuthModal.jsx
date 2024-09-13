import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Auth from './Auth';

const AuthModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Sign In or Sign Up</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center">
          <Auth />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;