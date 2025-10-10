import * as React from 'react';

import { StyledPre } from '../../common-elements/samples';
import { OperationModel } from '../../services';
import { ExampleModel } from '../../services/models';
import { ExampleValue } from './ExampleValue';
import { useExternalExample } from './exernalExampleHook';
import { observer } from 'mobx-react';

import store from '../../services/CustomStore';

export interface ExampleProps {
  example: ExampleModel;
  mimeType: string;
  operation?: OperationModel;
  sampletype?: string;
}

export function Example({ example, mimeType, operation, sampletype = 'response' }: ExampleProps) {
  if (operation && sampletype === 'request' && example.value !== undefined) {
    store.addRequestSample(operation.httpVerb, operation.path, JSON.stringify(example.value));
  }

  if (example.value === undefined && example.externalValueUrl) {
    return (
      <ExternalExample
        example={example}
        mimeType={mimeType}
        operation={operation}
        sampletype={sampletype}
      />
    );
  } else {
    return (
      <ExampleValue
        value={example.value}
        mimeType={mimeType}
        operation={operation}
        sampletype={sampletype}
      />
    );
  }
}

export function ExternalExample({
  example,
  mimeType,
  operation,
  sampletype = 'response',
}: ExampleProps) {
  const value = useExternalExample(example, mimeType);

  if (value === undefined) {
    return <span>Loading...</span>;
  }

  if (value instanceof Error) {
    return (
      <StyledPre>
        Error loading external example: <br />
        <a
          className={'token string'}
          href={example.externalValueUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {example.externalValueUrl}
        </a>
      </StyledPre>
    );
  }

  return (
    <ExampleValue value={value} mimeType={mimeType} operation={operation} sampletype={sampletype} />
  );
}

export default observer(Example);
