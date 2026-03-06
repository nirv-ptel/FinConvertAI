import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-preview',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './preview.html',
    styleUrl: './preview.scss',
})
export class Preview implements OnInit {
    private _api = inject(ApiService);
    private _route = inject(ActivatedRoute);

    conversionId = '';
    conversion = signal<any>(null);
    transactions = signal<any[]>([]);
    accountInfo = signal<any>({});
    loading = signal(true);
    editingIndex = signal<number | null>(null);
    editingTxn = signal<any>(null);
    saving = signal(false);
    exporting = signal<string | null>(null);

    ngOnInit() {
        this.conversionId = this._route.snapshot.paramMap.get('id') || '';
        this.loadConversion();
    }

    loadConversion() {
        this.loading.set(true);
        this._api.getStatementDetails(this.conversionId).subscribe({
            next: (res) => {
                this.conversion.set(res.data);
                this.transactions.set(res.data.transactions || []);
                this.accountInfo.set(res.data.accountInfo || {});
                this.updateCalculatedBalances();
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    updateCalculatedBalances() {
        const txns = this.transactions();
        const info = { ...this.accountInfo() };

        if (txns.length > 0) {
            // First transaction defines the opening balance anchor
            const first = txns[0];
            const opening = Number(first.Balance || 0) - Number(first.Deposit || 0) + Number(first.Withdrawal || 0);
            info.opening_balance = opening;

            // Calculate what the closing balance SHOULD be by summing all txns
            let calculatedClosing = opening;
            for (const t of txns) {
                calculatedClosing = calculatedClosing - (Number(t.Withdrawal) || 0) + (Number(t.Deposit) || 0);
            }
            info.closing_balance = calculatedClosing;
        }

        this.accountInfo.set(info);
    }

    recalculateTableBalances() {
        const txns = [...this.transactions()];
        const info = this.accountInfo();
        let currentBalance = info.opening_balance || 0;

        for (let i = 0; i < txns.length; i++) {
            const t = txns[i];
            const withdrawal = Number(t.Withdrawal) || 0;
            const deposit = Number(t.Deposit) || 0;
            currentBalance = currentBalance - withdrawal + deposit;
            t.Balance = currentBalance;
        }

        this.transactions.set(txns);
        this.updateCalculatedBalances();
    }

    getExpectedBalance(index: number): number {
        const txns = this.transactions();
        const opening = this.accountInfo().opening_balance || 0;
        let cumulative = opening;
        for (let i = 0; i <= index; i++) {
            const t = txns[i];
            cumulative = cumulative - (Number(t.Withdrawal) || 0) + (Number(t.Deposit) || 0);
        }
        return cumulative;
    }

    isBalanceValid(index: number): boolean {
        const txn = this.transactions()[index];
        if (!txn) return true;

        // Use a small epsilon for float comparison
        const expected = this.getExpectedBalance(index);
        return Math.abs((Number(txn.Balance) || 0) - expected) < 0.01;
    }

    isClosingBalanceValid(): boolean {
        const txns = this.transactions();
        if (txns.length === 0) return true;
        const lastTxn = txns[txns.length - 1];
        const expected = this.accountInfo().closing_balance;
        return Math.abs((Number(lastTxn.Balance) || 0) - (Number(expected) || 0)) < 0.01;
    }

    addNewRow() {
        const newTxn = {
            date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
            Particulars: '',
            'Chq./Ref.No.': '',
            Withdrawal: 0,
            Deposit: 0,
            Balance: 0,
        };
        const updated = [...this.transactions(), newTxn];
        this.transactions.set(updated);
        this.startEdit(updated.length - 1);
    }

    deleteRow(index: number) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const updated = this.transactions().filter((_, i) => i !== index);
            this.transactions.set(updated);
            this.updateCalculatedBalances(); // Update summary after deletion
            this.saving.set(true);
            this._api.bulkUpdateTransactions(this.conversionId, updated, this.accountInfo()).subscribe({
                next: () => this.saving.set(false),
                error: () => this.saving.set(false),
            });
        }
    }

    getPrecedingBalance(index: number): number {
        const txns = this.transactions();
        let balAdjustment = 0;
        for (let i = 0; i < index; i++) {
            const t = txns[i];
            balAdjustment += (Number(t.Deposit) || 0) - (Number(t.Withdrawal) || 0);
        }
        return balAdjustment;
    }

    startEdit(index: number) {
        this.editingIndex.set(index);
        this.editingTxn.set({ ...this.transactions()[index] });
    }

    cancelEdit() {
        this.editingIndex.set(null);
        this.editingTxn.set(null);
    }

    saveEdit() {
        const idx = this.editingIndex();
        const txn = this.editingTxn();
        if (idx === null || !txn) return;

        this.saving.set(true);
        const updated = [...this.transactions()];

        // Auto-set the balance for this row based on calculation
        const opening = this.accountInfo().opening_balance || 0;
        const preceding = this.getPrecedingBalance(idx);
        txn.Balance = opening + preceding - (Number(txn.Withdrawal) || 0) + (Number(txn.Deposit) || 0);

        updated[idx] = txn;
        this.transactions.set(updated);
        this.updateCalculatedBalances();

        // Save entire state to backend
        this._api.bulkUpdateTransactions(this.conversionId, this.transactions(), this.accountInfo()).subscribe({
            next: () => {
                this.editingIndex.set(null);
                this.editingTxn.set(null);
                this.saving.set(false);
            },
            error: (err) => {
                console.error('Failed to save bulk update', err);
                this.saving.set(false);
            },
        });
    }

    exportAs(format: string) {
        this.exporting.set(format);
        this._api.exportConversion(this.conversionId, format).subscribe({
            next: (blob) => {
                const ext = format === 'tally-xml' ? 'xml' : format;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.conversion()?.fileName?.replace('.pdf', '') || 'export'}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
                this.exporting.set(null);
            },
            error: () => this.exporting.set(null),
        });
    }
}
