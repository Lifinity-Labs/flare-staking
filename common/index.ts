import { PublicKey } from "@solana/web3.js";

export const GEM_BANK_PROG_ID = new PublicKey(
  process.env.NEXT_PUBLIC_GEM_BANK_PROG_ID!
);
export const GEM_FARM_PROG_ID = new PublicKey(
  process.env.NEXT_PUBLIC_GEM_FARM_PROG_ID!
);
export const LOCKER_PROG_ID = new PublicKey(
  process.env.NEXT_PUBLIC_LOCKER_PROG_ID!
);
