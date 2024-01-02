import Image from "next/image";
import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiCheckboxBlankCircleOutline,
  mdiCheckboxMarkedCircleOutline,
} from "@mdi/js";

const NFTCard = ({
  nft,
  checkbox,
  selected,
  toggleSelect,
}: {
  nft: any;
  checkbox: any;
  selected: boolean;
  toggleSelect: any;
}) => {
  return (
    <div
      className="relative w-full aspect-square"
      style={{ position: "relative" }}
      onClick={() => {
        if (checkbox) {
          toggleSelect(nft, !selected);
        }
      }}
    >
      <Image
        className="rounded-xl"
        src={nft.externalMetadata.image}
        alt="LIFINITY Flares"
        layout="fill"
        objectFit="cover"
      />
      {checkbox ? (
        <div className="absolute right-0 bottom-0 p-2">
          {selected ? (
            <Icon
              path={mdiCheckboxMarkedCircleOutline}
              size={1}
              color="#4ade80"
            />
          ) : (
            <Icon
              path={mdiCheckboxBlankCircleOutline}
              size={1}
              color="#94a3b8"
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default NFTCard;
