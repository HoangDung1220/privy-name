import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FHEPrivyName, FHEPrivyName__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHEPrivyName")) as FHEPrivyName__factory;
  const contract = (await factory.deploy()) as FHEPrivyName;
  return { contract, contractAddress: await contract.getAddress() };
}

describe("FHEPrivyName", function () {
  let signers: Signers;
  let contract: FHEPrivyName;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
    };
  });

  beforeEach(async () => {
    if (!fhevm.isMock) {
      throw new Error(`This test suite must run in FHEVM mock environment`);
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  /// --- helper ---
  function stringToBigInt(str: string): bigint {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return BigInt("0x" + Buffer.from(bytes).toString("hex"));
  }

  async function encryptForContractTest(signer: HardhatEthersSigner, str: string) {
    const bn = stringToBigInt(str);
    const input = fhevm.createEncryptedInput(contractAddress, await signer.getAddress());
    input.add256(bn);

    const encrypted = await input.encrypt();
    return [encrypted.handles[0], encrypted.inputProof] as const;
  }

  function bigIntToString(bn: bigint): string {
    let hex = bn.toString(16);
    if (hex.length % 2 !== 0) hex = "0" + hex;
    return Buffer.from(hex, "hex").toString("utf8");
  }

  /// --- tests ---
  it("should create a name", async function () {
    const [cipher, proof] = await encryptForContractTest(signers.alice, "AliceName");

    await contract.connect(signers.alice).createName(cipher, proof);

    const total = await contract.getTotalNames();
    expect(total).to.eq(1);

    const names = await contract.connect(signers.alice).getListNames();
    expect(names.length).to.eq(1);
    expect(names[0].owner).to.eq(signers.alice.address);
  });

  it("should allow only creator to decrypt name", async function () {
    const [cipher, proof] = await encryptForContractTest(signers.alice, "SecretAlice");
    await contract.connect(signers.alice).createName(cipher, proof);

    const names = await contract.connect(signers.alice).getListNames();
    const handle = names[0].name;

    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint256, handle, contractAddress, signers.alice);
    expect(bigIntToString(decrypted)).to.eq("SecretAlice");

    await expect(fhevm.userDecryptEuint(FhevmType.euint256, handle, contractAddress, signers.bob)).to.be.rejected;
  });

  it("should get name by id", async function () {
    const [cipher, proof] = await encryptForContractTest(signers.alice, "ByIdName");
    await contract.connect(signers.alice).createName(cipher, proof);

    const data = await contract.getNameById(1);
    expect(data.owner).to.eq(signers.alice.address);

    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint256, data.name, contractAddress, signers.alice);
    expect(bigIntToString(decrypted)).to.eq("ByIdName");
  });

  describe("name decryption test", function () {
    it("should create a name and decode it correctly", async function () {
      const [signerAlice] = await ethers.getSigners();

      const plainName = "SuperSecretName";
      const [ciphertext, proof] = await encryptForContractTest(signerAlice, plainName);

      await (await contract.connect(signerAlice).createName(ciphertext, proof)).wait();

      const names = await contract.connect(signerAlice).getListNames();
      if (!names.length) throw new Error("No name found after createName()");
      const rawName = names[0].name;

      const decryptedBigInt = await fhevm.userDecryptEuint(FhevmType.euint256, rawName, contractAddress, signerAlice);
      const decodedName = bigIntToString(decryptedBigInt);

      expect(decodedName).to.equal(plainName);
    });
  });
});
