import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { TryItParameterGroup } from './TryItParameterGroup';
import { UnderlinedHeader } from '../../common-elements';
import { RightPanelHeader } from '../../common-elements';
import { MediaContentModel } from '../../services';
import { FieldModel, RequestBodyModel } from '../../services/models';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { Schema } from '../Schema';
import { Markdown } from '../Markdown/Markdown';
import { OperationModel } from '../../services/models';
import { l } from '../../services/Labels';

function safePush(obj, prop, item) {
  if (!obj[prop]) {
    obj[prop] = [];
  }
  obj[prop].push(item);
}

export interface TryItParametersProps {
  parameters?: FieldModel[];
  body?: RequestBodyModel;
  params?: Record<string, Record<string, any>>;
  updateParams?: (name: string, value: string, place: string, operation: OperationModel) => void;
  codeSample?: any;
  operation: OperationModel;
}

const PARAM_PLACES = ['path', 'query']; // 'cookie', 'header', 'formData'

export const TryItParameters: React.FC<TryItParametersProps> = ({
  parameters = [],
  body,
  params,
  updateParams,
  codeSample = [],
  operation,
}) => {
  const [requestBodyValue, setRequestBodyValue] = useState<string>(
    JSON.stringify({ name: 'string' }),
  );

  const orderParams = useMemo(() => {
    const result: Record<string, FieldModel[]> = {};
    parameters.forEach(param => {
      safePush(result, param.in, param);
    });
    return result;
  }, [parameters]);

  const paramsPlaces = parameters.length > 0 ? PARAM_PLACES : [];
  const bodyContent = body && body.content;
  const hasSamples = codeSample.length > 0;

  useEffect(() => {
    setRequestBodyValue(JSON.stringify({ name: 'string' }));
  }, []);

  const changeHandler = (value: string) => {
    setRequestBodyValue(value);
    sessionStorage.setItem('requestContent', value);
  };

  if (body === undefined && parameters === undefined) {
    return null;
  }

  return (
    <>
      {paramsPlaces.map(place => (
        <TryItParameterGroup
          key={place}
          place={place}
          parameters={orderParams[place]}
          params={params}
          updateParams={updateParams}
          operation={operation}
        />
      ))}

      {bodyContent && !hasSamples && (
        <>
          <RightPanelHeader> {l('requestBody')} </RightPanelHeader>
          <input
            type="textarea"
            className="bodyContent"
            name="requestBody"
            value={requestBodyValue}
            onChange={e => changeHandler(e.target.value)}
          />
        </>
      )}
    </>
  );
};

function DropdownWithinHeader(props) {
  return (
    <UnderlinedHeader key="header">
      Request Body schema: <DropdownOrLabel {...props} />
    </UnderlinedHeader>
  );
}

export function TryItBodyContent(props: {
  content: MediaContentModel;
  description?: string;
}): JSX.Element {
  const { content, description } = props;
  const { isRequestType } = content;

  return (
    <MediaTypesSwitch content={content} renderDropdown={DropdownWithinHeader}>
      {({ schema }) => {
        return (
          <>
            {description !== undefined && <Markdown source={description} />}
            <Schema skipReadOnly={isRequestType} key="schema" schema={schema} />
          </>
        );
      }}
    </MediaTypesSwitch>
  );
}
