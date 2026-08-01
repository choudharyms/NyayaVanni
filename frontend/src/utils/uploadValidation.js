export const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
export const MAX_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, message: 'No file selected.' };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message:
        'Only PDF, DOCX, JPG, and PNG files are supported. Please choose a supported file type.',
    };
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      message:
        'Unsupported file extension. Only PDF, DOCX, JPG, and PNG files are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: `File size must not exceed ${MAX_SIZE_MB}MB. Your file is ${(
        file.size /
        1024 /
        1024
      ).toFixed(1)}MB. Please compress or split the document.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: 'The selected file is empty.' };
  }

  return { valid: true, message: null };
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
