const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("NFTMarketplace", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshopt in every test.
    async function deployNftMarketplaceProxyFixture() {
  
      // Contracts are deployed using the first signer/account by default
      const [addr1, addr2] = await ethers.getSigners();
      console.log("address",addr1.address)
  
      const marketplaceContract = await ethers.getContractFactory("NFTMarketplace");
      const NFTMarketplace = await upgrades.deployProxy(marketplaceContract);
  
      return { NFTMarketplace, addr1, addr2 };
    }
  
    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        const { NFTMarketplace, addr1 } = await loadFixture(deployNftMarketplaceProxyFixture);
        expect(await NFTMarketplace.owner()).to.equal(addr1.address);
      });
      it("")
    });
  
  });