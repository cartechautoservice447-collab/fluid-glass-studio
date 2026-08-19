import { useEffect } from "react";
import { registerPwa } from "@/pwa/register";

export function PwaBootstrap() {
  useEffect(() => {
    registerPwa();
  }, []);
  return null;
}
