"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { parseEther, Contract } from "ethers";
import { useFhevm } from "../../fhevm-react/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { FhevmDecryptionSignature, type FhevmInstance } from "@fhevm/react";

import { Toaster } from "react-hot-toast";
import { CONTRACT_ADDRESS } from "@/constants/index";
import { FHEPrivyNameABI } from "@/abi/FHEPrivyNameABI";

import Image from "next/image";
import toast from "react-hot-toast";

///////////////////////////////////////////////////////////////////////////////
// Types
///////////////////////////////////////////////////////////////////////////////

enum Tabs {
  HOME = 1,
  MY_NAME = 2,
}

type MyName = {
  id: number;
  name: string;
  decrypted: boolean,
};

type EncryptedResult = {
  ciphertext?: Uint8Array;
  proof?: Uint8Array;
};

///////////////////////////////////////////////////////////////////////////////
// Utils
///////////////////////////////////////////////////////////////////////////////

function stringToBigInt(str: string): bigint {
  const hexStr = Buffer.from(str, "utf8").toString("hex");
  return BigInt("0x" + hexStr);
}

function bigIntToString(bn: bigint): string {
  let hex = bn.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return Buffer.from(hex, "hex").toString("utf8");
}

///////////////////////////////////////////////////////////////////////////////
// Component
///////////////////////////////////////////////////////////////////////////////

export const PrivyName = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    ethersSigner,
    initialMockChains,
    connect,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const [tab, setTab] = useState<Tabs>(Tabs.HOME);
  const [name, setName] = useState<string>("");
  const [namePrice, setNamePrice] = useState<string>("0");
  const [myNames, setMyNames] = useState<MyName[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);

  /////////////////////////////////////////////////////////////////////////////
  // Handlers
  /////////////////////////////////////////////////////////////////////////////

  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (value.length > 0 && value.length <= 2) {
      setNamePrice("0.0003");
    } else if (value.length > 2 && value.length <= 5) {
      setNamePrice("0.0002");
    } else if (value.length > 5) {
      setNamePrice("0.0001");
    } else {
      setNamePrice("0");
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Effects
  /////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!ethersSigner) return;

    try {
      const contractInstance = new Contract(
        CONTRACT_ADDRESS,
        FHEPrivyNameABI.abi,
        ethersSigner
      );
      setContract(contractInstance);
    } catch (err) {
      console.error("Error creating contract:", err);
    }
  }, [ethersSigner]);

  useEffect(() => {
    if (fhevmStatus === "ready" && contract) {
      toast.success("App is ready!");
    }
  }, [fhevmStatus, contract]);

  useEffect(() => {
    if (tab !== Tabs.MY_NAME || !contract) return;

    const fetchNames = async () => {
      try {
        const names: MyName[] = await contract.getListNames();
        setMyNames(names.map((item: any) => ({ id: item[0].toString(), name: item[1], decrypted: false })));
      } catch (err) {
        console.error("Error fetching names:", err);
      }
    };

    fetchNames();
  }, [tab, contract]);

  /////////////////////////////////////////////////////////////////////////////
  // Utils (encrypt/decrypt)
  /////////////////////////////////////////////////////////////////////////////

  const encryptStringValue = async (): Promise<EncryptedResult> => {
    if (!fhevmInstance || !accounts?.[0]) return {};

    const builder = fhevmInstance.createEncryptedInput(
      CONTRACT_ADDRESS,
      accounts[0]
    );

    const hashBigInt = stringToBigInt(name);

    const encryptedData = await builder.add256(hashBigInt).encrypt();

    return {
      ciphertext: encryptedData?.handles[0],
      proof: encryptedData?.inputProof,
    };
  };

  const handleCreate = async () => {
    try {
      if (!contract) return;

      const encryptedName = await encryptStringValue();
      if (!encryptedName.ciphertext || !encryptedName.proof) {
        toast.error("Encryption failed");
        return;
      }

      const nftTx = await contract.createName(
        encryptedName.ciphertext,
        encryptedName.proof,
        {
          value: parseEther(namePrice),
          gasLimit: 5_000_000,
        }
      );

      toast("Your name is creating!");
      await nftTx.wait();
      toast.success("Your name is created!");
    } catch (error) {
      console.error("Error creating name:", error);
      toast.error("Failed to create name");
    }
  };

  const handleView = async (encName: string, index: number) => {
    if (!fhevmInstance || !ethersSigner) {
      console.error("FHEVM instance not ready");
      return;
    }

    try {
      toast("Decrypting your name...");
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [CONTRACT_ADDRESS as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        console.error("Unable to build FHEVM decryption signature");
        return;
      }

      const decrypted = await fhevmInstance.userDecrypt(
        [
          {
            handle: encName,
            contractAddress: CONTRACT_ADDRESS,
          },
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const value = Object.values(decrypted)[0] as bigint;
      setMyNames(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], name: bigIntToString(value), decrypted: true };

        return updated;
      });
      toast.success("Your name has been decrypted!");
    } catch (err) {
      console.error("Error decrypting name:", err);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // UI
  /////////////////////////////////////////////////////////////////////////////

  if (!isConnected) {
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
    <div className="w-full h-full mt-10">
      <Toaster position="bottom-center" toastOptions={{ className: "toast" }} />

      {/* Header */}
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
            onClick={() => setTab(Tabs.HOME)}
          >
            HOME
          </span>
          <span
            className="text-gray-700 hover:text-black cursor-pointer font-semibold"
            onClick={() => setTab(Tabs.MY_NAME)}
          >
            MY NAMES
          </span>
        </nav>
      </header>

      {/* HOME TAB */}
      {tab === Tabs.HOME && (
        <div className="h-full flex items-center justify-center">
          <div className="w-[600px] text-[20px] bg-white rounded-2xl flex flex-col items-center shadow-md pt-5">
            <h2>Create your name and join the community</h2>

            <div className="flex flex-row items-center px-4 py-2 gap-4 w-[500px] h-[42px] bg-white rounded-lg text-[16px] text-gray-400 mt-12 border border-gray-300 relative">
              <input
                id="nameInput"
                className="w-full h-full border-none outline-none text-gray-400 text-[16px] rounded-lg"
                placeholder="name.zama"
                maxLength={10}
                onChange={handleChangeName}
              />
              {name && <div className="ml-[-18px] text-gray-600">.zama</div>}
            </div>

            <div className="flex items-center justify-between px-4 py-2 w-[500px] h-[42px] rounded-lg text-[16px] text-gray-400 mt-3 border border-gray-300">
              <div>{namePrice}</div>
              <div className="text-black">ETH</div>
            </div>

            <button
              className={`h-14 w-[500px] flex items-center justify-center zama-bg rounded-lg mt-2 mb-12 text-black ${name.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 cursor-pointer"
                }`}
              disabled={name.length === 0}
              onClick={handleCreate}
            >
              Create name
            </button>
          </div>
        </div>
      )}

      {/* MY NAME TAB */}
      {tab === Tabs.MY_NAME && (
        <div className="w-full mt-10 bg-white rounded-2xl shadow-lg overflow-hidden">
          {myNames.length > 0 ? (
            <>
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
                  <div className="font-medium text-gray-800">{item.decrypted ? item.name : '************************************'}</div>
                  <div
                    className="text-right font-medium text-gray-800 cursor-pointer"
                    onClick={() => handleView(item.name, idx)}
                  >
                    View
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden">
              <div className="text-[20px] font-medium text-gray-800">
                Your names are currently empty.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
