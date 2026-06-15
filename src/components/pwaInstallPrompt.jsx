import { useEffect, useState } from "react";

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwaInstallDismissed") === "1");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return undefined;
    }

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installEvent) return;

    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setDismissed(true);
    localStorage.setItem("pwaInstallDismissed", "1");
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwaInstallDismissed", "1");
  };

  if (!installEvent || dismissed || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-[1.6rem] border border-red-400/20 bg-[#101827]/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl sm:left-auto sm:right-5 sm:mx-0">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/15 text-xl">🩸</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black">Install HemoDonation</h3>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Add the app to your device for faster access and app-like experience.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={installApp} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black hover:bg-red-500">
              Install App
            </button>
            <button onClick={dismiss} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
