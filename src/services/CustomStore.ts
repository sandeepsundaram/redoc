import { makeAutoObservable } from 'mobx';

// Standard interface and functions for Customized store
interface Custom {
  method: string;
  path: string;
  payload?: string;
  header?: string;
  parameters?: Record<string, Record<string, any>>;
  mimeType?: string;
  formData?: object;
  requestBody?: object;
}

const addRequest = (payload: string): string => payload;

const addHeader = (header: string): string => header;

const addParameter = (
  param: Record<string, Record<string, any>>,
): Record<string, Record<string, any>> => param;

const addRequestBodyValue = (request: object): object => request;

// MobX implementation
class TryOutInputs {
  tryOutInputSets: Custom[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addMethodPath(method: string, path: string) {
    this.tryOutInputSets.push({ method: method, path: path, header: '' });
  }

  addRequestSample(method: string, path: string, sample: string) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    if (tryOutInput.method !== '' && tryOutInput.path !== '') {
      tryOutInput.payload = addRequest(sample);
    }
  }
  addRequestHeader(method: string, path: string, sample: string) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    if (tryOutInput.method !== '' && tryOutInput.path !== '') {
      tryOutInput.header = addHeader(sample);
    }
  }
  addParameters(method: string, path: string, param: Record<string, Record<string, any>>) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    if (tryOutInput.method !== '' && tryOutInput.path !== '') {
      tryOutInput.parameters = addParameter(param);
    }
  }

  addMimeType(method: string, path: string, mimeType: string) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    tryOutInput.mimeType = mimeType;
  }

  addFormData(method: string, path: string, formData: object) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    if (tryOutInput.method !== '' && tryOutInput.path !== '') {
      tryOutInput.formData = formData;
    }
  }

  addRequestBody(method: string, path: string, request: Record<string, any>) {
    const tryOutInput = this.fetchtryOutInput(method, path);
    if (tryOutInput.method !== '' && tryOutInput.path !== '') {
      tryOutInput.requestBody = addRequestBodyValue(request);
    }
  }

  fetchtryOutInput(method: string, path: string): Custom {
    const tryOutInputreturn = this.tryOutInputSets.find(
      tryOutInput => tryOutInput.method == method && tryOutInput.path == path,
    );
    return tryOutInputreturn !== undefined ? tryOutInputreturn : { method: '', path: '' };
  }
}

const customStore = new TryOutInputs();

export default customStore;
