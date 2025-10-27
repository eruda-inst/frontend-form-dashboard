#!/bin/sh
set -e

echo "Starting runtime environment variable replacement..."

# --- CORREÇÃO AQUI ---
# O Middleware (de onde vêm os logs [MW-LOG]) não está em /static.
# Ele está em /server.
# Vamos escanear a pasta .next INTEIRA para garantir que pegamos
# tanto os arquivos de cliente (.next/static) quanto os de servidor/middleware (.next/server).
TARGET_DIR=.next

echo "Scanning directory: $TARGET_DIR for placeholders..."

# Encontra TODOS os arquivos (.js, .css, .html, etc.) dentro de .next
# que contenham qualquer string "__NEXT_PUBLIC_"
# -r = recursivo
# -l = listar apenas nomes de arquivos
FILES=$(grep -rl "__NEXT_PUBLIC_" $TARGET_DIR)

if [ -z "$FILES" ]; then
  echo "Warning: No files containing placeholders were found in $TARGET_DIR."
else
  echo "Found placeholder files. Processing..."
  
  # Loop pelos arquivos encontrados
  for file in $FILES; do
    # Garante que é um arquivo
    if [ -f "$file" ]; then
      # echo "Processing $file..." # (Descomente para debug pesado)
      
      # Roda a substituição
      sed -i "s|__NEXT_PUBLIC_API_URL_PLACEHOLDER__|${NEXT_PUBLIC_API_URL}|g" "$file"
      sed -i "s|__NEXT_PUBLIC_WS_URL_PLACEHOLDER__|${NEXT_PUBLIC_WS_URL}|g" "$file"
      sed -i "s|__NEXT_PUBLIC_FORM_URL_PLACEHOLDER__|${NEXT_PUBLIC_FORM_URL}|g" "$file"
    fi
  done
  
  echo "Replacement complete."
fi

# 5. Executa o comando original (npm start)
echo "Starting Next.js..."
exec "$@"