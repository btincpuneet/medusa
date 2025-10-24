import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { magentoB2cEndpoints, MagentoEndpoint } from './apilist';

type RequestOptions = {
  params?: AxiosRequestConfig['params'];
  data?: AxiosRequestConfig['data'];
  pathParams?: Record<string, string | number>;
  config?: AxiosRequestConfig;
};

type MagentoEndpointInvoker = ((options?: RequestOptions) => Promise<AxiosResponse>) & {
  meta: MagentoEndpoint;
};

type MagentoClientHelpers = Record<string, Record<string, MagentoEndpointInvoker>>;

function resolvePath(
  path: string,
  pathParams?: Record<string, string | number>
): string {
  if (!pathParams) {
    return path;
  }

  return Object.entries(pathParams).reduce((acc, [key, value]) => {
    const token = `:${key}`;
    return acc.includes(token)
      ? acc.replace(token, encodeURIComponent(String(value)))
      : acc;
  }, path);
}

// Builds axios-backed request helpers for every Magento endpoint we catalog.
function buildEndpointHelpers(axiosInstance: AxiosInstance): MagentoClientHelpers {
  const client: MagentoClientHelpers = {};

  Object.entries(magentoB2cEndpoints).forEach(([group, endpoints]) => {
    client[group] = {};

    endpoints.forEach((endpoint) => {
      const trimmedPath = endpoint.path.startsWith('/')
        ? endpoint.path
        : `/${endpoint.path}`;

      const requestFn: MagentoEndpointInvoker = (options: RequestOptions = {}) => {
        const { params, data, config, pathParams } = options;

        const url = resolvePath(trimmedPath, pathParams);

        return axiosInstance.request({
          url,
          method: endpoint.method,
          params,
          data,
          ...(config || {}),
        });
      };

      requestFn.meta = { ...endpoint };
      client[group][endpoint.name] = requestFn;
    });
  });

  return client;
}

type CreateMagentoClientArgs = {
  baseUrl: string;
  axiosConfig?: AxiosRequestConfig;
};

type MagentoClient = MagentoClientHelpers & {
  request: AxiosInstance['request'];
  axiosInstance: AxiosInstance;
};

export function createMagentoB2CClient({
  baseUrl,
  axiosConfig = {},
}: CreateMagentoClientArgs): MagentoClient {
  if (!baseUrl) {
    throw new Error('createMagentoB2CClient: "baseUrl" is required.');
  }

  const normalizedBase = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  const axiosInstance = axios.create({
    baseURL: normalizedBase,
    ...axiosConfig,
  });

  const helpers = buildEndpointHelpers(axiosInstance);

  const client = {
    request: axiosInstance.request.bind(axiosInstance),
    axiosInstance,
    ...helpers,
  } as unknown as MagentoClient;

  return client;
}
