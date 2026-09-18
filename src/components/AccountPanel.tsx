import {
  Cloud,
  DownloadSimple,
  GoogleLogo,
  SignOut,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CloudAccount } from "../hooks/useCloudAccount";
import type { AppData } from "../types";
import { downloadFile } from "../lib/storage";

function description(data: AppData): string {
  const name = data.profile.isDemo
    ? "Sample profile"
    : data.profile.name || "New profile";
  return `${name} · ${data.saved.length} saved universities · ${data.essays.length} essay drafts`;
}

export default function AccountPanel({ account }: { account: CloudAccount }) {
  const choosing = account.status === "choice" || account.status === "conflict";
  const busy = account.status === "loading" || account.status === "saving";
  return (
    <section className="account-panel stack" aria-labelledby="account-heading">
      <div>
        <h2 id="account-heading">Your Rasta account</h2>
        <p className="muted">
          Keep your profile, wishlist, applications, and essays together.
        </p>
      </div>
      {!account.configured ? (
        <div className="inline-note">
          <Cloud size={24} aria-hidden="true" />
          <div>
            <strong>For now, your progress stays on this device.</strong>
            <p>
              Google sign-in is not connected yet. You can use Rasta for free
              and download backups of your work.
            </p>
          </div>
        </div>
      ) : !account.user ? (
        <>
          <p>
            Sign in with Google to save your progress to your account. You will
            choose which profile to use before anything is uploaded.
          </p>
          {account.googleReady === false && (
            <div className="inline-note">
              <Cloud size={24} aria-hidden="true" />
              <div>
                <strong>Google sign-in is being set up.</strong>
                <p>
                  The account service is connected but Google login is not switched on yet. Your work stays on this device and in your backups until it is.
                </p>
              </div>
            </div>
          )}
          <button
            className="button google-sign-in"
            type="button"
            onClick={() => void account.signIn()}
            disabled={busy || account.googleReady === false}
          >
            <GoogleLogo size={20} aria-hidden="true" /> Continue with Google
          </button>
          <p className="muted">
            You can also close this window and keep working on this device.
          </p>
        </>
      ) : (
        <>
          <div className="account-identity">
            <strong>{account.user.email || "Google account"}</strong>
            <span className="badge">
              {account.status === "synced"
                ? "Saved to your account"
                : account.status === "saving"
                  ? "Saving…"
                  : "Sync paused"}
            </span>
          </div>
          {account.status === "loading" && (
            <p role="status">Checking your saved profile…</p>
          )}
          {choosing && (
            <div className="account-choice stack">
              <div>
                <h3>
                  {account.status === "conflict"
                    ? "Your account was updated somewhere else"
                    : account.pendingRemote
                      ? "Your account already has saved progress"
                      : "Save your progress to this account?"}
                </h3>
                <p>
                  {account.status === "conflict"
                    ? "Another tab or device saved newer changes. Load them, or keep what is open here."
                    : account.pendingRemote
                      ? "What is open on this device is different. Choose which one to keep; the other is replaced. Download a backup first if you want both."
                      : "Whatever is open right now becomes your account’s progress and follows you to any device."}
                </p>
              </div>
              {account.pendingRemote && (
                <div className="account-version">
                  <div>
                    <strong>{account.status === "conflict" ? "Newer version in your account" : "Saved in your account"}</strong>
                    <p>{description(account.pendingRemote.payload)}</p>
                    <small>
                      Saved{" "}
                      {new Date(
                        account.pendingRemote.updatedAt,
                      ).toLocaleString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="button"
                    onClick={account.useRemote}
                  >
                    {account.status === "conflict" ? "Load the newer version" : "Use my account’s progress"}
                  </button>
                </div>
              )}
              <div className="account-version">
                <div>
                  <strong>Open on this device</strong>
                  <p>{description(account.pendingLocal)}</p>
                </div>
                <button
                  type="button"
                  className={`button ${account.pendingRemote ? "secondary" : ""}`}
                  onClick={account.useLocal}
                >
                  {account.status === "conflict"
                    ? "Keep what is open here"
                    : account.pendingRemote
                      ? "Replace with this device’s progress"
                      : "Save to my account"}
                </button>
              </div>
              {account.pendingRemote && (
                <p className="muted">
                  Whichever you choose becomes the single copy saved to your Google account.
                </p>
              )}
            </div>
          )}
          {account.status === "synced" && (
            <p>
              Everything you change saves to your Google account automatically,
              so you see the same progress wherever you sign in. On a shared
              device, sign out when you finish.
            </p>
          )}
          <div className="button-row">
            <button
              className="button secondary"
              type="button"
              onClick={() => void account.signOut()}
              disabled={account.status === "saving"}
            >
              <SignOut size={18} aria-hidden="true" /> Sign out
            </button>
            {account.status === "error" && (
              <button className="button" type="button" onClick={account.retry}>
                Try again
              </button>
            )}
          </div>
        </>
      )}
      {account.message && (
        <div className="inline-note" role="alert">
          <WarningCircle size={22} aria-hidden="true" />
          <p>{account.message}</p>
        </div>
      )}
      <button
        className="button secondary"
        type="button"
        onClick={() =>
          downloadFile(
            "rasta-device-backup.json",
            JSON.stringify(account.pendingLocal, null, 2),
          )
        }
      >
        <DownloadSimple size={18} aria-hidden="true" /> Download a backup file
      </button>
      <p className="muted">
        Read our <a href="#privacy">Privacy policy</a> and{" "}
        <a href="#terms">Terms</a> before creating an account.
      </p>
    </section>
  );
}
