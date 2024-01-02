import { mdiCog } from "@mdi/js";
import Icon from "@mdi/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SettingsDialog from "./settings-dialog";

const AppBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <a>
                  <Image
                    src="/assets/logo-lifinity.svg"
                    alt="Workflow"
                    width={140}
                    height={34}
                  />
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center z-20">
            <button className="mr-2" onClick={() => setIsOpen(true)}>
              <Icon
                path={mdiCog}
                size={1}
                className="text-gray-400 hover:text-gray-500"
              />
            </button>
            <SettingsDialog open={isOpen} onClose={() => setIsOpen(false)} />
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppBar;
