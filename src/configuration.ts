import { CHAINS, PoolConfiguration } from './types';

export const CHAIN = CHAINS.ETHEREUM;

export const POOL_INFO: PoolConfiguration = {
  SY: '0x47bce1bb5d9a9072161ec25009bcd6e8d367b7d3',
  YT: '0x4f0b4e6512630480b868e62a8a1d3451b0e9192d',
  LPs: [
    {
      address: '0x00b321d89a8c36b3929f20b7955080baed706d1b',
      deployedBlock: 20468430
    }
  ],
  liquidLockerFees: {
    stakedao: 0.15
  }
};
