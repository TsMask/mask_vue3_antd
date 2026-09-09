/** 服务器监控各分组除 CPU、磁盘外的通用字段结构 */
export type SystemInfoRecord = Record<string, string | number>;

/** 项目信息 */
export interface SystemProjectInfo {
  name?: string;
  version?: string;
  env?: string;
  app_dir?: string;
}

/** CPU 信息；core_used 可能由后端按核心返回数组 */
export interface SystemCpuInfo {
  model?: string;
  speed?: string | number;
  core?: string | number;
  core_used?: string | number | string[];
}

/** 磁盘分区信息 */
export interface SystemDiskInfo {
  target?: string;
  size?: string;
  avail?: string;
  used?: string;
  percent?: string | number;
}

/** 服务器监控接口返回数据 */
export interface SystemInfo {
  cpu: SystemCpuInfo;
  disk: SystemDiskInfo[];
  memory: SystemInfoRecord;
  network: Record<string, string>;
  project: SystemProjectInfo;
  system: SystemInfoRecord;
  time: SystemInfoRecord;
}

/** 创建接口未返回前的空数据，保证模板始终拿到稳定结构 */
export function createEmptySystemInfo(): SystemInfo {
  return {
    cpu: {},
    disk: [],
    memory: {},
    network: {},
    project: {},
    system: {},
    time: {},
  };
}
