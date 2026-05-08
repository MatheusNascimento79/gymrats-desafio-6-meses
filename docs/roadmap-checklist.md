# Roadmap + Checklist

## Objetivo

Criar o MVP client-side do dashboard **GYMRATS - Desafio 6 Meses**, preparado para deploy gratuito na Vercel e para importação manual de exportações oficiais CSV/XLSX do GymRats Pro.

## Checklist

- [x] Estruturar projeto Next.js com TypeScript, Tailwind, Recharts, PapaParse e SheetJS.
- [x] Criar dados mockados para demonstrar o painel antes do export real.
- [x] Implementar normalização flexível de colunas comuns do GymRats Pro.
- [x] Implementar cálculos semanais com semana de segunda a domingo.
- [x] Criar dashboard principal com meta coletiva, rankings, insights e gráficos.
- [x] Criar importador CSV/XLSX com prévia e confirmação.
- [x] Criar tela de participantes com filtro, detalhes e histórico semanal.
- [x] Criar tela de Zero Álcool com controle manual por participante/semana.
- [x] Criar página pública bonita para competidores.
- [x] Documentar execução local, importação, deploy Vercel e adaptação de mapeamento.
- [x] Rodar build/lint e corrigir erros.

## Calibração com dados de exemplo

- [x] Criar CSV de exemplo parecido com export do GymRats Pro.
- [x] Validar normalização e cálculos com o CSV de exemplo.
- [x] Documentar o fluxo de teste manual do importador.

## Ajustes pós-publicação

- [x] Adicionar limpeza dos dados importados no navegador.
- [x] Adicionar modo de importação por substituição.
- [x] Adicionar modo de mesclagem sem duplicar.
- [x] Adicionar senha hardcoded para acessar a tela Importar.
