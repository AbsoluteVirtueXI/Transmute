/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { ethers } = require('hardhat');

// Utility functions
const toWei = (value) => ethers.utils.parseEther(value.toString());
const getBalance = ethers.provider.getBalance;

const getAmountOut = (amountIn, reserveIn, reserveOut) => reserveOut.mul(amountIn).div(reserveIn.add(amountIn));

describe('Transmute', function () {
  const INITIAL_SUPPLY = toWei('1000000000');
  const USER_INITIAL_BALANCE = toWei('1000000');
  let deployer,
    alice,
    bob,
    charlie,
    dan,
    eve,
    LP1,
    LP2,
    LP3,
    Token1,
    token1,
    Token2,
    token2,
    Transmute1,
    transmute1,
    Transmute2,
    transmute2;
  before(async () => {
    [deployer, alice, bob, charlie, dan, eve, LP1, LP2, LP3] = await ethers.getSigners();
    // Deploy Token1 contract
    Token1 = await ethers.getContractFactory('Token1');
    token1 = await Token1.connect(deployer).deploy(INITIAL_SUPPLY);
    token1.connect(deployer).transfer(LP1.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(LP2.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(LP3.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(alice.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(bob.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(charlie.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(dan.address, USER_INITIAL_BALANCE);
    token1.connect(deployer).transfer(eve.address, USER_INITIAL_BALANCE);
  });

  beforeEach(async () => {
    // Deploy Transmute and make approvals
    Transmute1 = await ethers.getContractFactory('Transmute');
    transmute1 = await Transmute1.deploy(token1.address);
    token1.connect(LP1).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(LP2).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(LP3).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(alice).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(bob).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(charlie).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(dan).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(eve).approve(transmute1.address, USER_INITIAL_BALANCE);
  });

  describe('addLiquidity', async () => {
    it('should add liquidity', async () => {
      await transmute1.connect(LP1).addLiquidity(toWei('1000'), { value: toWei('1') });
      expect(
        await getBalance(transmute1.address),
        `transmute1 eth balance should be ${toWei('1').toString()}`
      ).to.equal(toWei('1'));
      expect(
        await token1.balanceOf(transmute1.address),
        `transmute1 token1 balance should be ${toWei('1000').toString()}`
      ).to.equal(toWei('1000'));
      expect(await transmute1.getReserve()).to.equal(toWei('1000'));
    });
  });

  describe('getTokenAmount', async () => {
    it('Should return correct token amount', async () => {
      await transmute1.connect(LP1).addLiquidity(toWei(2000), { value: toWei(1000) });
      let amountOut = await transmute1.getTokenAmount(toWei(1));
      const reserveIn = await getBalance(transmute1.address);
      const reserveOut = await token1.balanceOf(transmute1.address);
      expect(amountOut).to.equal(getAmountOut(toWei(1), reserveIn, reserveOut));
      amountOut = await transmute1.getTokenAmount(toWei(100));
      expect(amountOut).to.equal(getAmountOut(toWei(100), reserveIn, reserveOut));
      amountOut = await transmute1.getTokenAmount(toWei(1000));
      expect(amountOut).to.equal(getAmountOut(toWei(1000), reserveIn, reserveOut));
    });
  });

  describe('getEthAmount', async () => {
    it('Should return correct ETH amount', async () => {
      await transmute1.connect(LP1).addLiquidity(toWei(2000), { value: toWei(1000) });
      let amountOut = await transmute1.getEthAmount(toWei(2));
      const reserveIn = await token1.balanceOf(transmute1.address);
      const reserveOut = await getBalance(transmute1.address);
      expect(amountOut).to.equal(getAmountOut(toWei(2), reserveIn, reserveOut));
      amountOut = await transmute1.getEthAmount(toWei(100));
      expect(amountOut).to.equal(getAmountOut(toWei(100), reserveIn, reserveOut));
      amountOut = await transmute1.getEthAmount(toWei(2000));
      expect(amountOut).to.equal(getAmountOut(toWei(2000), reserveIn, reserveOut));
    });
  });
});
