// scripts/upgrade-box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_CONTRACT_ADDRESS = '0x928d73c67A934781A54d5D8e9f3B7D9C9D75b68B';
  const version = "V2";  
  const NFTMarketplaceV2 = await ethers.getContractFactory("NFTMarketplaceV2");
  const marketplaceContractV2 = await upgrades.upgradeProxy(PROXY_CONTRACT_ADDRESS, NFTMarketplaceV2,{ initializer: [version] });
  console.log("Marketplace upgraded");
}

main();