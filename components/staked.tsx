import { useMemo } from "react";

export default function Staked({
  children,
  vaultNfts,
  unpaidReward,
  claim,
  endStaking,
  handleLockConfirm,
  rewardEndTs,
}: any) {
  const lockable = useMemo(
    () => rewardEndTs.toNumber() * 1000 > new Date().getTime(),
    [rewardEndTs]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 h-10">
        <h2 className="text-center text-base lg:text-xl">
          Staked ( {vaultNfts?.length} )
        </h2>
      </div>
      {children}
      <div className="grid grid-cols-6 items-center gap-4 p-2 mb-3 border rounded-md border-slate-500/30">
        <img className="ml-2 w-4" src="/assets/icons/LFNTY.svg" />
        <div className="col-span-3 text-right text-base">
          {(unpaidReward / 1_000_000).toLocaleString(undefined, {
            minimumFractionDigits: 6,
          })}
        </div>
        <button
          disabled={unpaidReward === 0}
          className="w-full col-span-2 bg-indigo-600 border border-transparent rounded-md shadow-sm py-1 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          onClick={claim}
        >
          Claim
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          onClick={endStaking}
        >
          Unstake
        </button>
        <button
          disabled={!lockable}
          className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          onClick={handleLockConfirm}
        >
          Lock
        </button>
      </div>
    </div>
  );
}
