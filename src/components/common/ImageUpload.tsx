'use client';

import { useRef, useState } from 'react';

import {
  Box,
  Alert,
  Paper,
  Avatar,
  Tooltip,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  uploadType?: 'profile' | 'product' | 'general';
  variant?: 'avatar' | 'rectangle' | 'square';
  size?: 'small' | 'medium' | 'large';
  allowRemove?: boolean;
  disabled?: boolean;
}

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  uploadType = 'general',
  variant = 'avatar',
  size = 'medium',
  allowRemove = true,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { width: 64, height: 64 };
      case 'medium':
        return { width: 120, height: 120 };
      case 'large':
        return { width: 200, height: 200 };
      default:
        return { width: 120, height: 120 };
    }
  };

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload file
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', uploadType);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onImageChange(result.data.url);
        setPreviewUrl(result.data.url);
        // Clean up preview URL
        URL.revokeObjectURL(preview);
      } else {
        setError(result.error.message || 'Upload failed');
        setPreviewUrl(currentImageUrl || null);
        URL.revokeObjectURL(preview);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    if (disabled) return;
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sizeProps = getSizeProps();

  if (variant === 'avatar') {
    return (
      <Box sx={{ textAlign: 'center', position: 'relative' }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            src={previewUrl || undefined}
            sx={{
              ...sizeProps,
              cursor: disabled ? 'default' : 'pointer',
              bgcolor: 'grey.200',
              fontSize: sizeProps.width / 3,
            }}
            onClick={handleFileSelect}
          >
            {uploading ? (
              <CircularProgress size={24} />
            ) : !previewUrl ? (
              <CameraIcon sx={{ fontSize: sizeProps.width / 3 }} />
            ) : null}
          </Avatar>

          {!disabled && (
            <>
              {/* Edit/Upload Button */}
              <Tooltip title={previewUrl ? 'Change image' : 'Upload image'}>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                  onClick={handleFileSelect}
                  disabled={uploading}
                >
                  {previewUrl ? <EditIcon sx={{ fontSize: 16 }} /> : <CameraIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>

              {/* Remove Button */}
              {allowRemove && previewUrl && (
                <Tooltip title="Remove image">
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                    }}
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    size="small"
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 1, textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          ...sizeProps,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          border: '2px dashed',
          borderColor: previewUrl ? 'success.main' : 'grey.300',
          bgcolor: previewUrl ? 'success.50' : 'grey.50',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            bgcolor: disabled ? 'grey.50' : 'primary.50',
          },
        }}
        onClick={handleFileSelect}
      >
        {uploading ? (
          <CircularProgress />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box textAlign="center" p={2}>
            <UploadIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click to upload
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, WebP (max 5MB)
            </Typography>
          </Box>
        )}

        {!disabled && previewUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 1,
            }}
          >
            <Tooltip title="Change image">
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.9)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileSelect();
                }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            
            {allowRemove && (
              <Tooltip title="Remove image">
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,0,0,0.7)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255,0,0,0.9)',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
}