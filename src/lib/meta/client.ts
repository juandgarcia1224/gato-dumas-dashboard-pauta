/**
 * Cliente HTTP mínimo para la Graph API de Meta.
 * Sin SDK: fetch directo con manejo de paginación y errores.
 */

const GRAPH_BASE = "https://graph.facebook.com";

export class MetaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fbCode?: number,
    public fbType?: string,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export interface MetaClientOptions {
  token: string;
  apiVersion: string;
}

interface GraphResponse<T> {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message: string; type: string; code: number };
}

export class MetaClient {
  private token: string;
  private version: string;

  constructor(opts: MetaClientOptions) {
    this.token = opts.token;
    this.version = opts.apiVersion;
  }

  /** GET de un endpoint, devolviendo el JSON parseado (sin paginar). */
  async getOne<T = unknown>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, { method: "GET" });
    const json = (await res.json()) as GraphResponse<unknown> & T;
    if (!res.ok || (json as GraphResponse<unknown>).error) {
      const err = (json as GraphResponse<unknown>).error;
      throw new MetaApiError(
        err?.message ?? `HTTP ${res.status} en ${path}`,
        res.status,
        err?.code,
        err?.type,
      );
    }
    return json as T;
  }

  /** GET paginado: recorre `paging.next` y acumula `data`. */
  async getAll<T = unknown>(
    path: string,
    params: Record<string, string> = {},
    maxPages = 50,
  ): Promise<T[]> {
    const out: T[] = [];
    let after: string | undefined;
    let pages = 0;
    do {
      const pageParams: Record<string, string> = {
        ...params,
        limit: params.limit ?? "200",
      };
      if (after) pageParams.after = after;
      const json = await this.getOne<GraphResponse<T>>(path, pageParams);
      if (Array.isArray(json.data)) out.push(...json.data);
      after = json.paging?.cursors?.after;
      const hasNext = Boolean(json.paging?.next) && Boolean(after);
      pages += 1;
      if (!hasNext) break;
    } while (pages < maxPages);
    return out;
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const clean = path.replace(/^\//, "");
    const search = new URLSearchParams({
      ...params,
      access_token: this.token,
    });
    return `${GRAPH_BASE}/${this.version}/${clean}?${search.toString()}`;
  }
}
