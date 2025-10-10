import * as React from 'react';

export interface EditableCodeProps {
  data: any;
  children: () => React.ReactNode;
}

export class EditableCode extends React.PureComponent<EditableCodeProps> {
  render() {
    return this.props.children();
  }
}
