import { Database, MoonStar } from "lucide-react";

export function BackendSetupPage() {
  return <main className="onboarding-shell"><div className="onboarding-brand"><span><MoonStar size={24} /></span><div><small>CLUBE DA</small><strong>Meia-Noite</strong></div></div><section className="onboarding-card"><div className="onboarding-art"><Database size={42} /><span>DB</span></div><p className="eyebrow">CONFIGURAÇÃO NECESSÁRIA</p><h1>Conecte o Supabase.</h1><p className="onboarding-copy">A interface não usa mais dados locais como fonte de verdade. Configure as duas variáveis públicas descritas em <code>.env.example</code> e aplique a migration SQL para habilitar contas, salas e sincronização.</p></section></main>;
}
