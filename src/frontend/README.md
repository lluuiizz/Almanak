# Almanak — Frontend

Cliente web do Almanak, feito com **React + Vite + TypeScript**.

## Requisitos

- Node.js 20 ou superior (recomendado: 22 LTS)
- npm

## Rodando localmente

```bash
cd src/frontend
npm install
npm run dev
```

A aplicação fica disponível em http://localhost:5173.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com hot reload na porta 5173. |
| `npm run build` | Checagem de tipos e build de produção em `dist/`. |
| `npm run lint` | Análise estática com ESLint (usado na pipeline de CI). |
| `npm run preview` | Serve localmente o build de produção. |

## Docker

```bash
# a partir da raiz do repositório
docker build -t almanak-frontend ./src/frontend
docker run --rm -p 5173:5173 almanak-frontend
```

