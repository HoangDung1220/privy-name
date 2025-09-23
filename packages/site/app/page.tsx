"use client";

import { useEffect } from "react";
import { PrivyName } from "@/components/PrivyName";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";

const SEPOLIA_CHAIN_ID_DEC = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export default function Home() {
  const { isConnected, connect, accounts, provider, chainId } = useMetaMaskEthersSigner();

  useEffect(() => {
    if (provider) {
      const switchNetwork = async () => {
        try {
          await provider.request?.({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
          });
          console.log("Switched to Sepolia!");
        } catch (error) {
          console.log(error);
        }
      };

      switchNetwork();
    }
  }, [provider]);

  if (!isConnected || chainId !== SEPOLIA_CHAIN_ID_DEC) {
    return (
      <div className="h-full mx-auto flex items-center justify-center">
        <button
          className="h-14 w-[500px] flex items-center justify-center zama-bg rounded-lg mt-2 mb-12 cursor-pointer text-black"
          onClick={connect}
        >
          <span className="text-white p-6 bg-black rounded-2xl font-medium text-gray-800">
            Connect to MetaMask
          </span>
        </button>
      </div>
    );
  }

  return (
    <main className="h-full">
      <div className="flex h-full flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
        <PrivyName />
      </div>
    </main>
  );
}
