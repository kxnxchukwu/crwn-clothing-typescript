import { ReactElement } from "react";
import { Link, useSearchParams } from "react-router";
import SignIn from "../../components/SignIn/SignIn";
import SignUp from "../../components/SignUp/SignUp";

// One page for both: /signin shows sign-in, /signin?mode=signup shows sign-up.
export default function SignInAndSignUpPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get("mode") === "signup";

  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        {isSignUp ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignUp
          ? "Save your details and check out faster."
          : "Welcome back. Sign in to your account."}
      </p>

      <div className="mt-8">
        {isSignUp ? <SignUp key="signup" /> : <SignIn key="signin" />}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        {isSignUp ? "Already have an account?" : "New to CRWN?"}{" "}
        <Link
          to={isSignUp ? "/signin" : "/signin?mode=signup"}
          replace
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
