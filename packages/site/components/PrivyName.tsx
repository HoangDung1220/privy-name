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

  const [fheName, setFheName] = useState("");
  const [namePrice, setNamePrice] = useState("");

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  if (!isConnected) {
    return (
      <div className="mx-auto">
        <button
          className={buttonClass}
          disabled={isConnected}
          onClick={connect}
        >
          <span className="text-4xl p-6">Connect to MetaMask</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid w-full h-full gap-4 mt-10">
      <header className="relative flex items-center h-16 px-6">
        <div className="mr-auto font-bold text-lg">
          <Image
            src="/zama-logo.svg"
            alt="Zama Logo"
            width={120}
            height={120}
          />
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-6 cursor-pointer">
          <span className="text-gray-700 hover:text-black font-semibold">
            HOME
          </span>
          <span className="text-gray-700 hover:text-black cursor-pointer font-semibold">
            MY NAMES
          </span>
        </nav>
      </header>

      <div className="h-fit flex items-center justify-center">
        <div className="w-[600px] text-[20px] bg-white rounded-lg flex flex-col items-center shadow-md pt-5">
          <h2 className="mb-4 text-xl font-semibold">
            Your digital identity starts here.
          </h2>
          <h2>
            Create your <strong>.zama</strong> name and join the community
          </h2>

          {/* Input */}
          <div className="flex flex-row items-center px-4 py-2 gap-4 w-[500px] h-[42px] bg-white rounded-lg text-[16px] text-gray-400 mt-12 border border-gray-300 relative">
            <input
              id="fheNameInput"
              className="w-full h-full border-none outline-none text-gray-400 text-[16px] rounded-lg"
              placeholder="name.zama"
            />
            <span className="absolute -z-10">{fheName}</span>
            {fheName && <div className="ml-[-18px] text-gray-600">.zama</div>}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between px-4 py-2 w-[500px] h-[42px] rounded-lg text-[16px] text-gray-400 mt-3 border border-gray-300">
            <div>{namePrice}</div>
            <div className="text-black">ETH</div>
          </div>

          {/* Button */}
          <div
            className={`h-14 w-[500px] flex items-center justify-center zama-bg rounded-lg mt-2 mb-12 cursor-pointer text-black ${"bg-gray-400 cursor-not-allowed"
              }`}
          >
            Create name
          </div>
        </div>
      </div>

    </div>
  );
};
