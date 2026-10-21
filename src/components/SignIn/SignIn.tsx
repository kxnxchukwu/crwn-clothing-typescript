import { FormEvent, ReactElement, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "../../redux/hooks";
import { signInWithEmail, signInWithGoogle } from "../../features/user-slice";
import { authErrorMessage } from "../../utils/auth-errors";
import FormField from "../FormField/FormField";
import {
  FormError,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from "../AuthUi/AuthUi";

const welcome = (name?: string | null) =>
  name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back";

export default function SignIn(): ReactElement {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On success the /signin route redirects home; the toast confirms it.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending("email");
    const result = await dispatch(signInWithEmail({ email, password }));
    setPending(null);
    if (signInWithEmail.rejected.match(result)) {
      setError(authErrorMessage(result.payload));
    } else {
      toast.success(welcome(result.payload?.displayName));
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setPending("google");
    const result = await dispatch(signInWithGoogle());
    setPending(null);
    if (signInWithGoogle.rejected.match(result)) {
      setError(authErrorMessage(result.payload));
    } else {
      toast.success(welcome(result.payload?.displayName));
    }
  };

  return (
    <div className="space-y-6">
      <GoogleButton pending={pending === "google"} onClick={handleGoogle}>
        Continue with Google
      </GoogleButton>
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <SubmitButton pending={pending === "email"}>Sign in</SubmitButton>
      </form>
    </div>
  );
}
