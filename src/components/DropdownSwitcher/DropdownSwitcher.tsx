import * as React from 'react';
import { useMemo, useState } from 'react';

import { DropdownProps, DropdownOption } from '../../common-elements/Dropdown';
import { DropdownLabel, DropdownWrapper } from '../PayloadRequestSamples/styled.elements';

export interface DropdownSwitcherProps<T> {
  items?: T[];
  options: DropdownOption[];
  label?: string;
  renderDropdown: (props: DropdownProps) => JSX.Element;
  children: (activeItem: T) => JSX.Element;
}

export const DropdownSwitcher = <T,>({
  items,
  options,
  label,
  renderDropdown,
  children,
}: DropdownSwitcherProps<T>) => {
  const [activeItemIdx, setActiveItemIdx] = useState(0);

  const safeOptions = useMemo(() => (options && options.length ? options : []), [options]);

  if (!items || !items.length || !safeOptions.length) {
    return null;
  }

  const Wrapper: React.FC<React.PropsWithChildren<unknown>> = ({ children: wrapperChildren }) =>
    label ? (
      <DropdownWrapper>
        <DropdownLabel>{label}</DropdownLabel>
        {wrapperChildren}
      </DropdownWrapper>
    ) : (
      <>{wrapperChildren}</>
    );

  const handleSwitch = ({ idx }: DropdownOption) => {
    if (idx !== undefined) {
      setActiveItemIdx(idx);
    }
  };

  const activeOption = safeOptions[Math.min(activeItemIdx, safeOptions.length - 1)];
  const activeItem = items[Math.min(activeItemIdx, items.length - 1)];

  return (
    <>
      <Wrapper>
        {renderDropdown({
          value: activeOption.value,
          options: safeOptions,
          onChange: handleSwitch,
          ariaLabel: label || 'Callback',
        })}
      </Wrapper>
      {children(activeItem)}
    </>
  );
};
