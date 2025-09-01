import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = 'https://auction.lebanon-auction.bdaya.tech';
    
    // Static routes
    const staticRoutes = [
      {
        url: baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/auth/login`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5
      },
      {
        url: `${baseUrl}/auth/register`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5
      }
    ];

    // Get all approved products
    const products = await prisma.product.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        updatedAt: true,
        endTime: true
      }
    });

    // Get all active categories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        updatedAt: true
      }
    });

    // Product routes
    const productRoutes = products.map(product => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: product.updatedAt.toISOString(),
      changeFrequency: product.endTime && new Date(product.endTime) > new Date() ? 'hourly' : 'weekly',
      priority: 0.8
    }));

    // Category routes
    const categoryRoutes = categories.map(category => ({
      url: `${baseUrl}/categories/${category.id}`,
      lastModified: category.updatedAt.toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    // Combine all routes
    const allRoutes = [...staticRoutes, ...productRoutes, ...categoryRoutes];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}