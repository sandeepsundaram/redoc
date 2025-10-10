import * as React from 'react';

import { OperationModel } from '../../services';
import { isJsonLike, langFromMime } from '../../utils/openapi';
import { JsonViewer } from '../JsonViewer/JsonViewer';
import { XmlViewer } from '../XmlViewer/XmlViewer';
import { RequestBodyParams } from '../RequestBodyParams/RequestBodyParams';

import { SourceCodeWithCopy } from '../SourceCode/SourceCode';

export interface ExampleValueProps {
  value: any;
  mimeType: string;
  operation?: OperationModel;
  sampletype?: string;
}

export function ExampleValue({
  value,
  mimeType,
  operation,
  sampletype = 'response',
}: ExampleValueProps) {
  if (isJsonLike(mimeType)) {
    return (
      <JsonViewer data={value} operation={operation} mimeType={mimeType} sampletype={sampletype} />
    );
  } else if (
    sampletype === 'request' &&
    operation &&
    (mimeType === 'application/x-www-form-urlencoded' ||
      mimeType === 'multipart/form-data' ||
      mimeType === 'application/octet-stream')
  ) {
    return (
      <RequestBodyParams
        operation={operation}
        mimeType={mimeType}
        content={value}
      ></RequestBodyParams>
    );
  } else if (mimeType === 'application/xml') {
    return (
      <XmlViewer data={value} operation={operation} mimeType={mimeType} sampletype={sampletype} />
    );
  } else {
    if (typeof value === 'object') {
      // just in case example was cached as json but used as non-json
      value = JSON.stringify(value, null, 2);
    }
    return <SourceCodeWithCopy lang={langFromMime(mimeType)} source={value} />;
  }
}
