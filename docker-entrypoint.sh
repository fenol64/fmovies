#!/bin/sh
set -eu

attempts=0
until npx prisma migrate deploy; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 15 ]; then
    echo "Não foi possível migrar o banco."
    exit 1
  fi
  echo "Banco ainda não está pronto. Tentativa ${attempts}..."
  sleep 2
done

exec npm run start -- --hostname 0.0.0.0 --port 3000
