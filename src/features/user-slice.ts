import { createAsyncThunk, createSlice, isRejected } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  createUserProfileDocument,
  getCurrentUser,
  UserProfile,
} from "../firebase/firebase.utils";

interface EmailAndPassword {
  email: string;
  password: string;
}

interface SignUpDetails extends EmailAndPassword {
  displayName: string;
}

interface UserState {
  currentUser: UserProfile | null;
  error: string | null;
  // False until the first session check finishes, so pages that need a user
  // can wait instead of treating "not known yet" as "signed out".
  sessionChecked: boolean;
}

const initialState: UserState = {
  currentUser: null,
  error: null,
  sessionChecked: false,
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// Restores the signed-in user on page load; resolves to null when signed out.
export const checkUserSession = createAsyncThunk(
  "user/checkUserSession",
  async (_, { rejectWithValue }) => {
    try {
      const userAuth = await getCurrentUser();
      return userAuth ? await createUserProfileDocument(userAuth) : null;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const signInWithGoogle = createAsyncThunk(
  "user/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      return await createUserProfileDocument(user);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const signInWithEmail = createAsyncThunk(
  "user/signInWithEmail",
  async ({ email, password }: EmailAndPassword, { rejectWithValue }) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return await createUserProfileDocument(user);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const signUp = createAsyncThunk(
  "user/signUp",
  async (
    { email, password, displayName }: SignUpDetails,
    { rejectWithValue },
  ) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return await createUserProfileDocument(user, { displayName });
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const signOut = createAsyncThunk(
  "user/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkUserSession.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.error = null;
        state.sessionChecked = true;
      })
      .addCase(checkUserSession.rejected, (state) => {
        state.sessionChecked = true;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.currentUser = null;
        state.error = null;
      })
      .addMatcher(
        isRejected(
          checkUserSession,
          signInWithGoogle,
          signInWithEmail,
          signUp,
          signOut,
        ),
        (state, action) => {
          state.error = (action.payload as string) ?? action.error.message;
        },
      );
  },
});

export const selectIsSessionChecked = (state: { user: UserState }) =>
  state.user.sessionChecked;

export const selectCurrentUser = (state: { user: UserState }) =>
  state.user.currentUser;

export default userSlice.reducer;
