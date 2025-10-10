"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { User } from "lucide-react";
import AuthModal from "./auth-modal";

export default function LoginButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Button
        variant={"outline"}
        size="icon"
        className="text-[#f7f7f7] hover:text-[#f7f7f7] bg-[#022044] hover:bg-[#01152d]"
        onClick={() => setShowAuthModal(true)}
      >
        <User className="h-5 w-5" />
      </Button>
      <AuthModal open={showAuthModal} onOpenChangeAction={setShowAuthModal} />
    </>
  );
}
