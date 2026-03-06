import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private _http = inject(HttpClient);
    private _baseUrl = 'http://localhost:4000';

    // ── Statements ──────────────────────────────────────────────
    uploadFile(file: File, bank?: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (bank) formData.append('bank', bank);
        return this._http.post(`${this._baseUrl}/statement/upload`, formData);
    }

    getStatements(page = 1, limit = 20): Observable<any> {
        const params = new HttpParams().set('_page', page).set('_limit', limit);
        return this._http.get(`${this._baseUrl}/statement/list`, { params });
    }

    deleteStatement(id: string): Observable<any> {
        return this._http.delete(`${this._baseUrl}/statement/${id}`);
    }

    // ── Processing ───────────────────────────────────────────
    processStatement(id: string, password?: string): Observable<any> {
        return this._http.post(`${this._baseUrl}/statement/${id}/process`, { password });
    }

    getStatementDetails(id: string): Observable<any> {
        return this._http.get(`${this._baseUrl}/statement/${id}`);
    }

    updateTransaction(conversionId: string, txnIndex: number, data: any): Observable<any> {
        return this._http.put(`${this._baseUrl}/statement/${conversionId}/transactions/${txnIndex}`, data);
    }

    bulkUpdateTransactions(conversionId: string, transactions: any[], accountInfo?: any): Observable<any> {
        return this._http.put(`${this._baseUrl}/statement/${conversionId}/transactions-bulk`, { transactions, accountInfo });
    }

    addTransaction(conversionId: string, data: any): Observable<any> {
        return this._http.post(`${this._baseUrl}/statement/${conversionId}/transactions`, data);
    }

    exportConversion(conversionId: string, format: string): Observable<Blob> {
        return this._http.get(`${this._baseUrl}/statement/${conversionId}/export/${format}`, {
            responseType: 'blob',
        });
    }

    // ── Dashboard Stats ───────────────────────────────────────
    getStats(): Observable<any> {
        return this._http.get(`${this._baseUrl}/statement/stats`);
    }
}
