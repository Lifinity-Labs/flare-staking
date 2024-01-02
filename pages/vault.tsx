import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { findFarmerPDA } from "../common/gem-farm";
import useGemFarm from "../hooks/useGemFarm";
import { stringifyPKsAndBNs } from "../common/gem-common";
import Vault from "../components/vault";
import NoFarmerVault from "../components/no-farmer-vault";
import { AnchorError, BN } from "@project-serum/anchor";
import { toast } from "react-toastify";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import ProgressDialog from "../components/progress-dialog";

const FARM_ID = process.env.NEXT_PUBLIC_FARM_ID!;
const FARM_ID_PK = new PublicKey(process.env.NEXT_PUBLIC_FARM_ID!);

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

const Farmer: NextPage = () => {
  const { publicKey, connected } = useWallet();

  const gf = useGemFarm();

  const [farmAcc, setFarmAcc] = useState<any>(null);

  const [farmerAcc, setFarmerAcc] = useState<any>(null);
  const [farmerState, setFarmerState] = useState<any>(null);

  const [unpaidReward, setUnpaidReward] = useState(0);

  const [isOpenLoadingDialog, setIsOpenLoadingDialog] = useState(false);
  const [loadingDialogText, setLoadingDialogText] = useState("");

  useEffect(() => {
    if (farmerState === "staked") {
      const {
        rarityPointsStaked: farmAccRarityPointsStaked,
        rewardA: {
          times: { rewardEndTs },
          variableRate: {
            accruedRewardPerRarityPoint: { n: accruedRewardPerRarityPointN },
            rewardLastUpdatedTs,
            rewardRate: { n: rewardRateN },
          },
        },
      } = farmAcc;
      const {
        rarityPointsStaked: farmerAccRarityPointsStaked,
        rewardA: {
          accruedReward,
          paidOutReward,
          variableRate: {
            lastRecordedAccruedRewardPerRarityPoint: {
              n: lastRecordedAccruedRewardPerRarityPointN,
            },
          },
        },
      } = farmerAcc;

      const interval = setInterval(() => {
        const now = new BN(Date.now() / 1000);
        const upperBound = rewardEndTs.lt(now) ? rewardEndTs : now;

        let newlyAccruedRewardPerRarityPoint = new BN(0);
        if (
          !farmAccRarityPointsStaked.eq(new BN(0)) &&
          upperBound.gt(rewardLastUpdatedTs)
        ) {
          const timeSinceLastCalc = upperBound.sub(rewardLastUpdatedTs);
          newlyAccruedRewardPerRarityPoint = timeSinceLastCalc
            .mul(rewardRateN)
            .div(farmAccRarityPointsStaked);
        }

        const newlyAccruedToFarmer = farmerAccRarityPointsStaked.mul(
          accruedRewardPerRarityPointN
            .add(newlyAccruedRewardPerRarityPoint)
            .sub(lastRecordedAccruedRewardPerRarityPointN)
        );
        const newRewardAmount = accruedReward
          .mul(new BN(1000))
          .add(newlyAccruedToFarmer);
        setUnpaidReward(
          newRewardAmount
            .sub(paidOutReward.mul(new BN(1_000)))
            .div(new BN(1_000))
            .toNumber()
        );
      }, 1000);

      return () => clearInterval(interval);
    } else if (farmerState === "unstaked") {
      if (farmerAcc && farmerAcc.rewardA) {
        const { accruedReward, paidOutReward } = farmerAcc.rewardA;
        setUnpaidReward(accruedReward - paidOutReward);
      }
    }
  }, [farmAcc, farmerAcc, farmerState]);

  const fetchFarm = useCallback(async () => {
    const farmAcc = await gf!.fetchFarmAcc(FARM_ID_PK);
    console.log(`farm found at ${FARM_ID}:`, stringifyPKsAndBNs(farmAcc));
    setFarmAcc(farmAcc);
  }, [gf]);

  const fetchFarmer = useCallback(async () => {
    const [farmerPDA] = await findFarmerPDA(FARM_ID_PK, publicKey!);
    // farmerIdentity.value = getWallet()!.publicKey?.toBase58();
    const farmerAcc = await gf!.fetchFarmerAcc(farmerPDA);
    setFarmerAcc(farmerAcc);
    setFarmerState(gf!.parseFarmerState(farmerAcc));
    // await updateAvailableRewards();
    console.log(
      `farmer found at ${publicKey!.toBase58()}:`,
      stringifyPKsAndBNs(farmerAcc)
    );
  }, [gf, publicKey]);

  const freshStart = useCallback(async () => {
    //reset stuff
    setFarmAcc(null);
    setFarmerAcc(null);
    setFarmerState(null);

    if (gf && publicKey) {
      try {
        await fetchFarm();
        await fetchFarmer();
      } catch (e) {
        console.log(`farm with PK ${FARM_ID} not found :(`);
      }
    }
  }, [gf, publicKey, fetchFarm, fetchFarmer]);

  useEffect(() => {
    (async () => {
      await freshStart();
    })();
  }, [freshStart]);

  const initFarmer = async () => {
    setLoadingDialogText("Creating vault account...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.initFarmerWallet(FARM_ID_PK);
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        if (
          error.message.indexOf(
            "Attempt to debit an account but found no record of a prior credit."
          )
        ) {
          toast.error(
            <div>
              <div>Failed to send transaction</div>
              <div className="max-w-[240px] break-words">
                Attempt to debit an account but found no record of a prior
                credit.
              </div>
            </div>
          );
        }

        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  // --------------------------------------- staking
  const beginStaking = async () => {
    setLoadingDialogText("Staking...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.stakeWallet(FARM_ID_PK);
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarm();
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  const endStaking = async () => {
    setLoadingDialogText("Unstaking...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.unstakeWallet(FARM_ID_PK);
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof AnchorError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              {error.error.errorMessage}
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  const claim = async () => {
    setLoadingDialogText("Claiming...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.claimWallet(
        FARM_ID_PK,
        new PublicKey(farmAcc.rewardA.rewardMint)
      );
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarm();
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  const lock = async () => {
    setLoadingDialogText("Locking...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.lockWallet(FARM_ID_PK);
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  const stakeLock = async () => {
    setLoadingDialogText("Locking...");
    setIsOpenLoadingDialog(true);
    try {
      const { txSig } = await gf!.stakeLockWallet(FARM_ID_PK);
      toast.success(
        <div>
          <div>Success</div>
          <div className="max-w-[240px] truncate">{txSig}</div>
        </div>,
        {
          onClick: () => {
            window.open(`https://solscan.io/tx/${txSig}`, "_blank");
          },
        }
      );
      await wait(5000);
      await fetchFarmer();
    } catch (error) {
      if (error instanceof WalletSignTransactionError) {
        toast.error(
          <div>
            <div>Error</div>
            <div className="max-w-[240px] truncate">
              User rejected the request.
            </div>
          </div>
        );
      } else if (error instanceof Error) {
        const found = error.message.match(
          /Check signature (.*) using the Solana Explorer or CLI tools./
        );
        if (found) {
          toast.error(
            <div>
              <div>Transaction was not confirmed</div>
              <div className="max-w-[240px] truncate">{found[1]}</div>
            </div>,
            {
              onClick: () => {
                window.open(`https://solscan.io/tx/${found[1]}`, "_blank");
              },
            }
          );
        }
      }
    }
    setIsOpenLoadingDialog(false);
    setLoadingDialogText("");
  };

  const handleRefreshFarmer = async () => {
    await fetchFarmer();
  };

  if (publicKey && farmerAcc) {
    return (
      <>
        <Vault
          vault={farmerAcc.vault}
          farmAcc={farmAcc}
          farmerState={farmerState}
          unpaidReward={unpaidReward}
          beginStaking={beginStaking}
          endStaking={endStaking}
          claim={claim}
          lock={lock}
          stakeLock={stakeLock}
        />
        <ProgressDialog open={isOpenLoadingDialog} onClose={() => {}}>
          {loadingDialogText}
        </ProgressDialog>
      </>
    );
  } else {
    return (
      <>
        <NoFarmerVault initFarmer={initFarmer} />
        <ProgressDialog open={isOpenLoadingDialog} onClose={() => {}}>
          {loadingDialogText}
        </ProgressDialog>
      </>
    );
  }
};

export default Farmer;
