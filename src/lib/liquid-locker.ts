import { ethers } from 'ethers';
import { LiquidLockerData } from '../pendle-api';
import { UserTempShare } from '../types';
import { getAllERC20Balances } from '../multicall';
import * as constants from '../consts';

const ERC20_TRANSFER_TOPIC = ethers.utils.solidityKeccak256(
  ['string'],
  ['Transfer(address,address,uint256)']
);

export async function resolveLiquidLocker(
  boostedSyBalance: ethers.BigNumber,
  llData: LiquidLockerData,
  fee: number,
  blockNumber: number
): Promise<UserTempShare[]> {
  if (boostedSyBalance.isZero()) {
    return [];
  }

  const users = llData.users;
  const receiptToken = llData.receiptToken;

  if (users.length === 0) {
    const transfers = await constants.PROVIDER.getLogs({
      address: receiptToken,
      topics: [ERC20_TRANSFER_TOPIC],
      fromBlock: 0
    });

    const recipients = transfers.map(
      ({ topics }) =>
        ethers.utils.defaultAbiCoder.decode(['address'], topics[2])[0]
    );

    users.push(...new Set(recipients));
    users.splice(users.indexOf(ethers.constants.AddressZero), 1);
  }

  const balances = await getAllERC20Balances(receiptToken, users, blockNumber);

  const totalReceiptBalance = balances.reduce(
    (a, b) => a.add(b),
    ethers.BigNumber.from(0)
  );

  if (totalReceiptBalance.isZero()) {
    return [];
  }

  const res: UserTempShare[] = [];

  if (fee > 0) {
    const feeShare = boostedSyBalance
      .mul(ethers.utils.parseEther(fee.toString()))
      .div(ethers.constants.WeiPerEther);

    res.push({
      user: llData.lpHolder,
      share: feeShare
    });

    boostedSyBalance = boostedSyBalance.sub(feeShare);
  }

  for (let j = 0; j < users.length; ++j) {
    const user = users[j];
    const receiptBalance = balances[j];

    if (receiptBalance.isZero()) {
      continue;
    }

    const userShare = receiptBalance
      .mul(boostedSyBalance)
      .div(totalReceiptBalance);

    res.push({
      user: user,
      share: userShare
    });
  }
  return res;
}
