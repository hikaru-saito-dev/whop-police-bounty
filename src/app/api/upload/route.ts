import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/whop';

// Simple image upload handler
// In production, you'd want to use a proper image hosting service like Cloudinary, S3, etc.
export async function POST(request: NextRequest) {
  try {
    const authInfo = await verifyUserFromRequest(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to base64 for storage
    // In production, upload to a proper storage service
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // For now, return the data URL
    // In production, upload to storage and return the URL
    return NextResponse.json({ 
      url: dataUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

