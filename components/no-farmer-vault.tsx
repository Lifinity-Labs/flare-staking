import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useState } from "react";
import { getNFTsByOwner } from "../common/web3/NFTget";
import NFTGrid from "./nft-grid";
import NoFarmer from "./no-farmer";

export default function NoFarmerVault({
  initFarmer,
}: {
  initFarmer: () => void;
}) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [currentWalletNFTs, setCurrentWalletNFTs] = useState<any[]>([]);

  const populateWalletNFTs = useCallback(async () => {
    // zero out to begin with
    setCurrentWalletNFTs([]);

    if (publicKey) {
      setCurrentWalletNFTs(
        (await getNFTsByOwner(publicKey, connection)).filter(
          (nft) =>
            (nft.onchainMetadata as any).updateAuthority ===
              process.env.NEXT_PUBLIC_UPDATE_AUTHORITY &&
            (nft.onchainMetadata as any).data.creators[0].address ===
              process.env.NEXT_PUBLIC_CREATOR_0_ADDRESS
        )
      );
    }
  }, [connection, publicKey]);

  useEffect(() => {
    (async () => {
      await populateWalletNFTs();
    })();
  }, [populateWalletNFTs]);

  return (
    <div className="container">
      <div className="text-center">
        <h1 className="inline-block my-4 text-2xl font-semibold clr-p">
          Lifinity Flare Vault
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-y-6 md:grid-cols-2">
        <section className="flex-1 ml-8 lg:ml-24 pr-8 md:border-r-2 border-black/20">
          {connected ? (
            <>
              <div className="flex justify-between items-center mb-4 h-10">
                <h2 className="text-center  text-base lg:text-xl">
                  Your wallet ({currentWalletNFTs?.length})
                </h2>
              </div>
              <NFTGrid
                nfts={currentWalletNFTs}
                checkbox={false}
                selectedNfts={[]}
                toggleSelect={() => {}}
              />
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 h-10">
                <h2 className="text-center text-xl font-light">Your wallet </h2>
              </div>
              <div className="aspect-square flex flex-col items-center justify-center">
                <p className="mb-4 text-base">Please connect wallet</p>
                <WalletMultiButton />
              </div>
            </>
          )}
        </section>
        <section className="flex-1 mr-8 lg:mr-24 pl-8 md:border-l-2 border-slate-500/10">
          <NoFarmer initFarmer={initFarmer} />
        </section>
      </div>
    </div>
  );
}
