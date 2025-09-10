'use client';

import { useRef, useState } from 'react';

import {
  Box,
  Grid,
  Alert,
  Paper,
  Button,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
  maxImages?: number;
  disabled?: boolean;
}

export default function MultiImageUpload({
  images = [],
  onChange,
  error,
  maxImages = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (disabled || images.length >= maxImages) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).slice(0, maxImages - images.length).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'product');

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      onChange(newImages.slice(0, maxImages)); // Ensure we don't exceed maxImages
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Existing Images */}
        {images.map((imageUrl, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Paper
              sx={{
                position: 'relative',
                aspectRatio: '1',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {!disabled && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: 'rgba(255,0,0,0.9)',
                    },
                  }}
                  onClick={() => handleRemoveImage(index)}
                  size="small"
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Paper>
          </Grid>
        ))}

        {/* Add New Image Button */}
        {canAddMore && (
          <Grid item xs={6} sm={4} md={3}>
            <Paper
              sx={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
                border: '2px dashed',
                borderColor: 'grey.300',
                bgcolor: 'grey.50',
                '&:hover': {
                  borderColor: uploading ? 'grey.300' : 'primary.main',
                  bgcolor: uploading ? 'grey.50' : 'primary.50',
                },
              }}
              onClick={handleFileSelect}
            >
              {uploading ? (
                <Box textAlign="center">
                  <CircularProgress size={24} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Uploading...
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center" p={2}>
                  <AddIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Add Image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {images.length}/{maxImages}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Upload Button for Mobile/Alternative */}
      {canAddMore && (
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          onClick={handleFileSelect}
          disabled={uploading}
          sx={{ mt: 2 }}
          fullWidth
        >
          {uploading ? 'Uploading...' : `Add Images (${images.length}/${maxImages})`}
        </Button>
      )}

      {/* Error Messages */}
      {(error || uploadError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || uploadError}
        </Alert>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
      />

      {/* Instructions */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        JPEG, PNG, WebP (max 5MB each). You can select multiple images at once.
      </Typography>
    </Box>
  );
}