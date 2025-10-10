import * as React from 'react';
import Select from 'react-select';

export interface option {
  value: string;
  label: string;
}

export interface Props {
  defaultValue: option;
  options?: option[];
  onChange?: (string) => void;
}

const Dropdown: React.FC<Props> = props => {
  const { defaultValue, options, onChange } = props;
  return (
    <Select
      aria-label="dapp-select-container"
      defaultValue={defaultValue}
      options={options}
      className="dapp-select-container"
      classNamePrefix="dapp-select"
      onChange={onChange}
    />
  );
};

export default Dropdown;
