/* eslint-disable no-unused-vars */
/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const { ethers } = require('hardhat');

// Utility functions
const toWei = (value) => ethers.utils.parseEther(value.toString());
const getBalance = ethers.provider.getBalance;

const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn.mul(ethers.BigNumber.from(1000 - FEE));
  return reserveOut.mul(amountInWithFee).div(reserveIn.mul(ethers.BigNumber.from('1000')).add(amountInWithFee));
};

const FEE = 1; // 0.1% fees

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
    transmute1 = await Transmute1.deploy(token1.address, FEE);
    token1.connect(LP1).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(LP2).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(LP3).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(alice).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(bob).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(charlie).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(dan).approve(transmute1.address, USER_INITIAL_BALANCE);
    token1.connect(eve).approve(transmute1.address, USER_INITIAL_BALANCE);
  });

  describe('deployement', async () => {
    it('should have fee', async () => {
      expect(await transmute1.fee()).to.equal(FEE);
    });
  });

  describe('addLiquidity', async () => {
    describe('empty liquidity pool', async () => {
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
      it('should mint FLAMEL token', async () => {
        await expect(() =>
          transmute1.connect(LP1).addLiquidity(toWei('1000'), { value: toWei('1') })
        ).to.changeTokenBalance(transmute1, LP1, toWei('1'));
      });
    });
    describe('existing liquidity pool', async () => {
      beforeEach(async () => {
        await transmute1.connect(LP1).addLiquidity(toWei('1000'), { value: toWei('1') });
      });
      it('should preserve exchange rate', async () => {
        const quoteBefore = await transmute1.quote(toWei('0.5'), toWei('1'), toWei('1000'));
        const aliceEthBalanceBefore = await getBalance(alice.address);
        await expect(() =>
          transmute1.connect(alice).addLiquidity(toWei('500'), { value: toWei('0.5'), gasPrice: 0 })
        ).to.changeTokenBalances(token1, [transmute1, alice], [toWei(500), toWei(-500)]);
        const quoteAfter = await transmute1.quote(toWei('0.5'), toWei('1'), toWei('1000'));
        expect(quoteBefore, 'quote has changed after adding liquidity').to.equal(quoteAfter);
        expect(await getBalance(alice.address)).to.equal(aliceEthBalanceBefore.sub(toWei('0.5')));
      });
      it('should only accept minimum token amount for ratio correctness', async () => {
        await expect(() =>
          transmute1.connect(alice).addLiquidity(toWei('10000'), { value: toWei('0.5') })
        ).to.changeTokenBalances(token1, [transmute1, alice], [toWei(500), toWei(-500)]);
      });
      it('should revert if ratio is not good', async () => {
        await expect(transmute1.connect(alice).addLiquidity(toWei('1'), { value: toWei('1') })).to.be.revertedWith(
          'Transmute: insufficient amount'
        );
      });
      it('should mint FLAMEL token', async () => {
        const totalSupply = await transmute1.totalSupply();
        const ethBalance = await getBalance(transmute1.address);
        const flamelReward = toWei('0.5').mul(totalSupply).div(ethBalance);
        await expect(() =>
          transmute1.connect(alice).addLiquidity(toWei('500'), { value: toWei('0.5') })
        ).to.changeTokenBalance(transmute1, alice, flamelReward);
      });
    });
  });

  describe('getTokenAmountOut', async () => {
    it('Should return correct token amount', async () => {
      await transmute1.connect(LP1).addLiquidity(toWei(2000), { value: toWei(1000) });
      let amountOut = await transmute1.getTokenAmountOut(toWei(1));
      const reserveIn = await getBalance(transmute1.address);
      const reserveOut = await token1.balanceOf(transmute1.address);
      expect(amountOut).to.equal(getAmountOut(toWei(1), reserveIn, reserveOut));
      amountOut = await transmute1.getTokenAmountOut(toWei(100));
      expect(amountOut).to.equal(getAmountOut(toWei(100), reserveIn, reserveOut));
      amountOut = await transmute1.getTokenAmountOut(toWei(1000));
      expect(amountOut).to.equal(getAmountOut(toWei(1000), reserveIn, reserveOut));
    });
  });

  describe('getEthAmountOut', async () => {
    it('Should return correct ETH amount', async () => {
      await transmute1.connect(LP1).addLiquidity(toWei(2000), { value: toWei(1000) });
      let amountOut = await transmute1.getEthAmountOut(toWei(2));
      const reserveIn = await token1.balanceOf(transmute1.address);
      const reserveOut = await getBalance(transmute1.address);
      expect(amountOut).to.equal(getAmountOut(toWei(2), reserveIn, reserveOut));
      amountOut = await transmute1.getEthAmountOut(toWei(100));
      expect(amountOut).to.equal(getAmountOut(toWei(100), reserveIn, reserveOut));
      amountOut = await transmute1.getEthAmountOut(toWei(2000));
      expect(amountOut).to.equal(getAmountOut(toWei(2000), reserveIn, reserveOut));
    });
  });

  describe('swap', async () => {
    beforeEach(async () => {
      await transmute1.connect(LP1).addLiquidity(toWei(2000), { value: toWei(1000) });
    });
    describe('swapEthToToken', () => {
      it('Should swap ETH to Token', async () => {
        let ethAmountIn = toWei(1);
        let tokenAmountOut = await transmute1.getTokenAmountOut(ethAmountIn);
        let prevTokenBalanceAlice = await token1.balanceOf(alice.address);
        let prevTokenBalanceTransmute = await token1.balanceOf(transmute1.address);
        // swap and check ETH balances
        await expect(() =>
          transmute1.connect(alice).swapEthToToken(tokenAmountOut, { value: ethAmountIn })
        ).to.changeEtherBalances([transmute1, alice], [ethAmountIn, ethAmountIn.mul(ethers.BigNumber.from('-1'))]);
        // Check token balances
        expect(await token1.balanceOf(alice.address)).to.equal(prevTokenBalanceAlice.add(tokenAmountOut));
        expect(await token1.balanceOf(transmute1.address)).to.equal(prevTokenBalanceTransmute.sub(tokenAmountOut));

        ethAmountIn = toWei(100);
        tokenAmountOut = await transmute1.getTokenAmountOut(ethAmountIn);
        prevTokenBalanceAlice = await token1.balanceOf(alice.address);
        prevTokenBalanceTransmute = await token1.balanceOf(transmute1.address);
        // swap and check ETH balances
        await expect(() =>
          transmute1.connect(alice).swapEthToToken(tokenAmountOut, { value: ethAmountIn })
        ).to.changeEtherBalances([transmute1, alice], [ethAmountIn, ethAmountIn.mul(ethers.BigNumber.from('-1'))]);
        // Check token balances
        expect(await token1.balanceOf(alice.address)).to.equal(prevTokenBalanceAlice.add(tokenAmountOut));
        expect(await token1.balanceOf(transmute1.address)).to.equal(prevTokenBalanceTransmute.sub(tokenAmountOut));
      });
    });
    describe('swapTokenToEth', async () => {
      it('Should swap Token to ETH', async () => {
        let tokenAmountIn = toWei(2);
        let ethAmountOut = await transmute1.getEthAmountOut(tokenAmountIn);
        let prevTokenBalanceAlice = await token1.balanceOf(alice.address);
        let prevTokenBalanceTransmute = await token1.balanceOf(transmute1.address);
        // swap and check ETH balances
        await expect(() =>
          transmute1.connect(alice).swapTokenToEth(tokenAmountIn, ethAmountOut)
        ).to.changeEtherBalances([transmute1, alice], [ethAmountOut.mul(ethers.BigNumber.from('-1')), ethAmountOut]);
        // Check token balances
        expect(await token1.balanceOf(alice.address)).to.equal(prevTokenBalanceAlice.sub(tokenAmountIn));
        expect(await token1.balanceOf(transmute1.address)).to.equal(prevTokenBalanceTransmute.add(tokenAmountIn));

        tokenAmountIn = toWei(100);
        ethAmountOut = await transmute1.getEthAmountOut(tokenAmountIn);
        prevTokenBalanceAlice = await token1.balanceOf(alice.address);
        prevTokenBalanceTransmute = await token1.balanceOf(transmute1.address);
        // swap and check ETH balances
        await expect(() =>
          transmute1.connect(alice).swapTokenToEth(tokenAmountIn, ethAmountOut)
        ).to.changeEtherBalances([transmute1, alice], [ethAmountOut.mul(ethers.BigNumber.from('-1')), ethAmountOut]);
        // Check token balances
        expect(await token1.balanceOf(alice.address)).to.equal(prevTokenBalanceAlice.sub(tokenAmountIn));
        expect(await token1.balanceOf(transmute1.address)).to.equal(prevTokenBalanceTransmute.add(tokenAmountIn));
      });
    });
  });

  describe('removeLiquidity', async () => {
    beforeEach(async () => {
      await transmute1.connect(LP1).addLiquidity(toWei('1000'), { value: toWei('1') });
    });
    it('should send back liquidity to provider', async () => {
      const beforeTokenBalance = await token1.balanceOf(LP1.address);
      await expect(() =>
        transmute1.connect(LP1).removeLiquidity(toWei('1'), toWei('1'), toWei('1000'))
      ).to.changeEtherBalance(LP1, toWei('1'));
      expect(await token1.balanceOf(LP1.address), 'should increase token balance').to.equal(
        beforeTokenBalance.add(toWei('1000'))
      );
      expect(await transmute1.balanceOf(LP1.address), 'Should have 0 FLAMEL').to.equal(0);
    });
    it('should send back liquidity with fee', async () => {
      const ethAmountIn = toWei('0.5');
      const tokenAmountOut = await transmute1.getTokenAmountOut(ethAmountIn);
      const poolEtherBalance = await getBalance(transmute1.address);
      const poolTokenBalance = await transmute1.getReserve();
      const oldLP1Token1Balance = await token1.balanceOf(LP1.address);

      // swap is done
      await transmute1.connect(alice).swapEthToToken(tokenAmountOut, { value: ethAmountIn });
      // remove liquidity here
      await expect(() =>
        transmute1.connect(LP1).removeLiquidity(toWei('1'), toWei('0'), toWei('0'))
      ).to.changeEtherBalance(LP1, ethAmountIn.add(poolEtherBalance));
      expect(await token1.balanceOf(LP1.address)).to.equal(
        oldLP1Token1Balance.add(poolTokenBalance).sub(tokenAmountOut)
      );
    });
  });
});
