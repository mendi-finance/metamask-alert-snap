import { Box, Heading, Bold, Link, Text } from '@metamask/snaps-sdk/jsx';

/**
 * Display a dialog to the user.
 * @param formattedPct - The formatted percentage of the borrow limit used.
 */
export async function displayBorrowLimitDialog(formattedPct: string) {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: (
        <Box>
          <Heading>Borrow Limit Alert</Heading>
          <Text>
            Your borrow limit usage has exceeded the threshold:{' '}
            <Bold>{formattedPct}%</Bold>
          </Text>
          <Text>
            Pay your debt <Link href="https://app.mendi.finance">here</Link>.
          </Text>
        </Box>
      ),
    },
  });
}

/**
 * Send a notification to the user.
 * @param formattedPct - The formatted percentage of the borrow limit used.
 */
export async function sendBorrowLimitNotification(formattedPct: string) {
  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message: `Borrow limit exceeded the threshold: ${formattedPct}%`,
    },
  });
}
