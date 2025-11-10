import { NextRequest, NextResponse } from 'next/server';
import { ZAI } from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    // Group products by brand
    const brandsMap = new Map();
    products.forEach(product => {
      const brand = product['Meta: _livora_brand_name'] || product.Brand || 'Unknown';
      if (!brandsMap.has(brand)) {
        brandsMap.set(brand, []);
      }
      brandsMap.get(brand).push(product);
    });

    const zai = await ZAI.create();
    const brandPages = [];

    for (const [brandName, brandProducts] of brandsMap) {
      try {
        // Generate brand page content
        const brandPrompt = `Generate comprehensive brand page content for:
        
        Brand: ${brandName}
        Products: ${brandProducts.map(p => p.Name).join(', ')}
        Categories: ${[...new Set(brandProducts.map(p => p.Categories))].join(', ')}
        
        Generate in Persian:
        1. Brand story/About section (200-300 words)
        2. Brand philosophy and values
        3. Key ingredients and technologies
        4. Product categories overview
        5. Why choose this brand section
        6. Customer testimonials style content
        7. Meta title and description for SEO
        8. Schema.org organization markup
        
        Format as JSON with keys: about, philosophy, ingredients, categories, why_choose, testimonials, seo_title, seo_description, schema_markup`;

        const brandCompletion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a brand content expert specializing in beauty brands. Create compelling, authentic brand stories in Persian.'
            },
            {
              role: 'user',
              content: brandPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 2000
        });

        const brandContent = JSON.parse(brandCompletion.choices[0]?.message?.content || '{}');

        // Generate category pages for this brand
        const categoryPages = [];
        const categories = [...new Set(brandProducts.map(p => p.Categories))];

        for (const category of categories) {
          const categoryProducts = brandProducts.filter(p => p.Categories === category);
          
          const categoryPrompt = `Generate category page content for:
          
          Brand: ${brandName}
          Category: ${category}
          Products: ${categoryProducts.map(p => p.Name).join(', ')}
          
          Generate in Persian:
          1. Category introduction (150-200 words)
          2. Benefits of this category
          3. How to choose products in this category
          4. Featured products highlights
          5. Usage tips and recommendations
          6. Meta title and description
          
          Format as JSON with keys: introduction, benefits, how_to_choose, featured, usage_tips, seo_title, seo_description`;

          const categoryCompletion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are a beauty category expert. Create informative, engaging category content in Persian.'
              },
              {
                role: 'user',
                content: categoryPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          });

          const categoryContent = JSON.parse(categoryCompletion.choices[0]?.message?.content || '{}');
          
          categoryPages.push({
            category_name: category,
            products: categoryProducts.map(p => ({
              id: p.ID,
              name: p.Name,
              sku: p.SKU,
              price: p['Regular price'],
              description: p['Short description'],
              image: p.Images
            })),
            content: categoryContent
          });
        }

        brandPages.push({
          brand_name: brandName,
          brand_slug: brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          product_count: brandProducts.length,
          categories: categories,
          content: brandContent,
          category_pages: categoryPages,
          generated_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error generating brand page for ${brandName}:`, error);
        brandPages.push({
          brand_name: brandName,
          error: true,
          error_message: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${brandPages.length} brand pages`,
      brand_pages: brandPages
    });

  } catch (error) {
    console.error('Brand page generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brand pages' },
      { status: 500 }
    );
  }
}