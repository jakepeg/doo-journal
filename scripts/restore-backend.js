#!/usr/bin/env node

// scripts/restore-backend.js - Restore original backend after deployment
import fs from "fs";
import path from "path";

const backendPath = path.resolve(process.cwd(), "src/journal_backend/main.mo");
const backupPath = path.resolve(process.cwd(), "src/journal_backend/main.mo.backup");

console.log("🔄 Restoring original backend file...");

if (fs.existsSync(backupPath)) {
  try {
    const backupContent = fs.readFileSync(backupPath, "utf8");
    fs.writeFileSync(backendPath, backupContent);
    fs.unlinkSync(backupPath);
    console.log("✅ Restored original main.mo with placeholder");
  } catch (error) {
    console.error("❌ Failed to restore:", error.message);
    process.exit(1);
  }
} else {
  console.log("⚠️  No backup found, skipping restore");
}