import { useMemo } from "react";
import { Idl } from "@project-serum/anchor";
import bankIdl from "../pages/idls/gem_bank.json";
import farmIdl from "../pages/idls/gem_farm.json";
import lockerIdl from "../pages/idls/lifinity_locker.json";
import { GemFarm } from "../common/gem-farm";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

const useGemFarm = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const gemBank = useMemo(
    () =>
      wallet
        ? new GemFarm(
            connection,
            wallet,
            farmIdl as Idl,
            bankIdl as Idl,
            lockerIdl as Idl
          )
        : null,
    [connection, wallet]
  );
  return gemBank;
};

export default useGemFarm;
