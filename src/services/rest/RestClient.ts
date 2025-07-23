import axios, { AxiosResponse } from "axios";

// Simple web-compatible RestClient for basic HTTP requests
// We don't need Tor or React Native dependencies for xpub import/export
export class RestClient {
  private static headers = {
    "Content-Type": "application/json",
  };

  static async get(path: string, headers?: object): Promise<AxiosResponse> {
    const config = {
      headers: { ...this.headers, ...headers },
    };
    return axios.get(path, config);
  }

  static async post(
    path: string,
    body: object,
    headers?: object
  ): Promise<AxiosResponse> {
    const config = {
      headers: { ...this.headers, ...headers },
    };
    return axios.post(path, body, config);
  }
}

export default RestClient;
