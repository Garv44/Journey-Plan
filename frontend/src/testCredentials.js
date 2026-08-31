// Single source of truth for the prototype's test credentials.
// The values live in ../test-credentials.txt (human-editable); Vite's `?raw`
// import hands us that file's text, which we parse into an object used to
// prefill the login and signup forms so testing needs no manual entry.
import raw from "../test-credentials.txt?raw";

function parse(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

const c = parse(raw);

export const TEST = {
  loginMobile: c.LOGIN_MOBILE || "",
  loginOtp: c.LOGIN_OTP || "",
  signupName: c.SIGNUP_NAME || "",
  signupMobile: c.SIGNUP_MOBILE || "",
  signupEmail: c.SIGNUP_EMAIL || "",
  signupOtp: c.SIGNUP_OTP || "",
};
