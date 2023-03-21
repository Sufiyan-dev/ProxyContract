const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("NFTMarketplace", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshopt in every test.
    async function deployNftMarketplaceProxyFixture() {
  
      // Contracts are deployed using the first signer/account by default
      const [addr1, addr2, addr3] = await ethers.getSigners();
  
      const marketplaceContract = await ethers.getContractFactory("NFTMarketplace");
      const NFTMarketplaceProxy = await upgrades.deployProxy(marketplaceContract);
  
      return { NFTMarketplaceProxy, addr1, addr2, addr3 };
    }

    async function deployErc721ContractFixture() {
        // const [addr1, addr2] = await ethers.getSigners();

        const erc721 = await ethers.getContractFactory("token");
        const Erc721NftContract = await erc721.deploy("xyz token","XYZT");

        return { Erc721NftContract}
    }

    async function deployErc1155ContractFixture() {
        // const [addr1, addr2] = await ethers.getSigners();

        const erc1155 = await ethers.getContractFactory("token2");
        const Erc1155NftContract = await erc1155.deploy();

        return { Erc1155NftContract}
    }
  
    describe("Deployment", function () {
        describe("Validation", function () {
            it("Should set the right owner", async function () {
              const { NFTMarketplaceProxy, addr1 } = await loadFixture(deployNftMarketplaceProxyFixture);
               expect(await NFTMarketplaceProxy.owner()).to.equal(addr1.address);
            });

            it("Should not be able to initailze again by owner or anyone", async function (){
              const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
      
              await expect(NFTMarketplaceProxy.initialize()).to.be.revertedWith('Initializable: contract is already initialized');
              await expect(NFTMarketplaceProxy.connect(addr2).initialize()).to.be.revertedWith('Initializable: contract is already initialized');
            });
        })
    });
    describe("Create Listing",function () {
        describe("Validation",function() {
            it("Should allow anyone to create listing, if they own it. For both token", async function (){
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
    
                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, "");

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

            })
            it("Should allow only the owner of the nft to list, for both types", async function() {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // minitng erc1155 nft
                await Erc1155NftContract.connect(addr2).mint(addr2.address, 0, 100, "");

                // listing
                await expect( NFTMarketplaceProxy.createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1)).to.be.revertedWith('Only the owner can list the NFT');
                await expect( NFTMarketplaceProxy.createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,50)).to.be.revertedWith('Sender does have sufficient amount of token');
            })
            it("Should revert error if owner has not approve the marketplace contract for both types", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // minting erc1155 nft
                await Erc1155NftContract.connect(addr2).mint(addr2.address, 0, 100, "");

                // listing erc721 token
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 1)).to.be.revertedWith('Need to approve this contract');
                //added login in v2
                // listing erc1155 token
                // await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc1155NftContract.address, 0, ethers.utils.parseEther("1.0"), 2, 1)).to.be.revertedWith('Sender need to approve this contract');
            })
            it("Should revert error if the price is less than 1, for both type", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // minting erc1155 nft
                await Erc1155NftContract.connect(addr2).mint(addr2.address, 0, 100, "");

                // approving 
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // added in V2
                //approving from erc1155
                await Erc1155NftContract.connect(addr2).setApprovalForAll(NFTMarketplaceProxy.address,true);

                // listing erc721 token
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, 0, 1, 1)).to.be.revertedWith('Price must be greater than zero');

                // listing erc1155 token
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc1155NftContract.address, 0, 0, 2, 1)).to.be.revertedWith('Price must be greater than zero');


            })
            it("Should revert error if the token amount is less than 1", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);

                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 0)).to.be.revertedWith('Invalid token amount');
            })
            it("Should revert error if token type is not 1 or 2 ", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 3, 1)).to.be.revertedWith('Invalid token type');
            })
            it("Should expext token amount is equal to 1 if token type is 1 which is erc721 token or revert error", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 2)).to.be.revertedWith('token amount 1 expect for erc721 token');
            })
            it("Should revert error if nft is already listed",async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing 1 
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing
                await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 2)).to.be.revertedWith('NFT is already listed');
            })
            it("Should transfer nft from user to NFTmarketplace contract if txn gets succeeded", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing 1 
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // checking owner 
                expect (await Erc721NftContract.ownerOf(0)).to.be.equal(NFTMarketplaceProxy.address)
            })
            it("Should revert error if owner does not have ")
        })
        describe("Events",function() {
            it("Should emit event when nft gets listed", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // listing 1 
                expect(await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1)).to.be.emit(NFTMarketplaceProxy,"ListingCreated").withArgs(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),addr2.address,1,1);
            })
        })
    })
    describe("Pausing and Unpasing Listing",function() {
        describe("Validation",function() {

        })
        describe("Events",function() {

        })
    })
    describe("Removing Listing",function() {
        describe("Validation",function() {

        })
        describe("Events",function() {
            
        })
    })
    describe("Buying Listed Nft",function() {
        describe("Validation",function() {

        })
        describe("Events",function() {
            
        })
    })
    describe("Update Listing",function() {
        describe("Validation",function() {

        })
        describe("Events",function() {
            
        })
    })
  
  });