import { Idl } from "@project-serum/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { GemBank } from "../common/gem-bank";
import bankIdl from "../pages/idls/gem_bank.json";

const useGemBank = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const gemBank = useMemo(
    () => (wallet ? new GemBank(connection, wallet, bankIdl as Idl) : null),
    [connection, wallet]
  );
  return gemBank;
};

export default useGemBank;
