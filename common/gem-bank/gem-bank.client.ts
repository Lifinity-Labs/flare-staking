import * as anchor from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  Provider,
  web3,
} from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { GemBank } from "../types/gem_bank";
import { AccountUtils } from "../gem-common/account-utils";
import {
  findGdrPDA,
  findGemBoxPDA,
  findRarityPDA,
  findVaultAuthorityPDA,
} from "./gem-bank.pda";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export class GemBankClient extends AccountUtils {
  wallet: AnchorWallet;
  provider!: Provider;
  bankProgram!: Program<GemBank>;

  constructor(
    conn: Connection,
    wallet: AnchorWallet,
    idl?: Idl,
    programId?: PublicKey
  ) {
    super(conn);
    this.wallet = wallet;
    this.setProvider();
    this.setBankProgram(idl, programId);
  }

  setProvider() {
    this.provider = new AnchorProvider(this.conn, this.wallet, {
      preflightCommitment: "processed",
    });
  }

  setBankProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.bankProgram = new anchor.Program<GemBank>(
        idl as any,
        programId,
        this.provider
      );
    } else {
      //means running inside test suite
      // @ts-ignore
      this.bankProgram = anchor.workspace.GemBank as Program<GemBank>;
    }
  }

  async fetchVaultAcc(vault: PublicKey) {
    return this.bankProgram.account.vault.fetch(vault);
  }

  async fetchAllGdrPDAs(vault?: PublicKey) {
    const filter = vault
      ? [
          {
            memcmp: {
              offset: 8, //need to prepend 8 bytes for anchor's disc
              bytes: vault.toBase58(),
            },
          },
        ]
      : [];
    const pdas = await this.bankProgram.account.gemDepositReceipt.all(filter);
    console.log(`found a total of ${pdas.length} GDR PDAs`);
    return pdas;
  }

  async depositGem(
    bank: PublicKey,
    vault: PublicKey,
    vaultOwner: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    gemSource: PublicKey,
    mintProof?: PublicKey,
    metadata?: PublicKey,
    creatorProof?: PublicKey
  ) {
    const [gemBox, gemBoxBump] = await findGemBoxPDA(vault, gemMint);
    const [GDR, GDRBump] = await findGdrPDA(vault, gemMint);
    const [vaultAuth, vaultAuthBump] = await findVaultAuthorityPDA(vault);
    const [gemRarity, gemRarityBump] = await findRarityPDA(bank, gemMint);

    const remainingAccounts = [];
    if (mintProof)
      remainingAccounts.push({
        pubkey: mintProof,
        isWritable: false,
        isSigner: false,
      });
    if (metadata)
      remainingAccounts.push({
        pubkey: metadata,
        isWritable: false,
        isSigner: false,
      });
    if (creatorProof)
      remainingAccounts.push({
        pubkey: creatorProof,
        isWritable: false,
        isSigner: false,
      });

    const signers: any[] = [];

    console.log(
      `depositing ${gemAmount} gems into ${gemBox.toBase58()}, GDR ${GDR.toBase58()}`
    );
    const txSig = await this.bankProgram.rpc.depositGem(
      vaultAuthBump,
      gemRarityBump,
      gemAmount,
      {
        accounts: {
          bank,
          vault,
          owner: vaultOwner,
          authority: vaultAuth,
          gemBox,
          gemDepositReceipt: GDR,
          gemSource,
          gemMint,
          gemRarity,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts,
        signers,
      }
    );

    return {
      vaultAuth,
      vaultAuthBump,
      gemBox,
      gemBoxBump,
      GDR,
      GDRBump,
      gemRarity,
      gemRarityBump,
      txSig,
    };
  }

  async fetchDepositGemInstruction(
    bank: PublicKey,
    vault: PublicKey,
    vaultOwner: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    gemSource: PublicKey,
    mintProof?: PublicKey,
    metadata?: PublicKey,
    creatorProof?: PublicKey
  ) {
    const [gemBox, gemBoxBump] = await findGemBoxPDA(vault, gemMint);
    const [GDR, GDRBump] = await findGdrPDA(vault, gemMint);
    const [vaultAuth, vaultAuthBump] = await findVaultAuthorityPDA(vault);
    const [gemRarity, gemRarityBump] = await findRarityPDA(bank, gemMint);

    const remainingAccounts = [];
    if (mintProof)
      remainingAccounts.push({
        pubkey: mintProof,
        isWritable: false,
        isSigner: false,
      });
    if (metadata)
      remainingAccounts.push({
        pubkey: metadata,
        isWritable: false,
        isSigner: false,
      });
    if (creatorProof)
      remainingAccounts.push({
        pubkey: creatorProof,
        isWritable: false,
        isSigner: false,
      });

    const signers: any[] = [];

    console.log(
      `depositing ${gemAmount} gems into ${gemBox.toBase58()}, GDR ${GDR.toBase58()}`
    );
    const txi = this.bankProgram.instruction.depositGem(
      vaultAuthBump,
      gemRarityBump,
      gemAmount,
      {
        accounts: {
          bank,
          vault,
          owner: vaultOwner,
          authority: vaultAuth,
          gemBox,
          gemDepositReceipt: GDR,
          gemSource,
          gemMint,
          gemRarity,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts,
        signers,
      }
    );

    return {
      vaultAuth,
      vaultAuthBump,
      gemBox,
      gemBoxBump,
      GDR,
      GDRBump,
      gemRarity,
      gemRarityBump,
      txi,
    };
  }

  async withdrawGem(
    bank: PublicKey,
    vault: PublicKey,
    vaultOwner: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    receiver: PublicKey
  ) {
    const [gemBox, gemBoxBump] = await findGemBoxPDA(vault, gemMint);
    const [GDR, GDRBump] = await findGdrPDA(vault, gemMint);
    const [vaultAuth, vaultAuthBump] = await findVaultAuthorityPDA(vault);
    const [gemRarity, gemRarityBump] = await findRarityPDA(bank, gemMint);

    const gemDestination = await this.findATA(gemMint, receiver);

    const signers: any[] = [];

    console.log(
      `withdrawing ${gemAmount} gems from ${gemBox.toBase58()}, GDR ${GDR.toBase58()}`
    );
    const txSig = await this.bankProgram.rpc.withdrawGem(
      vaultAuthBump,
      gemBoxBump,
      GDRBump,
      gemRarityBump,
      gemAmount,
      {
        accounts: {
          bank,
          vault,
          owner: vaultOwner,
          authority: vaultAuth,
          gemBox,
          gemDepositReceipt: GDR,
          gemDestination,
          gemMint,
          gemRarity,
          receiver,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        signers,
      }
    );

    return {
      gemBox,
      gemBoxBump,
      GDR,
      GDRBump,
      gemRarity,
      gemRarityBump,
      vaultAuth,
      vaultAuthBump,
      gemDestination,
      txSig,
    };
  }

  async fetchWithdrawGemInstruction(
    bank: PublicKey,
    vault: PublicKey,
    vaultOwner: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    receiver: PublicKey
  ) {
    const [gemBox, gemBoxBump] = await findGemBoxPDA(vault, gemMint);
    const [GDR, GDRBump] = await findGdrPDA(vault, gemMint);
    const [vaultAuth, vaultAuthBump] = await findVaultAuthorityPDA(vault);
    const [gemRarity, gemRarityBump] = await findRarityPDA(bank, gemMint);

    const gemDestination = await this.findATA(gemMint, receiver);

    const signers: any[] = [];

    console.log(
      `withdrawing ${gemAmount} gems from ${gemBox.toBase58()}, GDR ${GDR.toBase58()}`
    );
    const txi = await this.bankProgram.instruction.withdrawGem(
      vaultAuthBump,
      gemBoxBump,
      GDRBump,
      gemRarityBump,
      gemAmount,
      {
        accounts: {
          bank,
          vault,
          owner: vaultOwner,
          authority: vaultAuth,
          gemBox,
          gemDepositReceipt: GDR,
          gemDestination,
          gemMint,
          gemRarity,
          receiver,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        signers,
      }
    );

    return {
      gemBox,
      gemBoxBump,
      GDR,
      GDRBump,
      gemRarity,
      gemRarityBump,
      vaultAuth,
      vaultAuthBump,
      gemDestination,
      txi,
    };
  }
}
