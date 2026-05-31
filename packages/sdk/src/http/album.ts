import { HttpTransport } from '../connection/http-transport.js';

/** Per-type count entry from /album/list/mediaCounts. */
export interface MediaCount {
  mediaType: number;
  count: number;
}

/**
 * Item returned by /album/list/mediaInfos.
 * Shape verified live against firmware v1.5.0.1. Most fields are present
 * for every item; astroImageDetails is only set for stacked astro shots.
 */
export interface MediaInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  mediaType: number;           // canonical type on the item (may differ from filter)
  modificationTime: number;    // unix epoch seconds
  thumbnailPath?: string;
  camId?: number;              // 0 = tele, 1 = wide
  astroSubType?: number;
  astroTargetName?: string;
  astroImageDetails?: AstroImageDetails;
  fileState?: number;
}

export interface AstroImageDetails {
  target?: string;
  imageType?: number;
  floatHourRa?: number;
  floatDegreeDec?: number;
  latitude?: number;
  longitude?: number;
  shotsTaken?: number;
  shotsStacked?: number;
  shotsToTake?: number;
  totalExp?: number;
  maxTemp?: number;
  minTemp?: number;
  folderSize?: number;
  srcDir?: string;
  params?: {
    binning?: string;
    exp?: string;
    filter?: string;
    format?: string;
    gain?: string;
    height?: number;
    width?: number;
  };
  /** JSON-encoded annotation data from plate solving. Parse with JSON.parse. */
  annoInfo?: string;
}

export interface FitsFile {
  fileName: string;
  filePath: string;
  fileSize: number;
}

interface ApiResponse<T> {
  data: T;
  code: number;
  msg?: string | null;
  message?: string | null;
}

export class AlbumHttpApi {
  constructor(private readonly http: HttpTransport) {}

  /** Returns the per-mediaType counts. Live shape is an array, not a map. */
  async getMediaCounts(): Promise<MediaCount[]> {
    const res = await this.http.post<ApiResponse<MediaCount[]>>('/album/list/mediaCounts');
    return res.data ?? [];
  }

  /**
   * Returns the media items for a given filter type and page.
   * Live device returns `.data` as a bare array (no `{total, list}` wrapper).
   * mediaType is a filter category — items may have a different per-item mediaType.
   */
  async getMediaList(mediaType: number, pageIndex: number, pageSize = 20): Promise<MediaInfo[]> {
    const res = await this.http.post<ApiResponse<MediaInfo[]>>('/album/list/mediaInfos', {
      mediaType,
      pageIndex,
      pageSize,
    });
    return res.data ?? [];
  }

  /**
   * Delete media items from the device. Verified live against firmware
   * v1.5.0.1: the body must be `{"datas":[{mediaType, filePath, fileName,
   * subType}]}` — a bare array silently returns `{data:null}` with no error
   * and nothing is deleted. Returns the per-item success array.
   */
  async deleteMedia(items: Array<{ filePath: string; fileName?: string; mediaType: number; subType?: number }>): Promise<Array<{ filePath: string; fileName: string; mediaType: number; isSuccess: boolean }>> {
    const body = {
      datas: items.map((i) => ({
        mediaType: i.mediaType,
        filePath: i.filePath,
        fileName: i.fileName ?? i.filePath.split('/').slice(-2, -1)[0] ?? '',
        subType: i.subType ?? 0,
      })),
    };
    const res = await this.http.post<ApiResponse<Array<{ filePath: string; fileName: string; mediaType: number; isSuccess: boolean }>>>('/album/delete', body);
    return res.data ?? [];
  }

  async getFitsList(srcDir: string): Promise<FitsFile[]> {
    const res = await this.http.post<ApiResponse<FitsFile[]>>('/album/astro/fitsList', { srcDir });
    return res.data ?? [];
  }

  async deleteFits(files: Array<{ filePath: string }>): Promise<void> {
    await this.http.post('/album/astro/deleteFits', files);
  }

  async getMediaByFilePath(filePath: string): Promise<MediaInfo | null> {
    const res = await this.http.post<ApiResponse<MediaInfo>>('/album/getMediaInfoByFilePath', { filePath });
    return res.data ?? null;
  }

  /**
   * Build a URL to fetch a file (or thumbnail) from the device.
   * The device serves the SD card root via nginx on port 80 at the literal path.
   * Verified live: GET http://<host>/DWARF3/Videos/Thumbnail/<file>.jpg → image/jpeg.
   */
  fileUrl(devicePath: string, host: string): string {
    const cleanPath = devicePath.startsWith('/') ? devicePath : `/${devicePath}`;
    // Astro target names often contain spaces (e.g. "NGC 3628"), so the device
    // path must be URI-encoded segment-by-segment before use as an <img src>
    // or fetch URL. encodeURI is right — it preserves /, but encodes spaces
    // and other reserved characters that browsers won't accept raw.
    return `http://${host}${encodeURI(cleanPath)}`;
  }
}
