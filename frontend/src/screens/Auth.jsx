import { useState } from "react";
import { INK, ACCENT, MUTE, LINE, BG } from "../theme.js";
import { TEST } from "../testCredentials.js";

// B0 / B0b — onboarding. Welcome → (Log in | Sign up) → OTP → [Industry] → app.
// Login is mobile + OTP; signup adds name + work email, verified by one OTP.
// All fields are prefilled from ../test-credentials.txt for frictionless testing.

const INDUSTRIES = [
  ["FMCG · Food & staples", "Kirana, supermarkets, general trade"],
  ["FMCG · Home & personal care", "Detergents, soaps, cosmetics"],
  ["Beverages", "Soft drinks, water, juices, dairy"],
  ["Pharma & OTC", "Chemists, clinics, stockists"],
  ["Consumer durables & electronics", "Multi-brand outlets, dealers"],
  ["Apparel & footwear", "MBOs, standalone stores"],
  ["Building materials", "Paints, hardware, tiles, cement"],
  ["Agri inputs", "Seeds, fertiliser, crop protection"],
  ["Other", "Something else"],
];

export default function Auth({ onDone }) {
  const [screen, setScreen] = useState("welcome"); // welcome|login|signup|otp|industry
  const [otpLogin, setOtpLogin] = useState(false);
  const [industry, setIndustry] = useState(null);
  const [otpError, setOtpError] = useState(false);
  const [form, setForm] = useState({
    name: TEST.signupName,
    mobile: TEST.signupMobile,
    email: TEST.signupEmail,
    otp: "",
    other: "",
  });

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // --- validation ---
  const digits = (form.mobile || "").replace(/\D/g, "");
  const mobOk = digits.length === 10;
  const emailOk = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email || "");
  const otpOk = (form.otp || "").replace(/\D/g, "").length === 6;
  const nameOk = (form.name || "").trim().length > 2;
  const otherPicked = industry === "Other";
  const indOk = !!industry && (!otherPicked || (form.other || "").trim().length > 1);
  const expectedOtp = otpLogin ? TEST.loginOtp : TEST.signupOtp;

  // Identity carried into the app (Profile screen).
  const signedName = nameOk ? form.name.trim() : "";
  const signedIndustry = otherPicked ? (form.other || "Other").trim() : industry;

  const maskMobile = (d) =>
    d.length === 10 ? "+91 " + d.slice(0, 2) + "XX XX" + d.slice(6) : "+91 98XX XX1223";
  const maskEmail = (e) => {
    if (!emailOk) return "n****@company.com";
    const p = e.split("@");
    return p[0][0] + "****@" + p[1];
  };

  // --- transitions (prefill on entry) ---
  const goLogin = () => { setScreen("login"); setF("mobile", TEST.loginMobile); };
  const goSignup = () => {
    setScreen("signup");
    setForm((f) => ({ ...f, name: TEST.signupName, mobile: TEST.signupMobile, email: TEST.signupEmail }));
  };
  const sendCodeFromLogin = () => { setOtpLogin(true); setOtpError(false); setF("otp", TEST.loginOtp); setScreen("otp"); };
  const sendCodeFromSignup = () => { setOtpLogin(false); setOtpError(false); setF("otp", TEST.signupOtp); setScreen("otp"); };
  const verify = () => {
    if (form.otp !== expectedOtp) { setOtpError(true); return; }
    otpLogin ? onDone({ name: signedName, industry: null }) : setScreen("industry");
  };
  const finishSignup = () => onDone({ name: signedName, industry: signedIndustry });

  const shell = { position: "absolute", inset: 0, background: BG, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 5 };

  return (
    <div style={shell}>
      {screen === "welcome" && <Welcome onLogin={goLogin} onSignup={goSignup} />}
      {screen === "login" && (
        <Login
          mobile={form.mobile}
          onMobile={(v) => setF("mobile", v.replace(/[^\d ]/g, "").slice(0, 10))}
          mobOk={mobOk}
          onBack={() => setScreen("welcome")}
          onSend={sendCodeFromLogin}
          onSignup={goSignup}
        />
      )}
      {screen === "signup" && (
        <Signup
          form={form} setF={setF}
          nameOk={nameOk} mobOk={mobOk} emailOk={emailOk}
          onBack={() => setScreen("welcome")}
          onSend={sendCodeFromSignup}
        />
      )}
      {screen === "otp" && (
        <Otp
          value={form.otp}
          onChange={(v) => { setOtpError(false); setF("otp", v.replace(/\D/g, "").slice(0, 6)); }}
          otpOk={otpOk} error={otpError}
          otpLogin={otpLogin}
          maskedMobile={maskMobile(digits)} maskedEmail={maskEmail(form.email || "")}
          onBack={() => setScreen(otpLogin ? "login" : "signup")}
          onResend={() => setF("otp", "")}
          onVerify={verify}
        />
      )}
      {screen === "industry" && (
        <Industry
          industry={industry} onPick={setIndustry}
          otherPicked={otherPicked} other={form.other} onOther={(v) => setF("other", v)}
          indOk={indOk} onFinish={finishSignup}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── Welcome ─────────────────────────── */
function Welcome({ onLogin, onSignup }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 54, background: BG, flex: "none" }} />
      <div style={{ background: INK, color: BG, padding: "22px 20px 26px", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 14, background: ACCENT, display: "block" }} />
          <span style={{ font: "600 11px/1 'Archivo', monospace", letterSpacing: ".22em", textTransform: "uppercase" }}>
            Beatplan
          </span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px 20px 0", background: INK, color: BG }}>
        <div style={{ width: 44, height: 2, background: ACCENT, marginBottom: 20 }} />
        <h2 style={{ margin: 0, font: "600 34px/1.06 'Archivo', sans-serif", letterSpacing: "-.02em" }}>
          Your day,<br />planned to<br />the stop.
        </h2>
        <p style={{ margin: "16px 0 28px", font: "400 13.5px/1.55 'Archivo', sans-serif", color: "rgba(243,242,242,.72)", maxWidth: 290 }}>
          Beat plans, routes and visit logging for field sales. Works offline and syncs when you are back on network.
        </p>
      </div>
      <div style={{ borderTop: "2px solid " + ACCENT, background: INK, padding: "0 20px 28px", flex: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20 }}>
          <button onClick={onLogin} className="btn btn-primary" style={{ width: "100%", minHeight: 52, fontSize: 15, justifyContent: "flex-start", textAlign: "left" }}>
            Log in
          </button>
          <button onClick={onSignup} style={{ width: "100%", minHeight: 52, background: "transparent", border: "1px solid " + BG, color: BG, font: "600 15px/1 'Archivo', sans-serif", textAlign: "left", padding: "0 16px", cursor: "pointer" }}>
            Create an account
          </button>
        </div>
        <p style={{ margin: "16px 0 0", font: "400 10.5px/1.5 'Archivo', monospace", letterSpacing: ".04em", color: "rgba(243,242,242,.5)" }}>
          v1.0 · Pilot build · Dadar, Mumbai
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Login ─────────────────────────── */
function Login({ mobile, onMobile, mobOk, onBack, onSend, onSignup }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Head onBack={onBack} kicker="Back" title="Log in" note="Use the mobile number registered by your manager." />
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Mobile number">
          <MobileInput value={mobile} onChange={onMobile} />
        </Field>
        <PrefillHint />
      </div>
      <Footer>
        <button onClick={onSend} className="btn btn-primary" style={gate(mobOk)}>Send verification code</button>
        <span onClick={onSignup} style={{ font: "400 11.5px/1.4 'Archivo', sans-serif", color: "#6b6663", cursor: "pointer" }}>
          No account yet? <span style={{ color: ACCENT, fontWeight: 600 }}>Create one</span>
        </span>
      </Footer>
    </div>
  );
}

/* ─────────────────────────── Signup ─────────────────────────── */
function Signup({ form, setF, nameOk, mobOk, emailOk, onBack, onSend }) {
  const ok = nameOk && mobOk && emailOk;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Head onBack={onBack} kicker="Step 1 of 3" title="Create account" />
      <Progress pct="33%" />
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Full name">
          <input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="As per company records" className="input" style={{ width: "100%", minHeight: 48, font: "400 15px/1 'Archivo', sans-serif" }} />
        </Field>
        <Field label="Mobile number">
          <MobileInput value={form.mobile} onChange={(v) => setF("mobile", v.replace(/[^\d ]/g, "").slice(0, 10))} />
        </Field>
        <Field label="Work email">
          <input value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="name@company.com" className="input" style={{ width: "100%", minHeight: 48, font: "400 15px/1 'Archivo', sans-serif" }} />
        </Field>
        <p style={{ margin: 0, font: "400 11px/1.5 'Archivo', sans-serif", color: MUTE }}>
          A 6-digit code goes to both the mobile number and the email. Both must be verified before the account activates.
        </p>
        <PrefillHint />
      </div>
      <Footer>
        <button onClick={onSend} className="btn btn-primary" style={gate(ok)}>Send verification code</button>
      </Footer>
    </div>
  );
}

/* ─────────────────────────── OTP ─────────────────────────── */
function Otp({ value, onChange, otpOk, error, otpLogin, maskedMobile, maskedEmail, onBack, onResend, onVerify }) {
  const verified = otpOk && !error;
  const verColor = verified ? INK : MUTE;
  const verLabel = verified ? "Verified" : "Awaiting code";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Head onBack={onBack} kicker={otpLogin ? "Back to log in" : "Step 2 of 3"} title="Verify it's you"
        note={"Code sent to " + maskedMobile + (otpLogin ? "" : " and " + maskedEmail)} />
      <Progress pct={otpLogin ? "100%" : "66%"} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <Field label="6-digit code">
          <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={6} placeholder="––––––"
            style={{ width: "100%", boxSizing: "border-box", border: "2px solid " + (error ? ACCENT : INK), background: BG, outline: "none", minHeight: 64, padding: "0 16px", font: "600 30px/1 'Archivo', monospace", letterSpacing: ".34em", color: INK }} />
        </Field>
        {error && (
          <span style={{ font: "600 10px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT }}>
            Incorrect code · check test-credentials.txt
          </span>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ font: "400 11.5px/1 'Archivo', sans-serif", color: MUTE }}>Code expires in 04:32</span>
          <span onClick={onResend} style={{ font: "600 10px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, cursor: "pointer" }}>Resend code</span>
        </div>
        <div style={{ borderTop: "1px solid " + LINE }}>
          <VerRow label={"Mobile " + maskedMobile} color={verColor} value={verLabel} />
          {!otpLogin && <VerRow label={"Email " + maskedEmail} color={verColor} value={verLabel} />}
        </div>
      </div>
      <Footer>
        <button onClick={onVerify} className="btn btn-primary" style={gate(otpOk)}>Verify</button>
      </Footer>
    </div>
  );
}

/* ─────────────────────────── Industry ─────────────────────────── */
function Industry({ industry, onPick, otherPicked, other, onOther, indOk, onFinish }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "58px 20px 16px", borderBottom: "2px solid " + INK, flex: "none" }}>
        <span style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT }}>Step 3 of 3</span>
        <h2 style={{ margin: "10px 0 0", font: "600 26px/1.1 'Archivo', sans-serif", letterSpacing: "-.015em", color: INK }}>Which industry do you sell in?</h2>
        <p style={{ margin: "6px 0 0", font: "400 12.5px/1.45 'Archivo', sans-serif", color: "#6b6663" }}>Sets the outlet types, size tags and visit-frequency defaults for your beat.</p>
      </div>
      <Progress pct="100%" />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {INDUSTRIES.map(([name, note]) => {
          const active = industry === name;
          return (
            <div key={name} onClick={() => onPick(name)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid " + LINE, cursor: "pointer", background: active ? "#eceae7" : "transparent", minHeight: 44 }}>
              <span style={{ width: 16, height: 16, flex: "none", border: "2px solid " + INK, background: active ? ACCENT : "transparent", display: "block" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ font: "600 14px/1.2 'Archivo', sans-serif", color: INK }}>{name}</span>
                <span style={{ font: "400 11px/1.35 'Archivo', sans-serif", color: "#6b6663" }}>{note}</span>
              </div>
            </div>
          );
        })}
        {otherPicked && (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid " + LINE }}>
            <label style={labelStyle}>Tell us the category</label>
            <input value={other} onChange={(e) => onOther(e.target.value)} placeholder="e.g. Lubricants" className="input" style={{ width: "100%", minHeight: 48, font: "400 15px/1 'Archivo', sans-serif" }} />
          </div>
        )}
      </div>
      <Footer>
        <button onClick={onFinish} className="btn btn-primary" style={gate(indOk)}>Enter the app</button>
      </Footer>
    </div>
  );
}

/* ─────────────────────────── shared bits ─────────────────────────── */
const labelStyle = { font: "600 9px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#4a4644" };

function gate(ok) {
  return { width: "100%", minHeight: 52, fontSize: 15, justifyContent: "flex-start", textAlign: "left", opacity: ok ? 1 : 0.45, pointerEvents: ok ? "auto" : "none" };
}

function Head({ onBack, kicker, title, note }) {
  return (
    <div style={{ padding: "58px 20px 16px", borderBottom: "2px solid " + INK, flex: "none" }}>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", minHeight: 32 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path d="M15 5l-7 7 7 7" /></svg>
        <span style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT }}>{kicker}</span>
      </div>
      <h2 style={{ margin: "10px 0 0", font: "600 26px/1.1 'Archivo', sans-serif", letterSpacing: "-.015em", color: INK }}>{title}</h2>
      {note && <p style={{ margin: "6px 0 0", font: "400 12.5px/1.45 'Archivo', sans-serif", color: "#6b6663" }}>{note}</p>}
    </div>
  );
}

function Progress({ pct }) {
  return (
    <div style={{ height: 3, background: "#e0ddda", flex: "none" }}>
      <div style={{ height: 3, width: pct, background: ACCENT }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function MobileInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", border: "1px solid " + INK }}>
      <span style={{ padding: "0 12px", display: "flex", alignItems: "center", background: "#e8e6e4", borderRight: "1px solid " + INK, font: "600 14px/1 'Archivo', monospace", color: INK }}>+91</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="98XXXXXXXX" style={{ flex: 1, border: 0, outline: "none", background: BG, padding: "0 12px", minHeight: 48, font: "600 15px/1 'Archivo', monospace", color: INK }} />
    </div>
  );
}

function VerRow({ label, color, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid " + LINE }}>
      <span style={{ font: "400 13px/1 'Archivo', sans-serif", color: INK }}>{label}</span>
      <span style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color }}>{value}</span>
    </div>
  );
}

function Footer({ children }) {
  return (
    <div style={{ padding: "14px 20px 34px", borderTop: "2px solid " + INK, flex: "none", display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </div>
  );
}

function PrefillHint() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "1px dashed " + LINE, background: "#eceae7" }}>
      <span style={{ width: 7, height: 7, background: ACCENT, flex: "none" }} />
      <span style={{ font: "400 10px/1.4 'Archivo', monospace", letterSpacing: ".02em", color: "#6b6663" }}>
        Prefilled for testing · values from test-credentials.txt
      </span>
    </div>
  );
}
