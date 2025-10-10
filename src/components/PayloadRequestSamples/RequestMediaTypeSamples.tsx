import * as React from 'react';
import { useCallback, useState } from 'react';

import styled from '../../styled-components';

import { OperationModel } from '../../services';
import { DropdownProps } from '../../common-elements';
import { MediaTypeModel } from '../../services/models';
import { Markdown } from '../Markdown/Markdown';
import { Example } from './Example';
import { DropdownLabel, DropdownWrapper, NoSampleLabel } from './styled.elements';

export interface RequestMediaTypeSamplesProps {
  mediaType: MediaTypeModel;
  renderDropdown: (props: DropdownProps) => JSX.Element;
  operation?: OperationModel;
  sampletype?: string;
}

const SamplesWrapper = styled.div`
  margin-top: 15px;
`;

export const RequestMediaTypeSamples: React.FC<RequestMediaTypeSamplesProps> = ({
  mediaType,
  renderDropdown,
  operation,
  sampletype = 'response',
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const examples = mediaType.examples || {};
  const mimeType = mediaType.name;

  const exampleNames = Object.keys(examples);

  const handleSwitch = useCallback(option => {
    if (option && option.idx !== undefined) {
      setActiveIdx(option.idx);
    }
  }, []);

  if (exampleNames.length === 0) {
    return <NoSampleLabel>No sample</NoSampleLabel>;
  }

  if (exampleNames.length > 1) {
    const options = exampleNames.map((name, idx) => ({
      value: examples[name].summary || name,
      idx,
    }));

    const example = examples[exampleNames[activeIdx]];
    const description = example.description;

    return (
      <SamplesWrapper>
        <DropdownWrapper>
          <DropdownLabel>Example</DropdownLabel>
          {renderDropdown({
            value: options[activeIdx].value,
            options,
            onChange: handleSwitch,
            ariaLabel: 'Example',
          })}
        </DropdownWrapper>
        <div>
          {description && <Markdown source={description} />}
          <Example
            example={example}
            mimeType={mimeType}
            operation={operation}
            sampletype={sampletype}
          />
        </div>
      </SamplesWrapper>
    );
  } else {
    const example = examples[exampleNames[0]];
    return (
      <SamplesWrapper>
        {example.description && <Markdown source={example.description} />}
        <Example
          example={example}
          mimeType={mimeType}
          operation={operation}
          sampletype={sampletype}
        />
      </SamplesWrapper>
    );
  }
};
