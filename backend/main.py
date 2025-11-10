from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os
import json
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
import aiofiles
from pathlib import Path

from enhanced_manager import EnhancedBeautyProductManager

app = FastAPI(
    title="Livora Beauty Product Management API",
    description="Advanced AI-powered beauty product processing system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the enhanced product manager
product_manager = EnhancedBeautyProductManager()

# Create necessary directories
os.makedirs("output", exist_ok=True)
os.makedirs("images", exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Livora Beauty Product Management API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "zai_integration": "configured",
            "file_system": "ready"
        }
    }

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and process CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"upload_{timestamp}_{file.filename}"
    file_path = f"output/{filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Process the CSV
    try:
        products = await product_manager.load_csv(file_path)
        
        return {
            "success": True,
            "message": f"Successfully loaded {len(products)} products",
            "filename": filename,
            "products_count": len(products),
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand,
                    "category": p.category,
                    "price": p.price,
                    "sku": p.sku
                }
                for p in products[:10]  # Return first 10 for preview
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@app.post("/enhance-products")
async def enhance_products(products_data: Dict[str, Any]):
    """Enhance products with AI"""
    try:
        # Convert dict back to Product objects
        products = []
        for p_data in products_data.get("products", []):
            # This is a simplified conversion - in practice, you'd want proper Product objects
            products.append(p_data)
        
        enhanced_products = await product_manager.enhance_with_ai(products)
        
        return {
            "success": True,
            "message": f"Enhanced {len(enhanced_products)} products",
            "enhanced_products": enhanced_products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing products: {str(e)}")

@app.post("/scrape-images")
async def scrape_images(products_data: Dict[str, Any]):
    """Scrape or generate images for products"""
    try:
        products = products_data.get("products", [])
        
        # This would integrate with the image scraping functionality
        # For now, return placeholder data
        processed_products = []
        
        for product in products:
            processed_product = {
                **product,
                "scraped_images": [f"https://via.placeholder.com/400x400.png?text={product.get('Name', 'Product')}"],
                "image_count": 1,
                "images_processed_at": datetime.now().isoformat()
            }
            processed_products.append(processed_product)
        
        return {
            "success": True,
            "message": f"Processed images for {len(processed_products)} products",
            "products": processed_products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping images: {str(e)}")

@app.post("/generate-brand-pages")
async def generate_brand_pages(products_data: Dict[str, Any]):
    """Generate brand pages content"""
    try:
        products = products_data.get("products", [])
        brand_pages = product_manager.generate_brand_pages(products)
        
        return {
            "success": True,
            "message": f"Generated {len(brand_pages)} brand pages",
            "brand_pages": brand_pages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating brand pages: {str(e)}")

@app.post("/export-csv")
async def export_csv(data: Dict[str, Any]):
    """Export products to CSV format"""
    try:
        products = data.get("products", [])
        format_type = data.get("format", "woocommerce")
        
        # Convert to DataFrame for easier CSV export
        if format_type == "woocommerce":
            df_data = []
            for i, product in enumerate(products, 1):
                df_data.append({
                    'ID': i,
                    'Type': 'simple',
                    'SKU': product.get('SKU', ''),
                    'Name': product.get('Name', ''),
                    'Published': 1,
                    'Is featured?': 0,
                    'Visibility in catalog': 'visible',
                    'Short description': str(product.get('Description', ''))[:200],
                    'Description': product.get('enhanced_description', product.get('Description', '')),
                    'Tax status': 'taxable',
                    'In stock?': 1,
                    'Stock': 10,
                    'Regular price': product.get('Regular price', 0),
                    'Categories': product.get('Categories', ''),
                    'Tags': product.get('Tags', ''),
                    'Images': ';'.join(product.get('scraped_images', [])),
                    'Meta: _yoast_wpseo_title': product.get('seo_content', {}).get('meta_title', ''),
                    'Meta: _yoast_wpseo_metadesc': product.get('seo_content', {}).get('meta_description', ''),
                    'Meta: _yoast_wpseo_focuskw': product.get('seo_content', {}).get('keywords', '').split(',')[0] if product.get('seo_content', {}).get('keywords') else ''
                })
        else:
            # Enhanced format
            df_data = []
            for i, product in enumerate(products, 1):
                df_data.append({
                    'ID': i,
                    'SKU': product.get('SKU', ''),
                    'Name': product.get('Name', ''),
                    'Brand': product.get('Meta: _livora_brand_name', product.get('Brand', '')),
                    'Category': product.get('Categories', ''),
                    'Price': product.get('Regular price', 0),
                    'Original Description': product.get('Description', ''),
                    'Enhanced Description': product.get('enhanced_description', ''),
                    'SEO Title': product.get('seo_content', {}).get('meta_title', ''),
                    'SEO Description': product.get('seo_content', {}).get('meta_description', ''),
                    'Keywords': product.get('seo_content', {}).get('keywords', ''),
                    'Image URLs': ';'.join(product.get('scraped_images', []))
                })
        
        df = pd.DataFrame(df_data)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"output/{format_type}_products_{timestamp}.csv"
        
        # Save to CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        
        return FileResponse(
            filename,
            media_type='text/csv',
            filename=f"{format_type}_products_{timestamp}.csv"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@app.get("/market-intelligence")
async def get_market_intelligence():
    """Get market intelligence data"""
    try:
        competitor_data = await product_manager.scrape_competitor_data()
        
        return {
            "success": True,
            "message": "Market intelligence data retrieved",
            "competitor_data": competitor_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market intelligence: {str(e)}")

@app.post("/agent-zero-workflow")
async def agent_zero_workflow(file: UploadFile = File(...)):
    """Run complete Agent Zero workflow"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"upload_{timestamp}_{file.filename}"
    file_path = f"output/{filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    try:
        # Run Agent Zero workflow
        result = await product_manager.process_with_agents(file_path)
        
        return {
            "success": True,
            "message": "Agent Zero workflow completed successfully",
            "workflow_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Zero workflow failed: {str(e)}")

@app.post("/generate-json-pages")
async def generate_json_pages(products_data: Dict[str, Any]):
    """Generate JSON pages for frontend"""
    try:
        products = products_data.get("products", [])
        
        # This would use the Developer agent from Agent Zero
        json_pages = {
            "products": products,
            "brands": {},
            "categories": {},
            "pages": {
                "home": {
                    "title": "Livora - Beauty Products Store",
                    "description": "Discover premium beauty products at Livora",
                    "keywords": "beauty products, cosmetics, skincare"
                },
                "products": {
                    "title": "All Products - Livora",
                    "description": "Browse our complete collection of beauty products",
                    "keywords": "beauty products, cosmetics, makeup"
                }
            },
            "sitemap": [],
            "generated_at": datetime.now().isoformat()
        }
        
        # Organize by brands
        for product in products:
            brand = product.get('Meta: _livora_brand_name') or product.get('Brand', 'Unknown')
            if brand not in json_pages["brands"]:
                json_pages["brands"][brand] = {
                    "name": brand,
                    "slug": brand.lower().replace(' ', '-').replace("'", ''),
                    "products": [],
                    "description": f"Premium {brand} products at Livora",
                    "meta": {
                        "title": f"{brand} Products - Livora",
                        "description": f"Shop authentic {brand} products with best price guarantee",
                        "keywords": f"{brand}, {brand.lower()} products, buy {brand}"
                    }
                }
            json_pages["brands"][brand]["products"].append({
                "id": product.get('ID'),
                "name": product.get('Name'),
                "sku": product.get('SKU'),
                "price": product.get('Regular price'),
                "description": product.get('Short description'),
                "image": product.get('Images'),
                "category": product.get('Categories'),
                "skin_types": product.get('Meta: _livora_skin_type', '').split(',') if product.get('Meta: _livora_skin_type') else [],
                "ingredients": product.get('Meta: ingredients', '').split('|') if product.get('Meta: ingredients') else []
            })
        
        # Organize by categories
        for product in products:
            category = product.get('Categories', 'Unknown')
            if category not in json_pages["categories"]:
                json_pages["categories"][category] = {
                    "name": category,
                    "slug": category.lower().replace(' ', '-'),
                    "products": [],
                    "description": f"Browse {category} products at Livora",
                    "meta": {
                        "title": f"{category} Products - Livora",
                        "description": f"Shop premium {category} products with authentic brands",
                        "keywords": f"{category}, {category.lower()} products, buy {category}"
                    }
                }
            json_pages["categories"][category]["products"].append({
                "id": product.get('ID'),
                "name": product.get('Name'),
                "sku": product.get('SKU'),
                "price": product.get('Regular price'),
                "brand": product.get('Meta: _livora_brand_name') or product.get('Brand'),
                "image": product.get('Images'),
                "description": product.get('Short description')
                })
        
        # Generate sitemap
        json_pages["sitemap"] = [
            {"url": "/", "changefreq": "daily", "priority": "1.0"},
            {"url": "/products", "changefreq": "daily", "priority": "0.9"},
            {"url": "/brands", "changefreq": "weekly", "priority": "0.8"},
            {"url": "/categories", "changefreq": "weekly", "priority": "0.8"}
        ]
        
        for brand in json_pages["brands"].keys():
            json_pages["sitemap"].append({
                "url": f"/brand/{json_pages['brands'][brand]['slug']}",
                "changefreq": "weekly",
                "priority": "0.7"
            })
        
        for category in json_pages["categories"].keys():
            json_pages["sitemap"].append({
                "url": f"/category/{json_pages['categories'][category]['slug']}",
                "changefreq": "weekly",
                "priority": "0.7"
            })
        
        # Save JSON files
        os.makedirs("output/json", exist_ok=True)
        
        with open("output/json/brands.json", "w", encoding='utf-8') as f:
            json.dump(json_pages["brands"], f, ensure_ascii=False, indent=2)
        
        with open("output/json/categories.json", "w", encoding='utf-8') as f:
            json.dump(json_pages["categories"], f, ensure_ascii=False, indent=2)
        
        with open("output/json/products.json", "w", encoding='utf-8') as f:
            json.dump({"products": products}, f, ensure_ascii=False, indent=2)
        
        with open("output/json/sitemap.json", "w", encoding='utf-8') as f:
            json.dump(json_pages["sitemap"], f, ensure_ascii=False, indent=2)
        
        with open("output/json/pages.json", "w", encoding='utf-8') as f:
            json.dump(json_pages["pages"], f, ensure_ascii=False, indent=2)
        
        return {
            "success": True,
            "message": f"Generated JSON pages for {len(products)} products",
            "json_pages": json_pages,
            "files_generated": [
                "brands.json",
                "categories.json", 
                "products.json",
                "sitemap.json",
                "pages.json"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON generation failed: {str(e)}")

@app.get("/download-json/{file_name}")
async def download_json(file_name: str):
    """Download generated JSON files"""
    file_path = f"output/json/{file_name}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        media_type='application/json',
        filename=file_name
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)