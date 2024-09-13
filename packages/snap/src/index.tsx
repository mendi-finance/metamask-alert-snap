import {
  type OnRpcRequestHandler,
  type OnCronjobHandler,
  type OnHomePageHandler,
} from '@metamask/snaps-sdk';
import {
  Box,
  Text,
  Link,
  Heading,
  Divider,
  Image,
} from '@metamask/snaps-sdk/jsx';

import MendiIcon from '../img/icon-small.svg';
import { getBorrowLimitUsedPercentage } from './service';
import type { SnapState } from './types';
import {
  displayBorrowLimitDialog,
  sendBorrowLimitNotification,
} from './utils/ui';
import {
  addCustomRPC,
  getCustomRPCs,
  getState,
  removeCustomRPC,
  setState,
} from './utils/utils';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @see https://docs.metamask.io/snaps/reference/exports/#onrpcrequest
 * @see https://docs.metamask.io/snaps/reference/rpc-api/#wallet_invokesnap
 * @see https://docs.metamask.io/snaps/reference/rpc-api/#snap_notify
 * @throws If the request method is not valid for this snap.
 */

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const params = request.params as any;
  switch (request.method) {
    case 'connectAccount': {
      const { mendiAddress, threshold, notificationPeriod } = params;

      const mendiAddressStr = mendiAddress as `0x${string}`;
      const newState: SnapState = {
        mendiAddress: mendiAddressStr,
        threshold: threshold as number,
        notificationPeriod: notificationPeriod as number,
        lastNotificationTime: null,
        lastKnownAboveThreshold: false,
      };
      await setState(newState);
      return newState;
    }

    case 'updateThreshold': {
      const { threshold } = params;
      const currentState = (await getState()) as SnapState;
      const newState: SnapState = {
        ...currentState,
        threshold: threshold as number,
      };
      await setState(newState);
      return newState;
    }

    case 'updateNotificationPeriod': {
      const { notificationPeriod } = params;
      const currentState = (await getState()) as SnapState;
      const newState: SnapState = {
        ...currentState,
        notificationPeriod: notificationPeriod as number,
      };
      await setState(newState);
      return newState;
    }

    case 'addCustomRpc': {
      const { rpcUrls } = params;
      if (Array.isArray(rpcUrls)) {
        for (const rpcUrl of rpcUrls) {
          await addCustomRPC(rpcUrl);
        }
      } else if (typeof rpcUrls === 'string') {
        await addCustomRPC(rpcUrls);
      } else {
        throw new Error('Invalid rpcUrls parameter');
      }
      return await getCustomRPCs();
    }

    case 'removeCustomRpc': {
      const { rpcUrl } = params;
      if (typeof rpcUrl === 'string') {
        await removeCustomRPC(rpcUrl);
        return true;
      }
      throw new Error('Invalid parameters for removeCustomRpc');
    }

    case 'getState': {
      return await getState();
    }

    default:
      throw new Error(`Method not found: ${request.method}`);
  }
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'checkBorrowLimit': {
      const [{ locked }, snapState] = await Promise.all([
        snap.request({
          method: 'snap_getClientStatus',
        }),
        getState() as Promise<SnapState>,
      ]);

      const {
        threshold,
        notificationPeriod,
        lastNotificationTime,
        lastKnownAboveThreshold,
        mendiAddress,
      } = snapState;

      const currentTime = Date.now();

      // Check if it's time to check the borrow limit
      const timeSinceLastCheck = lastNotificationTime
        ? (currentTime - lastNotificationTime) / (60 * 1000)
        : Infinity;

      // Exit early if it's not time to check
      if (timeSinceLastCheck < notificationPeriod) {
        return;
      }

      const pct = await getBorrowLimitUsedPercentage(mendiAddress);
      const isAboveThreshold = pct >= threshold;
      const formattedPct = pct.toFixed(2);
      if (isAboveThreshold) {
        if (locked) {
          await sendBorrowLimitNotification(formattedPct);
        } else {
          await displayBorrowLimitDialog(formattedPct);
        }
        await setState({
          ...snapState,
          lastNotificationTime: currentTime,
          lastKnownAboveThreshold: true,
        });
      } else if (lastKnownAboveThreshold) {
        // Reset the last notification time if it just went below threshold
        await setState({
          ...snapState,
          lastNotificationTime: currentTime,
          lastKnownAboveThreshold: false,
        });
      } else {
        // Update lastNotificationTime even if no alert was sent
        await setState({
          ...snapState,
          lastNotificationTime: currentTime,
        });
      }

      return;
    }
    default:
      throw new Error(`Method not found: ${request.method}`);
  }
};

export const onHomePage: OnHomePageHandler = async () => {
  const state = (await getState()) as SnapState;
  const borrowLimitUsed = await getBorrowLimitUsedPercentage(
    state.mendiAddress,
  );

  return {
    content: (
      <Box>
        <Box direction="horizontal">
          <Image src={MendiIcon} />
          <Heading>Mendi Finance Liquidation Alert</Heading>
        </Box>
        <Divider />
        <Text>Current Borrow Limit Used: {borrowLimitUsed.toFixed(2)}%</Text>
        <Text>Threshold: {state.threshold?.toString() ?? 'Not set'}%</Text>
        <Text>
          Notification Period:{' '}
          {state.notificationPeriod?.toString() ?? 'Not set'} minutes
        </Text>
        <Divider />
        <Heading>Your Connected Address</Heading>
        <Text>{state.mendiAddress ?? 'Not set'}</Text>
        <Divider />
        <Text>
          To update your settings, please visit the Mendi Finance website:
        </Text>
        <Link href="https://mendi.finance/snap">Mendi Finance</Link>
      </Box>
    ),
  };
};
