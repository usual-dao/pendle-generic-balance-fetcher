import { ethers } from 'ethers';
import { LiquidLockerData } from '../pendle-api';
import { UserTempShare } from '../types';
import { getAllERC20Balances } from '../multicall';

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
