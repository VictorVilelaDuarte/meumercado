# ADR 0001 — Stack

Data: 2026-10-15 · Estado: aceita para o front; banco e hospedagem a confirmar com o Victor.

**Contexto:** app de celular, acessado por link entre amigos, sem loja de apps; uma pessoa mantém o projeto com ajuda do Claude Code.

**Decisão:** Next.js (App Router) + React + TypeScript + Tailwind, como PWA. Planejado: Supabase (Postgres, login, regras de acesso por linha) e Vercel.

**Por quê:** um só projeto para telas e servidor (a consulta à Sefaz precisa rodar no servidor); TypeScript pega erro cedo; Supabase dá banco + login + privacidade por linha sem servidor próprio; Vercel publica a cada push. Tudo tem plano gratuito suficiente para o grupo de amigos.

**Consequências:** buscar a nota na Sefaz roda em rota de servidor do Next. Se a Sefaz bloquear IPs da Vercel, reavaliar.
