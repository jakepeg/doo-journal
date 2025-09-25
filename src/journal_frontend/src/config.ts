// src/journal_frontend/src/config.ts
import { HttpAgent, ActorSubclass } from "@dfinity/agent";
import {
  createActor as generatedCreateActor,
  canisterId as generatedCanisterId,
} from "../../declarations/journal_backend";
import type { _SERVICE } from "../../declarations/journal_backend/journal_backend.did";

const canisterId = import.meta.env.VITE_CANISTER_ID_JOURNAL_BACKEND || generatedCanisterId;

export async function createActorWithConfig(
  options: { agentOptions?: { identity?: any; host?: string } } = {}
): Promise<ActorSubclass<_SERVICE>> {
  const { agentOptions } = options;

  const host =
    agentOptions?.host ||
    import.meta.env.VITE_IC_HOST ||
    (import.meta.env.VITE_DFX_NETWORK === "ic"
      ? "https://ic0.app"
      : "http://127.0.0.1:4943");

  const agent = new HttpAgent({
    identity: agentOptions?.identity,
    host,
  });

  // Fetch root key for certificate validation during development
  if (import.meta.env.VITE_DFX_NETWORK !== "ic") {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn(
        "Unable to fetch root key. Check to ensure your local replica is running"
      );
    }
  }

  if (!canisterId) {
    throw new Error(
      "Canister ID not found. Make sure VITE_CANISTER_ID_JOURNAL_BACKEND is set in your .env file"
    );
  }

  const actor = generatedCreateActor(canisterId, { agent });

  // Expose agent for debugging/hooks if needed
  (actor as any).__getAgent = () => agent;

  console.log("Creating actor with canister ID:", canisterId);
  console.log("Using host:", host);

  return actor;
}
