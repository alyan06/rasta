import { useCallback, useEffect, useRef, useState } from "react";
import {
  House,
  UserCircle,
  Buildings,
  ChartLineUp,
  NotePencil,
  Checks,
  Compass,
  ArrowUpRight,
  CheckCircle,
  List,
  X,
  DownloadSimple,
  UploadSimple,
  ShieldCheck,
  ArrowRight,
  Desktop,
  Moon,
  Sun,
} from "@phosphor-icons/react";
import type { AppData, Page, WorkspaceProps } from "./types";
import {
  downloadFile,
  initialData,
  isAppData,
  loadData,
  STORAGE_KEY,
  migrateAppData,
} from "./lib/storage";
import Dashboard from "./components/Dashboard";
import UniversitiesPage from "./components/UniversitiesPage";
import PlannerPage from "./components/PlannerPage";
import ProfilePage from "./components/ProfilePage";
import EssaysPage from "./components/EssaysPage";
import ApplicationsPage from "./components/ApplicationsPage";
import GuidePage from "./components/GuidePage";
import Onboarding from "./components/Onboarding";
import UniversityPage from "./components/UniversityPage";
import ContactPage from "./components/ContactPage";
import LegalPage from "./components/LegalPage";
import AccountPanel from "./components/AccountPanel";
import { useTheme, type Theme } from "./hooks/useTheme";
import { useCloudAccount } from "./hooks/useCloudAccount";
import { universities } from "./lib/admissions";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: House },
  { id: "profile", label: "My profile", icon: UserCircle },
  { id: "universities", label: "Universities", icon: Buildings },
  { id: "planner", label: "Score planner", icon: ChartLineUp },
  { id: "essays", label: "Essay studio", icon: NotePencil },
  { id: "applications", label: "My applications", icon: Checks },
  { id: "guide", label: "How to apply", icon: Compass },
] as const;
function currentPage(): Page {
  const id = window.location.hash.slice(1);
  if (
    ["privacy", "terms", "contact"].includes(id) ||
    /^university\/[a-z0-9-]+$/.test(id)
  )
    return id as Page;
  return navigation.some((n) => n.id === id) ? (id as Page) : "dashboard";
}

interface RecoveryCopy {
  key: string;
  raw: string;
}
function workspaceKey(scope: string): string {
  return scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}.account.${scope}`;
}
function readRecoveryCopies(key: string): RecoveryCopy[] {
  try {
    const copies: RecoveryCopy[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const candidate = localStorage.key(index);
      if (!candidate?.startsWith(`${key}.recovery.`)) continue;
      const raw = localStorage.getItem(candidate);
      if (raw !== null) copies.push({ key: candidate, raw });
    }
    return copies.sort((a, b) => a.key.localeCompare(b.key));
  } catch {
    return [];
  }
}

export default function App() {
  const [initial] = useState(loadData);
  const [scope, setScope] = useState("guest");
  const scopeRef = useRef("guest");
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<AppData>(initial.data);
  const [page, setPage] = useState<Page>(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 800px)").matches,
  );
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(initial.error);
  const [persistenceBlocked, setPersistenceBlocked] = useState(
    Boolean(initial.error),
  );
  const [originalRaw, setOriginalRaw] = useState(initial.recoveryRaw);
  const originalRawRef = useRef(originalRaw);
  originalRawRef.current = originalRaw;
  const [recoveryCopies, setRecoveryCopies] = useState(() =>
    readRecoveryCopies(STORAGE_KEY),
  );
  const [hasEdited, setHasEdited] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState("");
  const importGeneration = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const accountDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const storageKey = workspaceKey(scope);
  const onAccountChange = useCallback((userId: string | null) => {
    if (scopeRef.current === (userId ?? "guest")) return;
    scopeRef.current = userId ?? "guest";
    importGeneration.current += 1;
    setPendingImport(null);
    setImportError("");
    dialog.current?.close();
    const key = workspaceKey(userId ?? "guest");
    let cached = loadData(key);
    if (userId) {
      try {
        if (localStorage.getItem(key) === null) {
          const guest = loadData();
          cached = {
            ...guest,
            data: {
              ...guest.data,
              onboardingCompleted: guest.data.profile.isDemo
                ? false
                : guest.data.onboardingCompleted,
            },
          };
        }
      } catch {
        /* loadData surfaces unavailable storage. */
      }
    }
    setScope(userId ?? "guest");
    setData(migrateAppData(cached.data));
    setHasEdited(false);
    setStorageError(cached.error);
    setPersistenceBlocked(Boolean(cached.error));
    setOriginalRaw(cached.recoveryRaw);
    setRecoveryCopies(readRecoveryCopies(key));
  }, []);
  const preserveOriginal = useCallback(() => {
    const raw = originalRawRef.current;
    if (raw === null) return true;
    const key = workspaceKey(scopeRef.current);
    try {
      const copies = readRecoveryCopies(key);
      if (!copies.some((copy) => copy.raw === raw)) {
        const recoveryKey = `${key}.recovery.${Date.now()}.${crypto.randomUUID()}`;
        localStorage.setItem(recoveryKey, raw);
        copies.push({ key: recoveryKey, raw });
      }
      setRecoveryCopies(copies);
      originalRawRef.current = null;
      setOriginalRaw(null);
      return true;
    } catch {
      setStorageError(
        "Your current work is in memory. The original browser data is protected because its recovery copy could not be saved. Download both copies in Your data.",
      );
      return false;
    }
  }, []);
  const replaceData = useCallback(
    (next: AppData) => {
      const preserved = preserveOriginal();
      setData(migrateAppData(next));
      setHasEdited(true);
      setPersistenceBlocked(!preserved);
    },
    [preserveOriginal],
  );
  const account = useCloudAccount({
    data,
    scope,
    onAccountChange,
    replaceData,
  });
  const pageLabel = page.startsWith("university/")
    ? (universities.find((u) => u.id === page.split("/")[1])?.shortName ??
      "University")
    : ((
        {
          privacy: "Privacy policy",
          terms: "Terms of use",
          contact: "Contact & feedback",
        } as Record<string, string>
      )[page] ??
      navigation.find((n) => n.id === page)?.label ??
      "Rasta");
  const showOnboarding =
    !["privacy", "terms", "contact"].includes(page) &&
    originalRaw === null &&
    !data.onboardingCompleted &&
    !data.profile.onboardingCompleted &&
    data.profile.isDemo;
  const previousAccountStatus = useRef(account.status);
  useEffect(() => {
    if (account.status === "choice" || account.status === "conflict")
      accountDialog.current?.showModal();
    else if (
      previousAccountStatus.current === "choice" ||
      previousAccountStatus.current === "conflict"
    )
      accountDialog.current?.close();
    previousAccountStatus.current = account.status;
  }, [account.status]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const resize = () => {
      setMobile(media.matches);
      if (!media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (!menuOpen || !mobile) return;
    const links = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ) ?? [],
      );
    links()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        requestAnimationFrame(() => menuButton.current?.focus());
      }
      if (event.key === "Tab") {
        const items = links();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, [menuOpen, mobile]);
  useEffect(() => {
    const change = () => {
      accountDialog.current?.close();
      setPage(currentPage());
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = `${pageLabel} · Rasta`;
    main.current?.focus({ preventScroll: true });
  }, [page, pageLabel]);
  useEffect(() => {
    if (!hasEdited || persistenceBlocked) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setStorageError("");
    } catch {
      setStorageError(
        "Your browser could not save this change. Export a backup to keep your work.",
      );
    }
  }, [data, hasEdited, persistenceBlocked, storageKey]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4200);
    return () => clearTimeout(timer);
  }, [message]);
  const update = (patch: Partial<AppData>) => {
    if (patch.version === 1) setPersistenceBlocked(!preserveOriginal());
    setHasEdited(true);
    setData((previous) =>
      patch.version === 1
        ? migrateAppData({ ...previous, ...patch })
        : { ...previous, ...patch },
    );
  };
  const navigate = (next: Page) => {
    window.location.hash = next;
    setMenuOpen(false);
  };
  const props: WorkspaceProps = {
    data,
    update,
    navigate,
    notify: (text) =>
      setMessage(
        storageError
          ? "Changes are in memory. Export a backup to keep your work."
          : text,
      ),
    storageAvailable: !storageError,
  };
  const PageComponent = (
    {
      dashboard: Dashboard,
      profile: ProfilePage,
      universities: UniversitiesPage,
      planner: PlannerPage,
      essays: EssaysPage,
      applications: ApplicationsPage,
      guide: GuidePage,
      contact: ContactPage,
    } as Partial<Record<Page, React.ComponentType<WorkspaceProps>>>
  )[page];
  const cloudWarning =
    account.status === "error" ? (
      <div className="storage-warning" role="alert">
        <span>
          {account.message ||
            "Cloud saving is paused. Your device copy is available."}
        </span>{" "}
        <button onClick={account.retry}>Try again</button>{" "}
        <button onClick={() => accountDialog.current?.showModal()}>
          Open account
        </button>
      </div>
    ) : null;
  return (
    <>
      {showOnboarding && cloudWarning}
      {showOnboarding && (
        <Onboarding
          key={scope}
          profile={data.profile}
          theme={theme}
          setTheme={setTheme}
          signedIn={!!account.user}
          onSignIn={() => accountDialog.current?.showModal()}
          onExplore={() => update({ onboardingCompleted: true })}
          onComplete={(profile) => {
            update({
              profile,
              onboardingCompleted: true,
              saved: profile.isDemo ? data.saved : [],
              applications: data.profile.isDemo ? [] : data.applications,
            });
            navigate("profile");
          }}
        />
      )}
      <div className="app-shell" hidden={showOnboarding}>
        <a
          className="skip-link"
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();
            main.current?.focus();
          }}
        >
          Skip to content
        </a>
        {menuOpen && (
          <button
            className="nav-scrim"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside
          id="workspace-navigation"
          ref={sidebar}
          inert={mobile && !menuOpen}
          role={mobile && menuOpen ? "dialog" : undefined}
          aria-hidden={mobile && !menuOpen ? true : undefined}
          aria-modal={mobile && menuOpen ? true : undefined}
          className={`sidebar ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {mobile && (
            <button
              className="icon-button mobile-nav-close"
              aria-label="Close menu"
              onClick={() => {
                setMenuOpen(false);
                requestAnimationFrame(() => menuButton.current?.focus());
              }}
            >
              <X size={20} />
            </button>
          )}
          <a
            className="wordmark"
            href="#dashboard"
            onClick={() => setMenuOpen(false)}
          >
            <img src="/favicon.svg" alt="" />
            <span>
              rasta<span className="brand-period">.</span>
            </span>
          </a>
          <div className="sidebar-caption">A way forward, together.</div>
          <div className="workspace-label">Your workspace</div>
          <nav>
            {navigation.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => {
                  setMenuOpen(false);
                  if (id === page) main.current?.focus();
                }}
                aria-current={
                  page === id ||
                  (id === "universities" && page.startsWith("university/"))
                    ? "page"
                    : undefined
                }
                className={`nav-item ${page === id || (id === "universities" && page.startsWith("university/")) ? "active" : ""}`}
              >
                <Icon size={20} weight={page === id ? "fill" : "regular"} />
                <span>{label}</span>
                {id === "universities" && (
                  <span className="nav-count">{universities.length}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="free-note">
              <span className="free-icon">
                <Compass size={23} />
              </span>
              <strong>Big dreams. Open doors.</strong>
              <p>
                Your journey on Rasta is free.
                <br />
                Every step of the way.
              </p>
              <a href="#guide">
                Find your starting point <ArrowUpRight size={15} />
              </a>
            </div>
            <button
              className="data-button"
              onClick={() => {
                setMenuOpen(false);
                dialog.current?.showModal();
              }}
            >
              <ShieldCheck size={18} /> Your data <ArrowUpRight size={15} />
            </button>
            <div className="made-in">
              Made for students in Pakistan{" "}
              <span lang="ur" dir="rtl">
                راستہ
              </span>
            </div>
          </div>
        </aside>
        <div className="workspace" inert={mobile && menuOpen}>
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                ref={menuButton}
                aria-controls="workspace-navigation"
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <List size={24} />
              </button>
              <span className="desktop-breadcrumb">
                My workspace <span>/</span>
              </span>
              <strong>{pageLabel}</strong>
            </div>
            <div className="topbar-right">
              <label className="theme-picker">
                {theme === "dark" ? (
                  <Moon size={17} />
                ) : theme === "light" ? (
                  <Sun size={17} />
                ) : (
                  <Desktop size={17} />
                )}
                <select
                  aria-label="Appearance"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <span className="device-status">
                <CheckCircle size={16} weight="fill" />
                {storageError
                  ? "Backup needed"
                  : account.status === "synced"
                    ? "Saved to your account"
                    : account.status === "saving"
                      ? "Syncing…"
                      : account.status === "error"
                        ? "Cloud saving paused"
                        : account.status === "choice" ||
                            account.status === "conflict"
                          ? "Choose a saved version"
                          : account.status === "loading"
                            ? "Checking your account…"
                            : "Saved on this device"}
              </span>
              <button
                className="button secondary account-trigger"
                onClick={() => accountDialog.current?.showModal()}
              >
                {account.user ? "My account" : "Sign in"}
              </button>
              <button
                className="avatar"
                aria-label="Open your profile"
                onClick={() => navigate("profile")}
              >
                {data.profile.isDemo
                  ? "A"
                  : data.profile.name.slice(0, 1).toUpperCase() || "Y"}
              </button>
            </div>
          </header>
          <main
            id="main-content"
            className="main-content"
            tabIndex={-1}
            ref={main}
          >
            {cloudWarning}
            {storageError && (
              <div className="storage-warning" role="alert">
                {storageError}{" "}
                <button onClick={() => dialog.current?.showModal()}>
                  Manage data
                </button>
              </div>
            )}
            {data.profile.isDemo && (
              <div className="demo-notice">
                <span>
                  <span className="demo-label">A little preview</span> You’re
                  exploring a sample student profile.
                </span>
                <button
                  onClick={() =>
                    update({
                      onboardingCompleted: false,
                      profile: { ...data.profile, onboardingCompleted: false },
                    })
                  }
                >
                  Make it yours <ArrowRight size={15} />
                </button>
              </div>
            )}
            {page.startsWith("university/") ? (
              <UniversityPage
                key={`${scope}:${page}`}
                {...props}
                universityId={page.split("/")[1]}
              />
            ) : page === "privacy" || page === "terms" ? (
              <LegalPage kind={page} navigate={navigate} />
            ) : PageComponent ? (
              <PageComponent key={`${scope}:${page}`} {...props} />
            ) : (
              <Dashboard {...props} />
            )}
            <footer className="workspace-footer">
              <span>© {new Date().getFullYear()} Rasta</span>
              <nav aria-label="Footer">
                <a href="#privacy">Privacy policy</a>
                <a href="#terms">Terms of use</a>
                <a href="#contact">Contact & feedback</a>
              </nav>
            </footer>
          </main>
        </div>
        <div
          className={`toast ${message ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={20} />
          {message}
        </div>
        <dialog
          ref={dialog}
          aria-label="Your data settings"
          className="data-dialog"
          onClose={() => {
            if (mobile) menuButton.current?.focus();
            importGeneration.current += 1;
            setPendingImport(null);
            setImportError("");
          }}
        >
          <div className="panel-header">
            <h2>Your data belongs to you</h2>
            <button
              className="icon-button"
              aria-label="Close data settings"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          <p>
            Your work is saved in this browser
            {account.user
              ? " and can sync to your signed-in account"
              : ". Sign in to connect cloud saving"}
            . Export a backup before clearing browser data.
          </p>
          <div className="stack">
            {persistenceBlocked && (
              <div className="inline-note">
                <strong>Your original saved data is protected.</strong>
                <p>
                  Current edits stay in memory until you restore browser saving.
                  Download the original data first if you need to recover it.
                </p>
                <div className="button-row">
                  <button
                    className="button secondary"
                    onClick={() => {
                      try {
                        downloadFile(
                          "rasta-original-recovery.txt",
                          originalRaw ??
                            localStorage.getItem(storageKey) ??
                            "No saved data was accessible.",
                          "text/plain",
                        );
                      } catch {
                        setImportError(
                          "Browser storage cannot be accessed. Export your current backup instead.",
                        );
                      }
                    }}
                  >
                    Download original data
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Replace the original browser data with your current workspace? Download the original first if you need it.",
                        )
                      ) {
                        setPersistenceBlocked(!preserveOriginal());
                        setHasEdited(true);
                      }
                    }}
                  >
                    Restore browser saving
                  </button>
                </div>
              </div>
            )}
            {recoveryCopies.length > 0 && (
              <div className="inline-note">
                <div>
                  <strong>Your original data is kept for recovery.</strong>
                  <p>
                    Replacing the workspace did not delete these unreadable
                    browser copies. Download them if you need to recover earlier
                    work.
                  </p>
                  <div className="button-row">
                    {recoveryCopies.map((copy, index) => (
                      <button
                        key={copy.key}
                        className="button secondary"
                        onClick={() =>
                          downloadFile(
                            `rasta-original-recovery-${index + 1}.txt`,
                            copy.raw,
                            "text/plain",
                          )
                        }
                      >
                        Download original data
                        {recoveryCopies.length > 1 ? ` ${index + 1}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button
              className="button"
              onClick={() => {
                downloadFile(
                  `rasta-backup-${new Date().toISOString().slice(0, 10)}.json`,
                  JSON.stringify(data, null, 2),
                );
                setMessage("Your backup is ready.");
              }}
            >
              <DownloadSimple size={18} /> Export my backup
            </button>
            <button
              className="button secondary"
              onClick={() => fileInput.current?.click()}
            >
              <UploadSimple size={18} /> Import a backup
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const startedScope = scopeRef.current;
                const startedGeneration = ++importGeneration.current;
                setImportError("");
                try {
                  if (f.size > 20000000)
                    throw new Error(
                      "Please choose a backup smaller than 20 MB.",
                    );
                  const parsed: unknown = JSON.parse(await f.text());
                  if (
                    startedScope !== scopeRef.current ||
                    startedGeneration !== importGeneration.current
                  )
                    return;
                  if (!isAppData(parsed))
                    throw new Error(
                      "This file is not a valid Rasta backup. Your current work is safe.",
                    );
                  setPendingImport(parsed);
                } catch (error) {
                  if (
                    startedScope !== scopeRef.current ||
                    startedGeneration !== importGeneration.current
                  )
                    return;
                  setImportError(
                    error instanceof Error
                      ? error.message
                      : "Could not read this backup.",
                  );
                }
              }}
            />
            {importError && (
              <p className="field-error" role="alert">
                {importError}
              </p>
            )}
            {pendingImport && (
              <div className="inline-note">
                <p>
                  Replace this workspace with{" "}
                  {pendingImport.profile.name || "the imported student"}’s
                  backup? Export your current work first if you want to keep it.
                </p>
                <div className="button-row">
                  <button
                    className="button"
                    onClick={() => {
                      update(migrateAppData(pendingImport));
                      setPendingImport(null);
                      dialog.current?.close();
                      setMessage("Backup imported. Welcome back.");
                    }}
                  >
                    Replace workspace
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => setPendingImport(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <details>
              <summary>Start fresh</summary>
              <p>
                {account.user
                  ? "Clear the current account’s profile, wishlist, applications and essays on this device. When cloud saving is active, this also replaces the saved account copy with an empty workspace."
                  : "Clear your guest profile, wishlist, applications and essays from this browser."}
                This cannot be undone without a backup.
              </p>
              <button
                className="button danger"
                onClick={() => {
                  if (
                    window.confirm(
                      account.user
                        ? "Clear this account’s workspace on this device? When cloud saving is active, the empty workspace will also replace your cloud copy. Export a backup first if you want to keep your work."
                        : "Clear your guest workspace on this device? Export a backup first if you want to keep your work.",
                    )
                  ) {
                    update({
                      ...initialData,
                      profile: {
                        ...initialData.profile,
                        name: "",
                        city: "",
                        ssc: "",
                        hssc: "",
                        net: "",
                        nu: "",
                        sat: "",
                        budget: "",
                        activities: "",
                        isDemo: false,
                      },
                      saved: [],
                      applications: [],
                      essays: [],
                    });
                    dialog.current?.close();
                    navigate("profile");
                    setMessage("Your workspace is ready for a fresh start.");
                  }
                }}
              >
                Clear my workspace
              </button>
            </details>
          </div>
        </dialog>
      </div>
      <dialog
        ref={accountDialog}
        className="account-dialog"
        aria-label="Your account"
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('a[href^="#"]')
          )
            accountDialog.current?.close();
        }}
      >
        <div className="panel-header">
          <h2>Your account</h2>
          <button
            className="icon-button"
            aria-label="Close account"
            onClick={() => accountDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <AccountPanel account={account} />
      </dialog>
    </>
  );
}
