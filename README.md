# D185 - Desafio 6 Meses

Dashboard client-side para acompanhar o desafio fitness de 6 meses:

- minimo de 3 atividades fisicas por semana;
- semana de segunda-feira a domingo;
- meta coletiva batida somente quando todos os participantes ativos cumprem a meta;
- controle manual semanal de Zero Alcool.

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Persistencia central com Supabase

Para que todos vejam os mesmos dados em qualquer aparelho, configure um banco Supabase.

1. Crie um projeto em [Supabase](https://supabase.com).
2. Abra **SQL Editor**.
3. Execute o arquivo:

```text
docs/supabase-schema.sql
```

4. Na Vercel, abra o projeto e configure as variaveis em **Settings > Environment Variables**:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
IMPORT_PASSWORD=12344321567
```

5. Faca um novo deploy.

Com Supabase configurado:

- o dashboard le atividades do banco central;
- a tela Importar salva no banco central;
- todos os aparelhos veem os mesmos dados;
- o Zero Alcool tambem fica centralizado;
- uploads duplicados sao ignorados pela chave unica `dedup_key`.

Sem Supabase configurado, o app usa fallback local para desenvolvimento.

## Login e permissoes

Depois que `members.csv` for importado, a tela inicial passa a ter login por participante.

- O campo de usuario e um dropdown com os nomes do `members.csv`.
- Primeiro acesso: selecionar nome, criar senha e confirmar senha.
- Proximos acessos: selecionar nome e senha.
- Cada participante ve seus proprios dados e altera apenas seu proprio Zero Alcool.
- `Matheus Nascimento` e o super admin e ve tudo.
- A tela **Importar** aparece somente para o super admin.

Antes do primeiro import de `members.csv`, use o **Setup inicial do super admin** na tela de login com a senha definida em `IMPORT_PASSWORD`.

## Como importar dados

1. Abra a tela **Importar**.
2. Digite a senha de importacao.
3. Envie obrigatoriamente:
   - `members.csv`
   - `check_ins.csv`
4. Opcionalmente mantenha separados para uso futuro:
   - `challenge.csv`
   - `check_in_activities.csv`
   - `check_in_media.csv`
   - `messages.csv`
5. Escolha o modo:
   - **Substituir atividades**: remove atividades antigas e salva o arquivo novo, preservando participantes e senhas.
   - **Mesclar sem duplicar**: adiciona check-ins novos sem duplicar.
6. Clique em **Importar GymRats**.

Nesta primeira versao, os dados ficam salvos no `localStorage` do navegador. Antes do primeiro import, o app mostra dados mockados para demonstracao.

Para zerar as atividades no banco central, o super admin pode usar **Limpar atividades** na tela **Importar**. Participantes e senhas sao preservados.

Na importacao real do GymRats, duplicatas sao detectadas por:

```text
check_ins.id
```

Observacao: a senha do MVP fica no client-side e serve apenas como barreira simples de operacao, nao como seguranca forte.

## Teste com arquivo de exemplo

O projeto inclui um CSV de exemplo em:

```text
data/sample-gymrats-export.csv
```

Para validar os calculos esperados:

```bash
npm run validate:sample
```

Resultado esperado para a semana de `2026-05-04` a `2026-05-10`:

- 42 atividades no arquivo;
- 8 participantes;
- 4 participantes em dia;
- 4 participantes pendentes;
- 50% de cumprimento semanal.

Esse CSV e apenas para validar os calculos antigos/localmente. A importacao real em producao usa `members.csv` e `check_ins.csv` do GymRats.

## Colunas aceitas

O importador tenta detectar nomes comuns, incluindo:

- participante: `name`, `participant`, `user`, `athlete`, `nome`, `atleta`, `usuario`;
- data: `date`, `activity_date`, `workout_date`, `data`, `data_atividade`, `dia`;
- atividade: `activity`, `workout`, `type`, `atividade`, `treino`, `tipo`, `modalidade`;
- duracao: `duration`, `minutes`, `duration_minutes`, `duracao`, `minutos`, `tempo`;
- pontos: `points`, `score`, `pontos`, `pontuacao`;
- calorias: `calories`, `kcal`, `calorias`;
- distancia: `distance`, `distancia`, `km`, `quilometragem`;
- time: `team`, `grupo`, `time`, `equipe`.

## Como adaptar o mapeamento

Quando receber o export real do GymRats Pro, ajuste os aliases em:

```text
lib/column-mapping.ts
```

Adicione o nome real da coluna no array correspondente. Exemplo:

```ts
participant: ["name", "participant", "nome_do_atleta_no_export"]
```

## Deploy gratuito na Vercel

1. Suba o projeto para um repositorio GitHub.
2. Acesse [Vercel](https://vercel.com).
3. Importe o repositorio.
4. Framework: **Next.js**.
5. Comando de build: `npm run build`.
6. Public directory: deixe o padrao da Vercel para Next.js.

Nao ha backend no MVP. Para historico compartilhado entre admins e competidores, a evolucao natural e usar **Supabase gratuito + Vercel**.

## Observacao de integracao

Este projeto nao usa engenharia reversa nem API nao oficial do GymRats. A entrada de dados deve vir de exportacao oficial ou importacao manual consentida.
