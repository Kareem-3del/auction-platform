import type { NextRequest} from 'next/server';

import { join } from 'path';
import { existsSync } from 'fs';
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const type = formData.get('type') as string; // 'profile', 'product', etc.

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_FILE', 
            message: 'No image file provided' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_FILE_TYPE', 
            message: 'Only JPEG, PNG, and WebP images are allowed' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'FILE_TOO_LARGE', 
            message: 'Image file must be smaller than 5MB' 
          } 
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', type || 'general');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomSuffix}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${type || 'general'}/${filename}`;

    // In a production environment, you might want to:
    // 1. Upload to a cloud storage service (AWS S3, Cloudinary, etc.)
    // 2. Resize/optimize the image
    // 3. Generate thumbnails
    // 4. Store file metadata in database
    // 5. Implement proper authentication/authorization

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'UPLOAD_FAILED', 
          message: 'Failed to upload image' 
        } 
      },
      { status: 500 }
    );
  }
}