import { Suspense } from "react";
import LoginButton from "./login-button";
import { Button } from "./ui/button";
import { User } from "lucide-react";

// Fallback component while loading
function LoginButtonFallback() {
  return (
    <Button
      variant={"outline"}
      size="icon"
      className="text-[#f7f7f7] hover:text-[#f7f7f7] bg-[#022044] hover:bg-[#01152d]"
      disabled
    >
      <User className="h-5 w-5" />
    </Button>
  );
}

export default function LoginButtonWrapper() {
  return (
    <Suspense fallback={<LoginButtonFallback />}>
      <LoginButton />
    </Suspense>
  );
}
