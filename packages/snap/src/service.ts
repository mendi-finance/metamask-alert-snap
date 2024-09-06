import { Lending } from '@mendi-finance/lending-sdk';

import { getCustomRPCs } from './utils/utils';

export const getBorrowLimitUsedPercentage = async (address: string) => {
  const customRpcUrls = await getCustomRPCs();
  const lending = new Lending(address as `0x${string}`, customRpcUrls);
  await lending.initialize();
  const borrowLimit = lending.getBorrowLimitUsedPercentage();
  return borrowLimit;
};
