import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-upload',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './upload.html',
    styleUrl: './upload.scss',
})
export class Upload {
    private _api = inject(ApiService);
    private _router = inject(Router);

    selectedFile = signal<File | null>(null);
    selectedBank = signal('');
    password = signal('');
    uploading = signal(false);
    uploadProgress = signal(0);
    dragOver = signal(false);
    error = signal('');
    success = signal('');

    banks = [
        { id: 'SBI', name: 'State Bank of India' },
        { id: 'HDFC', name: 'HDFC Bank' },
        { id: 'ICICI', name: 'ICICI Bank' },
        { id: 'AXIS', name: 'Axis Bank' },
        { id: 'KOTAK', name: 'Kotak Bank' },
    ];

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver.set(false);
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.selectFile(files[0]);
        }
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectFile(input.files[0]);
        }
    }

    selectFile(file: File) {
        this.error.set('');
        this.success.set('');
        if (file.type !== 'application/pdf') {
            this.error.set('Only PDF files are allowed.');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            this.error.set('File size must be under 50MB.');
            return;
        }
        this.selectedFile.set(file);
    }

    removeFile() {
        this.selectedFile.set(null);
        this.error.set('');
        this.success.set('');
    }

    upload() {
        const file = this.selectedFile();
        if (!file) return;

        if (!this.selectedBank()) {
            this.error.set('Please select a bank first.');
            return;
        }

        this.uploading.set(true);
        this.uploadProgress.set(0);
        this.error.set('');

        // Simulate progress
        const interval = setInterval(() => {
            this.uploadProgress.update((v) => Math.min(v + 10, 90));
        }, 200);

        this._api.uploadFile(file, this.selectedBank()).subscribe({
            next: (res) => {
                clearInterval(interval);
                this.uploadProgress.set(100);
                this.success.set('File uploaded successfully! Processing...');

                // Auto-process the file
                this._api.processStatement(res.data._id, this.password() || undefined).subscribe({
                    next: (processRes) => {
                        this.uploading.set(false);
                        this.success.set('File processed successfully!');
                        setTimeout(() => {
                            this._router.navigate(['/preview', processRes.data._id]);
                        }, 1000);
                    },
                    error: (err) => {
                        this.uploading.set(false);
                        const msg = err.error?.message || err.error?.error || 'Processing failed. Check the file format.';
                        this.error.set(msg);
                        if (err.error?.error === 'PASSWORD_REQUIRED') {
                            this.success.set(''); // Clear success so password field gets attention if bound
                        }
                    },
                });
            },
            error: (err) => {
                clearInterval(interval);
                this.uploading.set(false);
                this.uploadProgress.set(0);
                this.error.set(err.error?.message || 'Upload failed. Please try again.');
            },
        });
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
