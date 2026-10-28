// What the register form actually collects, and all of what it sends. The email
// is the login the customer will sign in with.
export interface RegistrationDraft {
  name: string;
  email: string;
  password: string;
}
