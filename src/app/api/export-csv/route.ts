import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { products, format = 'woocommerce' } = await request.json();
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    let csvContent = '';
    let filename = '';

    if (format === 'woocommerce') {
      // WooCommerce CSV headers
      const headers = [
        'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog',
        'Short description', 'Description', 'Date sale price starts', 'Date sale price ends',
        'Tax status', 'Tax class', 'In stock?', 'Stock', 'Low stock amount', 'Backorders allowed?',
        'Sold individually?', 'Weight (kg)', 'Length (cm)', 'Width (cm)', 'Height (cm)',
        'Allow customer reviews?', 'Purchase note', 'Sale price', 'Regular price', 'Categories',
        'Tags', 'Shipping class', 'Images', 'Download limit', 'Download expiry days', 'Parent',
        'Grouped products', 'Upsells', 'Cross-sells', 'External URL', 'Button text', 'Position',
        'Meta: _yoast_wpseo_focuskw', 'Meta: _yoast_wpseo_title', 'Meta: _yoast_wpseo_metadesc',
        'Meta: _yoast_wpseo_focuskw', 'Meta: _yoast_wpseo_opengraph-title', 'Meta: _yoast_wpseo_opengraph-description',
        'Meta: _yoast_wpseo_opengraph-image', 'Meta: _yoast_wpseo_twitter-title', 'Meta: _yoast_wpseo_twitter-description',
        'Meta: _yoast_wpseo_twitter-image'
      ];
      
      csvContent = headers.join(',') + '\n';
      filename = 'woocommerce_products.csv';

      // Process each product
      products.forEach((product, index) => {
        const row = [
          product.ID || index + 1, // ID
          'simple', // Type
          `"${product.SKU || ''}"`, // SKU
          `"${product.Name || ''}"`, // Name
          1, // Published
          0, // Is featured?
          'visible', // Visibility in catalog
          `"${(product['Short description'] || '').replace(/"/g, '""')}"`, // Short description
          `"${(product.enhanced_description || product.Description || '').replace(/"/g, '""')}"`, // Description
          '', // Date sale price starts
          '', // Date sale price ends
          'taxable', // Tax status
          '', // Tax class
          product['In stock?'] || 1, // In stock?
          product.Stock || 10, // Stock
          5, // Low stock amount
          0, // Backorders allowed?
          0, // Sold individually?
          0.2, // Weight (kg)
          10, // Length (cm)
          5, // Width (cm)
          5, // Height (cm)
          1, // Allow customer reviews?
          '', // Purchase note
          `"${product['Sale price'] || ''}"`, // Sale price
          `"${product['Regular price'] || ''}"`, // Regular price
          `"${product.Categories || ''}"`, // Categories
          `"${product.Tags || ''}"`, // Tags
          '', // Shipping class
          `"${product.Images || ''}"`, // Images
          '', // Download limit
          '', // Download expiry days
          '', // Parent
          '', // Grouped products
          '', // Upsells
          '', // Cross-sells
          '', // External URL
          '', // Button text
          '', // Position
          `"${product.seo_content?.keywords?.split(',')[0] || product.Name || ''}"`, // Meta: _yoast_wpseo_focuskw
          `"${product.seo_content?.meta_title || ''}"`, // Meta: _yoast_wpseo_title
          `"${product.seo_content?.meta_description || ''}"`, // Meta: _yoast_wpseo_metadesc
          `"${product.scraped_images?.[0] || ''}"`, // Meta: _yoast_wpseo_opengraph-image
          `"${product.seo_content?.open_graph?.['og:title'] || ''}"`, // Meta: _yoast_wpseo_twitter-title
          `"${product.seo_content?.open_graph?.['og:description'] || ''}"`, // Meta: _yoast_wpseo_twitter-description
          `"${product.scraped_images?.[0] || ''}"` // Meta: _yoast_wpseo_twitter-image
        ];
        
        csvContent += row.join(',') + '\n';
      });

    } else if (format === 'enhanced') {
      // Enhanced CSV with all AI-generated content
      const headers = [
        'ID', 'SKU', 'Name', 'Brand', 'Category', 'Price', 'Original Description', 'Enhanced Description',
        'SEO Title', 'SEO Description', 'Keywords', 'Image URLs', 'Image Count', 'Processing Date'
      ];
      
      csvContent = headers.join(',') + '\n';
      filename = 'enhanced_products.csv';

      products.forEach((product, index) => {
        const row = [
          product.ID || index + 1,
          `"${product.SKU || ''}"`,
          `"${product.Name || ''}"`,
          `"${product['Meta: _livora_brand_name'] || product.Brand || ''}"`,
          `"${product.Categories || ''}"`,
          `"${product['Regular price'] || ''}"`,
          `"${(product.Description || '').replace(/"/g, '""')}"`,
          `"${(product.enhanced_description || '').replace(/"/g, '""')}"`,
          `"${product.seo_content?.meta_title || ''}"`,
          `"${product.seo_content?.meta_description || ''}"`,
          `"${product.seo_content?.keywords || ''}"`,
          `"${(product.scraped_images || []).join(';')}"`,
          product.image_count || 0,
          product.processed_at || new Date().toISOString()
        ];
        
        csvContent += row.join(',') + '\n';
      });
    }

    // Create download response
    const buffer = Buffer.from(csvContent, 'utf-8');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}