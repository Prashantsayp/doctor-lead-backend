#!/bin/bash

# Load env variables
MONGO_URI="mongodb://127.0.0.1:27017/doctor_leads"

DATE=$(date +%F-%H-%M)
BACKUP_DIR="./backups"
FILE_NAME="backup-$DATE.gz"

mkdir -p $BACKUP_DIR

echo "🚀 Starting backup..."

mongodump --uri="$MONGO_URI" --archive="$BACKUP_DIR/$FILE_NAME" --gzip

if [ -f "$BACKUP_DIR/$FILE_NAME" ]; then
  echo "✅ Backup successful"
else
  echo "❌ Backup failed"
  exit 1
fi

# delete old backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "🧹 Old backups deleted"