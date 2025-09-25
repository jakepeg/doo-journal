import { createActorWithConfig } from "./src/journal_frontend/src/config";
import canisterIds from "./.dfx/local/canister_ids.json";




async function main() {
  try {
    const canisterId = (canisterIds as any).journal_backend.local;

    console.log("🚀 Creating anonymous actor for canister:", canisterId);

    const actor = await createActorWithConfig({
      agentOptions: { host: "http://127.0.0.1:4943" },
    });

    console.log("✅ Actor created");

    if ("initializeAccessControl" in actor) {
      const result = await (actor as any).initializeAccessControl();
      console.log("✅ initializeAccessControl result:", result);
    } else {
      console.log("ℹ️ No initializeAccessControl in actor – try another method");
    }
  } catch (err) {
    console.error("❌ Actor test failed:", err);
  }
}

main();
