import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-conversions',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './conversions.html',
    styleUrl: './conversions.scss',
})
export class Conversions implements OnInit {
    private _api = inject(ApiService);

    conversions = signal<any[]>([]);
    total = signal(0);
    page = signal(1);
    loading = signal(true);

    ngOnInit() {
        this.loadConversions();
    }

    loadConversions() {
        this.loading.set(true);
        this._api.getStatements(this.page(), 20).subscribe({
            next: (res) => {
                this.conversions.set(res.data || []);
                this.total.set(res.pagination?.total || 0);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PROCESSED': return 'status-success';
            case 'PROCESSING': return 'status-processing';
            case 'UPLOADED': return 'status-default';
            case 'PASSWORD_REQUIRED': return 'status-warning';
            case 'NOT_SUPPORTED':
            case 'FAILED': return 'status-failed';
            default: return 'status-default';
        }
    }

    nextPage() {
        if (this.page() * 20 < this.total()) {
            this.page.update((p) => p + 1);
            this.loadConversions();
        }
    }

    prevPage() {
        if (this.page() > 1) {
            this.page.update((p) => p - 1);
            this.loadConversions();
        }
    }

    deleteConversion(id: string) {
        if (confirm('Are you sure you want to delete this statement?')) {
            this._api.deleteStatement(id).subscribe({
                next: () => {
                    this.loadConversions();
                },
                error: (err) => console.error('Delete failed', err),
            });
        }
    }

    reparseConversion(id: string) {
        this._api.processStatement(id).subscribe({
            next: () => {
                this.loadConversions();
                alert('Reparsing started...');
            },
            error: (err) => {
                console.error('Reparse failed', err);
                const msg = err.error?.message || 'Failed to start reparsing';
                alert(msg);
            }
        });
    }
}
