import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../Redoc/Redoc.scss';

// import Dropdown from '../Dropdown/Dropdown';
// eslint-disable-next-line import/no-internal-modules
import '../Dropdown/Dropdown.scss';
import { isPayloadSample } from '../../services';
import { RequestPayloadSamples } from '../PayloadRequestSamples/RequestPayloadSamples';
import { SourceCodeWithCopy } from '../SourceCode/SourceCode';
import customStore from '../../services/CustomStore';
import { toJS } from 'mobx';
import { MimeLabel } from '../PayloadRequestSamples/styled.elements';
import chevronDown from '../../common-elements/assets/HSBCicons/chevron_down.svg';

type Param = Record<string, any>;

const RequestSampleTabs = (props: { operation }) => {
  // @Start RequestSample related code
  const { operation } = props;

  const isGet = useMemo(() => {
    const verb = operation.httpVerb?.toLowerCase?.() || '';
    return !(verb === 'post' || verb === 'put');
  }, [operation.httpVerb]);

  const [languageSample, setLanguageSample] = useState('');
  const [showCode, setShowCode] = useState(false);
  languageSample === undefined ? setLanguageSample('') : null;
  showCode === undefined ? setShowCode(false) : null;
  const [headers, setHeaders] = useState<Param>({});
  const [params, setParams] = useState<Param>({});
  const ref = useRef<HTMLLIElement>(null);
  const [tabOverflow, setTabOverflow] = useState(false);
  const isEllipsisActive = e => {
    const button = e.target.querySelector('button');
    button && setTabOverflow(button.offsetWidth < button.scrollWidth);
  };

  const isEllipsisActiveButton = e => {
    const button = e.target;
    button && setTabOverflow(button.offsetWidth < button.scrollWidth);
  };

  const getRequestPath = useCallback(() => {
    const parameters = operation.parameters;
    let path = operation.path;
    const payloadObj = customStore.fetchtryOutInput(operation.httpVerb, operation.path);
    const payload = toJS(payloadObj);
    const servers = operation.servers[0].url;
    if (payload.parameters) {
      for (let i = 0; i < parameters.length; i++) {
        const name = operation.parameters[i].name;
        const place = operation.parameters[i].in;
        if (place && payload.parameters) {
          if (place == 'path') {
            const placeParams = payload.parameters[place] || {};
            if (path.includes(`{${name}}`) && placeParams[name] !== undefined) {
              path = path.replace(`/{${name}}`, `/${placeParams[name]}`);
            }
          }
          if (place == 'query') {
            const placeParams = payload.parameters[place] || {};
            if (placeParams[name] !== undefined) {
              if (i === 0) {
                path = path.concat(`/?${name}=${placeParams[name]}`);
              } else {
                path = path.concat(`&${name}=${placeParams[name]}`);
              }
            } else {
              if (i === 0) {
                path = path.concat(`/?${name}={${name}}`);
              } else {
                path = path.concat(`&${name}={${name}}`);
              }
            }
          }
        }
      }
    } else {
      path = `${operation.path}`;
      for (let i = 0; i < parameters.length; i++) {
        const name = operation.parameters[i].name;
        const place = operation.parameters[i].in;
        if (place) {
          if (place == 'query') {
            if (i === 0) {
              path = path.concat(`/?${name}={${name}}`);
            } else {
              path = path.concat(`&${name}={${name}}`);
            }
          }
        }
      }
    }
    return `${servers}${path}`;
  }, [operation]);

  const loadLanguage = value => {
    const langVar = value.split(',');
    const language = langVar[0];
    const variant = langVar[1];
    const tryOutObject = customStore.fetchtryOutInput(
      props.operation.httpVerb,
      props.operation.path,
    );

    const requestData = toJS(tryOutObject);
    // if (language === 'none' && variant === 'none') {
    //     setShowCode(false);
    // } else {
    let data;
    let path = operation.servers[0].url;
    if (requestData.payload) {
      data = requestData.payload;
    }
    if (requestData.parameters) {
      path = getRequestPath();
    }

    // const headersArr: { key: string; value: string }[] = [];
    // console.log(requestData)
    // if (requestData !== null && requestData.header !== '') {
    //   const headers = JSON.parse(requestData.header!);
    //   for (const h in headers) {
    //     const val = { key: h, value: headers[h] };
    //     headersArr.push(val);
    //   }
    // }
    const input: any = {
      url: path,
      method: props.operation.httpVerb,
      //header can be changed as per yml
      header: headers,
      body: {
        mode: 'raw',
        raw: data !== undefined ? JSON.stringify(data).replace(/\\/g, '') : '',
      },
    };
    const requestOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        variant,
        input,
      }),
    };
    const url = 'https://europe-west2-marketplace-build.cloudfunctions.net/codegen'; //process.env.CODEGEN_URL!;
    fetch(url, requestOptions)
      .then(response => response.text())
      .then(result => {
        setLanguageSample(result);
        setShowCode(true);
        return result;
      })
      .catch(error => {
        return error;
      });
    // }
  };

  // 29 language - variant options
  const languageVariantOptions = useMemo(
    () => [
      // {
      //     label: 'None',
      //     value: 'none,none',
      // },
      {
        label: 'cURL',
        value: 'curl,cURL',
      },
      {
        label: 'Java - OkHttp',
        value: 'java,OkHttp',
      },
      {
        label: 'Java - Unirest',
        value: 'java,Unirest',
      },
      {
        label: 'C - libcurl',
        value: 'c,libcurl',
      },
      {
        label: 'C#',
        value: 'csharp,RestSharp',
      },

      {
        label: 'Dart',
        value: 'dart,http',
      },
      {
        label: 'Go',
        value: 'go,Native',
      },
      {
        label: 'HTTP',
        value: 'http,HTTP',
      },

      {
        label: 'JavaScript - Fetch',
        value: 'javascript,Fetch',
      },
      {
        label: 'JavaScript - jQuery',
        value: 'javascript,jQuery',
      },
      {
        label: 'JavaScript - XHR',
        value: 'javascript,XHR',
      },
      {
        label: 'NodeJs - Axios',
        value: 'nodejs,Axios',
      },
      {
        label: 'NodeJs - Native',
        value: 'nodejs,Native',
      },
      {
        label: 'NodeJs - Request',
        value: 'nodejs,Request',
      },
      {
        label: 'NodeJs - Unirest',
        value: 'nodejs,Unirest',
      },
      {
        label: 'Objective-C',
        value: 'objective-c,NSURLSession',
      },
      {
        label: 'OCaml',
        value: 'ocaml,Cohttp',
      },
      {
        label: 'PHP - cURL',
        value: 'php,cURL',
      },
      {
        label: 'PHP - Guzzle',
        value: 'php,Guzzle',
      },
      {
        label: 'PHP - pecl_http',
        value: 'php,pecl_http',
      },
      {
        label: 'PHP - HTTP_Request2',
        value: 'php,HTTP_Request2',
      },
      {
        label: 'PowerShell - RestMethod',
        value: 'powershell,RestMethod',
      },
      {
        label: 'Python - http.client',
        value: 'python,http.client',
      },
      {
        label: 'Python - Requests',
        value: 'python,Requests',
      },
      {
        label: 'Ruby - Net::HTTP',
        value: 'ruby,Net::HTTP',
      },
      {
        label: 'Shell - Httpie',
        value: 'shell,Httpie',
      },
      {
        label: 'Shell - wget',
        value: 'shell,wget',
      },
      {
        label: 'Swift - URLSession',
        value: 'swift,URLSession',
      },
    ],
    [],
  );

  const samples = useMemo(() => operation.codeSamples || [], [operation.codeSamples]);

  const allSamples = useMemo(() => {
    const list = samples.slice();

    if (list.length === 0 || isGet) {
      list.push({
        lang: 'payload',
        source: getRequestPath(),
      });
    }

    languageVariantOptions.forEach(language => {
      list.push({
        lang: `lang-${language.label}`,
        source: '',
      });
    });

    return list;
  }, [getRequestPath, isGet, languageVariantOptions, samples]);

  // @Ends RequestSample related code

  // @Start Tabs dropdown related code
  const [moreDropdownOpen, setmoreDropdownState] = useState(false);
  const [tabs, setTabs] = useState<any>([]);
  const [lists, setLists] = useState<any>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [moreMenuActive, setMoreMenuActive] = useState(false);

  const updateIndex = (selectedTab: string, moreMenuActive: boolean) => {
    const clickedTab =
      selectedTab.slice(0, 5) === 'lang-' ? selectedTab.replace(/^lang-/, '') : selectedTab;
    for (let i = 0; i < languageVariantOptions.length; i++) {
      if (clickedTab === languageVariantOptions[i].label) {
        for (let j = 0; j < allSamples.length; j++) {
          if (allSamples[j].lang === selectedTab && allSamples[j].source === '') {
            loadLanguage(languageVariantOptions[i].value);
            break;
          }
        }
        break;
      } else {
        setShowCode(false);
      }
    }
    setSelectedTab(selectedTab);
    setMoreMenuActive(moreMenuActive);
  };

  useEffect(() => {
    const parameters = operation.parameters || [];
    for (const param of parameters) {
      if (param.in === 'header') {
        setHeaders((prevState: Param) => {
          const newState = { ...prevState };
          newState[param.name] =
            param.example && param.example !== 'undefined' && param.example !== ''
              ? param.example
              : '{example of header}';
          return newState;
        });
      } else {
        setParams((prevState: Param) => {
          const newState = { ...prevState };
          newState[param.name] =
            param.example && param.example !== 'undefined' && param.example !== ''
              ? param.example
              : '{example of parameter}';
          return newState;
        });
      }
    }
    const collect = () => {
      const fitCount = 2; //0, 1, 2 + more dropdown to be fit into request sample tabs section
      const allTabs: any = [];
      const allLists: any = [];

      for (const i in allSamples) {
        if (+i <= fitCount) {
          allTabs.push(allSamples[i]);
        }
      }
      setTabs(allTabs);
      setSelectedTab(allTabs[0].lang);
      for (const i in allSamples) {
        if (+i > fitCount) {
          allLists.push(allSamples[i]);
        }
      }
      setLists(allLists);
    };
    collect();
    window.addEventListener('resize', collect);

    return () => {
      window.removeEventListener('resize', collect);
    };
  }, [allSamples, operation.parameters, operation.codeSamples]);

  useEffect(() => {
    // Capture outside click
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setmoreDropdownState(false);
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    // addEventListener('mouseover', isEllipsisActive);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
      // document.removeEventListener("mouseOver", isEllipsisActive);
    };
  }, [ref]);

  const headerParamHtml = Object.keys(headers).map(param => {
    return (
      <div key={param} className="dapp-req-field">
        <label>{param}</label>
        <MimeLabel className="dapp-select__control label">{headers[param]}</MimeLabel>
      </div>
    );
  });

  const otherParamHtml = Object.keys(params).map(param => {
    return (
      <div key={param} className="dapp-req-field">
        <label>{param}</label>
        <MimeLabel className="dapp-select__control label">{params[param]}</MimeLabel>
      </div>
    );
  });

  return (
    <>
      <div className="row">
        <div className="col-sm-12 d-flex">
          <div style={{ width: '100%' }}>
            <ul className="nav dapp-tab-menu-initial" role="tablist">
              {tabs &&
                tabs.map(sample => {
                  return (
                    <li
                      className={`${selectedTab === sample.lang ? 'active' : ''} ${
                        tabOverflow ? 'ellipsis-active' : ''
                      } tooltip`}
                      key={sample.lang}
                      onMouseEnter={isEllipsisActive}
                      onClick={() => updateIndex(sample.lang, false)}
                    >
                      <button onMouseEnter={isEllipsisActiveButton}>
                        {sample.lang === 'payload'
                          ? 'Default'
                          : sample.lang.slice(0, 5) === 'lang-'
                          ? sample.lang.replace(/^lang-/, '')
                          : sample.lang}
                      </button>
                      <span className="tooltiptext">
                        {sample.lang === 'payload'
                          ? 'Default'
                          : sample.lang.slice(0, 5) === 'lang-'
                          ? sample.lang.replace(/^lang-/, '')
                          : sample.lang}
                      </span>
                    </li>
                  );
                })}
              {lists.length > 0 && (
                <li
                  className={`more-dropdown nav-item dropdown ${moreMenuActive ? 'active' : ''}`}
                  onClick={() => setmoreDropdownState(!moreDropdownOpen)}
                  ref={ref}
                >
                  <div className={moreDropdownOpen ? 'open' : ''}>
                    <button>
                      {lists.length} more
                      <img alt="samples_tab_chevron" src={chevronDown} />
                    </button>
                    <ul className="moreMenu dropdown-menu dropdown-menu-right">
                      {lists &&
                        lists.map(sample => {
                          return (
                            <li
                              className="nav-item"
                              key={sample.lang}
                              onClick={() => updateIndex(sample.lang, true)}
                            >
                              <button>
                                {sample.lang.slice(0, 5) === 'lang-'
                                  ? sample.lang.replace(/^lang-/, '')
                                  : sample.lang}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      {allSamples.map(sample => (
        <div
          key={sample.lang}
          className="dapp-tabContent"
          style={{ display: selectedTab === sample.lang ? 'block' : 'none' }}
        >
          {!showCode && sample.lang === 'payload' ? (
            <>
              {headerParamHtml.length > 0 && (
                <div className="dapp-req-param">
                  <div className="dapp-req-header">Headers</div>
                  {headerParamHtml}
                </div>
              )}
              {otherParamHtml.length > 0 && (
                <div className="dapp-req-param">
                  <div className="dapp-req-header">Parameters</div>
                  <div>{otherParamHtml}</div>
                </div>
              )}
              <div className="dapp-req-header">Payload</div>
              {isPayloadSample(sample) && sample.requestBodyContent ? (
                <RequestPayloadSamples
                  content={sample.requestBodyContent}
                  operation={operation}
                  sampletype={'request'}
                />
              ) : (
                <SourceCodeWithCopy
                  lang="java"
                  source={showCode ? languageSample : sample.source}
                />
              )}
            </>
          ) : (
            <SourceCodeWithCopy lang="java" source={showCode ? languageSample : sample.source} />
          )}
        </div>
      ))}
    </>
  );
};

export default RequestSampleTabs;
