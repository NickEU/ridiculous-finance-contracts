import { ethers, network, run } from "hardhat";
import config from "../config";

const main = async () => {
  // Compile contracts
  await run("compile");
  console.log("Compiled contracts.");

  const networkName = network.name;
  console.log("Deploying to network:", networkName);

  performSanityChecks(networkName);

  let routerAddress = config.RidiRouter[networkName]
  if (!routerAddress || routerAddress === ethers.constants.AddressZero) {
    routerAddress = await deployRouter(networkName);
  }

  console.log("Deploying RidiZap V1..");

  const RidiZapV1 = await ethers.getContractFactory("RidiZapV1");

  const ridiZap = await RidiZapV1.deploy(
    config.WFTM[networkName],
    routerAddress,
    config.MaxZapReverseRatio[networkName]
  );

  await ridiZap.deployed();

  console.log("RidiZap V1 deployed to:", ridiZap.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
async function deployRouter(networkName: string) {
  const RidiRouter = await ethers.getContractFactory("RidiRouter");
  const factoryAddress = config.RidiFactory[networkName] ?? await deployFactory();

  console.log("Deploying RidiRouter..");
  const ridiRouter = await RidiRouter.deploy(factoryAddress, config.WFTM[networkName]);
  const deployedRouterAddress = ridiRouter.address;
  console.log("RidiRouter deployed to:", deployedRouterAddress);

  return deployedRouterAddress;
}

async function deployFactory() {
  const RidiFactory = await ethers.getContractFactory("RidiFactory");
  const deployerKey = process.env.ADMIN_PUBLIC_KEY;
  if (!deployerKey) {
    throw new Error("Missing deployer key. Cannot deploy factory for the router.");
  }

  console.log("Deploying RidiFactory..");
  const ridiFactory = await RidiFactory.deploy(deployerKey);
  const deployedFactoryAddress = ridiFactory.address;
  console.log("RidiFactory deployed to:", deployedFactoryAddress);

  return deployedFactoryAddress;
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

  if (!config.WFTM[networkName] || config.WFTM[networkName] === ethers.constants.AddressZero) {
    throw new Error("Missing WFTM address");
  }
}

