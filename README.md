# Clube da Meia-Noite

MVP gamificado de leitura cooperativa para uma sala de até duas pessoas. A aplicação funciona sem backend: o estado normalizado é persistido no `localStorage` do navegador e toda a interface é derivada desse estado.

## Executar localmente

Requisito: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

O modo de desenvolvimento carrega um seed demonstrativo isolado em `data/dev-seed.ts` somente quando ainda não existe estado v2 persistido. Builds de produção iniciam no onboarding vazio.

## Fonte de verdade

- Perfis, salas e vínculos: `profiles`, `rooms` e `memberships`.
- Livros: pertencem simultaneamente à sala e ao perfil proprietário.
- Sessões: apontam para sala, perfil e livro compatíveis.
- Metas, pactos, cartas, cofre e resultados semanais: pertencem à sala.
- XP, níveis, progresso, dias lidos, streak individual, streak da dupla e conquistas: são calculados a partir de sessões e resultados; não são armazenados como contadores duplicados.
- Persistência e reparo de relações: `services/storage.ts`.
- Seletores, cálculos e visões derivadas: `utils/domain.ts` e `utils/gamification.ts`.
- Mutações e regras de autorização local: `hooks/use-reading-club.ts`.

## Fluxos implementados

- onboarding local e criação da sala;
- convite e entrada local da segunda pessoa;
- biblioteca individual por perfil;
- cronômetro e registro de sessão;
- atualização de páginas sem regressão do progresso;
- metas e pactos semanais da sala;
- XP, níveis, streaks e conquistas derivados;
- cofre e fechamento semanal;
- histórico completo de sessões e resultados;
- estados de carregamento, erro e vazio;
- layout responsivo para desktop e mobile.

## Limites deste MVP

Não há autenticação, API, banco remoto, sincronização entre dispositivos nem controle de acesso no servidor. A troca de perfil e o convite funcionam apenas no mesmo navegador, portanto não são uma fronteira de segurança. O scaffold de D1 existente no projeto não é usado pelo produto.

Para integrar um backend, preserve o contrato normalizado de `ClubState`, substitua `services/storage.ts` por um repositório remoto e aplique autorização server-side com base no usuário autenticado e em `memberships`.
