
export interface IFileValidationOptions  {
 /** Maximum allowed file size in bytes (default: 1 MB) */
  maxSize?: number;
  /** Allowed MIME types (default: ['application/pdf']) */
  allowedTypes?: string[];
  /** Require at least one file per field? (default: true) */
  requireFilesInEachField?: boolean;
    /** Require at least one file per field? (default: true) */
  limit?: number;
}