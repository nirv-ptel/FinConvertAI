import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
    private _api = inject(ApiService);

    stats = signal<any>({
        totalUploads: 0,
        totalConversions: 0,
        completedConversions: 0,
        failedConversions: 0,
        successRate: 0,
    });
    loading = signal(true);

    ngOnInit() {
        this._api.getStats().subscribe({
            next: (res) => {
                this.stats.set(res.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }
}
