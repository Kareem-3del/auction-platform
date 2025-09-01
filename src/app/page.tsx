import { Metadata } from 'next';
import NewHomePageClient from './NewHomePageClient';

export const metadata: Metadata = {
  title: 'Lebanon Auction - Premier Online Auction House | Luxury Items, Cars, Real Estate & Collectibles',
  description: 'Discover exceptional items from cars and real estate to jewelry and collectibles at Lebanon\'s most trusted auction platform since 2020. Join thousands of collectors in live bidding with verified sellers.',
  keywords: [
    'lebanon auction',
    'online auction',
    'luxury cars auction',
    'real estate auction',
    'jewelry auction',
    'collectibles auction',
    'antiques auction',
    'art auction',
    'live bidding',
    'verified sellers',
    'secure transactions',
    'lebanon marketplace',
    'middle east auction',
    'premium items',
    'investment collectibles'
  ].join(', '),
  
  // Open Graph
  openGraph: {
    title: 'Lebanon Auction - Premier Online Auction House',
    description: 'Discover exceptional items from cars and real estate to jewelry and collectibles at Lebanon\'s most trusted auction platform since 2020.',
    url: 'https://auction.lebanon-auction.bdaya.tech',
    siteName: 'Lebanon Auction',
    images: [
      {
        url: 'https://auction.lebanon-auction.bdaya.tech/images/og-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'Lebanon Auction - Premier Online Auction House',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Lebanon Auction - Premier Online Auction House',
    description: 'Discover exceptional items from cars and real estate to jewelry and collectibles at Lebanon\'s most trusted auction platform since 2020.',
    images: ['https://auction.lebanon-auction.bdaya.tech/images/og-homepage.jpg'],
    site: '@LebanonAuction',
    creator: '@LebanonAuction',
  },
  
  // Additional meta tags
  other: {
    // Business information
    'business:contact_data:street_address': 'Beirut, Lebanon',
    'business:contact_data:region': 'Beirut',
    'business:contact_data:country_name': 'Lebanon',
    'business:contact_data:email': 'info@lebauction.com',
    'business:contact_data:phone_number': '+961 1 123-456',
    
    // SEO meta tags
    'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    'googlebot': 'index, follow',
    'revisit-after': '1 day',
    'rating': 'general',
    'distribution': 'global',
    'language': 'en',
    
    // Geographic SEO
    'geo.region': 'LB',
    'geo.placename': 'Beirut',
    'geo.position': '33.8938;35.5018',
    'ICBM': '33.8938, 35.5018',
    
    // App information
    'application-name': 'Lebanon Auction',
    'apple-mobile-web-app-title': 'Lebanon Auction',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    
    // Theme colors
    'theme-color': '#CE0E2D',
    'msapplication-TileColor': '#CE0E2D',
    'msapplication-navbutton-color': '#CE0E2D',
    
    // Rich snippets
    'article:publisher': 'https://auction.lebanon-auction.bdaya.tech',
    'article:section': 'Auctions',
    
    // Additional SEO
    'referrer': 'origin-when-cross-origin',
    'format-detection': 'telephone=yes',
    'HandheldFriendly': 'True',
    'MobileOptimized': '320',
    'viewport': 'width=device-width, initial-scale=1.0, shrink-to-fit=no',
  },
  
  // Canonical URL
  alternates: {
    canonical: 'https://auction.lebanon-auction.bdaya.tech',
    languages: {
      'en': 'https://auction.lebanon-auction.bdaya.tech',
      'ar': 'https://auction.lebanon-auction.bdaya.tech/ar',
    },
  },
  
  // Verification and tracking
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  
  // App manifest
  manifest: '/manifest.json',
};


export default async function HomePage() {
  // Generate JSON-LD structured data for the homepage
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://auction.lebanon-auction.bdaya.tech';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // Main organization
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Lebanon Auction',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/images/logo.png`,
          width: 300,
          height: 100
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'LB',
          addressRegion: 'Beirut',
          addressLocality: 'Beirut'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+961-1-123-456',
          contactType: 'customer service',
          email: 'info@lebauction.com'
        },
        sameAs: [
          'https://facebook.com/LebanonAuction',
          'https://twitter.com/LebanonAuction',
          'https://instagram.com/LebanonAuction',
          'https://linkedin.com/company/LebanonAuction'
        ],
        foundingDate: '2020',
        description: 'Lebanon\'s premier online auction platform for luxury items, cars, real estate, and collectibles.',
        slogan: 'Discover exceptional items through trusted online auctions'
      },
      
      // Website
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Lebanon Auction',
        description: 'Premier online auction house in Lebanon specializing in luxury cars, real estate, jewelry, art, and collectibles.',
        publisher: {
          '@id': `${baseUrl}/#organization`
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      },

      // Webpage (Homepage)
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/#webpage`,
        url: baseUrl,
        name: 'Lebanon Auction - Premier Online Auction House',
        description: 'Discover exceptional items from cars and real estate to jewelry and collectibles at Lebanon\'s most trusted auction platform since 2020.',
        isPartOf: {
          '@id': `${baseUrl}/#website`
        },
        about: {
          '@id': `${baseUrl}/#organization`
        },
        mainContentOfPage: {
          '@type': 'WebPageElement',
          cssSelector: 'main'
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${baseUrl}/images/og-homepage.jpg`,
          width: 1200,
          height: 630
        }
      },

      // Service offerings
      {
        '@type': 'Service',
        '@id': `${baseUrl}/#auction-service`,
        name: 'Online Auction Services',
        description: 'Professional online auction services for luxury items, vehicles, real estate, and collectibles',
        provider: {
          '@id': `${baseUrl}/#organization`
        },
        serviceType: 'Auction Services',
        areaServed: {
          '@type': 'Country',
          name: 'Lebanon'
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Auction Categories',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Luxury Vehicles',
                category: 'Automotive'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Real Estate',
                category: 'Property'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Jewelry & Watches',
                category: 'Luxury Goods'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Art & Collectibles',
                category: 'Collectibles'
              }
            }
          ]
        }
      },

      // FAQ structured data
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do online auctions work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Online auctions allow you to bid on items from anywhere. Simply register, browse available items, place bids, and track your bidding status in real-time until the auction ends.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is bidding secure on Lebanon Auction?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, we use advanced encryption and secure payment processing to protect all transactions. All sellers are verified and items are authenticated by our experts.'
            }
          },
          {
            '@type': 'Question',
            name: 'What payment methods are accepted?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We accept various payment methods including credit cards, bank transfers, and digital payment platforms like Binance Pay and Whish Money.'
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      <NewHomePageClient />
    </>
  );
}