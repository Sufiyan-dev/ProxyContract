const { ethers, upgrades } = require("hardhat");


async function main() {
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplaceContract = await upgrades.deployProxy(NFTMarketplace);
    await marketplaceContract.deployed();
    console.log("NFTmarketplace contract deployed to:", marketplaceContract.address);
}
main();