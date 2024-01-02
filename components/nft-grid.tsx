import { useEffect, useMemo, useState } from "react";
import NFTCard from "./nft-card";
import PageNation from "./pagenation";

type NFTGridProps = {
  nfts: any[];
  checkbox: any;
  selectedNfts: any[];
  toggleSelect: any;
};

const perPage = 9;

const NFTGrid = ({
  nfts,
  checkbox,
  selectedNfts,
  toggleSelect,
}: NFTGridProps) => {
  const [page, setPage] = useState(1);
  const pages = useMemo(() => {
    if (nfts.length > 0) {
      return Math.ceil(nfts.length / perPage);
    } else {
      return 1;
    }
  }, [nfts]);
  const handleChange = (value: number) => {
    setPage(value);
  };

  const items = useMemo(() => {
    return nfts.slice((page - 1) * perPage, page * perPage);
  }, [nfts, page]);

  useEffect(() => {
    if (pages < page) {
      setPage(pages);
    }
  }, [page, pages]);

  return (
    <div>
      <div className="aspect-square">
        <div className="grid grid-cols-3 gap-4">
          {items.map((nft, i) => (
            <NFTCard
              key={nft.mint.toBase58()}
              nft={nft}
              checkbox={checkbox}
              selected={selectedNfts.some(
                (selectedNft) =>
                  selectedNft.mint.toBase58() === nft.mint.toBase58()
              )}
              toggleSelect={toggleSelect}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 mb-3">
        {pages == 1 && ( 
          <div className="text-transparent text-sm">1</div> 
        )}      
        {pages > 1 && ( 
          <PageNation count={pages} page={page} onChange={handleChange} /> 
        )} 
      </div>
    </div>
  );
};

export default NFTGrid;
