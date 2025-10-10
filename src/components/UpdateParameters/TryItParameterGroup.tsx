import * as React from 'react';

import { PropertiesTable } from '../../common-elements/fields-layout';
import { FieldModel } from '../../services/models';
import { mapWithLast } from '../../utils';
import { RightPanelHeader } from '../../common-elements';
import { OperationModel } from '../../services/models';
import styled from 'styled-components';

export interface TryItParameterGroupProps {
  place: string;
  parameters: FieldModel[];
  params?: Record<string, Record<string, any>>;
  updateParams?: (name: string, value: string, place: string, operation: OperationModel) => void;
  operation: OperationModel;
}

export const TryItParameterGroup: React.FC<TryItParameterGroupProps> = ({
  place,
  parameters,
  params,
  updateParams,
  operation,
}) => {
  if (!parameters || !parameters.length) {
    return null;
  }

  const isRequired = (location: string, localParams: FieldModel[]): boolean => {
    for (const parameter of localParams) {
      if (parameter.in === location && parameter.required) {
        return true;
      }
    }
    return false;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!updateParams) {
      return;
    }
    updateParams(event.currentTarget.name, event.currentTarget.value, place, operation);
  };

  return (
    <div key={place}>
      <RightPanelHeader>
        <span style={{ textTransform: 'capitalize' }}>{place}</span> Parameters
        {isRequired(place, parameters) ? <span style={{ color: '#db0011' }}> *</span> : null}
      </RightPanelHeader>
      <PropertiesTable>
        <tbody>
          {mapWithLast(parameters, field => (
            <tr key={field.name}>
              <td>
                <ParamLabel>
                  <span style={{ textAlign: 'right', textTransform: 'capitalize' }}>
                    {field.name}:
                  </span>
                </ParamLabel>
                <ParamInput
                  type="text"
                  aria-label={field.name}
                  name={field.name}
                  value={(params && params[place] && params[place][field.name]) || ''}
                  placeholder=""
                  onChange={handleChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </PropertiesTable>
    </div>
  );
};

export const ParamLabel = styled.label`
  outline: none;
  outline-offset: none !important;
  padding: 0 0.75rem;
  display: inline-block;
  width: 150px;
`;

export const ParamInput = styled.input`
  height: 2.25rem;
  padding: 0 0.75rem;
  margin: 0.25rem 1.5rem;
  width: min(18rem, 100%);
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: #fff;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    border-color: #db0011;
    box-shadow: 0 0 0 2px rgba(219, 0, 17, 0.15);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    background-color: #f3f4f6;
    color: #9ca3af;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;
