# Clube da Meia-Noite

Aplicação gamificada de leitura cooperativa para uma sala de até duas pessoas. O Supabase Auth identifica cada leitor e o PostgreSQL com RLS é a única fonte de verdade dos dados do clube.

## Configuração

1. Crie um projeto no Supabase.
2. Em um projeto novo, aplique uma única vez e na ordem as migrations de `supabase/migrations`. No projeto de produção atual, `20261001000100_clube_core.sql` e `20261007000100_stage3_consistency_realtime.sql` já foram aplicadas manualmente e não devem ser recriadas nem reaplicadas.
3. Em **Authentication → URL Configuration**, use estas configurações de produção:
   - **Site URL:** `https://clube-da-meia-noite-leitura.bonifacioguilherme1.chatgpt.site`
   - **Redirect URLs:** `https://clube-da-meia-noite-leitura.bonifacioguilherme1.chatgpt.site/auth/callback**`
   - `/reset-password` e `/invite/{token}` não são destinos diretos do Supabase: o callback troca o código e então navega internamente para essas rotas.
4. Para desenvolvimento local, adicione também `http://localhost:5173/auth/callback**` e, se usar esse host, `http://127.0.0.1:5173/auth/callback**` às Redirect URLs.
5. Copie `.env.example` para `.env.local` e preencha somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `NEXT_PUBLIC_SUPABASE_ANON_KEY` continua aceito apenas como fallback temporário para instalações antigas.
6. No ambiente publicado pelo Sites, abra as configurações do Site **Clube da Meia-Noite** (`appgprj_6abc53392b3881918f0adad6195bd3e3`) e cadastre as mesmas duas chaves em **Environment variables**, no ambiente de produção. Depois, faça uma nova implantação para aplicar a revisão do ambiente.
7. Nunca use `service_role` no frontend ou no Sites.

```bash
npm install
npm run dev
```

Sem as variáveis públicas, a aplicação mostra uma tela de configuração; ela não cai para mocks nem para dados locais.

A publishable key começa com `sb_publishable_` e é própria para código enviado ao navegador. Não cadastre `sb_secret_`, `service_role` ou qualquer chave privada neste projeto frontend.

## Fonte de verdade

- `auth.users` + `profiles`: conta e identidade individual.
- `rooms` + `room_members`: sala, proprietário e participação ativa.
- `books` + `reading_sessions`: biblioteca e sessões individuais. FKs compostas impedem associar um livro a uma pessoa de outra sala.
- `weekly_goals`, `weekly_pacts`, `pact_cards`, `weekly_results`, `vault_transactions`: dados compartilhados da sala.
- XP, nível, progresso, streaks e conquistas: derivados dos registros persistidos; não existem contadores duplicados editáveis.
- Convites: somente o SHA-256 do token fica no banco; o token original aparece uma vez, expira em sete dias, é revogável e tem uso único.

O cofre usa um livro-razão separado de XP. `pact_cards.kind` e `metadata` permanecem extensíveis para futuros tipos de carta ou moedas sem acoplar a economia ao progresso de leitura.

## Regras de segurança

- RLS está habilitado em todas as tabelas públicas.
- Leitura de dados compartilhados exige participação ativa na sala.
- Livros só podem ser inseridos, alterados ou excluídos pelo próprio dono.
- Sessões, convites, entrada/saída, substituição de cartas e fechamento semanal usam funções transacionais que derivam `auth.uid()` no servidor.
- A lotação de duas pessoas é protegida por trigger e lock da sala, não apenas pela UI.
- Sair não apaga histórico. O proprietário precisa transferir a sala quando há outra pessoa.

## Verificação local

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Roteiro de teste com duas contas

1. Em uma janela normal, cadastre a conta A, confirme o e-mail e crie uma sala.
2. Em Clube, gere o convite e copie o link.
3. Abra o link numa janela anônima, cadastre/confirme a conta B e aceite o convite preservado em `/invite/{token}`.
4. Confirme que ambas veem a mesma meta, pacto, cofre e histórico, mas cada uma só edita os próprios livros.
5. Mantenha as duas contas abertas. Registre uma sessão na conta A e confira a atualização automática de minutos, páginas, XP e histórico na conta B; depois repita com foco/visibilidade para validar o fallback.
6. Tente reutilizar o convite, usar um convite expirado e entrar com uma terceira conta; todos devem falhar.
7. No SQL Editor com JWT de usuário, tente consultar outra sala e inserir livro com `owner_id` alheio; RLS deve retornar zero linhas/erro.
8. Confirme que a semana em andamento não oferece fechamento. Para uma semana passada pendente, feche o resultado, confirme o snapshot e verifique que um segundo fechamento falha pela unicidade.
9. Teste recuperação de senha e saída da conta. Teste saída da sala: o proprietário deve transferir a propriedade antes de sair.

Os testes reais de Auth/RLS exigem um projeto Supabase configurado; o build sem credenciais valida apenas o código e a tela segura de configuração.

## Instalar como aplicativo

O Clube da Meia-Noite é uma PWA. A instalação não cria uma segunda conta nem copia os dados do clube para o aparelho: autenticação e dados compartilhados continuam no Supabase.

### Android

1. Abra o site no Chrome.
2. Use o botão discreto **Instalar** quando ele aparecer ou abra o menu do navegador.
3. Toque em **Instalar app** ou **Adicionar à tela inicial**.
4. Abra o ícone **Meia-Noite** na tela inicial. O aplicativo será executado em modo independente do navegador.

### iPhone e iPad

1. Abra o site no Safari.
2. Toque no botão **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Confirme o nome e toque em **Adicionar**.

No iOS, a instalação é controlada pelo Safari e não existe um prompt programático equivalente ao Android.

## Cache e funcionamento offline

- O service worker guarda apenas a tela offline, manifesto, ícones e assets estáticos do app.
- HTML autenticado, rotas de autenticação, convites, chamadas do Supabase e respostas privadas não entram no cache.
- Ao trocar de conta ou sair, o cache estático de execução é limpo e o estado em memória é invalidado antes de exibir outra conta.
- Uma tela já aberta pode continuar visível sem rede, mas qualquer ação que dependa do Supabase é recusada até a conexão voltar.
- Uma abertura nova sem rede mostra uma página offline neutra. Não existe fila de sessões nem sincronização offline nesta etapa.
- O identificador `VERSION` de `public/sw.js` deve ser alterado quando a estratégia ou os assets pré-carregados mudarem; na ativação, caches antigos do Clube são removidos.
