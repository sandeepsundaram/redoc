import { observer } from 'mobx-react';
import * as React from 'react';
import { isPayloadSample, OperationModel, RedocNormalizedOptions } from '../../services';
import { SourceCodeWithCopy } from '../SourceCode/SourceCode';
import { RightPanelHeader, TabPanel, Tabs } from '../../common-elements';
import { OptionsContext } from '../OptionsProvider';
import { l } from '../../services/Labels';
import RequestSampleTabs from '../SampleSectionTabs/RequestSampleTabs';

export interface RequestSamplesProps {
  operation: OperationModel;
}

@observer
export class RequestSamples extends React.Component<RequestSamplesProps> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;
  operation: OperationModel;

  render() {
    const { operation } = this.props;
    const samples = operation.codeSamples;

    const hasSamples = samples.length > 0;
    return (
      (hasSamples && (
        <div>
          <RightPanelHeader> {l('requestSamples')} </RightPanelHeader>

          <Tabs defaultIndex={0}>
            {samples.map(sample => (
              <TabPanel key={sample.lang + '_' + (sample.label || '')}>
                {isPayloadSample(sample) ? (
                  <div>
                    <RequestSampleTabs operation={operation} />
                  </div>
                ) : (
                  <SourceCodeWithCopy lang={sample.lang} source={sample.source} />
                )}
              </TabPanel>
            ))}
          </Tabs>
        </div>
      )) ||
      null
    );
  }
}
