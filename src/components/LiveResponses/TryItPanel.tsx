import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { OperationModel } from '../../services/models';

import { RightPanelHeader, TabPanel, Tabs, Tab, TabList } from '../../common-elements';
import { DropdownWrapper, DropdownLabel } from '../PayloadRequestSamples/styled.elements';
import styled from 'styled-components';
import { jsonToHTML } from '../../utils/jsonToHtml';
import { jsonStyles } from '../JsonViewer/style';
import { PrismDiv } from '../../common-elements/PrismDiv';
import { TryItParameters } from '../UpdateParameters/TryItParameters';
import customStore from '../../services/CustomStore';
import { isPayloadSample, RequestPayloadSamples, SourceCodeWithCopy } from '../..';
import { l } from '../../services/Labels';

export interface TryItPanelProps {
  operation: OperationModel;
  updateStateLiveResponse: (exists: boolean) => void;
}

type ParamsState = Record<string, Record<string, any>>;

const isFormEncoding = (mime: string) => {
  const lowerMime = mime ? mime.toLowerCase() : '';
  return (
    lowerMime === 'application/x-www-form-urlencoded' ||
    lowerMime === 'multipart/form-data' ||
    lowerMime === 'application/octet-stream'
  );
};

const normalizeFormDataSample = (exampleValue: any): Record<string, any> => {
  if (!exampleValue) {
    return {};
  }

  if (exampleValue instanceof URLSearchParams) {
    const result: Record<string, any> = {};
    exampleValue.forEach((v, k) => {
      result[k] = v;
    });
    return result;
  }

  if (typeof exampleValue === 'string') {
    const params = new URLSearchParams(exampleValue);
    const result: Record<string, any> = {};
    params.forEach((v, k) => {
      result[k] = v;
    });
    if (Object.keys(result).length > 0) {
      return result;
    }
    return { value: exampleValue };
  }

  if (typeof exampleValue === 'object') {
    return { ...exampleValue };
  }

  return { value: exampleValue };
};

const serializePayload = (exampleValue: any, mime: string): string | undefined => {
  if (isFormEncoding(mime)) {
    return undefined;
  }

  if (typeof exampleValue === 'string') {
    return exampleValue;
  }

  try {
    return JSON.stringify(exampleValue);
  } catch (err) {
    console.warn('Unable to serialize payload sample', err);
    return undefined;
  }
};

const shouldHydrateFromSamples = (operation: OperationModel, samples: any[]) => {
  if (!samples || samples.length === 0) {
    return false;
  }
  const verb = operation.httpVerb ? operation.httpVerb.toLowerCase() : '';
  if (verb !== 'post' && verb !== 'put' && verb !== 'patch') {
    return false;
  }
  return samples.some(sample => isPayloadSample(sample));
};

const TryItPanelComponent: React.FC<TryItPanelProps> = ({ operation, updateStateLiveResponse }) => {
  const [paramsState, setParamsState] = useState<ParamsState>({});
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [showLive, setShowLive] = useState(false);

  useEffect(() => {
    customStore.addMethodPath(operation.httpVerb, operation.path);
  }, [operation.httpVerb, operation.path]);

  const hydratePayloadFromSamples = useCallback(
    (samples: any[]) => {
      const entry = customStore.fetchtryOutInput(operation.httpVerb, operation.path);
      const hasExistingPayload =
        entry && typeof entry.payload === 'string' && entry.payload.trim() !== '';
      const hasExistingFormData = entry && entry.formData && Object.keys(entry.formData).length > 0;

      for (const sample of samples) {
        if (!isPayloadSample(sample) || !sample.requestBodyContent) {
          continue;
        }

        const mediaContent = sample.requestBodyContent;
        const mediaTypes = mediaContent.mediaTypes || [];
        const orderedMediaTypes = mediaContent.active
          ? [mediaContent.active, ...mediaTypes.filter(mt => mt !== mediaContent.active)]
          : mediaTypes;

        for (const mediaType of orderedMediaTypes) {
          if (!mediaType || !mediaType.examples) {
            continue;
          }

          const exampleKeys = Object.keys(mediaType.examples);
          if (exampleKeys.length === 0) {
            continue;
          }

          const exampleModel = mediaType.examples[exampleKeys[0]];
          if (!exampleModel) {
            continue;
          }

          const mime = exampleModel.mime || '';
          const exampleValue = exampleModel.value;

          if (!hasExistingFormData && isFormEncoding(mime) && exampleValue !== undefined) {
            const normalized = normalizeFormDataSample(exampleValue);
            customStore.addMimeType(operation.httpVerb, operation.path, mime);
            customStore.addFormData(operation.httpVerb, operation.path, normalized);
            return;
          }

          if (!hasExistingPayload && exampleValue !== undefined) {
            const payloadString = serializePayload(exampleValue, mime);
            if (payloadString !== undefined) {
              customStore.addMimeType(operation.httpVerb, operation.path, mime);
              customStore.addRequestSample(operation.httpVerb, operation.path, payloadString);
              return;
            }
          }
        }
      }
    },
    [operation.httpVerb, operation.path],
  );

  useEffect(() => {
    const samples = operation.codeSamples || [];
    if (shouldHydrateFromSamples(operation, samples)) {
      hydratePayloadFromSamples(samples);
    }
  }, [operation, operation.codeSamples, hydratePayloadFromSamples]);

  const updateParams = useCallback(
    (name: string, value: string, place: string, op: OperationModel) => {
      setParamsState(prev => {
        const next = {
          ...prev,
          [place]: {
            ...(prev[place] || {}),
            [name]: value,
          },
        };
        customStore.addParameters(op.httpVerb, op.path, next);
        return next;
      });
    },
    [],
  );

  const getResponse = useCallback(() => {
    const servers = operation.servers[0].url;
    let path = operation.path;
    const parameters = operation.parameters;

    const tryOutObject = customStore.fetchtryOutInput(operation.httpVerb, path);
    const requestData = toJS(tryOutObject);

    let header: Record<string, any> = {};
    if (requestData.mimeType !== undefined && requestData.mimeType !== null) {
      header = { 'Content-type': requestData.mimeType };
      if (requestData.mimeType === 'multipart/form-data') {
        header = {};
      }
    }
    if (requestData.header !== undefined && requestData.header !== '') {
      try {
        header = { ...header, ...JSON.parse(requestData.header) };
      } catch (e) {
        /* ignore malformed header JSON */
      }
    }
    for (let i = 0; i < parameters.length; i++) {
      const name = operation.parameters[i].name;
      const place = operation.parameters[i].in;
      if (place && paramsState[place] !== undefined) {
        if (place === 'path') {
          if (paramsState && path.includes(`{${name}`)) {
            path = path.replace(`/{${name}}`, `/${paramsState[place][name]}`);
          }
        }
        if (place === 'query') {
          path = path.concat(`/?${name}=${paramsState[place][name]}`);
        }
      }
    }
    const livePath = `${servers}${path}`;
    const method = operation.httpVerb;
    if (method === 'post' || method === 'put') {
      let bodyContent: any;
      if (requestData.mimeType === 'application/json') {
        bodyContent = JSON.stringify(JSON.parse(requestData.payload!));
      } else if (requestData.mimeType === 'application/x-www-form-urlencoded') {
        const urlEncode = new URLSearchParams();
        for (const field in requestData.formData) {
          urlEncode.append(field, requestData.formData[field]);
        }
        bodyContent = urlEncode;
      } else if (
        requestData.mimeType === 'multipart/form-data' ||
        requestData.mimeType === 'application/octet-stream'
      ) {
        const formData = new FormData();
        for (const field in requestData.formData) {
          formData.append(field, requestData.formData[field]);
        }
        bodyContent = formData;
      } else {
        bodyContent = requestData.payload;
      }
      try {
        fetch(livePath, {
          method: method,
          headers: header,
          body: bodyContent,
          redirect: 'follow',
        })
          .then(resp => resp.json())
          .then(res => {
            setLiveResponse(res);
            setShowLive(true);
            updateStateLiveResponse(true);
          })
          .catch(err => {
            let error: any = err;
            if (err.message === 'Failed to fetch') {
              error = {
                name: '',
                message:
                  '**Request failed.**  \n**Check for:** \n  - CORS restrictions \n  - Network connectivity issues \n  - Request URL using `http` or `https` for CORS calls.',
              };
            }
            setLiveResponse(error);
            setShowLive(true);
            updateStateLiveResponse(true);
          });
        setShowLive(true);
        updateStateLiveResponse(true);
      } catch (e) {
        const error: any = { name: '', message: 'Something went wrong!!' };
        setLiveResponse(error);
        setShowLive(true);
        updateStateLiveResponse(true);
      }
    } else {
      try {
        fetch(livePath, { method: method })
          .then(resp => resp.json())
          .then(final => {
            setLiveResponse(final);
            setShowLive(true);
            updateStateLiveResponse(true);
          })
          .catch(err => {
            let error: any = err;
            if (err.message === 'Failed to fetch') {
              error = {
                name: '',
                message:
                  '**Request failed.**  \n**Check for:** \n  - CORS restrictions \n  - Network connectivity issues \n  - Request URL using `http` or `https` for CORS calls.',
              };
            }
            setLiveResponse(error);
            setShowLive(true);
            updateStateLiveResponse(true);
          });
        setShowLive(true);
        updateStateLiveResponse(true);
      } catch (e) {
        const error: any = { name: '', message: 'Something went wrong!!' };
        setLiveResponse(error);
        setShowLive(true);
        updateStateLiveResponse(true);
      }
    }
  }, [operation, paramsState, updateStateLiveResponse]);

  const samples = operation.codeSamples;
  const hasSamples = samples.length > 0;
  const verb = operation.httpVerb ? operation.httpVerb.toLowerCase() : '';
  const shouldShowTabs = (verb === 'post' || verb === 'put' || verb === 'patch') && hasSamples;
  const hideTabList = samples.length === 1;

  const responseHtml = useMemo(() => {
    if (liveResponse === null) {
      return '';
    }
    return jsonToHTML(liveResponse, 4);
  }, [liveResponse]);

  return (
    <div>
      <div className="requestBody">
        {!shouldShowTabs && (
          <TryItParameters
            parameters={operation.parameters}
            params={paramsState}
            updateParams={updateParams}
            codeSample={operation.codeSamples}
            operation={operation}
          />
        )}
        {shouldShowTabs ? (
          <div>
            <RightPanelHeader> {l('requestSamples')} </RightPanelHeader>

            <Tabs defaultIndex={0}>
              <TabList hidden={hideTabList}>
                {samples.map(sample => (
                  <Tab key={sample.lang + '_' + (sample.label || '')}>
                    {sample.label !== undefined ? sample.label : sample.lang}
                  </Tab>
                ))}
              </TabList>
              {samples.map(sample => {
                const key = sample.lang + '_' + (sample.label || '');
                if (isPayloadSample(sample)) {
                  return (
                    <TabPanel key={key}>
                      {sample.requestBodyContent ? (
                        <div>
                          <RequestPayloadSamples
                            content={sample.requestBodyContent}
                            operation={operation}
                            sampletype="request"
                          />
                        </div>
                      ) : (
                        <div />
                      )}
                    </TabPanel>
                  );
                }

                if (sample.source) {
                  return (
                    <TabPanel key={key}>
                      <SourceCodeWithCopy lang={sample.lang} source={sample.source} />
                    </TabPanel>
                  );
                }

                return (
                  <TabPanel key={key}>
                    <div />
                  </TabPanel>
                );
              })}
            </Tabs>
          </div>
        ) : null}
        <TryoutBtn onClick={getResponse}> Try Out </TryoutBtn>
      </div>
      {showLive && liveResponse && (
        <div>
          <RightPanelHeader> API Response </RightPanelHeader>
          <Tabs defaultIndex={0}>
            <TabList>
              <Tab>Payload</Tab>
            </TabList>
            <TabPanel key="payload">
              <div style={{ paddingBottom: '0' }}>
                <DropdownWrapper>
                  <DropdownLabel>Content type</DropdownLabel>
                  <ResponseValueType>application/json</ResponseValueType>
                </DropdownWrapper>
              </div>
              <StyledPrismDiv
                dangerouslySetInnerHTML={{
                  __html: responseHtml,
                }}
              />
            </TabPanel>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export const TryItPanel = observer(TryItPanelComponent);

export const TryoutBtn = styled.button`
  min-width: 100px;
  color: rgb(51, 51, 51);
  background: rgb(255, 255, 255);
  padding: 8px 10px;
  display: inline-block;
  cursor: pointer;
  text-align: center;
  outline: none;
  margin: 20px 5px 0;
  border: 1px solid rgb(7, 9, 11);
  border-radius: 5px;
  font-size: 0.9em;
  font-weight: bold;

  &:focus {
    outline: auto;
  }
`;

export const ResponseValueType = styled.div`
  position: relative;
  font-family: ${props => props.theme.typography.headings.fontFamily};
  font-size: 0.929em;
  padding: 0.9em 1.6em 0.9em 0.9em;
  min-width: 100px;
  width: auto;
  color: #ffffff;
  background-color: rgba(38, 50, 56, 0.4);
  outline: none;
  line-height: 1.5em;
  margin: 0 0 10px 0;
`;

export const StyledPrismDiv = styled(PrismDiv)`
  ${jsonStyles};
  max-height: 30rem;
`;
