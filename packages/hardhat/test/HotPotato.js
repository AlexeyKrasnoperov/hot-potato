const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HotPotato", function () {
  let contract;
  let owner, alice, bob;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const HotPotato = await ethers.getContractFactory("HotPotato");
    contract = await HotPotato.deploy();
  });

  it("should create a potato", async () => {
    const tx = await contract.createPotato(alice.address);
    const receipt = await tx.wait();
    const id = await contract.potatoCount();
    const holder = await contract.getPotatoHolder(id);
    expect(holder).to.equal(alice.address);
  });

  it("should allow passing potato within time limit", async () => {
    await contract.createPotato(alice.address);
    const id = await contract.potatoCount();

    await contract.connect(alice).passPotato(id, bob.address, "cid123");

    const holder = await contract.getPotatoHolder(id);
    expect(holder).to.equal(bob.address);
  });

  it("should not allow passing by non-holder", async () => {
    await contract.createPotato(alice.address);
    const id = await contract.potatoCount();

    await expect(
      contract.connect(bob).passPotato(id, alice.address, "cidXYZ")
    ).to.be.revertedWith("Not current holder");
  });

  it("should burn potato after timeout", async () => {
    await contract.createPotato(alice.address);
    const id = await contract.potatoCount();

    await ethers.provider.send("evm_increaseTime", [10 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    await contract.connect(alice).burnPotato(id);
    const isActive = await contract.isActive(id);
    expect(isActive).to.equal(false);
  });

  it("should not burn before timeout", async () => {
    await contract.createPotato(alice.address);
    const id = await contract.potatoCount();

    await expect(
      contract.connect(alice).burnPotato(id)
    ).to.be.revertedWith("Still within time");
  });
});
