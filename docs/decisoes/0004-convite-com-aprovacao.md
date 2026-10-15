# ADR 0004 — Convite com aprovação do administrador

Data: 2026-10-15 · Estado: aceita (pedido do Victor)

**Contexto:** o app é fechado. O Victor quer que qualquer membro possa convidar, mas que ele, como administrador, aceite cada pessoa.

**Decisão:** membro gera código (MERC-XXXX, 7 dias, até 5 por membro) → pessoa se cadastra e fica "aguardando_aprovacao" → admin aprova ("ativo", quem convidou ganha 100 pontos) ou recusa.

**Por quê:** cresce pela rede de amigos sem perder o controle de quem entra.

**Consequências:** regras em `src/domain/convites.ts`; telas `/convites`, `/entrar`, `/admin`. No Supabase, a regra de acesso deve impedir que alguém "aguardando" leia dados.
