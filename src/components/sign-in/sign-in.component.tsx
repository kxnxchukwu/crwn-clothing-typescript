import { FormEvent, ReactElement, useState } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { signInWithEmail, signInWithGoogle } from "../../features/user-slice";
import { authErrorMessage } from "../../utils/auth-errors";
import FormField from "../form-field/form-field.component";
import {
  FormError,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from "../auth/auth-ui";

export default function SignIn(): ReactElement {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On success the /signin route redirects home, so only failures need handling.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending("email");
    const result = await dispatch(signInWithEmail({ email, password }));
    setPending(null);
    if (signInWithEmail.rejected.match(result)) {
      setError(authErrorMessage(result.payload));
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setPending("google");
    const result = await dispatch(signInWithGoogle());
    setPending(null);
    if (signInWithGoogle.rejected.match(result)) {
      setError(authErrorMessage(result.payload));
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
