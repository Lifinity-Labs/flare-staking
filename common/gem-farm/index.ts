import { Idl } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { GEM_FARM_PROG_ID, GEM_BANK_PROG_ID, LOCKER_PROG_ID } from "..";
import { GemFarmClient } from "./gem-farm.client";

export * from "./gem-farm.pda";
export * from "./gem-farm.client";

export class GemFarm extends GemFarmClient {
  constructor(
    conn: Connection,
    wallet: any,
    farmIdl: Idl,
    bankIdl: Idl,
    lockerIdl: Idl
  ) {
    super(
      conn,
      wallet,
      farmIdl,
      GEM_FARM_PROG_ID,
      bankIdl,
      GEM_BANK_PROG_ID,
      lockerIdl,
      LOCKER_PROG_ID
    );
  }

  async initFarmerWallet(farm: PublicKey) {
    const result = await this.initFarmer(
      farm,
      this.wallet.publicKey,
      this.wallet.publicKey
    );

    console.log("initialized new farmer", this.wallet.publicKey.toBase58());

    return result;
  }

  async stakeWallet(farm: PublicKey) {
    const result = await this.stake(farm, this.wallet.publicKey);

    console.log("begun staking for farmer", this.wallet.publicKey.toBase58());

    return result;
  }

  async unstakeWallet(farm: PublicKey) {
    const result = await this.unstake(farm, this.wallet.publicKey);

    console.log("ended staking for farmer", this.wallet.publicKey.toBase58());

    return result;
  }

  async claimWallet(farm: PublicKey, rewardAMint: PublicKey) {
    const result = await this.claim(farm, this.wallet.publicKey, rewardAMint);

    console.log("claimed rewards for farmer", this.wallet.publicKey.toBase58());

    return result;
  }

  async lockWallet(farm: PublicKey) {
    const result = await this.lock(farm, this.wallet.publicKey);

    console.log("locked rewards for farmer", this.wallet.publicKey.toBase58());

    return result;
  }

  async stakeLockWallet(farm: PublicKey) {
    const result = await this.stakeLock(farm, this.wallet.publicKey);

    console.log(
      "stakeLocked rewards for farmer",
      this.wallet.publicKey.toBase58()
    );

    return result;
  }
}
