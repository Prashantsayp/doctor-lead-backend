#!/bin/bash

MONGO_URI="mongodb://127.0.0.1:27017/doctor_leads"

FILE=$1

if [ -z "$FILE" ]; then
  echo "❌ Provide backup file path"
  exit 1
fi

echo "🔄 Restoring..."

mongorestore --uri="$MONGO_URI" --archive="$FILE" --gzip --drop

echo "✅ Restore done"