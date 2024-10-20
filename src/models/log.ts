import { ElasticService } from '../services/elastic.service';
import { User } from './user';
import config from './../../config.json';

export class Log {
  eventtype = 'game';
  duration = 0;
  score = 0;
  ['@timestamp']: string;
  interrupted = false;
  difficulty: number = 2;
  player_id: any;
  region: number;
  education: string;
  sex: number;
  age: number;
  pause_count = 0;
  pause_time = 0;
  mf_score = 0;
  timeout = false;
  probe_mode = false;

  game_specific_data: any;

  host_domain = config.host_domain;

  constructor(
    user: User,
    public game_name: string,
    public start_time: string,
    public ui_device?: string,
    public game_version?: string,
    public ui_agent?: any,
    public ui_width?: number,
    public ui_height?: number,
  ) {
    this.player_id = user.player_id || 12;

    this.region = user.region || 2;

    this.age = new Date().getFullYear() - user.birthYear || 26;

    this.sex = user.sex ?? 1;

    this.education = user.education || 'higher';
  }

  interrupt() {
    this.interrupted = true;
  }

  send(token?: string) {
    this['@timestamp'] = new Date(new Date().toUTCString()).toISOString();
    ElasticService.postGameLog(this, token);
  }
}

export function logError() {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        Logger.catchError(error, originalMethod.name);
      }
    };

    return descriptor;
  };
}

export class Logger {
  private static errorLogger: ErrorLogger = null;
  private static readonly logStackSet = new Set<string>();

  public static initLogger(logger: ErrorLogger) {
    Logger.errorLogger = logger;
  }

  public static catchError(error: Error, method: string = '') {
    if (Logger.logStackSet.has(error.stack)) return;
    Logger.logStackSet.add(error.stack);
    Logger.errorLogger?.logError({
      function: method,
      message: error.message,
      callstack: error.stack,
    });
  }
}

export interface ErrorLogger {
  logError(error: IBaseErrorLog): void;
}

export interface IBaseErrorLog {
  function: string;
  message: string;
  callstack: string;
}

export interface IErrorLog extends IBaseErrorLog {
  game: string;
}
