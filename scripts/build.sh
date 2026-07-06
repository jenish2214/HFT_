#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/cpp/build"
mkdir -p "$BUILD_DIR"

CXX="${CXX:-g++}"
FLAGS="-std=c++17 -O3 -Wall -Wextra -I$ROOT/cpp/include"

echo "==> Building C++ matching engine with $CXX..."
$CXX $FLAGS \
  "$ROOT/cpp/src/main.cpp" \
  "$ROOT/cpp/src/order_book.cpp" \
  "$ROOT/cpp/src/matching_engine.cpp" \
  "$ROOT/cpp/src/json_handler.cpp" \
  -o "$BUILD_DIR/hft_engine"

echo "==> Build complete: $BUILD_DIR/hft_engine"
