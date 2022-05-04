import { ethers, network, run } from "hardhat";

const main = async () => {
  // Compile contracts
  await run("compile");
  console.log("Compiled contracts.");

  const networkName = network.name;
  console.log("Deploying to network:", networkName);

  performSanityChecks(networkName);
  await deployMulticall(networkName);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
async function deployMulticall(networkName: string) {
  const Multicall2 = await ethers.getContractFactory("Multicall2");

  console.log("Deploying Multicall2..");

  const multiCall2 = await Multicall2.deploy();
  const deployedMulticallAddress = multiCall2.address;
  console.log("Multicall2 deployed to:", deployedMulticallAddress);

  return deployedMulticallAddress;
}

function performSanityChecks(networkName: string) {
  if (networkName === "mainnet") {
    if (!process.env.KEY_MAINNET) {
      throw new Error("Missing private key");
    }
  } else if (networkName === "testnet") {
    if (!process.env.KEY_TESTNET) {
      throw new Error("Missing private key");
    }
  }
}