# Clube da Meia-Noite

Aplicação gamificada de leitura cooperativa para uma sala de até duas pessoas. O Supabase Auth identifica cada leitor e o PostgreSQL com RLS é a única fonte de verdade dos dados do clube.

## Configuração

1. Crie um projeto no Supabase.
2. Aplique, na ordem, as migrations de `supabase/migrations` pelo CLI (`supabase db push`) ou SQL Editor. A migration da ETAPA 3 adiciona a trava de fechamento semanal, administração da sala e a publicação Realtime.
3. Em Authentication → URL Configuration, configure a URL do site e permita `/auth/callback` e `/reset-password` como redirects.
4. Copie `.env.example` para `.env.local` e preencha somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Nunca use `service_role` no frontend ou no Sites.

```bash
npm install
npm run dev
```

Sem as variáveis públicas, a aplicação mostra uma tela de configuração; ela não cai para mocks nem para dados locais.

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
