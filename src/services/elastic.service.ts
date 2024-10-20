import { Log } from '../models/log';
import { serverUrl } from '../../config.json';

export class ElasticService {
  static async postGameLog(log: Log, token?: string) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const path = token ? '/emerald/rest/api/v1/mf/gamelog/' : '/emerald/rest/api/v1/analytics/gamelog/';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const rawResponse = await fetch(serverUrl + path, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(log),
    });
    const content = await rawResponse.json();

    console.log(content);
  }
}
