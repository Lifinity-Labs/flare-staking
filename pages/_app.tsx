import "@solana/wallet-adapter-react-ui/styles.css";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  Coin98WalletAdapter,
  NightlyWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { AppProps } from "next/app";
import Head from "next/head";
import { FC, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import AppBar from "../components/app-bar";
import Footer from "../components/footer";
import { findSelectedEndpoint } from "../components/settings-dialog";
import { useSettingsStore } from "../store/settings";

import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

const queryClient = new QueryClient();

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const selectedEndpointId = useSettingsStore(
    (state) => state.selectedEndpointId
  );
  const customEndpoint = useSettingsStore((state) => state.customEndpoint);
  const endpoint = useMemo(() => {
    if (customEndpoint) {
      return customEndpoint;
    } else {
      return findSelectedEndpoint(selectedEndpointId).endpoint;
    }
  }, [customEndpoint, selectedEndpointId]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new Coin98WalletAdapter(),
      new SlopeWalletAdapter(),
      new SolletWalletAdapter(),
      new NightlyWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Head>
            <title>LIFINITY</title>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@Lifinity_io" />
            <meta name="twitter:creator" content="@Lifinity_io" />
            <meta property="og:url" content="http://localhost:3000/" />
            <meta property="og:title" content="LIFINITY Flares" />
            <meta
              property="og:description"
              content="A Merging of DeFi &amp; NFTs"
            />
            <meta
              property="og:image"
              content="http://localhost:3000/assets/ogp.png"
            />
            <meta property="og:image:width" content="600" />
            <meta property="og:image:height" content="315" />
            <meta property="og:type" content="website" />
          </Head>
          <div
            className="flex flex-col min-h-screen"
            style={{
              background:
                "linear-gradient(135deg, rgba(44,45,52,1) 0%, rgba(33,35,41,1) 100%)",
            }}
          >
            <AppBar />
            <div className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1 xl:px-4 h-full text-th-fgd-1">
              <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </div>
            <Footer />
            <ToastContainer position="bottom-left" />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default MyApp;
