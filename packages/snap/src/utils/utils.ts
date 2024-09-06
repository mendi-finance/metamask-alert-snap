import { ManageStateOperation } from '@metamask/snaps-sdk';

import type { SnapState } from '../types';

/**
 * Get the snap state.
 * @returns Snap State.
 */
export async function getState() {
  const snapState = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: ManageStateOperation.GetState,
      encrypted: false,
    },
  });

  console.log('snapState', snapState);

  return (snapState ?? {}) as any;
}

/**
 * Set the snap state.
 * @param state - The new state to set.
 */
export async function setState(state: SnapState): Promise<void> {
  try {
    const currentState = await getState();
    const newState = {
      ...currentState,
      ...state,
    };
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: ManageStateOperation.UpdateState,
        newState,
        encrypted: false,
      },
    });
  } catch (error) {
    console.error(`Failed to set the Snap's state`);
  }
}

/**
 * Get the current chain ID.
 * @returns The current chain ID.
 */
export async function getChainId() {
  let chainId = await ethereum.request<string>({
    method: 'eth_chainId',
  });

  if (!chainId) {
    console.error('Something went wrong while getting the chain ID.');
    chainId = '1';
  }

  return chainId;
}

/**
 * Convert the raw balance to a displayable balance.
 * @param rawBalance - The raw balance.
 * @returns The displayable balance.
 */
export function convertBalanceToDisplay(rawBalance?: string | null) {
  if (!rawBalance || rawBalance === '0x') {
    return 0;
  }

  return Number(BigInt(rawBalance) / BigInt(10 ** 18));
}

/**
 * Simple string truncation with ellipsis.
 * @param input - The input to be truncated.
 * @param maxLength - The size of the string to truncate.
 * @returns The truncated string or the original string if shorter than maxLength.
 */
export function truncateString(input: string, maxLength: number): string {
  if (input.length > maxLength) {
    return `${input.substring(0, maxLength)}...`;
  }
  return input;
}

/**
 * Save custom RPC URL to the snap state.
 * @param rpcUrl - The custom RPC URL to save.
 */
export async function addCustomRPC(rpcUrl: string): Promise<void> {
  const currentState = await getState();
  const customRPCs = currentState.customRPCs || [];
  if (!customRPCs.includes(rpcUrl)) {
    const newState = {
      ...currentState,
      customRPCs: [...customRPCs, rpcUrl],
    };
    await setState(newState);
  }
}

/**
 * Remove a custom RPC URL from the snap state.
 * @param rpcUrl - The custom RPC URL to remove.
 */
export async function removeCustomRPC(rpcUrl: string): Promise<void> {
  const currentState = await getState();
  const customRPCs = currentState.customRPCs || [];
  const newState = {
    ...currentState,
    customRPCs: customRPCs.filter((url: string) => url !== rpcUrl),
  };
  await setState(newState);
}

/**
 * Get all custom RPC URLs from the snap state.
 * @returns An array of custom RPC URLs or an empty array if none are set.
 */
export async function getCustomRPCs(): Promise<string[]> {
  const state = await getState();
  return state.customRPCs || [];
}
