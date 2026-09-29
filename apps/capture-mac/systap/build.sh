#!/usr/bin/env bash
# 編譯 systap（需要 Xcode Command Line Tools，macOS 14.2 以上）
set -euo pipefail
cd "$(dirname "$0")"
swiftc -O -o systap main.swift -framework CoreAudio -framework AudioToolbox -framework AVFoundation
echo "built: $(pwd)/systap"
