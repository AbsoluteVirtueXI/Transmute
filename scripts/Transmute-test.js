const { ethers } = require('ethers');

const main = async () => {
  const provider = ethers.getDefaultProvider('rinkeby');
  const a = await provider.getBalance('0x57d401b8502bc5cbbaafd2564236de4571165051');
  console.log(a.toString());
};

main();
