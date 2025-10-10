import { observer } from 'mobx-react';
import * as React from 'react';
import { useCallback } from 'react';
import { RequestMediaTypeSamples } from './RequestMediaTypeSamples';
import { OperationModel } from '../../services';

import { MediaContentModel } from '../../services/models';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { InvertedSimpleDropdown, MimeLabel } from './styled.elements';

export interface RequestPayloadSamplesProps {
  content: MediaContentModel;
  changeHandler?: any;
  operation?: OperationModel;
  sampletype?: string;
}

const RequestPayloadSamplesComponent: React.FC<RequestPayloadSamplesProps> = ({
  content,
  operation,
  sampletype = 'response',
}) => {
  const renderDropdown = useCallback(
    props => <DropdownOrLabel Label={MimeLabel} Dropdown={InvertedSimpleDropdown} {...props} />,
    [],
  );

  if (content === undefined) {
    return null;
  }

  return (
    <MediaTypesSwitch content={content} renderDropdown={renderDropdown} withLabel={true}>
      {mediaType => (
        <RequestMediaTypeSamples
          key="samples"
          mediaType={mediaType}
          renderDropdown={renderDropdown}
          operation={operation}
          sampletype={sampletype}
        />
      )}
    </MediaTypesSwitch>
  );
};

export const RequestPayloadSamples = observer(RequestPayloadSamplesComponent);
