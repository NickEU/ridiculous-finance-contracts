import { ethers, network, run } from "hardhat";
import config from "../config";

const main = async () => {
  // Compile contracts
  await run("compile");
  console.log("Compiled contracts.");

  const networkName = network.name;
  console.log("Deploying to network:", networkName);

  performSanityChecks(networkName);

  const ridiToken = config.RIDIToken[networkName];

  const provider = ethers.getDefaultProvider("https://rpc.testnet.fantom.network/");
  const blockNumberToStartOn = await provider.getBlockNumber() + 1
  console.log(blockNumberToStartOn);

  let syrupBarAddress = config.SyrupBar[networkName]
  if (!syrupBarAddress || syrupBarAddress === ethers.constants.AddressZero) {
    syrupBarAddress = await deploySyrupBar(networkName, ridiToken);
  }
  console.log(syrupBarAddress);

  await deployMasterChef(networkName, ridiToken, syrupBarAddress, blockNumberToStartOn);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
async function deploySyrupBar(networkName: string, ridiToken: string) {  
  console.log("Deploying SyrupBar");

  const SyrupBar = await ethers.getContractFactory("SyrupBar");

  const syrupBar = await SyrupBar.deploy(ridiToken);

  await syrupBar.deployed();
  const syrupBarAddress = syrupBar.address;
  console.log("SyrupBar deployed to:", syrupBar.address);

  return syrupBarAddress;
}

async function deployMasterChef(networkName: string, ridiToken: string, syrupBarAddress: string, blockNumberToStartOn: number) {
  const MasterChef = await ethers.getContractFactory("MasterChef");
  const deployerKey = process.env.ADMIN_PUBLIC_KEY;
  if (!deployerKey) {
    throw new Error("Missing deployer key. Cannot deploy MasterChef.");
  }

  console.log("Deploying MasterChef..");
  const ridiPerBlock = 10;
  const masterChef = await MasterChef.deploy(ridiToken, syrupBarAddress, deployerKey, ridiPerBlock, blockNumberToStartOn);
  const deployedMasterChefAddress = masterChef.address;
  console.log("MasterChef deployed to:", deployedMasterChefAddress);

  return deployedMasterChefAddress;
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

  if (!config.RIDIToken[networkName] || config.RIDIToken[networkName] === ethers.constants.AddressZero) {
    throw new Error("Missing RIDIToken address");
  }
}

