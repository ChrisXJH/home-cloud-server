#!/bin/bash
([ -z "$1" ] || [ -z "$2" ]) && echo "Missing aregument." && exit 1

URL=$1
TARGET_DIRECTORY=$2

# Downloading the file to the target directory
echo "Downloading file from: ${URL} to ${TARGET_DIRECTORY} ..."
wget $URL -P $TARGET_DIRECTORY && echo "Download compleleted."