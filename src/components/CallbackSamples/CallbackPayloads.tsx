import { observer } from 'mobx-react';
import * as React from 'react';
import { useCallback, useMemo } from 'react';

import styled from '../../styled-components';
import { RightPanelHeader } from '../../common-elements';
import { CallbackModel } from '../../services/models';
import { DropdownSwitcher } from '../DropdownSwitcher/DropdownSwitcher';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { InvertedSimpleDropdown, MimeLabel } from '../PayloadRequestSamples/styled.elements';
import { CallbackPayloadPanel } from './CallbackPayloadPanel';

export interface CallbackPayloadsProps {
  callbacks: CallbackModel[];
}

const SamplesWrapper = styled.div`
  background: ${({ theme }) => theme.codeBlock.backgroundColor};
  padding: ${props => props.theme.spacing.unit * 4}px;
`;

const CallbackPayloadsComponent: React.FC<CallbackPayloadsProps> = ({ callbacks }) => {
  const operations = useMemo(() => {
    if (!callbacks || callbacks.length === 0) {
      return [];
    }
    return callbacks
      .map(callback => callback.operations.map(operation => operation))
      .reduce((a, b) => a.concat(b), []);
  }, [callbacks]);

  const hasSamples = useMemo(
    () => operations.some(operation => operation.codeSamples.length > 0),
    [operations],
  );

  const renderDropdown = useCallback(
    props => (
      <DropdownOrLabel
        Label={MimeLabel}
        Dropdown={InvertedSimpleDropdown}
        {...props}
        variant="dark"
      />
    ),
    [],
  );

  const dropdownOptions = useMemo(
    () =>
      operations.map((callback, idx) => ({
        value: `${callback.httpVerb.toUpperCase()}: ${callback.name}`,
        idx,
      })),
    [operations],
  );

  if (!callbacks || callbacks.length === 0 || !operations.length || !hasSamples) {
    return null;
  }

  return (
    <div>
      <RightPanelHeader> Callback payload samples </RightPanelHeader>

      <SamplesWrapper>
        <DropdownSwitcher
          items={operations}
          renderDropdown={renderDropdown}
          label={'Callback'}
          options={dropdownOptions}
        >
          {callback => (
            <CallbackPayloadPanel
              key={callback.operationId || callback.name || callback.path || callback.httpVerb}
              callback={callback}
            />
          )}
        </DropdownSwitcher>
      </SamplesWrapper>
    </div>
  );
};

export const CallbackPayloads = observer(CallbackPayloadsComponent);
