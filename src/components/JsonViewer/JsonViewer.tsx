import * as React from 'react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from '../../styled-components';

import { SampleControls } from '../../common-elements';
import { CopyButtonWrapper } from '../../common-elements/CopyButtonWrapper';
import { EditableCode } from '../../common-elements/EditableCode';
import { PrismDiv } from '../../common-elements/PrismDiv';
import { jsonToHTML } from '../../utils/jsonToHtml';
import { OptionsContext } from '../OptionsProvider';
import { jsonStyles, ErrorDiv } from './style';
import { observer } from 'mobx-react';
import { OperationModel } from '../../services';

import AceEditor from 'react-ace';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/mode-json';
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/theme-chaos';
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/ext-language_tools';

import customStore from '../../services/CustomStore';

export interface JsonProps {
  data: any;
  className?: string;
  operation?: OperationModel;
  mimeType?: string;
  sampletype?: string;
}

const JsonViewerWrap = styled.div`
  &:hover > ${SampleControls} {
    opacity: 1;
  }
`;

const isJsonString = (str: string) => {
  if (typeof str !== 'string') {
    return false;
  }
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const serializeData = (value: any): string => {
  if (value === undefined || value === null) {
    return JSON.stringify({}, null, 2);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    if (isJsonString(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return JSON.stringify({}, null, 2);
  }
};

const JsonViewerComponent: React.FC<JsonProps> = ({
  data: propData,
  className,
  operation,
  sampletype,
}) => {
  const options = useContext(OptionsContext);
  const [editMode, setEditMode] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [data, setData] = useState<string>(serializeData(propData));
  const [headers, setHeaders] = useState<string>(JSON.stringify({}, null, 2));
  const [error, setError] = useState<string>('');
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setData(serializeData(propData));
  }, [propData]);

  useEffect(() => {
    if (sampletype === 'request' && !operation) {
      console.warn('JsonViewer: request sample rendered without an operation. Editing disabled.');
    }
  }, [operation, sampletype]);

  const collapseElement = useCallback((target: HTMLElement) => {
    if (!target || target.className !== 'collapser') {
      return;
    }
    const collapsed = target.parentElement?.getElementsByClassName('collapsible')[0];
    if (!collapsed || !collapsed.parentElement) {
      return;
    }
    if (collapsed.parentElement.classList.contains('collapsed')) {
      collapsed.parentElement.classList.remove('collapsed');
      target.setAttribute('aria-label', 'collapse');
    } else {
      collapsed.parentElement.classList.add('collapsed');
      target.setAttribute('aria-label', 'expand');
    }
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const clickListener = (event: MouseEvent) => collapseElement(event.target as HTMLElement);
    const focusListener = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        collapseElement(event.target as HTMLElement);
      }
    };
    node.addEventListener('click', clickListener);
    node.addEventListener('focus', focusListener);
    return () => {
      node.removeEventListener('click', clickListener);
      node.removeEventListener('focus', focusListener);
    };
  }, [collapseElement]);

  const expandAll = useCallback(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const elements = node.getElementsByClassName('collapsible');
    for (const collapsed of Array.prototype.slice.call(elements)) {
      const parentNode = collapsed.parentNode as Element;
      parentNode.classList.remove('collapsed');
      parentNode.querySelector('.collapser')?.setAttribute('aria-label', 'collapse');
    }
  }, []);

  const collapseAll = useCallback(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const elements = node.getElementsByClassName('collapsible');
    const elementsArr = Array.prototype.slice.call(elements, 1);

    for (const expanded of elementsArr) {
      const parentNode = expanded.parentNode as Element;
      parentNode.classList.add('collapsed');
      parentNode.querySelector('.collapser')?.setAttribute('aria-label', 'expand');
    }
  }, []);

  const handleHeaderChange = useCallback(
    (value: string) => {
      let newValue = value;
      if (newValue === null || newValue === undefined || newValue === '') {
        newValue = JSON.stringify({}, null, 2);
      }
      setHeaders(newValue);
      if (showHeaders && operation && sampletype === 'request') {
        try {
          const headerObj = JSON.parse(newValue);
          if (typeof headerObj === 'object') {
            customStore.addRequestHeader(
              operation.httpVerb,
              operation.path,
              JSON.stringify(headerObj),
            );
          }
        } catch (e) {
          /* ignore parse errors while typing */
        }
      }
    },
    [operation, sampletype, showHeaders],
  );

  const handlePayloadChange = useCallback(
    (value: string) => {
      let newValue = value;
      if (newValue === null || newValue === undefined || newValue === '') {
        newValue = JSON.stringify({}, null, 2);
      }
      setData(newValue);
      if (!showHeaders && editMode && operation && sampletype === 'request') {
        try {
          const payloadObj = JSON.parse(newValue);
          if (typeof payloadObj === 'object') {
            customStore.addRequestSample(
              operation.httpVerb,
              operation.path,
              JSON.stringify(payloadObj),
            );
          }
        } catch (e) {
          /* ignore parse errors while typing */
        }
      }
    },
    [editMode, operation, sampletype, showHeaders],
  );

  const showHeaderEditor = useCallback(() => {
    if (!showHeaders) {
      if (!isJsonString(data) || typeof JSON.parse(data) !== 'object') {
        setError('Invalid Payload Format');
        return false;
      }
      setShowHeaders(true);
      setError('');
    }
  }, [data, showHeaders]);

  const showPayloadEditor = useCallback(() => {
    if (showHeaders) {
      if (!isJsonString(headers) || typeof JSON.parse(headers) !== 'object') {
        setError('Invalid Header Format');
        return false;
      }
      setShowHeaders(false);
      setError('');
    }
  }, [headers, showHeaders]);

  const prettyPrint = useCallback(() => {
    if (!isJsonString(data) || typeof JSON.parse(data) !== 'object') {
      setError('Invalid Payload Format');
      return false;
    }
    if (!isJsonString(headers) || typeof JSON.parse(headers) !== 'object') {
      setError('Invalid Header Format');
      return false;
    }
    setEditMode(false);
    setShowHeaders(false);
    setError('');
  }, [data, headers]);

  const html = useMemo(() => {
    const expandLevel = options?.jsonSamplesExpandLevel ?? 0;
    try {
      return jsonToHTML(JSON.parse(data), expandLevel);
    } catch (e) {
      return jsonToHTML({}, expandLevel);
    }
  }, [data, options?.jsonSamplesExpandLevel]);

  const renderHeaderEditor = useCallback(
    () => (
      <JsonViewerWrap>
        <SampleControls>
          <button onClick={showHeaderEditor}> Headers </button>
          <button onClick={showPayloadEditor}> Payload </button>
          <button onClick={prettyPrint}> Done </button>
        </SampleControls>
        <AceEditor
          mode="json"
          theme="chaos"
          onChange={handleHeaderChange}
          editorProps={{ $blockScrolling: true }}
          value={headers}
          highlightActiveLine={true}
          tabSize={2}
          width={'100%'}
          showGutter={false}
          fontSize={13}
          setOptions={{
            showLineNumbers: false,
            tabSize: 2,
          }}
        />
      </JsonViewerWrap>
    ),
    [handleHeaderChange, headers, prettyPrint, showHeaderEditor, showPayloadEditor],
  );

  const renderPayloadEditor = useCallback(
    () => (
      <JsonViewerWrap>
        <SampleControls>
          <button onClick={showHeaderEditor}> Headers </button>
          <button onClick={showPayloadEditor}> Payload </button>
          <button onClick={prettyPrint}> Done </button>
        </SampleControls>
        <AceEditor
          mode="json"
          theme="chaos"
          onChange={handlePayloadChange}
          editorProps={{ $blockScrolling: true }}
          value={data}
          highlightActiveLine={true}
          tabSize={2}
          width={'100%'}
          showGutter={false}
          fontSize={13}
          setOptions={{
            showLineNumbers: false,
            tabSize: 2,
          }}
        />
      </JsonViewerWrap>
    ),
    [data, handlePayloadChange, prettyPrint, showHeaderEditor, showPayloadEditor],
  );

  const renderReadOnly = useCallback(
    ({ renderCopyButton }: { renderCopyButton: () => React.ReactNode }) => (
      <JsonViewerWrap>
        {sampletype === 'request' ? (
          <SampleControls>
            <button onClick={() => setEditMode(true)}> Edit </button>
            {renderCopyButton()}
            <button onClick={expandAll}> Expand all </button>
            <button onClick={collapseAll}> Collapse all </button>
          </SampleControls>
        ) : null}
        <PrismDiv
          className={className}
          ref={node => {
            nodeRef.current = node;
          }}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </JsonViewerWrap>
    ),
    [className, collapseAll, expandAll, html, sampletype],
  );

  return (
    <>
      {editMode && error !== '' && <ErrorDiv>{error}</ErrorDiv>}
      {!editMode ? (
        <CopyButtonWrapper data={data}>{renderReadOnly}</CopyButtonWrapper>
      ) : (
        <EditableCode data={showHeaders ? headers : data}>
          {showHeaders ? renderHeaderEditor : renderPayloadEditor}
        </EditableCode>
      )}
    </>
  );
};

export const JsonViewer = observer(styled(JsonViewerComponent)`
  ${jsonStyles};
`);
