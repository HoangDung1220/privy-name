"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";

import Image from "next/image";
import { useState } from "react";

export const PrivyName = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const TABS = {
    HOME: 1,
    YOUR_NAME: 2,
  };

  type MyName = {
    id: number;
    name: string;
  };

  const [tab, setTab] = useState<number>(TABS.HOME);
  const [fheName, setFheName] = useState<string>("");
  const [namePrice, setNamePrice] = useState<string>("");
  const [myNames, setMyNames] = useState<MyName[]>([]);

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  if (!isConnected) {
    return (
      <div className="h-full mx-auto flex items-center justify-center">
        <button
          className={`h-14 w-[500px] flex items-center justify-center zama-bg rounded-lg mt-2 mb-12 cursor-pointer text-black cursor-not-allowed`}
          disabled={isConnected}
          onClick={connect}
        >
          <span className="text-white p-6 bg-black rounded-2xl font-medium text-gray-800">Connect to MetaMask</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-10">
      <header className="relative flex items-center h-16">
        <div className="mr-auto font-bold text-lg">
          <Image
            src="/zama-logo.svg"
            alt="Zama Logo"
            width={120}
            height={120}
          />
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-6 cursor-pointer">
          <span
            className="text-gray-700 hover:text-black font-semibold"
            onClick={() => setTab(TABS.HOME)}
          >
            HOME
          </span>
          <span
            className="text-gray-700 hover:text-black cursor-pointer font-semibold"
            onClick={() => setTab(TABS.YOUR_NAME)}
          >
            MY NAMES
          </span>
        </nav>
      </header>

      {tab == TABS.HOME && (
        <div className="h-full flex items-center justify-center">
          <div className="w-[600px] text-[20px] bg-white rounded-2xl flex flex-col items-center shadow-md pt-5">
            <h2 className="mb-4 text-xl font-semibold">
              Your digital identity starts here.
            </h2>
            <h2>
              Create your <strong>.zama</strong> name and join the community
            </h2>

            <div className="flex flex-row items-center px-4 py-2 gap-4 w-[500px] h-[42px] bg-white rounded-lg text-[16px] text-gray-400 mt-12 border border-gray-300 relative">
              <input
                id="fheNameInput"
                className="w-full h-full border-none outline-none text-gray-400 text-[16px] rounded-lg"
                placeholder="name.zama"
              />
              <span className="absolute -z-10">{fheName}</span>
              {fheName && <div className="ml-[-18px] text-gray-600">.zama</div>}
            </div>

            <div className="flex items-center justify-between px-4 py-2 w-[500px] h-[42px] rounded-lg text-[16px] text-gray-400 mt-3 border border-gray-300">
              <div>{namePrice}</div>
              <div className="text-black">ETH</div>
            </div>

            <div
              className={`h-14 w-[500px] flex items-center justify-center zama-bg rounded-lg mt-2 mb-12 cursor-pointer text-black ${"bg-gray-400 cursor-not-allowed"}`}
            >
              Create name
            </div>
          </div>
        </div>
      )}

      {tab === TABS.YOUR_NAME && myNames.length > 0 && (
        <div className="w-full mt-10 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-100 text-gray-700 font-semibold px-6 py-3">
            <div>STT</div>
            <div>Name</div>
            <div className="text-right"></div>
          </div>

          {myNames.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-3 items-center px-6 py-3 border-t hover:bg-gray-50 transition"
            >
              <div>{idx + 1}</div>
              <div className="font-medium text-gray-800">{item.name}</div>
              <div className="text-right font-medium text-gray-800 cursor-pointer">
                View
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === TABS.YOUR_NAME && myNames.length === 0 && (
        <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden">
          <div className="text-[20px] font-medium text-gray-800">
            Your names are currently empty.
          </div>
        </div>
      )}
    </div>
  );
};
