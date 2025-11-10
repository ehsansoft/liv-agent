import { NextRequest, NextResponse } from 'next/server';
import { ZAI } from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read CSV file
    const csvText = await file.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse CSV data
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const product: any = {};
        headers.forEach((header, index) => {
          product[header] = values[index] || '';
        });
        products.push(product);
      }
    }

    // Initialize ZAI for enhancement
    const zai = await ZAI.create();
    
    // Enhance products with AI
    const enhancedProducts = [];
    for (const product of products) {
      try {
        // Generate SEO content
        const seoPrompt = `Generate SEO content for this beauty product:
        Name: ${product.Name || ''}
        Brand: ${product['Meta: _livora_brand_name'] || ''}
        Category: ${product.Categories || ''}
        Description: ${product.Description || ''}
        
        Generate:
        1. Persian meta title (50-60 chars)
        2. Persian meta description (150-160 chars)
        3. Keywords (comma separated)
        4. Schema.org JSON markup
        5. Open Graph tags
        
        Respond in JSON format.`;

        const seoCompletion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert specializing in Persian beauty e-commerce. Generate high-quality, SEO-optimized content in Persian.'
            },
            {
              role: 'user',
              content: seoPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        const seoContent = JSON.parse(seoCompletion.choices[0]?.message?.content || '{}');

        // Generate enhanced product description
        const descPrompt = `Enhance this beauty product description for better conversion:
        
        Product: ${product.Name || ''}
        Brand: ${product['Meta: _livora_brand_name'] || ''}
        Current Description: ${product.Description || ''}
        
        Create an enhanced description that:
        1. Highlights key benefits
        2. Mentions key ingredients and their benefits
        3. Includes usage instructions
        4. Adds social proof elements
        5. Is SEO optimized with relevant keywords
        6. Is written in fluent Persian
        
        Keep the enhanced description but make it more compelling.`;

        const descCompletion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a copywriting expert for beauty products. Write compelling, conversion-focused descriptions in Persian.'
            },
            {
              role: 'user',
              content: descPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1500
        });

        const enhancedDescription = descCompletion.choices[0]?.message?.content || product.Description;

        // Combine data
        const enhancedProduct = {
          ...product,
          seo_content: seoContent,
          enhanced_description: enhancedDescription,
          processed_at: new Date().toISOString()
        };

        enhancedProducts.push(enhancedProduct);

      } catch (error) {
        console.error(`Error processing product ${product.Name}:`, error);
        // Add original product if enhancement fails
        enhancedProducts.push({
          ...product,
          processed_at: new Date().toISOString(),
          enhancement_failed: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${enhancedProducts.length} products`,
      products: enhancedProducts
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}