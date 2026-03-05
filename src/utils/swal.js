/**
 * Shared SweetAlert2 helper utilities for LabMate360
 * Provides consistent toast and dialog wrappers across the app.
 */
import Swal from 'sweetalert2';

// ─── Toast (top-right, auto-dismiss) ───────────────────────────────────────
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
});

export const showSuccess = (title, text) =>
    Toast.fire({ icon: 'success', title, text });

export const showError = (title, text) =>
    Toast.fire({ icon: 'error', title, text });

export const showWarning = (title, text) =>
    Toast.fire({ icon: 'warning', title, text });

export const showInfo = (title, text) =>
    Toast.fire({ icon: 'info', title, text });

// ─── Blocking dialogs ───────────────────────────────────────────────────────
export const showErrorDialog = (title, text) =>
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#ef4444' });

export const showSuccessDialog = (title, text) =>
    Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#10b981' });

export const showConfirm = (title, text, confirmText = 'Yes', cancelText = 'Cancel', confirmColor = '#3b82f6') =>
    Swal.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: confirmColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
    });
