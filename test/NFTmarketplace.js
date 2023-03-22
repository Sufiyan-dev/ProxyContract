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

        return { Erc1155NftContract }
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
            it("Should have listing count zero", async () => {
                const { NFTMarketplaceProxy, addr1, addr2 } = await loadFixture(deployNftMarketplaceProxyFixture);

                expect(await NFTMarketplaceProxy.listingCount()).to.be.equal(0);
            })
        })
    });
    describe("Create Listing",function () {
        describe("Validation",function() {
            describe("Common",function() {
                it("Should allow anyone to create listing, if they own it", async function (){
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
        
                    // minting erc721 nft 
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving erc721 token
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);
    
                    // approving erc1155 token
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);
    
                    // listing erc721 token
                    await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);
    
                    // listing erc1155 token
                    await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);
    
                })
                it("Should count the number of listing", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
        
                    // minting erc721 nft 
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving erc721 token
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);
    
                    // approving erc1155 token
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);
    
                    // listing erc721 token
                    await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);
    
                    expect(await NFTMarketplaceProxy.listingCount()).to.be.equal(1);

                    // listing erc1155 token
                    await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                    expect(await NFTMarketplaceProxy.listingCount()).to.be.equal(2);
                })
                it("Should allow only the owner of the nft to list", async function() {
                    const { NFTMarketplaceProxy, addr1, addr2,addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
    
                    // minting erc721 nft 
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                    // minitng erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                    // approving erc721 token
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);
    
                    // approving erc1155 token
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);
    
                    // listing
                    await expect( NFTMarketplaceProxy.createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1)).to.be.revertedWith('Only the owner can list the NFT');
                    await expect( NFTMarketplaceProxy.createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,50)).to.be.revertedWith('Sender does have sufficient amount of token');
                })
                it("Should revert error if owner has not approve the marketplace contract", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
    
                    // minting erc721 nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr2.address, 0, 100, 0x00);
    
                    // listing erc721 token
                    await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 1)).to.be.revertedWith('Need to approve this contract');
                    //added login in v2
                    // listing erc1155 token
                    // await expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address, 0, ethers.utils.parseEther("1.0"), 2, 1)).to.be.revertedWith('Sender need to approve this contract');
                })
                it("Should revert error if the price is less than 1", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
    
                    // minting erc721 nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving 
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);
    
                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);
    
                    // listing erc721 token
                    await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, 0, 1, 1)).to.be.revertedWith('Price must be greater than zero');
    
                    // listing erc1155 token
                    await expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address, 0, 0, 2, 1)).to.be.revertedWith('Price must be greater than zero');
    
                    
                })
                it("Should revert error if the token amount is less than 1", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
    
                    // minting erc721 nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving erc721 
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);
    
                    // listing
                    await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 0)).to.be.revertedWith('Invalid token amount');
                   
                    await expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address, 0, ethers.utils.parseEther("1.0"), 2, 0)).to.be.revertedWith('Invalid token amount');
                })
                it("Should revert error if token type is not 1 or 2 ", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
                    
                    // minting nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);
    
                    // listing
                    await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 3, 1)).to.be.revertedWith('Invalid token type');

                    await expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address, 0, ethers.utils.parseEther("1.0"), 3, 1)).to.be.revertedWith('Invalid token type');
                })
                it("Should revert error if nft is already listed",async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
                    
                    // minting nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);
    
                    // listing 
                    await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);
                    await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,20);
    
                    // listing again
                    await expect(NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address, 0, ethers.utils.parseEther("1.0"), 1, 2)).to.be.revertedWith('NFT is already listed');
                    await expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address, 0, ethers.utils.parseEther("1.0"), 2, 50)).to.be.revertedWith('NFT is already listed');
                })
                it("Should transfer nft from user to NFTmarketplace contract if txn gets succeeded", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                    // minting nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);

                    // getting balance of contract of that erc1155 token before listing 
                    const erc1155tokeBalanceBefore = await Erc1155NftContract.balanceOf(NFTMarketplaceProxy.address, 0);
    
                    // listing 
                    await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);
                    await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,50);
    
                    // checking owner 
                    expect (await Erc721NftContract.ownerOf(0)).to.be.equal(NFTMarketplaceProxy.address)
                    expect(await Erc1155NftContract.balanceOf(NFTMarketplaceProxy.address,0)).to.be.greaterThan(erc1155tokeBalanceBefore);
                })
                it("Should set the right seller in listings struct details", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                    // minting nft
                    await Erc721NftContract.connect(addr2).mint(addr2.address,0);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);
    
                    // approving
                    await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);

                    // getting balance of contract of that erc1155 token before listing 
                    const erc1155tokeBalanceBefore = await Erc1155NftContract.balanceOf(NFTMarketplaceProxy.address, 0);
    
                    // listing 
                    await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);
                    await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,50);

                    // checking sellet address
                    const erc721ListingDetails = await NFTMarketplaceProxy.listings(Erc721NftContract.address,0)
                    const erc1155ListingDetails = await NFTMarketplaceProxy.listings(Erc1155NftContract.address,0)
                    

                    expect(erc721ListingDetails[0]).to.be.equal(addr2.address);
                    expect(erc1155ListingDetails[0]).to.be.equal(addr3.address);
                })
            })
            describe("ERC721",function(){
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
                
            })
            describe("ERC1155",function(){
                it("Should revert error if owner does not have sufficient erc1155 token", async () => {
                    const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                    const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                    // minting erc1155 nft
                    await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                    // added in V2
                    //approving from erc1155
                    await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);

                    // listing
                    expect(NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,110)).to.be.revertedWith('Sender does have sufficient amount of token')
                })
            })
        })
        describe("Events",function() {
            it("Should emit event when nft gets listed", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);
                
                // minting nft
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
                await Erc1155NftContract.connect(addr3).mint(addr3.address,0,100,0x00);

                // approving
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // added in V2
                //approving from erc1155
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address,true);


                // listing 1 
                expect(await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1)).to.be.emit(NFTMarketplaceProxy,"ListingCreated").withArgs(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),addr2.address,1,1);
                expect(await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),2,50)).to.be.emit(NFTMarketplaceProxy,"ListingCreated").withArgs(Erc1155NftContract.address,0,ethers.utils.parseEther("1.0"),addr3.address,2,50);
            })
        })
    })
    describe("Pausing and Unpasing Listing",function() {
        describe("Validation",function() {
            it("Should not pause and listing which is already sold and revert error", async() => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                // pausing check 
                expect(NFTMarketplaceProxy.pauseUnpauseListing(Erc721NftContract.address,0,false)).to.be.revertedWith('Nft already sold');
                expect(NFTMarketplaceProxy.pauseUnpauseListing(Erc1155NftContract.address,0,false)).to.be.revertedWith('Nft already sold');
            })
            it("Should revert error if the caller is not seller of token", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // pausing check 
                expect(NFTMarketplaceProxy.pauseUnpauseListing(Erc721NftContract.address,0,false)).to.be.revertedWith('Only owner can pause the listing');
                expect(NFTMarketplaceProxy.pauseUnpauseListing(Erc1155NftContract.address,0,false)).to.be.revertedWith('Only owner can pause the listing');
            })
            it("Should pause listing if listing is not sold yet",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // pausing listing erc721
                await NFTMarketplaceProxy.connect(addr2).pauseUnpauseListing(Erc721NftContract.address,0, false);
                // pausing listing erc1155
                await NFTMarketplaceProxy.connect(addr3).pauseUnpauseListing(Erc1155NftContract.address,0, false);

                // gettign erc721 listing details
                const erc721ListingDetails = await NFTMarketplaceProxy.listings(Erc721NftContract.address,0);
                // getting erc1155 listing details 
                const erc1155ListingDetails = await NFTMarketplaceProxy.listings(Erc1155NftContract.address,0);

                expect(erc721ListingDetails[5]).to.be.false;
                expect(erc1155ListingDetails[5]).to.be.false;

            })
            it("Should not affect the listing count ", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // pausing listing erc721
                await NFTMarketplaceProxy.connect(addr2).pauseUnpauseListing(Erc721NftContract.address,0, false);
                // pausing listing erc1155
                await NFTMarketplaceProxy.connect(addr3).pauseUnpauseListing(Erc1155NftContract.address,0, false);

                expect(NFTMarketplaceProxy.listingCount()).to.not.be.change;

            })
        })
        describe("Events",function() {
            it("Should emit event when pausing and unpasing listing", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // pausing listing erc721
                expect(await NFTMarketplaceProxy.connect(addr2).pauseUnpauseListing(Erc721NftContract.address,0, false)).to.emit(NFTMarketplaceProxy,'ListingPausedUnpaused').withArgs(Erc721NftContract.address,0,1,addr2.address);
                // pausing listing erc1155
                expect(await NFTMarketplaceProxy.connect(addr3).pauseUnpauseListing(Erc1155NftContract.address,0, false)).to.emit(NFTMarketplaceProxy,'ListingPausedUnpaused').withArgs(Erc1155NftContract.address,0,2,addr3.address);
            })
        })
    })
    describe("Update Listing",function() {
        describe("Validation",function() {
            it("Should not allow to update details if nft is already sold", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                expect(NFTMarketplaceProxy.updateListing(Erc721NftContract.address,0,ethers.utils.parseEther("0.7"))).to.be.revertedWith('Nft already sold');
                expect(NFTMarketplaceProxy.updateListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1"))).to.be.revertedWith('Nft already sold');
            })
            it("Should not allow any other than onwer to update listing details", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                expect(NFTMarketplaceProxy.updateListing(Erc721NftContract.address,0,ethers.utils.parseEther("0.7"))).to.be.revertedWith('Only owner can update listing details');
                expect(NFTMarketplaceProxy.updateListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1"))).to.be.revertedWith('Only owner can update listing details');
            })
            it("Should revert error if the new amount is not greater than 0", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                expect(NFTMarketplaceProxy.connect(addr2).updateListing(Erc721NftContract.address,0,0)).to.be.revertedWith('Amount should be greater than zero');
                expect(NFTMarketplaceProxy.connect(addr3).updateListing(Erc1155NftContract.address,0,0)).to.be.revertedWith('Amount should be greater than zero');
            })
            it("Should update the listing details", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // updating listing details
                await NFTMarketplaceProxy.connect(addr2).updateListing(Erc721NftContract.address,0,ethers.utils.parseEther("0.7"));
                await NFTMarketplaceProxy.connect(addr3).updateListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1"));

                // getting details
                const erc721ListingDetails = await NFTMarketplaceProxy.listings(Erc721NftContract.address,0);
                const erc1155ListingDetails = await NFTMarketplaceProxy.listings(Erc1155NftContract.address,0);

                expect(erc721ListingDetails[1]).to.be.equal(ethers.utils.parseEther("0.7"));
                expect(erc1155ListingDetails[1]).to.be.equal(ethers.utils.parseEther("1"));
            })
        })
        describe("Events",function() {
            it("Should emit event when updating listing details", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // updating listing details
                expect(await NFTMarketplaceProxy.connect(addr2).updateListing(Erc721NftContract.address,0,ethers.utils.parseEther("0.7"))).to.emit(NFTMarketplaceProxy,'ListingUpdated');
                expect(await NFTMarketplaceProxy.connect(addr3).updateListing(Erc1155NftContract.address,0,ethers.utils.parseEther("1"))).to.emit(NFTMarketplaceProxy,'ListingUpdated');
            })
        })
    })
    describe("Buying Listed Nft",function() {
        describe("Validation",function() {
            it("Should not allow anyone to buy nft if its already sold",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                expect(NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{value: ethers.utils.parseEther("1") })).to.be.revertedWith('Nft already sold');
                expect(NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{value: ethers.utils.parseEther("0.5") })).to.be.revertedWith('Nft already sold');
            })
            it("Should not allow anyone to buy if there is not such listed nft",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // buying listed nft
                expect(NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") })).to.be.revertedWith('No such listing');
                expect(NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") })).to.be.revertedWith('No such listing');
            })
            it("Should not allow anyone to buy nft if the listing is paused by the lister ",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                await NFTMarketplaceProxy.connect(addr2).pauseUnpauseListing(Erc721NftContract.address,0,false);
                await NFTMarketplaceProxy.connect(addr3).pauseUnpauseListing(Erc1155NftContract.address,0, false);

                // buying listed nft
                expect(NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") })).to.be.revertedWith('listing is paused');
                expect(NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") })).to.be.revertedWith('listing is paused');
            })
            it("Should revert error if amount sended is less than ", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                expect(NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("0.1") })).to.be.revertedWith('Insufficient amount sended');
                expect(NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.2") })).to.be.revertedWith('Insufficient amount sended');
            })
            it("Should transfer nft token to right caller ",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                expect(await Erc721NftContract.ownerOf(0)).to.be.equal(addr1.address);
                expect(await Erc1155NftContract.balanceOf(addr1.address,0)).to.be.greaterThan(0)
            })
            it("Should transfer eth to lister", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                const balanceBeforeErc721Owner = await addr2.getBalance();
                const balanceBeforeErc1155Owner = await addr3.getBalance();

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                expect(await addr2.getBalance()).to.be.greaterThan(balanceBeforeErc721Owner);
                expect(await addr3.getBalance()).to.be.greaterThan(balanceBeforeErc1155Owner);
            })
            it("Should update the status and sold status of listing", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                // getting details 
                const erc721ListingDetails = await NFTMarketplaceProxy.listings(Erc721NftContract.address,0);
                const erc1155ListingDetails = await NFTMarketplaceProxy.listings(Erc1155NftContract.address,0);

                expect(erc721ListingDetails.sold).to.be.true;
                expect(erc721ListingDetails.status).to.be.false;
                
                expect(erc1155ListingDetails.sold).to.be.true;
                expect(erc1155ListingDetails.status).to.be.false;
                
            })
            it("Should remove listing from counting ", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                
                expect(await NFTMarketplaceProxy.listingCount()).to.be.lessThan(2);

                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                expect(await NFTMarketplaceProxy.listingCount()).to.be.lessThan(1);
            })
        })
        describe("Events",function() {
            it("Should emit event when anyone buys nft",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                expect(await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") })).to.emit(NFTMarketplaceProxy,'ListingSold');
                expect(await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") })).to.emit(NFTMarketplaceProxy,'ListingSold');

            })
        })
    })
    describe("Removing Listing",function() {
        describe("Validation",function() {
            it("Should not allow to remove listing if its sold already",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                // buying listed nft
                await NFTMarketplaceProxy.buyListedNft(Erc721NftContract.address,0,{ value: ethers.utils.parseEther("1") });
                await NFTMarketplaceProxy.buyListedNft(Erc1155NftContract.address,0,{ value: ethers.utils.parseEther("0.5") });

                // removing listing
                expect(NFTMarketplaceProxy.connect(addr2).removeListing(Erc721NftContract.address,0)).revertedWith('Nft already sold');
                expect(NFTMarketplaceProxy.connect(addr3).removeListing(Erc1155NftContract.address,0)).revertedWith('Nft already sold');
            })
            it("Should handle invalid listing inputs",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // removing listing
                expect(NFTMarketplaceProxy.connect(addr2).removeListing(Erc721NftContract.address,0)).revertedWith('No such listing');
                expect(NFTMarketplaceProxy.connect(addr3).removeListing(Erc1155NftContract.address,0)).revertedWith('No such listing');
            })
            it("Should revert error if caller is not lister", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                expect(NFTMarketplaceProxy.removeListing(Erc721NftContract.address,0)).to.be.revertedWith('Only the seller can remove the listing');
                expect(NFTMarketplaceProxy.removeListing(Erc1155NftContract.address,0)).to.be.revertedWith('Only the seller can remove the listing');

            })
            it("Should transfer nft back to the lister if is an valid user",async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                const balanceBeforeRemoving = await Erc1155NftContract.balanceOf(addr3.address,0);

                await NFTMarketplaceProxy.connect(addr2).removeListing(Erc721NftContract.address,0);
                await NFTMarketplaceProxy.connect(addr3).removeListing(Erc1155NftContract.address,0);

                expect(await Erc721NftContract.ownerOf(0)).to.be.equal(addr2.address);
                expect(await Erc1155NftContract.balanceOf(addr3.address,0)).to.be.greaterThan(balanceBeforeRemoving);
            })
            it("Should delete listing details, when called by valid user", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                await NFTMarketplaceProxy.connect(addr2).removeListing(Erc721NftContract.address,0);
                await NFTMarketplaceProxy.connect(addr3).removeListing(Erc1155NftContract.address,0);

                // getting details 
                const erc721ListingDetails= await NFTMarketplaceProxy.listings(Erc721NftContract.address,0);
                const erc1155ListingDetails = await NFTMarketplaceProxy.listings(Erc1155NftContract.address,0);
                expect(erc721ListingDetails.seller).to.be.equals(ethers.constants.AddressZero);
                expect(erc1155ListingDetails.seller).to.be.equals(ethers.constants.AddressZero);
            })
        })
        describe("Events",function() {
            it("Should emit event when successfully removed listing ", async () => {
                const { NFTMarketplaceProxy, addr1, addr2, addr3 } = await loadFixture(deployNftMarketplaceProxyFixture);
                const { Erc721NftContract } = await loadFixture(deployErc721ContractFixture);
                const { Erc1155NftContract } = await loadFixture(deployErc1155ContractFixture);

                // minting erc721 nft 
                await Erc721NftContract.connect(addr2).mint(addr2.address,0);
    
                // minting erc1155 nft
                await Erc1155NftContract.connect(addr3).mint(addr3.address, 0, 100, 0x00);

                // approving erc721 token
                await Erc721NftContract.connect(addr2).approve(NFTMarketplaceProxy.address,0);

                // approving erc1155 token
                await Erc1155NftContract.connect(addr3).setApprovalForAll(NFTMarketplaceProxy.address, true);

                // listing erc721 token
                await NFTMarketplaceProxy.connect(addr2).createListing(Erc721NftContract.address,0,ethers.utils.parseEther("1.0"),1,1);

                // listing erc1155 token
                await NFTMarketplaceProxy.connect(addr3).createListing(Erc1155NftContract.address,0,ethers.utils.parseEther("0.5"),2,100);

                expect(await NFTMarketplaceProxy.connect(addr2).removeListing(Erc721NftContract.address,0)).to.emit(NFTMarketplaceProxy,'ListingRemoved');
                expect(await NFTMarketplaceProxy.connect(addr3).removeListing(Erc1155NftContract.address,0)).to.emit(NFTMarketplaceProxy,'ListingRemoved');
            })
        })
    })
  
  });