/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  CustomButton,
  Card,
} from '../components';
import { TrashIcon } from '../components/TrashIcon';
import { defaultSnapOrigin } from '../config';
import {
  useMetaMask,
  useInvokeSnap,
  useMetaMaskContext,
  useRequestSnap,
} from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';

type SnapState = {
  customRPCs?: string[];
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const InputField = styled.input`
  flex-grow: 1;
  padding: 0.5rem;
  margin-right: 0.5rem;
`;

const AddButton = styled.button`
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.primary?.default};
  color: white;
  border: none;
  cursor: pointer;
`;

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnap, provider } = useMetaMask();
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  const [customRpcs, setCustomRpcs] = useState(['']);
  const [savedRpcs, setSavedRpcs] = useState<string[]>([]);
  const [snapState, setSnapState] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(90);
  const [notificationPeriod, setNotificationPeriod] = useState(1440);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  const handleConnectAccount = async () => {
    await requestSnap();

    // await provider?.request({
    //   method: 'wallet_requestPermissions',
    //   // eslint-disable-next-line @typescript-eslint/naming-convention
    //   params: [{ eth_accounts: {} }],
    // });

    const accounts = await provider?.request<string[]>({
      method: 'eth_requestAccounts',
      params: [],
    });

    console.log('Accounts:', accounts);

    const account = accounts?.[0] ?? '';

    const res = await invokeSnap({
      method: 'connectAccount',
      params: {
        mendiAddress: account,
        threshold: 90,
        notificationPeriod: 1440,
      },
    });

    console.log('Installed Snap:', res);
  };

  const fetchSavedRpcs = async () => {
    try {
      const state = (await invokeSnap({ method: 'getState' })) as SnapState;
      setSavedRpcs(state.customRPCs ?? []);
    } catch (er) {
      console.error('Failed to fetch saved RPCs:', er);
    }
  };

  const handleAddRpcField = () => {
    setCustomRpcs([...customRpcs, '']);
  };

  const handleRpcChange = (index: number, value: string) => {
    const newRpcs = [...customRpcs];
    newRpcs[index] = value;
    setCustomRpcs(newRpcs);
  };

  const handleAddCustomRpc = async () => {
    const nonEmptyRpcs = customRpcs.filter((rpc) => rpc.trim() !== '');
    if (nonEmptyRpcs.length > 0) {
      await invokeSnap({
        method: 'addCustomRpc',
        params: {
          rpcUrls: nonEmptyRpcs.length === 1 ? nonEmptyRpcs[0] : nonEmptyRpcs,
        },
      });
    }
  };

  const handleRemoveRpc = async (rpcToRemove: string) => {
    try {
      await invokeSnap({
        method: 'removeCustomRpc',
        params: { rpcUrl: rpcToRemove },
      });
      const newRpcs = savedRpcs.filter((rpc) => rpc !== rpcToRemove);
      setSavedRpcs(newRpcs);
    } catch (er) {
      console.error('Failed to remove RPC:', er);
    }
  };

  const fetchSnapState = async () => {
    try {
      const state = await invokeSnap({
        method: 'getState',
      });
      setSnapState(
        state ? JSON.stringify(state, null, 2) : 'No state available',
      );
    } catch (er) {
      console.error('Failed to fetch snap state:', er);
      setSnapState('Failed to fetch snap state');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const thresholdRes = await invokeSnap({
        method: 'updateThreshold',
        params: { threshold },
      });
      console.log('Threshold updated:', thresholdRes);

      const periodRes = await invokeSnap({
        method: 'updateNotificationPeriod',
        params: { notificationPeriod },
      });
      console.log('Notification period updated:', periodRes);

      // Fetch updated state
      fetchSnapState().catch(console.error);
    } catch (er) {
      console.error('Failed to update settings:', er);
    }
  };

  useEffect(() => {
    if (installedSnap) {
      fetchSavedRpcs().catch(console.error);
      fetchSnapState().catch(console.error);
    }
  }, [installedSnap]);
  return (
    <Container>
      <Heading>
        Welcome to <Span>template-snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.tsx</code>
      </Subtitle>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description: 'Connect and install the Mendi Finance snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectAccount}
                  disabled={!isMetaMaskReady}
                >
                  Connect
                </ConnectButton>
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        {shouldDisplayReconnectButton(installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={requestSnap}
                  disabled={!installedSnap}
                />
              ),
            }}
            disabled={!installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Add Custom RPC',
            description: 'Enter custom RPC URL(s) and add them to MetaMask.',
            button: (
              <>
                {customRpcs.map((rpc, index) => (
                  <InputContainer key={index}>
                    <InputField
                      type="text"
                      placeholder="Enter custom RPC URL"
                      value={rpc}
                      onChange={(evnt) =>
                        handleRpcChange(index, evnt.target.value)
                      }
                    />
                    {index === customRpcs.length - 1 && (
                      <AddButton onClick={handleAddRpcField}>+</AddButton>
                    )}
                  </InputContainer>
                ))}
                <CustomButton
                  onClick={handleAddCustomRpc}
                  disabled={
                    !installedSnap ||
                    customRpcs.every((rpc) => rpc.trim() === '')
                  }
                >
                  Add Custom RPC(s)
                </CustomButton>
              </>
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />
        <Card
          content={{
            title: 'Manage Custom RPCs',
            description: 'Add or remove custom RPC URLs.',
            button: (
              <>
                <div>
                  <h4>Saved RPCs:</h4>
                  <ul>
                    {savedRpcs.map((rpc, index) => (
                      <li key={index}>
                        {rpc}
                        <TrashIcon onClick={async () => handleRemoveRpc(rpc)} />
                      </li>
                    ))}
                  </ul>
                </div>
                {customRpcs.map((rpc, index) => (
                  <InputContainer key={index}>
                    <InputField
                      type="text"
                      placeholder="Enter custom RPC URL"
                      value={rpc}
                      onChange={(ev) => handleRpcChange(index, ev.target.value)}
                    />
                    {index === customRpcs.length - 1 && (
                      <AddButton onClick={handleAddRpcField}>+</AddButton>
                    )}
                  </InputContainer>
                ))}
                <CustomButton
                  onClick={handleAddCustomRpc}
                  disabled={
                    !installedSnap ||
                    customRpcs.every((rpc) => rpc.trim() === '')
                  }
                >
                  Add Custom RPC(s)
                </CustomButton>
              </>
            ),
          }}
          disabled={!installedSnap}
          fullWidth
        />
        <Card
          content={{
            title: 'Update Settings',
            description: 'Update notification period and threshold.',
            button: (
              <>
                <InputContainer>
                  <InputField
                    type="number"
                    placeholder="Threshold"
                    value={threshold}
                    onChange={(ev) => setThreshold(Number(ev.target.value))}
                  />
                </InputContainer>
                <InputContainer>
                  <InputField
                    type="number"
                    placeholder="Notification Period (minutes)"
                    value={notificationPeriod}
                    onChange={(ev) =>
                      setNotificationPeriod(Number(ev.target.value))
                    }
                  />
                </InputContainer>
                <CustomButton
                  onClick={handleUpdateSettings}
                  disabled={!installedSnap}
                >
                  Update Settings
                </CustomButton>
              </>
            ),
          }}
          disabled={!installedSnap}
          fullWidth
        />
        <Card
          content={{
            title: 'Snap State',
            description: 'Fetch and display the current state of the snap.',
            button: (
              <>
                <CustomButton
                  onClick={fetchSnapState}
                  disabled={!installedSnap}
                >
                  Refresh Snap State
                </CustomButton>
                <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
                  {snapState ?? 'No state available'}
                </div>
              </>
            ),
          }}
          disabled={!installedSnap}
          fullWidth
        />

        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
