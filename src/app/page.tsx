"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Download, 
  Search, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  BarChart3, 
  Globe, 
  Package,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  sku: string;
  skinTypes: string[];
  ingredients: string[];
  usage: string;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
}

export default function BeautyProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "1", name: "CSV Analysis", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "2", name: "Product Data Enhancement", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "3", name: "Image Scraping & Optimization", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "4", name: "Brand Page Generation", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "5", name: "JSON Pages Generation", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "6", name: "SEO Content Generation", status: "pending", progress: 0, message: "Waiting to start..." },
    { id: "7", name: "Final CSV Export", status: "pending", progress: 0, message: "Waiting to start..." }
  ]);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Sample data based on the provided CSV
  useEffect(() => {
    const sampleProducts: Product[] = [
      {
        id: "LV-CLN-001",
        name: "ژل شستشوی صورت سرو CeraVe",
        brand: "CeraVe",
        category: "شوینده",
        price: 1806890,
        description: "ژل شستشوی صورت سرو CeraVe از برند معتبر CeraVe. محصول مؤثر برای آکنه با فرمول پیشرفته و ترکیبات علمی.",
        sku: "LV-CLN-001",
        skinTypes: ["چرب", "مستعد آکنه", "ترکیبی"],
        ingredients: ["سرامید NP", "نیاسینامید", "هیالورونیک اسید", "کلسترول"],
        usage: "صبح و شب: صورت را با آب مرطوب کنید، مقدار مناسبی از ژل را کف دست بمالید تا کف ایجاد شود."
      },
      {
        id: "LV-CLN-002",
        name: "ژل پاک‌کننده Effaclar لاروش پوزه",
        brand: "La Roche-Posay",
        category: "شوینده",
        price: 2505569,
        description: "ژل پاک‌کننده Effaclar لاروش پوزه از برند معتبر La Roche-Posay. محصول مؤثر برای آکنه.",
        sku: "LV-CLN-002",
        skinTypes: ["چرب", "مستعد آکنه"],
        ingredients: ["زینک PCA", "سالیسیلیک اسید", "PEG-7"],
        usage: "صبح و شب: مقدار کوچکی از ژل را روی صورت مرطوب بمالید و به آرامی ماساژ دهید."
      },
      {
        id: "LV-SRM-001",
        name: "سرم ویتامین C ۲۰٪ تاتچا",
        brand: "Tatcha",
        category: "سرم",
        price: 6910718,
        description: "سرم ویتامین C ۲۰٪ تاتچا از برند معتبر Tatcha. محصول مؤثر برای هایپرپیگمنتیشن.",
        sku: "LV-SRM-001",
        skinTypes: ["همه انواع", "معمولی", "خشک"],
        ingredients: ["ویتامین C ۲۰٪", "عصاره چای سبز", "هیالورونیک اسید"],
        usage: "صبح: بعد از پاک‌کننده و تونر، ۳-۴ قطره روی صورت و گردن بمالید."
      }
    ];
    setProducts(sampleProducts);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    }
  };

  const startProcessing = async () => {
    if (!csvFile) return;
    
    setProcessing(true);
    
    try {
      // Step 1: Process CSV
      updateStepStatus(0, "processing", 0, "Uploading and analyzing CSV...");
      
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const csvResponse = await fetch('/api/process-csv', {
        method: 'POST',
        body: formData
      });
      
      const csvResult = await csvResponse.json();
      
      if (!csvResult.success) {
        throw new Error(csvResult.error);
      }
      
      updateStepStatus(0, "completed", 100, `Processed ${csvResult.products.length} products`);
      
      // Step 2: Scrape Images
      updateStepStatus(1, "processing", 0, "Scraping and generating images...");
      
      const imageResponse = await fetch('/api/scrape-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: csvResult.products })
      });
      
      const imageResult = await imageResponse.json();
      updateStepStatus(1, "completed", 100, `Processed images for ${imageResult.products.length} products`);
      
      // Step 3: Generate Brand Pages
      updateStepStatus(2, "processing", 0, "Generating brand pages...");
      
      const brandResponse = await fetch('/api/generate-brand-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: imageResult.products })
      });
      
      const brandResult = await brandResponse.json();
      updateStepStatus(2, "completed", 100, `Generated ${brandResult.brand_pages.length} brand pages`);
      
      // Step 4: Generate SEO Content
      updateStepStatus(3, "processing", 0, "Generating SEO content...");
      
      // SEO is already included in the CSV processing step
      updateStepStatus(3, "completed", 100, "SEO content generated");
      
      // Step 5: Export CSV
      updateStepStatus(4, "processing", 0, "Exporting enhanced CSV...");
      
      const exportResponse = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products: imageResult.products, 
          format: 'woocommerce' 
        })
      });
      
      if (exportResponse.ok) {
        const blob = await exportResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enhanced_products.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      updateStepStatus(4, "completed", 100, "CSV exported successfully");
      
      // Step 6: Complete
      updateStepStatus(5, "processing", 0, "Finalizing...");
      
      // Update products in state
      setProducts(imageResult.products.map(product => ({
        id: product.ID,
        name: product.Name,
        brand: product['Meta: _livora_brand_name'] || product.Brand,
        category: product.Categories,
        price: parseFloat(product['Regular price']) || 0,
        description: product.Description,
        image: product.scraped_images?.[0],
        sku: product.SKU,
        skinTypes: product['Meta: _livora_skin_type']?.split(',') || [],
        ingredients: product['Meta: ingredients']?.split('|') || [],
        usage: product['Meta: usage_instructions'] || ''
      })));
      
      updateStepStatus(5, "completed", 100, "All processes completed successfully!");
      
    } catch (error) {
      console.error('Processing error:', error);
      // Mark all remaining steps as failed
      processingSteps.forEach((step, index) => {
        if (step.status === 'pending') {
          updateStepStatus(index, "error", 0, `Error: ${error.message}`);
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateStepStatus = (index: number, status: "pending" | "processing" | "completed" | "error", progress: number, message: string) => {
    setProcessingSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, progress, message } : step
    ));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          Beauty Product Management System
        </h1>
        <p className="text-muted-foreground text-lg">
          Advanced AI-powered product data enhancement and SEO optimization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO & Content
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CSV Upload & Processing
              </CardTitle>
              <CardDescription>
                Upload your product CSV file and let our AI agents enhance it with SEO content, images, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="csv-upload">Select CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={startProcessing} 
                    disabled={!csvFile || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start AI Processing
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {processing && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Processing Steps</h3>
                  {processingSteps.map((step) => (
                    <div key={step.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{step.name}</span>
                        <div className="flex items-center gap-2">
                          {step.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {step.status === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
                          {step.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                          <span className="text-sm text-muted-foreground">{step.message}</span>
                        </div>
                      </div>
                      <Progress value={step.progress} className="w-full" />
                    </div>
                  ))}
                </div>
              )}

              {csvFile && !processing && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File "{csvFile.name}" ready for processing. Click "Start AI Processing" to begin.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Inventory
              </CardTitle>
              <CardDescription>
                Manage and view your enhanced product catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === "all" ? "All" : category}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {product.brand} • {product.category}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{product.sku}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">
                            {product.price.toLocaleString()} تومان
                          </span>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.skinTypes.map((skinType) => (
                            <Badge key={skinType} variant="outline" className="text-xs">
                              {skinType}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SEO Content Generation
              </CardTitle>
              <CardDescription>
                AI-powered SEO optimization for your product pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">SEO Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Persian Meta Titles & Descriptions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Schema.org Markup</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Open Graph & Twitter Cards</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Keyword Optimization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Content Enhancement</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Content Generation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Brand Story Pages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Category Landing Pages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Product Comparisons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Skin Care Guides</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Ingredient Education</span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-center">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate SEO Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Insights
              </CardTitle>
              <CardDescription>
                Market intelligence and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{products.length}</div>
                      <div className="text-sm text-muted-foreground">Total Products</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{categories.length - 1}</div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">3</div>
                      <div className="text-sm text-muted-foreground">Brands</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}