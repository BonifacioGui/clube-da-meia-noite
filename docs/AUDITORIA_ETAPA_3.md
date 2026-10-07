# Auditoria da ETAPA 3

## Hardcodes e mocks encontrados

- O nível exibido na navegação era calculado com o XP somado do clube, embora o nível seja individual.
- O fechamento semanal era oferecido para a semana corrente e dependia principalmente do estado da interface.
- Perfil, conquistas e estantes tinham cálculos ou apresentação distribuídos entre componentes.
- Formulários de perfil, sala e meta inicializavam com um snapshot e não distinguiam atualização remota de edição local em andamento.
- A biblioteca não separava explicitamente a estante editável do usuário da estante somente leitura da dupla.
- Convites não tinham revogação explícita nem um estado de sala completa.
- O filtro Realtime de `rooms` estava sujeito a usar a coluna das tabelas filhas (`room_id`) em vez da chave da própria sala (`id`).
- O plugin local do Sites contém `mockAuth` e o usuário técnico `seedy@sites.test`. Ele está restrito à infraestrutura de prévia local e não fornece perfis, livros, XP, sessões, sala ou qualquer dado do domínio.
- Não há seed ou mock de domínio usado pela aplicação. Sem configuração do Supabase, a interface mostra um estado de configuração e não fabrica dados.

## O que foi removido ou corrigido

- Nível, faixa e progresso agora usam apenas o XP derivado do usuário autenticado; o total do clube aparece somente como métrica secundária.
- A ação de fechar a semana atual foi removida. A interface só oferece semanas passadas pendentes e a função SQL rejeita semana corrente/futura, sala incompleta, duplicidade e semana sem meta.
- Conquistas e progressão foram centralizadas em utilitários de domínio.
- Formulários sincronizam novas respostas do backend apenas enquanto não estão sujos.
- A Biblioteca ganhou abas por proprietário, com edição restrita à estante própria e a estante da dupla em modo somente leitura.
- Proprietários podem renomear o clube, gerar/substituir convite e revogar o convite ativo; salas completas não exibem ações de convite.
- Eventos Realtime apenas disparam revalidação; a resposta persistida continua sendo a fonte de verdade. Foco e retorno de visibilidade funcionam como fallback.
- Histórico e atividade recente preservam a identidade de ex-membros sem conceder acesso a quem já saiu da sala.
- A identidade visual foi consolidada em tokens preto/azul-meia-noite; dourado ficou reservado ao cofre e às conquistas.

## Fonte de verdade por domínio

| Domínio | Fonte de verdade |
| --- | --- |
| Conta e identidade | Supabase Auth + `profiles` |
| Sala, proprietário e membros | `rooms` + `room_members` |
| Convites | `room_invites`; somente o hash do token é persistido |
| Livros | `books`, com `owner_id` e vínculo composto à sala |
| Sessões e páginas | `reading_sessions` + atualização transacional de `books` |
| Meta | `weekly_goals` da sala e semana |
| Pacto e cartas | `weekly_pacts` + `pact_cards` |
| Fechamento semanal | `weekly_results`, criado por `close_week` no banco |
| Cofre | livro-razão `vault_transactions` |
| XP, nível e progresso | derivação determinística de sessões, dias e resultados persistidos |
| Streak individual | datas distintas de `reading_sessions` |
| Streak da dupla | sequência de `weekly_results` com `both_met` |
| Conquistas | critérios centralizados derivados dos mesmos registros persistidos |
| Histórico | sessões e resultados persistidos, inclusive perfis históricos da sala |

## Regras fixas legítimas

`XP_RULES`, faixas de nível, critérios de conquista e a meta inicial de 4 dias/120 minutos são regras de produto centralizadas. Elas não representam dados de uma pessoa ou sala existente. A meta inicial é gravada no banco na criação da sala e, a partir daí, a interface usa o registro persistido.

## Validação executada

- `npm run lint`: aprovado.
- `npx tsc --noEmit`: aprovado.
- `npm run build`: aprovado.
- Inspeção visual local em desktop e 390 × 844: aprovada para o estado seguro de configuração.
- `git diff --check`: aprovado.
- Varredura de segredos: nenhum segredo encontrado; apenas placeholders em `.env.example`.

## Ainda não validado com backend real

Este checkout não contém `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` nem acesso administrativo a um projeto Supabase. Portanto, não foram executados testes reais de Auth, RLS, Realtime com duas contas, convite de uso único, fechamento semanal ou persistência remota. A migration `20261007000100_stage3_consistency_realtime.sql` precisa ser aplicada ao projeto antes da publicação conectada.

Não há integração futura de moeda, mercado ou novos tipos de carta nesta etapa.
