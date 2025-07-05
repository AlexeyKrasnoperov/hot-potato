import { expect } from "chai";
import { ethers } from "hardhat";

describe("HotPotato", function () {
  let contract, owner, player1, player2, player3, player4, player5, player6;

  beforeEach(async () => {
    [owner, player1, player2, player3, player4, player5, player6] = await ethers.getSigners();
    const HotPotato = await ethers.getContractFactory("HotPotato");
    contract = await HotPotato.deploy();
  });

  it("is owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should create a potato", async () => {
    await contract.createPotato(player1.address);
    const holder = await contract.getPotatoHolder(1);
    expect(holder).to.equal(player1.address);
  });

  it("should pass the potato and update recent holders", async () => {
    await contract.createPotato(player1.address);
    await contract.passPotato(1, player2.address, "cid1");
    await contract.passPotato(1, player3.address, "cid2");
    const holder = await contract.getPotatoHolder(1);
    expect(holder).to.equal(player3.address);
  });

  it("should not allow passing potato to someone in recent holders", async () => {
    await contract.createPotato(player1.address);
    await contract.passPotato(1, player2.address, "cid1");
    await contract.passPotato(1, player3.address, "cid2");
    await contract.passPotato(1, player4.address, "cid3");
    await contract.passPotato(1, player5.address, "cid4");
    await contract.passPotato(1, player6.address, "cid5");
    // try to pass back to player2 (should fail)
    await expect(contract.passPotato(1, player2.address, "cid6")).to.be.revertedWith("Recipient is in recent holders");
  });

  it("should burn and reward score correctly", async () => {
    await contract.createPotato(player1.address);
    await contract.passPotato(1, player2.address, "cid1");
    await contract.passPotato(1, player3.address, "cid2");
    await contract.passPotato(1, player4.address, "cid3");

    // fast-forward time to expire the potato
    await ethers.provider.send("evm_increaseTime", [600]); // 10 minutes
    await ethers.provider.send("evm_mine");

    // simulate burn by current holder
    await contract.connect(player4).burnPotato(1);

    const score1 = await contract.getScore(player1.address); // passed before 2 others
    const score2 = await contract.getScore(player2.address); // before 1
    const score3 = await contract.getScore(player3.address); // before 0
    expect(score1).to.equal(2);
    expect(score2).to.equal(1);
    expect(score3).to.equal(0);
  });
});
