import { useMemo } from "react";

export default function Locked({
  children,
  vaultNfts,
  rewardEndTs,
  endStaking,
}: any) {
  const unlockable = useMemo(
    () => rewardEndTs.toNumber() * 1000 < new Date().getTime(),
    [rewardEndTs]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 h-10">
        <h2 className="text-center text-base lg:text-xl">
          Locked ( {vaultNfts?.length} )
        </h2>
      </div>

      <div className="relative">
        {children}
      </div>

      {unlockable && (
        <div>
          <button
            className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            onClick={endStaking}
          >
            Unlock
          </button>
        </div>
      )}
    </div>
  );
}
