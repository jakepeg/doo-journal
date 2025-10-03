#!/usr/bin/env node

// scripts/build-backend.js - Inject environment variables into Motoko backend before build
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const backendPath = path.resolve(process.cwd(), "src/journal_backend/main.mo");
const backupPath = path.resolve(process.cwd(), "src/journal_backend/main.mo.backup");

// Read environment variables
const vetKdKeyName = process.env.VITE_VETKD_KEY_NAME || "dfx_test_key";

console.log(`🔧 Building backend with vetKD key: ${vetKdKeyName}`);

try {
  // Read the main.mo file
  const mainMoContent = fs.readFileSync(backendPath, "utf8");
  
  // Create backup
  fs.writeFileSync(backupPath, mainMoContent);
  
  // Replace the placeholder with the actual key name
  const updatedContent = mainMoContent.replace(
    'let KEY_NAME = "VETKD_KEY_NAME_PLACEHOLDER";',
    `let KEY_NAME = "${vetKdKeyName}";`
  );
  
  // Write the updated content
  fs.writeFileSync(backendPath, updatedContent);
  
  console.log(`✅ Injected KEY_NAME = "${vetKdKeyName}" into main.mo`);
  
  // Build the canister
  console.log("🏗️  Building canister...");
  execSync("dfx build journal_backend", { stdio: "inherit" });
  
  console.log("✅ Backend built successfully");
  
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
} finally {
  // Don't restore automatically - let deployment script handle it
  console.log("📄 Backend build complete (backup saved for later restore)");
}