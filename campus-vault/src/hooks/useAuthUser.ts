import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured } from "@/firebase/client";
import { firebaseAuthService } from "@/services/firebaseAuthService";

type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "signedOut"; user: null; error: null }
  | { status: "signedIn"; user: User; error: null }
  | { status: "error"; user: null; error: string };

export function useAuthUser() {
  const [authState, setAuthState] = useState<AuthState>(() =>
    isFirebaseConfigured()
      ? { status: "loading", user: null, error: null }
      : { status: "signedOut", user: null, error: null },
  );

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    return firebaseAuthService.observe(
      (user) => {
        setAuthState(
          user
            ? { status: "signedIn", user, error: null }
            : { status: "signedOut", user: null, error: null },
        );
      },
      (error) =>
        setAuthState({ status: "error", user: null, error: error.message }),
    );
  }, []);

  return authState;
}
