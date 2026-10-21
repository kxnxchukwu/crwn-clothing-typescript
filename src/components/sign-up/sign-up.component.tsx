import { ChangeEvent, FormEvent, ReactElement, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "../../redux/hooks";
import { signInWithGoogle, signUp } from "../../features/user-slice";
import { authErrorMessage } from "../../utils/auth-errors";
import FormField from "../form-field/form-field.component";
import {
  FormError,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from "../auth/auth-ui";

// Firebase rejects passwords shorter than this.
const MIN_PASSWORD_LENGTH = 6;

export default function SignUp(): ReactElement {
  const dispatch = useAppDispatch();
  const [fields, setFields] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { displayName, email, password, confirmPassword } = fields;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const errors: typeof fieldErrors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setPending("email");
    const result = await dispatch(signUp({ displayName, email, password }));
    setPending(null);
    if (signUp.rejected.match(result)) {
      setError(authErrorMessage(result.payload));
    } else {
      toast.success("Account created", {
        description: `You're signed in as ${email}.`,
      });
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
      toast.success("You're signed in with Google");
    }
  };

  return (
    <div className="space-y-6">
      <GoogleButton pending={pending === "google"} onClick={handleGoogle}>
        Sign up with Google
      </GoogleButton>
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <FormField
          label="Name"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={handleChange}
          required
        />
        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={handleChange}
          required
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />
        <FormField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          required
        />
        <SubmitButton pending={pending === "email"}>
          Create account
        </SubmitButton>
      </form>
    </div>
  );
}
