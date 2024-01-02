import { BN, web3 } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import PQueue from "p-queue";
import { toast } from "react-toastify";
import chunk from "lodash.chunk";
import { getNFTMetadataForMany, getNFTsByOwner } from "../common/web3/NFTget";
import useGemBank from "../hooks/useGemBank";
import ConfirmDialog from "./confirm-dialog";
import Locked from "./locked";
import NFTGrid from "./nft-grid";
import ProgressDialog from "./progress-dialog";
import Staked from "./staked";
import Unstaked from "./unstaked";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

function getUnixTs() {
  return new Date().getTime();
}
const SEND_OPTIONS = {
  skipPreflight: true,
  maxRetries: 2,
};
const IX_CHUNK_SIZE = 20;
const TX_CONCURRENCY = 10;
const TX_TIMEOUT = 60000;
/**
 * awaits confirmation while resending the transaction periodically
 *
 * Our RPC node settings
 * solana_send_leader_count: 8
 * solana_send_retry_ms: 15000
 **/

async function transactionSenderAndConfirmationWaiter(
  connection: Connection,
  signedTransaction: web3.Transaction,
  timeout = TX_TIMEOUT, // 2 minutes, (sendInterval * sendRetries) = 80_000 + extra wait 40_000
  pollInterval = 1000,
  sendInterval = 5000,
  sendRetries = 40
) {
  const rawTransaction = signedTransaction.serialize();
  const txid = await connection.sendRawTransaction(
    rawTransaction,
    SEND_OPTIONS
  );
  const start = getUnixTs();
  let lastSendTimestamp = getUnixTs();
  let retries = 0;

  while (getUnixTs() - start < timeout) {
    const timestamp = getUnixTs();

    if (retries < sendRetries && timestamp - lastSendTimestamp > sendInterval) {
      lastSendTimestamp = timestamp;
      retries += 1;
      await connection.sendRawTransaction(rawTransaction, SEND_OPTIONS);
    }

    const response = await Promise.any([
      connection.getTransaction(txid, {
        commitment: "confirmed",
      }),
      wait(1500),
    ]);
    if (response)
      return {
        txid,
        transactionResponse: response,
      };
    await wait(pollInterval);
  }

  return {
    txid,
    transactionResponse: null,
  };
}

export default function Vault({
  vault,
  farmAcc,
  farmerState,
  unpaidReward,
  beginStaking,
  endStaking,
  claim,
  lock,
  stakeLock,
}: any) {
  const { publicKey, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();
  const gb = useGemBank();

  const [currentWalletNFTs, setCurrentWalletNFTs] = useState<any[]>([]);
  const [currentVaultNFTs, setCurrentVaultNFTs] = useState<any[]>([]);
  const [selectedWalletNFTs, setSelectedWalletNFTs] = useState<any[]>([]);
  const [selectedVaultNFTs, setSelectedVaultNFTs] = useState<any[]>([]);
  const [loadingWalletNFTs, setLoadingWalletNFTs] = useState(false);
  const [loadingVaultNFTs, setLoadingVaultNFTs] = useState(false);

  const [bank, setBank] = useState<any>();

  const [selecting, setSelecting] = useState(false);
  const [isOpenProgressDialog, setIsOpenProgressDialog] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successProgress, setSuccessProgress] = useState(0);
  const [errorProgress, setErrorProgress] = useState(0);

  const [isOpenLockConfirm, setIsOpenLockConfirm] = useState(false);
  const [lockPeriodEndsOn, setLockPeriodEndsOn] = useState("");
  const [rewardRate, setRewardRate] = useState(0);

  // --------------------------------------- populate initial nfts

  const populateWalletNFTs = useCallback(async () => {
    // zero out to begin with
    // setCurrentWalletNFTs([]);
    setLoadingWalletNFTs(true);
    setSelectedWalletNFTs([]);

    if (publicKey) {
      setCurrentWalletNFTs(
        (await getNFTsByOwner(publicKey, connection))
          .filter(
            (nft) =>
              (nft.onchainMetadata as any).updateAuthority ===
                process.env.NEXT_PUBLIC_UPDATE_AUTHORITY &&
              (nft.onchainMetadata as any).data.creators[0].address ===
                process.env.NEXT_PUBLIC_CREATOR_0_ADDRESS
          )
          .sort((a, b) => {
            if (a.mint.toBase58() < b.mint.toBase58()) {
              return -1;
            }
            if (a.mint.toBase58() > b.mint.toBase58()) {
              return 1;
            }
            return 0;
          })
      );
    }
    setLoadingWalletNFTs(false);
  }, [connection, publicKey]);

  const populateVaultNFTs = useCallback(async () => {
    // zero out to begin with
    // setCurrentVaultNFTs([]);
    setLoadingVaultNFTs(true);
    setSelectedVaultNFTs([]);

    const foundGDRs = await gb!.fetchAllGdrPDAs(vault);
    if (foundGDRs && foundGDRs.length) {
      console.log(`found a total of ${foundGDRs.length} gdrs`);

      const mints = foundGDRs.map((gdr: any) => {
        return { mint: gdr.account.gemMint };
      });
      const currentVaultNFTs = await getNFTMetadataForMany(mints, connection);
      setCurrentVaultNFTs(
        currentVaultNFTs.sort((a, b) => {
          if (a.mint.toBase58() < b.mint.toBase58()) {
            return -1;
          }
          if (a.mint.toBase58() > b.mint.toBase58()) {
            return 1;
          }
          return 0;
        })
      );
      console.log(`populated a total of ${currentVaultNFTs.length} vault NFTs`);
    } else {
      setCurrentVaultNFTs([]);
    }
    setLoadingVaultNFTs(false);
  }, [connection, gb, vault]);

  const updateVaultState = useCallback(async () => {
    const vaultAcc = await gb!.fetchVaultAcc(vault);
    setBank(vaultAcc.bank);
  }, [gb, vault]);

  useEffect(() => {
    (async () => {
      await updateVaultState();

      //populate wallet + vault nfts
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    })();
  }, [updateVaultState, populateWalletNFTs, populateVaultNFTs]);

  // --------------------------------------- moving nfts

  const handleWalletSelected = (nft: any, selected: boolean) => {
    if (selected) {
      setSelectedWalletNFTs([...selectedWalletNFTs, nft]);
    } else {
      setSelectedWalletNFTs(
        selectedWalletNFTs.filter((selected) => selected != nft)
      );
    }
  };

  const handleVaultSelected = (nft: any, selected: boolean) => {
    if (selected) {
      setSelectedVaultNFTs([...selectedVaultNFTs, nft]);
    } else {
      setSelectedVaultNFTs(
        selectedVaultNFTs.filter((selected) => selected != nft)
      );
    }
  };

  const handleSelectAllWalletNfts = () => {
    setSelectedWalletNFTs(currentWalletNFTs);
  };

  const handleDeselectAllWalletNfts = () => {
    setSelectedWalletNFTs([]);
  };

  const handleSelectAllVaultNfts = () => {
    setSelectedVaultNFTs(currentVaultNFTs);
  };

  // --------------------------------------- gem bank

  const depositGem = async (
    mint: PublicKey,
    creator: PublicKey,
    source: PublicKey
  ) => {
    const { txSig } = await gb!.depositGemWallet(
      bank,
      vault,
      new BN(1),
      mint,
      source,
      creator
    );
    console.log("deposit done", txSig);
  };

  const fetchDepositGemInstruction = async (
    mint: PublicKey,
    creator: PublicKey,
    source: PublicKey
  ) => {
    const { txi } = await gb!.fetchDepositGemWalletInstruction(
      bank,
      vault,
      new BN(1),
      mint,
      source,
      creator
    );
    console.log("fetch deposit TransactionInstruction", txi);
    return txi;
  };

  const withdrawGem = async (mint: PublicKey) => {
    const { txSig } = await gb!.withdrawGemWallet(bank, vault, new BN(1), mint);
    console.log("withdrawal done", txSig);
  };

  const fetchWithdrawGemInstruction = async (mint: PublicKey) => {
    const { txi } = await gb!.fetchWithdrawGemWalletInstruction(
      bank,
      vault,
      new BN(1),
      mint
    );
    console.log("fetch withdraw TransactionInstruction", txi);
    return txi;
  };

  const handleLockConfirm = async () => {
    const { durationSec, rewardEndTs } = farmAcc.rewardA.times;
    const lockPeriodEndsOn = new Date(rewardEndTs.toNumber() * 1000);
    setLockPeriodEndsOn(lockPeriodEndsOn.toLocaleDateString());
    setRewardRate(
      (rewardEndTs.toNumber() * 1000 - new Date().getTime()) /
        (durationSec.toNumber() * 1000)
    );
    setIsOpenLockConfirm(true);
  };

  useEffect(() => {
    const { durationSec, rewardEndTs } = farmAcc.rewardA.times;
    const lockPeriodEndsOn = new Date(rewardEndTs.toNumber() * 1000);
    setLockPeriodEndsOn(lockPeriodEndsOn.toLocaleDateString());
    const interval = setInterval(() => {
      setRewardRate(
        (rewardEndTs.toNumber() * 1000 - new Date().getTime()) /
          (durationSec.toNumber() * 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [farmAcc.rewardA.times]);

  const nftGrid = (
    <div className="relative">
      <NFTGrid
        nfts={currentVaultNFTs}
        checkbox={selecting}
        selectedNfts={selectedVaultNFTs}
        toggleSelect={handleVaultSelected}
      />
      {loadingVaultNFTs && (
        <div className="absolute inset-0">
          <div className="aspect-square flex justify-center items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );

  let vaultAreaComponent;
  if (farmerState === "unstaked") {
    vaultAreaComponent = (
      <Unstaked
        vaultNfts={currentVaultNFTs}
        selectedVaultNFTsLength={selectedVaultNFTs.length}
        unpaidReward={unpaidReward}
        selecting={selecting}
        onSelectAll={handleSelectAllVaultNfts}
        onWithdraw={() => {
          setSelecting(true);
        }}
        onConfirm={async () => {
          setMoveLeft(true);
          setIsOpenProgressDialog(true);

          const txis = [];
          for (const nft of selectedVaultNFTs) {
            const txi = await fetchWithdrawGemInstruction(nft.mint);
            txis.push(txi);
          }

          const ixsList = chunk(chunk(txis, 3), IX_CHUNK_SIZE);
          const results = [];
          try {
            for (const ixses of ixsList) {
              const { blockhash } = await connection.getLatestBlockhash();
              const txsWithBlockhash = ixses.map((ixs) => {
                const tx = new web3.Transaction({
                  recentBlockhash: blockhash,
                  feePayer: publicKey,
                });
                ixs.forEach((ix) => tx.add(ix));
                return tx;
              });
              const signedTx = await signAllTransactions!(txsWithBlockhash);
              const queue = new PQueue({ concurrency: TX_CONCURRENCY });
              const result = await queue.addAll(
                signedTx.map(
                  (tx) => () =>
                    transactionSenderAndConfirmationWaiter(connection, tx).then(
                      (values) => {
                        setProgress((progress) => ++progress);
                        if (values.transactionResponse) {
                          setSuccessProgress(
                            (successProgress) => ++successProgress
                          );
                        } else {
                          setErrorProgress((errorProgress) => ++errorProgress);
                        }
                        return values;
                      }
                    )
                )
              );
              results.push(result);
            }
            const successCount = results
              .flat()
              .reduce((pre, cur) => (cur.transactionResponse ? ++pre : pre), 0);
            const errorCount = results
              .flat()
              .reduce((pre, cur) => (cur.transactionResponse ? pre : ++pre), 0);
            if (errorCount > 0) {
              toast.error(
                <div>
                  <div>Error</div>
                  <div className="max-w-[240px] truncate">
                    Withdraw unconfirmed: {errorCount}
                  </div>
                </div>
              );
            } else {
              toast.success(
                <div>
                  <div>Success</div>
                  <div className="max-w-[240px] truncate">
                    Withdraw confirmed: {successCount}
                  </div>
                </div>
              );
            }
            await wait(5000);
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
            }
          }
          await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
          setSelecting(false);
          setIsOpenProgressDialog(false);
          setProgress(0);
          setSuccessProgress(0);
          setErrorProgress(0);
        }}
        onCancel={() => {
          setSelectedVaultNFTs([]);
          setSelecting(false);
        }}
        beginStaking={beginStaking}
        claim={claim}
        handleLockConfirm={handleLockConfirm}
        confirmable={selectedVaultNFTs.length > 0}
        rewardEndTs={farmAcc.rewardA.times.rewardEndTs}
      >
        {nftGrid}
      </Unstaked>
    );
  }
  if (farmerState === "staked") {
    vaultAreaComponent = (
      <Staked
        vaultNfts={currentVaultNFTs}
        endStaking={endStaking}
        unpaidReward={unpaidReward}
        claim={claim}
        handleLockConfirm={handleLockConfirm}
        rewardEndTs={farmAcc.rewardA.times.rewardEndTs}
      >
        {nftGrid}
      </Staked>
    );
  }
  if (farmerState === "locked") {
    vaultAreaComponent = (
      <Locked
        vaultNfts={currentVaultNFTs}
        rewardEndTs={farmAcc.rewardA.times.rewardEndTs}
        endStaking={endStaking}
      >
        {nftGrid}
      </Locked>
    );
  }

  return (
    <div className="container">
      <div className="text-center">
        <h1 className="inline-block my-4 text-2xl font-semibold clr-p">
          Lifinity Flare Vault
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-y-6 md:grid-cols-2">
        <section className="flex-1 ml-8 lg:ml-24 pr-8 md:border-r-2 border-black/20">
          <div className="flex justify-between items-center mb-4 h-10">
            <h2 className="text-center text-base lg:text-xl">
              Your wallet ({" "}
              {selectedWalletNFTs.length > 0 &&
                `${selectedWalletNFTs.length} / `}
              {currentWalletNFTs?.length} )
            </h2>
            {farmerState === "unstaked" && (
              <div>
                {selectedWalletNFTs.length > 0 && (
                  <button
                    onClick={handleDeselectAllWalletNfts}
                    className="text-sm underline hover:no-underline"
                  >
                    Deselect All
                  </button>
                )}
                {selectedWalletNFTs.length !== currentWalletNFTs.length && (
                  <button
                    onClick={handleSelectAllWalletNfts}
                    className="ml-2 text-sm underline hover:no-underline"
                  >
                    Select All
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <NFTGrid
              nfts={currentWalletNFTs}
              checkbox={farmerState === "unstaked"}
              selectedNfts={selectedWalletNFTs}
              toggleSelect={handleWalletSelected}
            />
            {loadingWalletNFTs && (
              <div className="absolute inset-0">
                <div className="aspect-square flex justify-center items-center">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>
          <div>
            {farmerState === "unstaked" && (
              <button
                disabled={true}
                className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
                onClick={async () => {
                  setMoveLeft(false);
                  setIsOpenProgressDialog(true);

                  const txis = [];
                  for (const nft of selectedWalletNFTs) {
                    const txi = await fetchDepositGemInstruction(
                      nft.mint,
                      new PublicKey(process.env.NEXT_PUBLIC_CREATOR_0_ADDRESS!),
                      nft.pubkey
                    );
                    txis.push(txi);
                  }

                  const ixsList = chunk(chunk(txis, 3), IX_CHUNK_SIZE);
                  const results = [];
                  try {
                    for (const ixses of ixsList) {
                      const { blockhash } =
                        await connection.getLatestBlockhash();
                      const txsWithBlockhash = ixses.map((ixs) => {
                        const tx = new web3.Transaction({
                          recentBlockhash: blockhash,
                          feePayer: publicKey,
                        });
                        ixs.forEach((ix) => tx.add(ix));
                        return tx;
                      });
                      const signedTx = await signAllTransactions!(txsWithBlockhash);
                      const queue = new PQueue({ concurrency: TX_CONCURRENCY });
                      const result = await queue.addAll(
                        signedTx.map(
                          (tx) => () =>
                            transactionSenderAndConfirmationWaiter(
                              connection,
                              tx
                            ).then((values) => {
                              setProgress((progress) => ++progress);
                              if (values.transactionResponse) {
                                setSuccessProgress(
                                  (successProgress) => ++successProgress
                                );
                              } else {
                                setErrorProgress(
                                  (errorProgress) => ++errorProgress
                                );
                              }
                              return values;
                            })
                        )
                      );
                      results.push(result);
                    }
                    const successCount = results
                      .flat()
                      .reduce(
                        (pre, cur) => (cur.transactionResponse ? ++pre : pre),
                        0
                      );
                    const errorCount = results
                      .flat()
                      .reduce(
                        (pre, cur) => (cur.transactionResponse ? pre : ++pre),
                        0
                      );
                    if (errorCount > 0) {
                      toast.error(
                        <div>
                          <div>Error</div>
                          <div className="max-w-[240px] truncate">
                            Deposit unconfirmed: {errorCount}
                          </div>
                        </div>
                      );
                    } else {
                      toast.success(
                        <div>
                          <div>Success</div>
                          <div className="max-w-[240px] truncate">
                            Deposit confirmed: {successCount}
                          </div>
                        </div>
                      );
                    }
                    await wait(5000);
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
                    }
                  }
                  await Promise.all([
                    populateWalletNFTs(),
                    populateVaultNFTs(),
                  ]);
                  setIsOpenProgressDialog(false);
                  setProgress(0);
                  setSuccessProgress(0);
                  setErrorProgress(0);
                }}
              >
                Deposit
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-stone-400 italic">
            * Wallets cannot stake and lock simultaneously<br />
            * Flares cannot be deposited into vaults that are staked or locked
          </p>
        </section>
        <section className="flex-1 mr-8 lg:mr-24 pl-8 md:border-l-2 border-slate-500/10">
          {vaultAreaComponent}
        </section>
      </div>
      <ProgressDialog open={isOpenProgressDialog} onClose={() => {}}>
        {moveLeft ? "Withdrawing" : "Depositing"}... [{progress}/
        {moveLeft
          ? Math.ceil(selectedVaultNFTs.length / 3)
          : Math.ceil(selectedWalletNFTs.length / 3)}{" "}
        Transactions]
        <br />
        Confirmed: {successProgress}&nbsp;&nbsp;Unconfirmed: {errorProgress}
      </ProgressDialog>
      <ConfirmDialog
        open={isOpenLockConfirm}
        onClose={() => setIsOpenLockConfirm(false)}
        onLock={async () => {
          if (farmerState === "unstaked") {
            await stakeLock();
          } else if (farmerState === "staked") {
            await lock();
          }
          setIsOpenLockConfirm(false);
        }}
        numberOfFlaresToLock={currentVaultNFTs.length}
        rewardRate={rewardRate}
        lockPeriodEndsOn={lockPeriodEndsOn}
      ></ConfirmDialog>
    </div>
  );
}
