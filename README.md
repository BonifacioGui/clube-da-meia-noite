# Clube da Meia-Noite

MVP de um clube de leitura gamificado e cooperativo para duas pessoas.

## Executar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (normalmente `http://localhost:5173`).

## O que está incluído

- Dashboard semanal cooperativo com XP, níveis e streaks
- Cronômetro e registro de sessões de leitura
- Biblioteca com cadastro, edição, progresso e status de livros
- Meta e Pacto da Semana com sorteio de cartas
- Cofre da Leitura e histórico simbólico
- Conquistas bloqueadas e desbloqueadas
- Persistência centralizada em `services/storage.ts` com `localStorage`
- Layout mobile-first e navegação adaptada ao desktop

## Estrutura

- `app/`: entrada e estilos globais
- `components/reading/`: telas e fluxos do produto
- `data/`: dados fictícios iniciais
- `hooks/`: estado e ações do clube
- `services/`: persistência local
- `types/`: modelo de dados
- `utils/`: regras de gamificação

Os dados são locais ao navegador. Para uma próxima fase, a API de `services/storage.ts` pode ser substituída por uma implementação do Supabase sem espalhar acesso à persistência pelos componentes.
