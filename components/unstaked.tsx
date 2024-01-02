import { useMemo } from "react";
import WithdrawButton from "./withdraw-button";

export default function Unstaked({
  children,
  vaultNfts,
  selectedVaultNFTsLength,
  unpaidReward,
  selecting,
  onSelectAll,
  onWithdraw,
  onConfirm,
  onCancel,
  beginStaking,
  claim,
  handleLockConfirm,
  confirmable,
  rewardEndTs,
}: any) {
  const lockable = useMemo(
    () => rewardEndTs.toNumber() * 1000 > new Date().getTime(),
    [rewardEndTs]
  );

  if (vaultNfts?.length > 0) {
    return (
      <div>
        <div className="flex flex-wrap justify-end items-center mb-4 max-h-16 min-h-[40px]">
          <h2 className="text-center text-base lg:text-xl">
            Vault ({" "}
            {selectedVaultNFTsLength > 0 && `${selectedVaultNFTsLength} / `}
            {vaultNfts.length} )
          </h2>
          <div className="grow"></div>
          {selecting && (
            <div>
              <button
                onClick={onSelectAll}
                className="mr-2 lg:mr-3 text-sm underline hover:no-underline"
              >
                Select All
              </button>
            </div>
          )}
          <div>
            <WithdrawButton
              selecting={selecting}
              onWithdraw={onWithdraw}
              onConfirm={onConfirm}
              onCancel={onCancel}
              confirmable={confirmable}
            />
          </div>
        </div>
        {unpaidReward > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2 bg-stone-900 rounded px-1 text-right">
              {(unpaidReward / 1_000_000).toLocaleString(undefined, {
                minimumFractionDigits: 6,
              })}
            </div>
            <button
              className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
              onClick={claim}
            >
              Claim
            </button>
          </div>
        )}
        {children}
        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={true}
            className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            onClick={beginStaking}
          >
            Stake
          </button>
          <button
            disabled={true}
            className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            onClick={handleLockConfirm}
          >
            Lock
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-4 h-10">
        <h2 className="text-center text-base lg:text-xl">Vault</h2>
      </div>
      <div className="aspect-square">
        <div className="flex items-center justify-center bg-stone-900 backdrop-blur-lg rounded-xl p-10 h-full">
          <p className="text-base clr-p">Select flares and deposit</p>
        </div>
      </div>
      {unpaidReward > 0 && (
        <div className="grid grid-cols-6 items-center gap-4 p-2 mb-3 border rounded-md border-slate-500/30">
              <img
              className="ml-2 w-4"
              src="/assets/icons/LFNTY.svg"
              />
          <div className="col-span-3 text-right text-base">
            {(unpaidReward / 1_000_000).toLocaleString(undefined, {
              minimumFractionDigits: 6,
            })}
          </div>
          <button
            className="w-full col-span-2 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            onClick={claim}
          >
            Claim
          </button>
        </div>
      )}
    </div>
  );
}
