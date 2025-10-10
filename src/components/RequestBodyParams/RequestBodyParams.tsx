import * as React from 'react';

import { OperationModel } from '../../services/models';
import { ParamLabel, ParamInput } from '../UpdateParameters/TryItParameterGroup';
import customStore from '../../services/CustomStore';
// import { toJS } from 'mobx';

export interface RequestBodyParamsProps {
  content: any;
  mimeType: string;
  operation: OperationModel;
}

export function RequestBodyParams(props: RequestBodyParamsProps) {
  const [formData, updateFormData] = React.useState({});
  const { content, mimeType, operation } = props;
  const decodedContent = {};
  if (mimeType === 'application/x-www-form-urlencoded') {
    const contentParams = new URLSearchParams(content);
    contentParams.forEach((value, key) => {
      decodedContent[key] = value;
    });
  }
  const updateStore = (event, name) => {
    updateFormData(
      Object.assign(formData, {
        [name]: name === 'file' ? event.target.files[0] : event.currentTarget.value,
      }),
    );
    customStore.addFormData(operation.httpVerb, operation.path, formData);
  };
  return (
    <>
      {Object.keys(mimeType === 'application/x-www-form-urlencoded' ? decodedContent : content).map(
        key => (
          <div key={key}>
            <ParamLabel style={{ width: 'max-content', color: '#ffffff' }}>
              <span style={{ textAlign: 'right', textTransform: 'capitalize' }}>
                {key}
                <span style={{ color: 'red' }}>*</span>:
              </span>
            </ParamLabel>
            <ParamInput
              style={{
                padding: '3px 10px',
                margin: '5px',
                color: '#ffffff',
                borderColor: '#ffffff',
              }}
              type={key === 'file' ? key : 'text'}
              aria-label={key}
              name={key}
              value={formData![key]}
              onChange={e => updateStore(e, key)}
            />
          </div>
        ),
      )}
    </>
  );
}
