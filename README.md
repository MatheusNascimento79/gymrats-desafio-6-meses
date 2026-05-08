# GYMRATS - Desafio 6 Meses

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

## Como importar dados

1. Abra a tela **Importar**.
2. Digite a senha de importacao.
3. Envie um arquivo `.csv`, `.xls` ou `.xlsx` exportado oficialmente pelo GymRats Pro.
4. Escolha o modo:
   - **Substituir base**: remove a base atual e salva somente o arquivo novo.
   - **Mesclar sem duplicar**: adiciona atividades novas e ignora duplicadas.
5. Confira a previa e o mapeamento detectado.
6. Clique em **Confirmar importacao**.

Nesta primeira versao, os dados ficam salvos no `localStorage` do navegador. Antes do primeiro import, o app mostra dados mockados para demonstracao.

Para zerar os dados deste navegador, use o botao **Limpar dados importados** na tela **Importar**.

Com Supabase configurado, esse botao limpa as atividades do banco central. Sem Supabase, limpa apenas este navegador.

Duplicatas na mesclagem sao detectadas por:

```text
participante + data + tipo de atividade + duracao
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

Voce tambem pode importar esse CSV pela tela **Importar** para testar a previa, o mapeamento e a atualizacao do dashboard.

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
