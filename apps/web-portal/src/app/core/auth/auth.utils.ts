// -----------------------------------------------------------------------------------------------------
// @ AUTH UTILITIES
//
// Methods are derivations of the Auth0 Angular-JWT helper service methods
// https://github.com/auth0/angular2-jwt
// -----------------------------------------------------------------------------------------------------

export class AuthUtils {
  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Is token expired?
   *
   * @param token
   * @param offsetSeconds
   */
  static isTokenExpired(token: string, offsetSeconds?: number): boolean {
    if (!token || token === '') {
      return true;
    }

    const date = this._getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds ?? 0;

    if (date === null) {
      return true;
    }

    return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  private static _urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Illegal base64url string!');
    }
    try {
      return decodeURIComponent(
        Array.from(atob(output), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
    } catch {
      throw new Error('Cannot decode the token.');
    }
  }

  private static _decodeToken(token: string): { exp?: number } | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error(
        "The inspected token doesn't appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more."
      );
    }

    const decoded = this._urlBase64Decode(parts[1]);

    if (!decoded) {
      throw new Error('Cannot decode the token.');
    }

    return JSON.parse(decoded);
  }

  private static _getTokenExpirationDate(token: string): Date | null {
    const decodedToken = this._decodeToken(token);

    if (!decodedToken || !Object.prototype.hasOwnProperty.call(decodedToken, 'exp')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decodedToken.exp!);

    return date;
  }
}
