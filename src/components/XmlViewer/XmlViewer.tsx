import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '../../styled-components';

import { SampleControls } from '../../common-elements';
import { CopyButtonWrapper } from '../../common-elements/CopyButtonWrapper';
import { EditableCode } from '../../common-elements/EditableCode';
import { PrismDiv } from '../../common-elements/PrismDiv';
import { XmlFormatter } from './XmlFormatter';

import { observer } from 'mobx-react';
import { OperationModel } from '../../services';

import AceEditor from 'react-ace';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/mode-xml';
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/theme-chaos';
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-internal-modules
import 'ace-builds/src-noconflict/ext-language_tools';

import customStore from '../../services/CustomStore';

export interface XmlViewerProps {
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

const XmlViewerComponent: React.FC<XmlViewerProps> = ({
  data: propData,
  className,
  operation,
  sampletype,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [data, setData] = useState<string>(propData ?? '');
  const [headers, setHeaders] = useState<string>(JSON.stringify({}, null, 2));
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setData(propData ?? '');
  }, [propData]);

  useEffect(() => {
    if (operation && sampletype === 'request') {
      customStore.addRequestSample(operation.httpVerb, operation.path, propData ?? '');
    }
  }, [operation, propData, sampletype]);

  const verifyXml = useCallback((xml: string) => xml, []);

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
      if (value === null || value === undefined || value === '') {
        setData('');
      } else {
        const verified = verifyXml(value);
        if (verified) {
          setData(verified);
        } else {
          return;
        }
      }
      if (!showHeaders && editMode && operation && sampletype === 'request') {
        try {
          let payload = (value ?? '').replace(/(\r\n|\n|\r)/gm, '');
          payload = payload.replace(/^\s+|\s+$/g, '');
          payload = payload.replace(/>\s*/g, '>');
          payload = payload.replace(/\s*</g, '<');
          customStore.addRequestSample(operation.httpVerb, operation.path, payload);
        } catch (e) {
          /* ignore formatting errors while typing */
        }
      }
    },
    [editMode, operation, sampletype, showHeaders, verifyXml],
  );

  const showHeaderEditor = useCallback(() => {
    if (!showHeaders) {
      if (!verifyXml(data)) {
        setError('Invalid Payload Format');
        return false;
      }
      setShowHeaders(true);
      setError('');
    }
  }, [data, showHeaders, verifyXml]);

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
    if (!verifyXml(data)) {
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
  }, [data, headers, verifyXml]);

  const formattedPreview = useMemo(() => XmlFormatter(data, '    '), [data]);

  const renderHeaderEditor = useCallback(
    () => (
      <JsonViewerWrap>
        <SampleControls>
          <button onClick={showHeaderEditor}> Headers </button>
          <button onClick={showPayloadEditor}> Payload </button>
          <button onClick={prettyPrint}> Pretty Print </button>
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
          <button onClick={prettyPrint}> Pretty Print </button>
        </SampleControls>
        <AceEditor
          mode="xml"
          theme="chaos"
          onChange={handlePayloadChange}
          editorProps={{ $blockScrolling: true }}
          value={XmlFormatter(data, '  ')}
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
            <button
              onClick={() => {
                /* no-op for XML */
              }}
            >
              {' '}
              Expand all{' '}
            </button>
            <button
              onClick={() => {
                /* no-op for XML */
              }}
            >
              {' '}
              Collapse all{' '}
            </button>
          </SampleControls>
        ) : null}

        <PrismDiv className={className}>
          <pre>
            <code>{formattedPreview}</code>
          </pre>
        </PrismDiv>
      </JsonViewerWrap>
    ),
    [className, formattedPreview, sampletype],
  );

  return (
    <>
      {editMode && error !== '' && <span>{error}</span>}
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

export const XmlViewer = observer(XmlViewerComponent);
