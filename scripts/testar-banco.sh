#!/usr/bin/env bash
# Testa o esquema do banco (supabase/migrations) num Postgres temporário, sem precisar de conta no Supabase.
# Uso: npm run test:db. Se o Postgres não estiver instalado, avisa e sai sem erro (docs/09-banco.md).
set -euo pipefail
cd "$(dirname "$0")/.."

BIN="$(pg_config --bindir 2>/dev/null || true)"
[ -x "$BIN/initdb" ] || BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
if [ -z "$BIN" ] || [ ! -x "$BIN/initdb" ]; then
  echo "test:db pulado: Postgres não está instalado (sudo apt install postgresql ou brew install postgresql)."
  exit 0
fi

DIR="$(mktemp -d)"
PORTA=54329
# O Postgres não roda como root; em contêiner (root) usa o usuário postgres.
como() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$DIR"
parar() { como "'$BIN/pg_ctl' -D '$DIR/dados' -m immediate stop" >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap parar EXIT

como "'$BIN/initdb' -D '$DIR/dados' -U postgres -A trust -E UTF8 --locale=C.UTF-8" >/dev/null
como "'$BIN/pg_ctl' -D '$DIR/dados' -o \"-p $PORTA -k '$DIR' -c listen_addresses=''\" -l '$DIR/log' -w start" >/dev/null

PSQL=(psql -h "$DIR" -p "$PORTA" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f supabase/testes/00-supabase-local.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
for f in supabase/testes/*.sql; do
  [ "$(basename "$f")" = 00-supabase-local.sql ] && continue
  echo "• $f"
  "${PSQL[@]}" -f "$f"
done
echo "Banco OK"
