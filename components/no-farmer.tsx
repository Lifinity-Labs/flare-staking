import { useWallet } from "@solana/wallet-adapter-react";

export default function NoFarmer({ initFarmer }: { initFarmer: () => void }) {
  const { connected } = useWallet();

  return (
    <div>
      <div className="flex justify-between items-center mb-4 h-10">
        <h2 className="text-center text-base lg:text-xl">Vault</h2>
      </div>
      <div className="aspect-square bg-stone-900 backdrop-blur-lg rounded-xl p-10 flex flex-col justify-center">
        <p className="text-base">
          Flares can be staked to receive LFNTY over the course of a year or
          locked to receive your share of LFNTY upfront as 4-year locked
          veLFNTY.
        </p>
        <ol className="list-decimal mt-3 mb-5 ml-6 text-base">
          <li className="text-white">Create a vault account</li>
          <li className="text-white">Deposit your Flares into the vault</li>
          <li className="text-white">Stake or lock the vault</li>
        </ol>
        <p className="text-sm text-stone-400 italic">
          *Wallets cannot stake and lock simultaneously
          <br />
          *Flares cannot be deposited into vaults that are staked or locked
        </p>
        {connected && (
          <button
            disabled={true}
            onClick={initFarmer}
            className="w-full my-6 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Create vault account
          </button>
        )}
      </div>
    </div>
  );
}
