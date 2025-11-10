import { NextRequest, NextResponse } from 'next/server';
import { ZAI } from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const processedProducts = [];

    for (const product of products) {
      try {
        // Search for product images using web search
        const searchQuery = `${product.Name} ${product['Meta: _livora_brand_name'] || ''} product image`;
        
        const searchResult = await zai.functions.invoke("web_search", {
          query: searchQuery,
          num: 5
        });

        // Extract image URLs from search results
        const imageUrls = [];
        if (searchResult && Array.isArray(searchResult)) {
          for (const result of searchResult) {
            // Try to find image URLs in the search results
            if (result.url && (result.url.includes('.jpg') || result.url.includes('.png') || result.url.includes('.webp'))) {
              imageUrls.push(result.url);
            }
          }
        }

        // Generate product-specific images if no images found
        if (imageUrls.length === 0) {
          const imagePrompt = `Create a professional product photography image for:
          Product: ${product.Name}
          Brand: ${product['Meta: _livora_brand_name'] || ''}
          Category: ${product.Categories || ''}
          
          Style: Clean, professional beauty product photography on white background
          Quality: High resolution, commercial quality
          Lighting: Soft, professional studio lighting`;

          try {
            const imageGeneration = await zai.images.generations.create({
              prompt: imagePrompt,
              size: "1024x1024"
            });

            if (imageGeneration.data && imageGeneration.data.length > 0) {
              const base64Image = imageGeneration.data[0].base64;
              // Convert base64 to a data URL
              const dataUrl = `data:image/jpeg;base64,${base64Image}`;
              imageUrls.push(dataUrl);
            }
          } catch (imgError) {
            console.error(`Image generation failed for ${product.Name}:`, imgError);
          }
        }

        processedProducts.push({
          ...product,
          scraped_images: imageUrls,
          image_count: imageUrls.length,
          images_processed_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error processing images for ${product.Name}:`, error);
        processedProducts.push({
          ...product,
          scraped_images: [],
          image_count: 0,
          image_processing_failed: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed images for ${processedProducts.length} products`,
      products: processedProducts
    });

  } catch (error) {
    console.error('Image scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape images' },
      { status: 500 }
    );
  }
}