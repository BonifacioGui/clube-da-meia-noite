"use client";

import { useEffect, useState } from "react";
import { Download, Share, WifiOff, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

export function PwaController() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setOnline(navigator.onLine);
      setDismissed(sessionStorage.getItem("midnight-pwa-dismissed") === "1" || isStandalone());
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setShowIosHelp(ios && !isStandalone());
    });
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstalled = () => { setInstallPrompt(null); setShowIosHelp(false); setDismissed(true); };
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (sessionStorage.getItem("midnight-pwa-dismissed") === "1" || isStandalone()) return;
      setInstallPrompt(event as InstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = () => { sessionStorage.setItem("midnight-pwa-dismissed", "1"); setDismissed(true); };
  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setDismissed(true);
    else dismiss();
    setInstallPrompt(null);
  };

  return <>
    {!online && <div className="pwa-offline" role="status" aria-live="polite"><WifiOff size={16} /><span>Sem conexão. Você pode consultar esta tela, mas alterações não serão salvas.</span></div>}
    {!dismissed && (installPrompt || showIosHelp) && <aside className="pwa-install" aria-label="Instalar aplicativo">
      <span className="pwa-install-icon">{showIosHelp ? <Share size={18} /> : <Download size={18} />}</span>
      <div><strong>Instale o Clube da Meia-Noite</strong><p>{showIosHelp ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início." : "Abra o clube em uma janela própria, direto da sua tela inicial."}</p></div>
      {installPrompt && <button className="pwa-install-action" onClick={() => void install()}>Instalar</button>}
      <button className="pwa-install-close" onClick={dismiss} aria-label="Fechar sugestão de instalação"><X size={16} /></button>
    </aside>}
  </>;
}
