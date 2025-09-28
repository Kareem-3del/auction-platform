// Script to verify all auction images are accessible
const https = require('https');
const http = require('http');

async function checkImageURL(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode === 200
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false,
        error: err.message
      });
    });
  });
}

async function verifyAuctionImages() {
  try {
    console.log('🖼️ Verifying auction images...');
    
    // Fetch auctions from API
    const response = await fetch('http://localhost:8083/api/auctions/?limit=30');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.error('❌ Failed to fetch auctions:', data);
      return;
    }
    
    const auctions = data.data;
    console.log(`📊 Found ${auctions.length} auctions to check`);
    
    let totalImages = 0;
    let accessibleImages = 0;
    let inaccessibleImages = [];
    
    for (const auction of auctions) {
      console.log(`\n🔍 Checking images for: ${auction.title}`);
      
      const images = Array.isArray(auction.images) ? auction.images : JSON.parse(auction.images || '[]');
      
      for (const imagePath of images) {
        totalImages++;
        
        // Convert relative paths to full URLs
        const imageUrl = imagePath.startsWith('http') 
          ? imagePath 
          : `https://auction.lebanon-auction.bdaya.tech${imagePath}`;
        
        const result = await checkImageURL(imageUrl);
        
        if (result.accessible) {
          accessibleImages++;
          console.log(`  ✅ ${imagePath}`);
        } else {
          inaccessibleImages.push({ auction: auction.title, imagePath, ...result });
          console.log(`  ❌ ${imagePath} (Status: ${result.status})`);
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Total images: ${totalImages}`);
    console.log(`Accessible: ${accessibleImages}`);
    console.log(`Inaccessible: ${inaccessibleImages.length}`);
    console.log(`Success rate: ${((accessibleImages / totalImages) * 100).toFixed(1)}%`);
    
    if (inaccessibleImages.length > 0) {
      console.log('\n❌ Inaccessible images:');
      inaccessibleImages.forEach(img => {
        console.log(`  - ${img.imagePath} (${img.auction}) - Status: ${img.status}`);
      });
    } else {
      console.log('\n🎉 All images are accessible!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyAuctionImages();