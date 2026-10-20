import { ChangeEvent, FormEvent, ReactElement, useState } from "react";
import { useAppDispatch } from "../../redux/hooks";
import FormInput from "../form-input/form-input.component";
import Button, { BUTTON_TYPE_CLASSES } from "../button/button.component";

import {
  SignInContainer,
  SignInTitle,
  ButtonsBarContainer,
} from "./sign-in.styles";
import {
  signInWithGoogle,
  signInWithEmail,
} from "../../features/user-slice";

export default function SignIn(): ReactElement {
  const dispatch = useAppDispatch();
  const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: "",
  });

  const { email, password } = userCredentials;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(signInWithEmail({ email, password }));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = event.target;
    setUserCredentials({ ...userCredentials, [name]: value });
  };

  return (
    <SignInContainer>
      <SignInTitle>I already have an account</SignInTitle>
      <span>Sign in with your email and password</span>

      <form onSubmit={handleSubmit}>
        <FormInput
          name="email"
          type="email"
          handleChange={handleChange}
          value={email}
          label="email"
          required
        />
        <FormInput
          name="password"
          type="password"
          value={password}
          handleChange={handleChange}
          label="password"
          required
        />
        <ButtonsBarContainer>
          <Button buttonType="base" type="submit">
            {" "}
            Sign in{" "}
          </Button>
          <Button
            buttonType={BUTTON_TYPE_CLASSES.google}
            type="button"
            onClick={() => dispatch(signInWithGoogle())}
          >
            Sign in with Google
          </Button>
        </ButtonsBarContainer>
      </form>
    </SignInContainer>
  );
}
