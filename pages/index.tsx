import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import CountUp from "react-countup";

type Stats = {
  numFlaresBoughtBack: number;
  remainingSupply: number;
  numStaked: number;
  numLocked: number;
};

const Home: NextPage = () => {
  const router = useRouter();
  const { data: flares } = useQuery<Stats>({
    queryKey: ["flares"],
    queryFn: () =>
      axios
        .get("http://localhost:3000/json/flare.json")
        .then((res) => res.data),
    initialData: {
      numFlaresBoughtBack: 0,
      remainingSupply: 0,
      numStaked: 0,
      numLocked: 0,
    },
  });

  return (
    <div className="container">
      <div className="bg" />

      <section className="nft-face grid-cover-container mt-11">
        <div className="image">
          <div className="flame" />
        </div>
        <div className="title">
          <p className="title-text -1">
            A Merging of <strong>DeFi &amp; NFTs</strong>
          </p>
          <h1 className="title-text -2">
            <span>LIFINITY</span>
            <br />
            <span>Flares</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 md:mx-6">
            {/* <dl>
              <dt className="text-base leading-5 clr-s3">
                # of Flares
                <br />
                bought back
              </dt>
              <dd>{flares.numFlaresBoughtBack}</dd>
            </dl> */}
            {/* <dl>
              <dt className="text-base clr-s3">Remaining supply</dt>
              <dd>{flares.remainingSupply}</dd>
            </dl> */}
            <dl>
              <dt className="text-base clr-s2">Total # staked</dt>
              <dd>
                <CountUp start={0} duration={0.5} end={flares.numStaked} />
              </dd>
            </dl>
            <dl>
              <dt className="text-base clr-s2">Total # locked</dt>
              <dd>
                <CountUp start={0} duration={0.5} end={flares.numLocked} />
              </dd>
            </dl>
          </div>
        </div>
      </section>
      <section className="mx-4 my-6 p-6 md:mx-8 md:my-12 md:px-8">
        <div className="mt-8 mb-6 md:my-6">
          <button
            className="button-gradient py-1.5 px-12 md:px-32"
            onClick={() => router.push("/vault")}
          >
            Unstake / Unlock
          </button>
        </div>
        <div className="mb-10 text-center italic text-red-600 text-base">
          Staking and locking have ended
        </div>
      </section>
      <p className="mb-10 text-center">
        Flares can be purchased at
        <a
          href="https://www.tensor.trade/trade/lifinity_flares"
          target="_blank"
          rel="noopener noreferrer"
          className="text-md ml-2 text-indigo-600 hover:text-indigo-500"
        >
          Tensor
        </a>
      </p>

      <section className="aboutLF md:pt-24 md:pb-12">
        <div className="text">
          <h2>
            <span className="text-3xl font-medium">What are</span>
            <br />
            <strong>Lifinity Flares?</strong>
          </h2>
          <p className="mb-5">
            Lifinity Flares are a set of 10,000 NFTs with two purposes:
          </p>
          <ul className="list-disc pl-10 mb-5">
            <li className="purposes">
              Raise capital to seed Lifinity&apos;s pools with liquidity
            </li>
            <li className="purposes">
              Perpetually create value for NFT holders
            </li>
          </ul>
          <p className="mb-5">
            This is accomplished through the following mechanisms.
          </p>
        </div>
        <div className="nfts">
          <img src="/assets/nft/TOP.webp" alt="LIFINITY Flare" />
        </div>
      </section>
      <section className="mechanisms mb-20">
        <h2>Utility</h2>
        <ol>
          <li>
            <dl>
              <dt>100% deposited to liquidity pool</dt>
              <dd className="mechanisms-img">
                <img src="/assets/nft/mechanism1.webp" alt="mechanism1"></img>
              </dd>
              <dd className="mechanisms-text">
                All of the funds raised from the sale of Lifinity Flares will be
                deposited into Lifinity&apos;s liquidity pools.
              </dd>
            </dl>
          </li>
          <li>
            <dl>
              <dt>Buyback and reinvest</dt>
              <dd className="mechanisms-img">
                <img src="/assets/nft/mechanism2.webp" alt="mechanism2" />
              </dd>
              <dd className="mechanisms-text">
                All revenue from trading fees &amp; royalties will be either
                used to buy back Lifinity Flares or reinvested in the liquidity
                pools.
              </dd>
            </dl>
          </li>
          <li>
            <dl>
              <dt>Buyback mechanism</dt>
              <dd className="mechanisms-img">
                <img src="/assets/nft/mechanism3.webp" alt="mechanism3" />
              </dd>
              <dd className="mechanisms-text">
                If the floor price ever falls below 50% of the mint price, we
                will buy back all Lifinity Flares below that price using funds
                in the pool (i.e. not just profits but funds from the sale).
              </dd>
            </dl>
          </li>
          <li>
            <dl>
              <dt>LFNTY token airdrop</dt>
              <dd className="mechanisms-img">
                <img src="/assets/nft/mechanism4.webp" alt="mechanism4" />
              </dd>
              <dd className="mechanisms-text">
                1% of the supply of LFNTY, Lifinity&apos;s governance token,
                will be reserved for NFT holders.
              </dd>
            </dl>
          </li>
        </ol>
      </section>
    </div>
  );
};

export default Home;
