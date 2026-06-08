"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "@/components/icons";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type PushStatus = "loading" | "unsupported" | "unconfigured" | "default" | "granted" | "denied";

export function PushNotificationsSetup() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const checkStatus = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    try {
      const res = await fetch("/api/push/vapid-key");
      const data = (await res.json()) as { configured?: boolean; publicKey?: string };
      if (!data.configured || !data.publicKey) {
        setStatus("unconfigured");
        return;
      }
    } catch {
      setStatus("unconfigured");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") setStatus("granted");
    else if (perm === "denied") setStatus("denied");
    else setStatus("default");
  }, []);

  useEffect(() => {
    checkStatus();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [checkStatus]);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey, configured } = (await keyRes.json()) as {
        publicKey?: string;
        configured?: boolean;
      };
      if (!configured || !publicKey) {
        setMessage("Push not configured on the server.");
        setStatus("unconfigured");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Permission denied. Allow notifications in browser settings.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = sub.toJSON();
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      if (!saveRes.ok) {
        const err = (await saveRes.json()) as { error?: string };
        setMessage(err.error ?? "Could not save subscription.");
        return;
      }

      setStatus("granted");
      setMessage("Push notifications enabled!");
    } catch {
      setMessage("Could not enable push. Make sure you're on HTTPS.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      } else {
        await fetch("/api/push/subscribe", { method: "DELETE" });
      }
      setStatus("default");
      setMessage("Push notifications turned off.");
    } catch {
      setMessage("Could not disable push.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking…
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted">
        Push notifications are not supported in this browser. Try Chrome or install the app.
      </p>
    );
  }

  if (status === "unconfigured") {
    return (
      <p className="text-sm text-muted">
        Push is not configured on the server. Add VAPID keys to your environment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Get notified when a movie or series on your list is about to release. Works best when
        installed as a PWA.
      </p>

      {status === "denied" && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Notifications are blocked. Allow them in your browser or OS settings.
        </p>
      )}

      {status === "granted" ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          {busy ? "Turning off…" : "Turn off push notifications"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy || status === "denied"}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {busy ? "Enabling…" : "Enable release notifications"}
        </button>
      )}

      {message && <p className="text-sm text-accent">{message}</p>}
    </div>
  );
}
