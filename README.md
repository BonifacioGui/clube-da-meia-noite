# Clube da Meia-Noite

Aplicação gamificada de leitura cooperativa para uma sala de até duas pessoas. O frontend é um export estático do Next.js hospedado como **Project Site** no GitHub Pages; autenticação, persistência, RLS e Realtime continuam no Supabase.

## Produção

- Repositório: `BonifacioGui/clube-da-meia-noite`
- URL esperada: `https://bonifaciogui.github.io/clube-da-meia-noite/`
- Base path: `/clube-da-meia-noite`
- Artefato: `out/`
- Publicação: `.github/workflows/deploy-pages.yml`

O `next.config.ts` usa `output: "export"`, `basePath`, `trailingSlash` e imagens sem otimização de servidor. A produção não depende de servidor Node, Vinext, Cloudflare, ChatGPT Sites ou funções server-side.

## Configuração local

1. Use Node.js 22 ou superior.
2. Copie `.env.example` para `.env.local`.
3. Preencha somente:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

4. Instale e execute:

```bash
npm install
npm run dev
```

Com o base path de produção ativo, o desenvolvimento abre em `http://localhost:3000/clube-da-meia-noite/`. A variável antiga `NEXT_PUBLIC_SUPABASE_ANON_KEY` é aceita apenas como fallback temporário; não use `service_role`, `sb_secret_`, chave privada ou qualquer segredo no frontend.

## Configuração do GitHub Pages

No repositório, abra **Settings → Secrets and variables → Actions → Variables → New repository variable** e crie exatamente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

São **Repository Variables**, não Secrets: ambas são públicas por natureza e são incorporadas ao JavaScript enviado ao navegador. Nunca cadastre uma Service Role Key nesse workflow.

Depois abra **Settings → Pages → Build and deployment** e selecione **GitHub Actions** como Source. Um push em `master` ou uma execução manual do workflow faz `npm ci`, lint, TypeScript, build estático, valida `out/` e publica somente esse diretório.

O repositório deve permanecer com a visibilidade escolhida pelo proprietário. GitHub Pages em repositório privado pessoal exige um plano compatível (como GitHub Pro); mesmo assim, o site do Pages normalmente é público. Pages com acesso realmente privado exige organização no GitHub Enterprise Cloud.

## Configuração do Supabase Auth

Em **Supabase → Authentication → URL Configuration**, cadastre:

- **Site URL:** `https://bonifaciogui.github.io/clube-da-meia-noite/`
- **Redirect URL de produção:** `https://bonifaciogui.github.io/clube-da-meia-noite/auth/callback/`
- **Redirect URL local:** `http://localhost:3000/clube-da-meia-noite/auth/callback/`
- Opcional para o mesmo ambiente local: `http://127.0.0.1:3000/clube-da-meia-noite/auth/callback/`

Recuperação de senha e convites voltam primeiro ao callback PKCE autorizado. Depois da troca do código, a aplicação navega internamente para:

- `https://bonifaciogui.github.io/clube-da-meia-noite/reset-password/`
- `https://bonifaciogui.github.io/clube-da-meia-noite/invite/?token=TOKEN`

Essas duas URLs não precisam ser Redirect URLs adicionais no Supabase, porque o destino enviado ao Auth é sempre `/auth/callback/`. Não use mais o formato dinâmico `/invite/{token}`.

## Banco e fonte de verdade

Em um projeto Supabase novo, aplique uma única vez e na ordem as migrations de `supabase/migrations`. No projeto de produção atual, estas migrations já foram aplicadas manualmente e não devem ser recriadas nem reaplicadas:

- `20261001000100_clube_core.sql`
- `20261007000100_stage3_consistency_realtime.sql`

Domínios persistidos:

- `auth.users` + `profiles`: conta e identidade individual.
- `rooms` + `room_members`: sala, proprietário e participação ativa.
- `books` + `reading_sessions`: biblioteca e sessões individuais.
- `weekly_goals`, `weekly_pacts`, `pact_cards`, `weekly_results`, `vault_transactions`: dados compartilhados da sala.
- XP, nível, progresso, streaks e conquistas: derivados dos registros persistidos.
- Convites: somente o SHA-256 do token fica no banco; o token original aparece uma vez, expira, é revogável e tem uso único.

RLS limita leituras e mutações à conta e à sala corretas. Funções transacionais derivam `auth.uid()` no servidor; o frontend nunca recebe privilégios administrativos.

## Rotas estáticas e autenticação

As rotas exportadas são:

- `/clube-da-meia-noite/`
- `/clube-da-meia-noite/auth/callback/`
- `/clube-da-meia-noite/reset-password/`
- `/clube-da-meia-noite/invite/?token=TOKEN`

O token de convite está no query string para que a página seja um arquivo estático. O callback valida que `next` seja uma rota interna, troca o código PKCE pela sessão e só então redireciona dentro do base path.

## PWA e cache

- Manifesto, ícones, `start_url`, `scope` e service worker respeitam `/clube-da-meia-noite/`.
- O service worker guarda apenas a tela offline, manifesto, ícones e assets estáticos.
- Navegações autenticadas, callback, convite, recuperação, chamadas do Supabase e respostas com headers de autenticação não entram no cache.
- Ao trocar de conta ou sair, o cache estático de execução é limpo e o estado em memória é invalidado.
- Sem rede, operações do Supabase são bloqueadas; não existe fila nem sincronização offline de sessões.

### Instalação no Android

Abra a URL de produção no Chrome e use **Instalar app** ou **Adicionar à tela inicial**. O prompt discreto da própria aplicação aparece apenas quando o navegador oferece suporte.

### Instalação no iPhone/iPad

Abra a URL no Safari, toque em **Compartilhar → Adicionar à Tela de Início** e confirme. O iOS não oferece o mesmo prompt programático do Android.

## Verificação

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

O build executa `scripts/prepare-pages.mjs`, que exige as páginas estáticas essenciais e confirma que os assets usam `/clube-da-meia-noite/_next/`. O preview serve `out/` em `http://127.0.0.1:4173/clube-da-meia-noite/`, simulando o subdiretório do GitHub Pages.

Os testes reais de cadastro, callback, recuperação, convite, RLS e Realtime exigem as variáveis públicas válidas e a configuração manual do Supabase. O build sem credenciais apenas valida o frontend e a tela segura de configuração.

## Roteiro de teste com duas contas

1. Cadastre a conta A, confirme o e-mail e crie uma sala.
2. Gere um convite em Clube e abra o link numa janela anônima.
3. Cadastre/confirme a conta B e aceite o convite preservado em `/invite/?token=...`.
4. Confirme que ambas veem a mesma meta, pacto, cofre e histórico, mas cada uma edita apenas seus próprios livros.
5. Registre sessões nas duas contas e confira Realtime, XP, minutos, páginas, streak e histórico.
6. Teste convite reutilizado, expirado e uma terceira conta; todos devem falhar.
7. Teste recuperação de senha, logout/login com outra conta e confirme que nenhum dado anterior aparece do cache.
8. Teste a PWA instalada e uma atualização de versão do service worker.
