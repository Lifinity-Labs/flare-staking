import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { GemFarm } from "../types/gem_farm";
import { isKp } from "../gem-common";
import { findVaultPDA, GemBankClient } from "../gem-bank";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  findFarmAuthorityPDA,
  findFarmerPDA,
  findFarmTreasuryPDA,
  findRewardsPotPDA,
} from "./gem-farm.pda";

const locker = new PublicKey(process.env.NEXT_PUBLIC_LOCKER!);
const lockerVault = new PublicKey(process.env.NEXT_PUBLIC_LOCKER_VAULT!);
const rewardMint = new PublicKey(process.env.NEXT_PUBLIC_REWARD_MINT!);

export class GemFarmClient extends GemBankClient {
  farmProgram!: anchor.Program<GemFarm>;
  lockerProgram!: anchor.Program<any>;

  constructor(
    conn: Connection,
    // @ts-ignore
    wallet: any,
    farmIdl?: Idl,
    farmProgramId?: PublicKey,
    bankIdl?: Idl,
    bankProgramId?: PublicKey,
    lockerIdl?: Idl,
    lockerProgramId?: PublicKey
  ) {
    super(conn, wallet, bankIdl, bankProgramId);
    this.setFarmProgram(farmIdl, farmProgramId);
    this.setLockerProgram(lockerIdl, lockerProgramId);
  }

  setFarmProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.farmProgram = new anchor.Program<GemFarm>(
        idl as any,
        programId,
        this.provider
      );
    } else {
      //means running inside test suite
      // @ts-ignore
      this.farmProgram = anchor.workspace.GemFarm as Program<GemFarm>;
    }
  }

  setLockerProgram(idl?: Idl, programId?: PublicKey) {
    //instantiating program depends on the environment
    if (idl && programId) {
      //means running in prod
      this.lockerProgram = new anchor.Program<any>(
        idl as any,
        programId,
        this.provider
      );
    } else {
      //means running inside test suite
      // @ts-ignore
      this.lockerProgram = anchor.workspace.GemFarm as Program<any>;
    }
  }

  // --------------------------------------- fetch deserialized accounts

  async fetchFarmAcc(farm: PublicKey) {
    return this.farmProgram.account.farm.fetch(farm);
  }

  async fetchFarmerAcc(farmer: PublicKey) {
    return this.farmProgram.account.farmer.fetch(farmer);
  }

  // --------------------------------------- farmer ops ixs

  async initFarmer(
    farm: PublicKey,
    farmerIdentity: PublicKey | Keypair,
    payer: PublicKey | Keypair
  ) {
    const identityPk = isKp(farmerIdentity)
      ? (<Keypair>farmerIdentity).publicKey
      : <PublicKey>farmerIdentity;

    const farmAcc = await this.fetchFarmAcc(farm);

    const [farmer, farmerBump] = await findFarmerPDA(farm, identityPk);
    const [vault, vaultBump] = await findVaultPDA(farmAcc.bank, identityPk);

    const signers = [];
    if (isKp(farmerIdentity)) signers.push(<Keypair>farmerIdentity);
    if (isKp(payer)) signers.push(<Keypair>payer);

    console.log("adding farmer", identityPk.toBase58());
    const txSig = await this.farmProgram.rpc.initFarmer({
      accounts: {
        farm,
        farmer,
        identity: identityPk,
        payer: isKp(payer) ? (<Keypair>payer).publicKey : payer,
        // feeAcc: feeAccount,
        bank: farmAcc.bank,
        vault,
        gemBank: this.bankProgram.programId,
        systemProgram: SystemProgram.programId,
      } as any,
      signers,
    });

    return {
      farmer,
      farmerBump,
      vault,
      vaultBump,
      txSig,
    };
  }

  async stakeCommon(
    farm: PublicKey,
    farmerIdentity: PublicKey | Keypair,
    unstake = false,
    skipRewards = false
  ) {
    const identityPk = isKp(farmerIdentity)
      ? (<Keypair>farmerIdentity).publicKey
      : <PublicKey>farmerIdentity;

    const farmAcc = await this.fetchFarmAcc(farm);

    const [farmer, farmerBump] = await findFarmerPDA(farm, identityPk);
    const [vault, vaultBump] = await findVaultPDA(farmAcc.bank, identityPk);
    const [farmAuth, farmAuthBump] = await findFarmAuthorityPDA(farm);
    const [farmTreasury, farmTreasuryBump] = await findFarmTreasuryPDA(farm);

    const signers = [];
    if (isKp(farmerIdentity)) signers.push(<Keypair>farmerIdentity);

    let txSig;
    if (unstake) {
      console.log("UNstaking gems for", identityPk.toBase58());
      txSig = await this.farmProgram.rpc.unstake(
        farmAuthBump,
        farmTreasuryBump,
        farmerBump,
        skipRewards,
        {
          accounts: {
            farm,
            farmer,
            farmTreasury,
            identity: identityPk,
            bank: farmAcc.bank,
            vault,
            farmAuthority: farmAuth,
            gemBank: this.bankProgram.programId,
            systemProgram: SystemProgram.programId,
          },
          signers,
        }
      );
    } else {
      console.log("staking gems for", identityPk.toBase58());
      txSig = await this.farmProgram.rpc.stake(farmAuthBump, farmerBump, {
        accounts: {
          farm,
          farmer,
          identity: identityPk,
          bank: farmAcc.bank,
          vault,
          farmAuthority: farmAuth,
          gemBank: this.bankProgram.programId,
        },
        signers,
      });
    }

    return {
      farmer,
      farmerBump,
      vault,
      vaultBump,
      farmAuth,
      farmAuthBump,
      farmTreasury,
      farmTreasuryBump,
      txSig,
    };
  }

  async stake(farm: PublicKey, farmerIdentity: PublicKey | Keypair) {
    return this.stakeCommon(farm, farmerIdentity, false);
  }

  async unstake(
    farm: PublicKey,
    farmerIdentity: PublicKey | Keypair,
    skipRewards = false
  ) {
    return this.stakeCommon(farm, farmerIdentity, true, skipRewards);
  }

  async claim(
    farm: PublicKey,
    farmerIdentity: PublicKey | Keypair,
    rewardAMint: PublicKey
  ) {
    const identityPk = isKp(farmerIdentity)
      ? (<Keypair>farmerIdentity).publicKey
      : <PublicKey>farmerIdentity;

    const [farmAuth, farmAuthBump] = await findFarmAuthorityPDA(farm);
    const [farmer, farmerBump] = await findFarmerPDA(farm, identityPk);

    const [potA, potABump] = await findRewardsPotPDA(farm, rewardAMint);

    const rewardADestination = await this.findATA(rewardAMint, identityPk);

    const signers = [];
    if (isKp(farmerIdentity)) signers.push(<Keypair>farmerIdentity);

    const txSig = await this.farmProgram.rpc.claim(
      farmAuthBump,
      farmerBump,
      potABump,
      {
        accounts: {
          farm,
          farmAuthority: farmAuth,
          farmer,
          identity: identityPk,
          rewardAPot: potA,
          rewardAMint,
          rewardADestination,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers,
      }
    );

    return {
      farmAuth,
      farmAuthBump,
      farmer,
      farmerBump,
      potA,
      potABump,
      rewardADestination,
      txSig,
    };
  }

  async lock(farm: PublicKey, farmerIdentity: PublicKey | Keypair) {
    const identityPk = isKp(farmerIdentity)
      ? (<Keypair>farmerIdentity).publicKey
      : <PublicKey>farmerIdentity;
    const farmAcc = await this.fetchFarmAcc(farm);

    const [farmer, farmerBump] = await findFarmerPDA(farm, identityPk);
    const [farmAuth, farmAuthBump] = await findFarmAuthorityPDA(farm);
    const [rewardAPot, rewardAPotBump] = await findRewardsPotPDA(
      farm,
      rewardMint
    );
    const [escrow, escrowBump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("Escrow"),
        locker.toBuffer(),
        identityPk.toBuffer(),
      ],
      this.lockerProgram.programId
    );

    try {
      await this.lockerProgram.account.escrow.fetch(escrow);
    } catch (e: any) {
      if (e.toString().includes("Account does not exist")) {
        await this.lockerProgram.methods
          .newEscrow()
          .accounts({
            locker,
            escrow,
            escrowOwner: identityPk,
            payer: identityPk,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(`created an escrow account: ${escrow.toBase58()}`);
      }
    }

    const signers: any[] = [];

    console.log("staking gems for", identityPk.toBase58());
    const txSig = await this.farmProgram.rpc.lock(
      farmAuthBump,
      farmerBump,
      rewardAPotBump,
      {
        accounts: {
          farm,
          farmer,
          identity: identityPk,
          bank: farmAcc.bank,
          farmAuthority: farmAuth,
          rewardPot: rewardAPot,
          rewardMint,
          locker: locker,
          escrow: escrow,
          vault: lockerVault,
          lockerProgram: this.lockerProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any,
        signers,
      }
    );

    return {
      farmer,
      farmerBump,
      farmAuth,
      farmAuthBump,
      txSig,
    };
  }

  async stakeLock(farm: PublicKey, farmerIdentity: PublicKey | Keypair) {
    const identityPk = isKp(farmerIdentity)
      ? (<Keypair>farmerIdentity).publicKey
      : <PublicKey>farmerIdentity;

    const farmAcc = await this.fetchFarmAcc(farm);

    const [farmer, farmerBump] = await findFarmerPDA(farm, identityPk);
    const [vault, vaultBump] = await findVaultPDA(farmAcc.bank, identityPk);
    const [farmAuth, farmAuthBump] = await findFarmAuthorityPDA(farm);
    const [rewardAPot, rewardAPotBump] = await findRewardsPotPDA(
      farm,
      rewardMint
    );
    const [escrow, escrowBump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("Escrow"),
        locker.toBuffer(),
        identityPk.toBuffer(),
      ],
      this.lockerProgram.programId
    );

    try {
      await this.lockerProgram.account.escrow.fetch(escrow);
    } catch (e: any) {
      if (e.toString().includes("Account does not exist")) {
        await this.lockerProgram.methods
          .newEscrow()
          .accounts({
            locker,
            escrow,
            escrowOwner: identityPk,
            payer: identityPk,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(`created an escrow account: ${escrow.toBase58()}`);
      }
    }

    const signers: any[] = [];

    console.log("staking gems for", identityPk.toBase58());
    const ix1 = await this.farmProgram.instruction.stake(
      farmAuthBump,
      farmerBump,
      {
        accounts: {
          farm,
          farmer,
          identity: identityPk,
          bank: farmAcc.bank,
          vault,
          farmAuthority: farmAuth,
          gemBank: this.bankProgram.programId,
        },
        signers,
      }
    );

    const ix2 = await this.farmProgram.instruction.lock(
      farmAuthBump,
      farmerBump,
      rewardAPotBump,
      {
        accounts: {
          farm,
          farmer,
          identity: identityPk,
          bank: farmAcc.bank,
          farmAuthority: farmAuth,
          rewardPot: rewardAPot,
          rewardMint,
          locker: locker,
          escrow: escrow,
          vault: lockerVault,
          lockerProgram: this.lockerProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any,
        signers,
      }
    );

    const tx = new Transaction();
    tx.add(ix1, ix2);

    const txSig = await (
      this.farmProgram.provider as AnchorProvider
    ).sendAndConfirm(tx);

    return {
      farmer,
      farmerBump,
      vault,
      vaultBump,
      farmAuth,
      farmAuthBump,
      txSig,
    };
  }

  // --------------------------------------- helpers

  //returns "staked" / "unstaked" / "pendingCooldown"
  parseFarmerState(farmer: any): string {
    return Object.keys(farmer.state)[0];
  }
}
