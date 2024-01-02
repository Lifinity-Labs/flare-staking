import { programs } from "@metaplex/js";
import { BN, Idl } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { GEM_BANK_PROG_ID } from "..";
import { GemBankClient } from "./gem-bank.client";
import { findWhitelistProofPDA } from "./gem-bank.pda";

export * from "./gem-bank.pda";
export * from "./gem-bank.client";

export class GemBank extends GemBankClient {
  constructor(conn: Connection, wallet: AnchorWallet, idl: Idl) {
    super(conn, wallet, idl, GEM_BANK_PROG_ID);
  }

  async depositGemWallet(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    gemSource: PublicKey,
    creator: PublicKey
  ) {
    const [mintProof, bump] = await findWhitelistProofPDA(bank, gemMint);
    const [creatorProof, bump2] = await findWhitelistProofPDA(bank, creator);
    const metadata = await programs.metadata.Metadata.getPDA(gemMint);

    return this.depositGem(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      gemSource,
      mintProof,
      metadata,
      creatorProof
    );
  }

  async fetchDepositGemWalletInstruction(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    gemSource: PublicKey,
    creator: PublicKey
  ) {
    const [mintProof, bump] = await findWhitelistProofPDA(bank, gemMint);
    const [creatorProof, bump2] = await findWhitelistProofPDA(bank, creator);
    const metadata = await programs.metadata.Metadata.getPDA(gemMint);

    return this.fetchDepositGemInstruction(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      gemSource,
      mintProof,
      metadata,
      creatorProof
    );
  }

  async withdrawGemWallet(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey
  ) {
    return this.withdrawGem(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      this.wallet.publicKey
    );
  }

  async fetchWithdrawGemWalletInstruction(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey
  ) {
    return this.fetchWithdrawGemInstruction(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      this.wallet.publicKey
    );
  }
}
