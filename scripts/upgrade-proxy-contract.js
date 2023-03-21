// scripts/upgrade-box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_CONTRACT_ADDRESS = '';  
  const NFTMarketplaceV2 = await ethers.getContractFactory("NFTMarketplaceV2");
  const marketplaceContractV2 = await upgrades.upgradeProxy(PROXY_CONTRACT_ADDRESS, NFTMarketplaceV2);
  console.log("Marketplace upgraded");
}

main();