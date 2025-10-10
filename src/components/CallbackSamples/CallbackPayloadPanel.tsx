import * as React from 'react';

import styled from '../../styled-components';
import { RequestPayloadSamples } from '../PayloadRequestSamples/RequestPayloadSamples';
import { OperationModel } from '../../services/models';
import { XPayloadSample } from '../../services/models/Operation';
import { isPayloadSample } from '../../services';

export interface CallbackPayloadPanelProps {
  callback: OperationModel;
}

export const CallbackPayloadPanel: React.FC<CallbackPayloadPanelProps> = ({ callback }) => {
  const payloadSample = callback.codeSamples.find(sample => isPayloadSample(sample)) as
    | XPayloadSample
    | undefined;

  if (!payloadSample) {
    return null;
  }

  return (
    <PayloadSampleWrapper>
      <RequestPayloadSamples
        content={payloadSample.requestBodyContent}
        operation={callback}
        sampletype="request"
      />
    </PayloadSampleWrapper>
  );
};

export const PayloadSampleWrapper = styled.div`
  margin-top: 15px;
`;
