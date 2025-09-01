import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from 'src/lib/prisma';
import ProductDetailClient from './ProductDetailClient';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  reservePrice?: number;
  provenance?: string;
  dimensions?: string;
  weight?: string;
  materials?: string;
  authenticity?: string;
  createdAt: string;
  auctionStatus?: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startTime?: string;
  endTime?: string;
  currentBid?: number;
  startingBid?: number;
  bidIncrement?: number;
  bidCount?: number;
  uniqueBidders?: number;
  auctionType?: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  agent: {
    id: string;
    displayName: string;
    businessName: string;
    bio?: string;
    logoUrl?: string;
    rating?: number;
    reviewCount: number;
    totalSales: number;
    totalAuctions: number;
    successfulAuctions: number;
  };
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            businessName: true,
            bio: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
            totalSales: true,
            totalAuctions: true,
            successfulAuctions: true,
          }
        }
      }
    });

    if (!product) return null;

    // Transform Prisma data to match interface
    return {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: Array.isArray(product.images) ? product.images : 
        (typeof product.images === 'string' ? JSON.parse(product.images || '[]') : []),
      condition: product.condition || 'GOOD',
      location: product.location || '',
      estimatedValueMin: Number(product.estimatedValueMin || 0),
      estimatedValueMax: Number(product.estimatedValueMax || 0),
      reservePrice: product.reservePrice ? Number(product.reservePrice) : undefined,
      provenance: product.provenance,
      dimensions: product.dimensions,
      weight: product.weight,
      materials: product.materials,
      authenticity: product.authenticity,
      createdAt: product.createdAt.toISOString(),
      auctionStatus: product.auctionStatus as 'SCHEDULED' | 'LIVE' | 'ENDED' | undefined,
      startTime: product.startTime?.toISOString(),
      endTime: product.endTime?.toISOString(),
      currentBid: product.currentBid ? Number(product.currentBid) : undefined,
      startingBid: product.startingBid ? Number(product.startingBid) : undefined,
      bidIncrement: product.bidIncrement ? Number(product.bidIncrement) : undefined,
      bidCount: product.bidCount || 0,
      uniqueBidders: product.uniqueBidders || 0,
      auctionType: product.auctionType,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug || '',
        parent: product.category.parent ? {
          id: product.category.parent.id,
          name: product.category.parent.name,
          slug: product.category.parent.slug || '',
        } : undefined
      },
      agent: {
        id: product.agent.id,
        displayName: product.agent.displayName || '',
        businessName: product.agent.businessName || '',
        bio: product.agent.bio,
        logoUrl: product.agent.logoUrl,
        rating: product.agent.rating ? Number(product.agent.rating) : undefined,
        reviewCount: product.agent.reviewCount || 0,
        totalSales: product.agent.totalSales ? Number(product.agent.totalSales) : 0,
        totalAuctions: product.agent.totalAuctions || 0,
        successfulAuctions: product.agent.successfulAuctions || 0,
      }
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found | Lebanon Auction',
      description: 'The requested auction product could not be found.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
  const productUrl = `${baseUrl}/products/${product.id}`;
  const imageUrl = product.images[0] || `${baseUrl}/images/default-auction.jpg`;

  // Generate structured description
  const priceRange = product.estimatedValueMin && product.estimatedValueMax
    ? `Estimated value: $${product.estimatedValueMin.toLocaleString()} - $${product.estimatedValueMax.toLocaleString()}`
    : '';
  
  const currentBidText = product.currentBid 
    ? `Current bid: $${product.currentBid.toLocaleString()}`
    : product.startingBid 
    ? `Starting bid: $${product.startingBid.toLocaleString()}`
    : '';

  const auctionStatusText = product.auctionStatus === 'LIVE' 
    ? 'Live auction now!'
    : product.auctionStatus === 'SCHEDULED'
    ? 'Auction starting soon'
    : product.auctionStatus === 'ENDED'
    ? 'Auction ended'
    : '';

  const metaDescription = [
    product.description.substring(0, 100),
    priceRange,
    currentBidText,
    auctionStatusText,
    `Location: ${product.location}`,
    `Condition: ${product.condition.replace('_', ' ')}`
  ].filter(Boolean).join(' • ').substring(0, 155) + '...';

  // Keywords generation
  const keywords = [
    'auction',
    'bidding',
    'lebanon auction',
    'online auction',
    product.category.name.toLowerCase(),
    product.category.parent?.name.toLowerCase(),
    product.condition.toLowerCase(),
    product.location.toLowerCase(),
    'collectibles',
    'antiques',
    'art',
    'luxury items'
  ].filter(Boolean);

  return {
    title: `${product.title} | ${product.category.name} Auction | Lebanon Auction`,
    description: metaDescription,
    keywords: keywords.join(', '),
    
    // Open Graph
    openGraph: {
      title: `${product.title} | Lebanon Auction`,
      description: metaDescription,
      url: productUrl,
      siteName: 'Lebanon Auction',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
        ...(product.images.slice(1, 4).map(img => ({
          url: img,
          width: 800,
          height: 600,
          alt: product.title,
        })))
      ],
      locale: 'en_US',
      type: 'website',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | Lebanon Auction`,
      description: metaDescription,
      images: [imageUrl],
      site: '@LebanonAuction',
      creator: '@LebanonAuction',
    },
    
    // Additional meta tags
    other: {
      // Product-specific meta tags
      'product:price:amount': product.currentBid?.toString() || product.startingBid?.toString() || '',
      'product:price:currency': 'USD',
      'product:condition': product.condition,
      'product:category': product.category.name,
      'product:brand': product.agent.businessName || product.agent.displayName,
      'product:availability': product.auctionStatus === 'LIVE' ? 'in stock' : 'out of stock',
      
      // Auction-specific meta tags
      'auction:status': product.auctionStatus || 'scheduled',
      'auction:start_time': product.startTime || '',
      'auction:end_time': product.endTime || '',
      'auction:bid_count': product.bidCount?.toString() || '0',
      
      // SEO meta tags
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      'googlebot': 'index, follow',
      'revisit-after': '1 day',
      'rating': 'general',
      'distribution': 'global',
      
      // Location-based SEO
      'geo.region': 'LB',
      'geo.placename': product.location,
      
      // Rich snippets
      'article:author': product.agent.displayName,
      'article:section': product.category.name,
      'article:published_time': product.createdAt,
      'article:modified_time': product.createdAt,
    },
    
    // Canonical URL
    alternates: {
      canonical: productUrl,
    },
    
    // Verification and tracking
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
  const productUrl = `${baseUrl}/products/${product.id}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    url: productUrl,
    image: product.images,
    sku: product.id,
    category: product.category.name,
    brand: {
      '@type': 'Brand',
      name: product.agent.businessName || product.agent.displayName
    },
    condition: `https://schema.org/${product.condition === 'NEW' ? 'NewCondition' : 'UsedCondition'}`,
    offers: product.auctionStatus ? {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: product.currentBid || product.startingBid || product.estimatedValueMin,
      highPrice: product.estimatedValueMax,
      offerCount: product.bidCount || 0,
      availability: product.auctionStatus === 'LIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      validFrom: product.startTime,
      validThrough: product.endTime,
      seller: {
        '@type': 'Organization',
        name: product.agent.businessName || product.agent.displayName,
        aggregateRating: product.agent.rating ? {
          '@type': 'AggregateRating',
          ratingValue: product.agent.rating,
          reviewCount: product.agent.reviewCount
        } : undefined
      }
    } : undefined,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Condition',
        value: product.condition.replace('_', ' ')
      },
      {
        '@type': 'PropertyValue',
        name: 'Location',
        value: product.location
      },
      ...(product.dimensions ? [{
        '@type': 'PropertyValue',
        name: 'Dimensions',
        value: product.dimensions
      }] : []),
      ...(product.weight ? [{
        '@type': 'PropertyValue',
        name: 'Weight',
        value: product.weight
      }] : []),
      ...(product.materials ? [{
        '@type': 'PropertyValue',
        name: 'Materials',
        value: product.materials
      }] : [])
    ],
    // Auction-specific structured data
    ...(product.auctionStatus && {
      '@type': ['Product', 'Event'],
      eventStatus: product.auctionStatus === 'LIVE' 
        ? 'https://schema.org/EventScheduled'
        : product.auctionStatus === 'ENDED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
      startDate: product.startTime,
      endDate: product.endTime,
      location: {
        '@type': 'Place',
        name: product.location
      },
      organizer: {
        '@type': 'Organization',
        name: 'Lebanon Auction',
        url: baseUrl
      }
    })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}