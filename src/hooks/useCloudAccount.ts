import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData } from "../types";
import { googleProviderEnabled,
  CloudConflictError,
  cloudConfigured,
  getCloudClient,
  readCloudWorkspace,
  writeCloudWorkspace,
  type CloudWorkspace,
} from "../lib/cloud";

type AccountStatus =
  | "disabled"
  | "loading"
  | "guest"
  | "choice"
  | "synced"
  | "saving"
  | "error"
  | "conflict";
interface CloudAccountOptions {
  data: AppData;
  /** Root must use a distinct browser-storage key per account, and restore guest data on logout. */
  scope: string;
  onAccountChange: (userId: string | null) => void;
  replaceData: (data: AppData) => void;
}

export function useCloudAccount(options: CloudAccountOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AccountStatus>(
    cloudConfigured ? "loading" : "disabled",
  );
  const [message, setMessage] = useState("");
  const [pendingRemote, setPendingRemote] = useState<CloudWorkspace | null>(
    null,
  );
  const [reload, setReload] = useState(0);
  const [googleReady, setGoogleReady] = useState<boolean | null>(cloudConfigured ? null : false);
  useEffect(() => {
    let cancelled = false;
    if (cloudConfigured) void googleProviderEnabled().then(enabled => { if (!cancelled) setGoogleReady(enabled); });
    return () => { cancelled = true; };
  }, []);
  const live = useRef(options);
  live.current = options;
  const generation = useRef(0);
  const authId = useRef<string | null | undefined>(undefined);
  const active = useRef(false);
  const revision = useRef<number | null>(null);
  const baseline = useRef("");
  const applyingRemote = useRef<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    const connection = getCloudClient();
    if (!connection) return;
    let mounted = true;
    const receive = (nextUser: User | null) => {
      if (!mounted || authId.current === (nextUser?.id ?? null)) return;
      generation.current += 1;
      active.current = false;
      saving.current = false;
      revision.current = null;
      baseline.current = "";
      applyingRemote.current = null;
      authId.current = nextUser?.id ?? null;
      setUser(nextUser);
      setPendingRemote(null);
      setMessage("");
      setStatus(nextUser ? "loading" : "guest");
      live.current.onAccountChange(nextUser?.id ?? null);
    };
    // Keep the callback synchronous: auth calls inside it can deadlock token refresh.
    const {
      data: { subscription },
    } = connection.auth.onAuthStateChange((_event, session) =>
      receive(session?.user ?? null),
    );
    void connection.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        // Auth events take precedence over this initial snapshot: a late promise
        // must never put an earlier account back after a switch or logout.
        if (!mounted || authId.current !== undefined) return;
        if (error) {
          setStatus("error");
          setMessage(
            "We could not check your sign-in. Your device copy is still available.",
          );
        } else receive(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted || authId.current !== undefined) return;
        setStatus("error");
        setMessage(
          "We could not check your sign-in. Your device copy is still available.",
        );
      });
    return () => {
      mounted = false;
      generation.current += 1;
      authId.current = undefined;
      subscription.unsubscribe();
    };
  }, []);

  const applyRemote = useCallback((remote: CloudWorkspace) => {
    revision.current = remote.revision;
    baseline.current = JSON.stringify(remote.payload);
    applyingRemote.current = baseline.current;
    active.current = true;
    live.current.replaceData(remote.payload);
    setPendingRemote(null);
    setMessage("");
    setStatus("synced");
  }, []);

  useEffect(() => {
    const connection = getCloudClient();
    if (!connection || !user || options.scope !== user.id) return;
    const token = ++generation.current;
    active.current = false;
    saving.current = false;
    setStatus("loading");
    setMessage("");
    void readCloudWorkspace(connection, user.id)
      .then((remote) => {
        if (token !== generation.current) return;
        revision.current = remote?.revision ?? null;
        const local = live.current.data;
        // The account is the source of truth. Only ask when this device holds real,
        // different work that would otherwise be lost.
        const localHasWork =
          !local.profile.isDemo &&
          Boolean(
            local.profile.name.trim() ||
              local.saved.length ||
              local.essays.length ||
              local.applications.length ||
              local.profile.activityEntries?.length,
          );
        if (remote && (!localHasWork || JSON.stringify(remote.payload) === JSON.stringify(local))) {
          applyRemote(remote);
          return;
        }
        if (!remote) {
          // First sign-in: whatever is open becomes the account's progress.
          void save(local);
          return;
        }
        setPendingRemote(remote);
        setStatus("choice");
      })
      .catch((error: unknown) => {
        if (token !== generation.current) return;
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Your account could not be loaded.",
        );
      });
    return () => {
      generation.current += 1;
    };
  }, [user?.id, options.scope, reload]);

  const save = useCallback(async (payload: AppData) => {
    const connection = getCloudClient();
    const userId = authId.current;
    if (
      !connection ||
      !userId ||
      live.current.scope !== userId ||
      saving.current
    )
      return;
    const token = generation.current;
    saving.current = true;
    setStatus("saving");
    setMessage("");
    try {
      const result = await writeCloudWorkspace(
        connection,
        userId,
        payload,
        revision.current,
      );
      if (token !== generation.current) return;
      revision.current = result.revision;
      baseline.current = JSON.stringify(result.payload);
      active.current = true;
      setPendingRemote(null);
      setStatus("synced");
    } catch (error) {
      if (token !== generation.current) return;
      active.current = false;
      setMessage(
        error instanceof Error ? error.message : "Your changes could not sync.",
      );
      if (error instanceof CloudConflictError) {
        try {
          const remote = await readCloudWorkspace(connection, userId);
          if (token !== generation.current) return;
          revision.current = remote?.revision ?? null;
          setPendingRemote(remote);
          setStatus("conflict");
        } catch {
          if (token === generation.current) {
            setStatus("error");
            setMessage(
              "A newer account copy exists, but could not be loaded. Keep your device backup and try again.",
            );
          }
        }
      } else setStatus("error");
    } finally {
      if (token === generation.current) saving.current = false;
    }
  }, []);

  useEffect(() => {
    if (
      !active.current ||
      !user ||
      options.scope !== user.id ||
      status !== "synced"
    )
      return;
    const serialized = JSON.stringify(options.data);
    if (applyingRemote.current !== null) {
      if (serialized !== applyingRemote.current) return;
      applyingRemote.current = null;
    }
    if (serialized === baseline.current) return;
    const timer = window.setTimeout(() => void save(live.current.data), 800);
    return () => window.clearTimeout(timer);
  }, [options.data, options.scope, user, status, save]);

  const signIn = async () => {
    const connection = getCloudClient();
    if (!connection) {
      setMessage(
        "Google sign-in is not connected yet. You can keep working on this device.",
      );
      return;
    }
    setMessage("");
    try {
      const { error } = await connection.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch {
      setMessage(
        "Google sign-in could not start. Please try again; your device copy is unchanged.",
      );
    }
  };
  const signOut = async () => {
    const connection = getCloudClient();
    if (!connection) return;
    active.current = false;
    generation.current += 1;
    try {
      const { error } = await connection.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      setStatus("error");
      setMessage(
        "Sign-out did not finish. Please try again before leaving a shared device.",
      );
    }
  };
  const useRemote = () => {
    if (
      !pendingRemote ||
      options.scope !== user?.id ||
      !["choice", "conflict"].includes(status)
    )
      return;
    applyRemote(pendingRemote);
  };
  const useLocal = () => {
    if (["choice", "conflict"].includes(status)) void save(live.current.data);
  };
  const retry = () => {
    if (user) setReload((value) => value + 1);
    else void signIn();
  };

  return {
    configured: cloudConfigured,
    /** false = Supabase reachable but the Google provider is off; null = not checked yet. */
    googleReady,
    user,
    status,
    message,
    pendingRemote,
    pendingLocal: options.data,
    signIn,
    signOut,
    useRemote,
    useLocal,
    retry,
  };
}

export type CloudAccount = ReturnType<typeof useCloudAccount>;
