/** Redis 服务端 info 命令返回的分组信息 */
export interface CacheServerInfo {
  clients: Record<string, string>;
  cluster: Record<string, string>;
  cpu: Record<string, string>;
  errorstats: Record<string, string>;
  keyspace: Record<string, string>;
  memory: Record<string, string>;
  modules: Record<string, string>;
  persistence: Record<string, string>;
  replication: Record<string, string>;
  server: Record<string, string>;
  stats: Record<string, string>;
}

/** 缓存监控接口返回的 Redis 概览 */
export interface CacheOverview {
  info: CacheServerInfo;
  db_size: number;
  command_stats: Record<string, string>[];
}
