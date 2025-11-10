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
  Search, 
  Settings, 
  BarChart3, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  Globe, 
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
  seoContent?: any;
  scrapedImages?: string[];
}

interface ProcessingStep {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  message: string;
}

interface SystemStatus {
  apiStatus: "connected" | "disconnected" | "error";
  agentZeroStatus: "active" | "inactive" | "error";
  lastWorkflow: any;
  generatedFiles: string[];
  totalProducts: number;
}

export default function BeautyProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "1", name: "CSV Analysis", status: "pending", progress: 0, message: "در انتظار پردازش..." },
    { id: "2", name: "Product Enhancement", status: "pending", progress: 0, message: "در انتظار بهبودانی محصولات..." },
    { id: "3", name: "Image Processing", status: "pending", progress: 0, message: "در انتظار پردازش تصاویر..." },
    { id: "4", name: "Brand Page Generation", status: "pending", progress: 0, message: "در انتظار تولید صفحات برندها..." },
    { id: "5", name: "JSON Pages Generation", status: "pending", progress: 0, message: "در انتظار تولید صفحات JSON..." },
    { id: "6", name: "SEO Content Generation", status: "pending", progress: 0, message: "در انتظار تولید محتوای SEO..." },
    { id: "7", name: "Final Export", status: "pending", progress: 0, message: "در انتظار صدور فایل نهایی..." }
  ]);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSuccess, setShowSuccess] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  
  // System status monitoring
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiStatus: "connected",
    agentZeroStatus: "inactive",
    lastWorkflow: null,
    generatedFiles: [],
    totalProducts: 0
  });

  // Check system status on mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check API status
      const apiResponse = await fetch('/api/health');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          apiStatus: "connected"
        }));
      }

      // Check Agent Zero status
      const agentResponse = await fetch('/api/agent-zero-status');
      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          agentZeroStatus: agentData.status || "inactive"
        }));
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    }
  };

  const startProcessing = async () => {
    if (!csvFile) {
      alert("لطفاً ابتدا یک فایل CSV انتخاب کنید");
      return;
    }

    setProcessing(true);
    setShowSuccess(false);

    try {
      // Step 1: Process CSV
      updateStepStatus(0, "processing", 0, "در حال پردازش CSV...");
      
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const csvResponse = await fetch('/api/enhanced-workflow', {
        method: 'POST',
        body: formData
      });
      
      if (!csvResponse.ok) {
        const errorText = await csvResponse.text();
        throw new Error(`خطا در پردازش CSV: ${errorText}`);
      }
      
      const csvResult = await csvResponse.json();
      
      if (!csvResult.success) {
        throw new Error(csvResult.error || 'خطا ناشناخته در پردازش CSV');
      }
      
      updateStepStatus(0, "completed", 100, `${csvResult.products_processed || 0} محصول با موفقیت پردازش شد`);
      
      // Step 2-7: Run Agent Zero Workflow
      updateStepStatus(1, "processing", 0, "در حال اجرای Agent Zero Workflow...");
      
      const enhancedResponse = await fetch('/api/enhanced-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          use_agent_zero: true,
          csv_file_path: 'uploaded_products.csv'
        })
      });
      
      if (!enhancedResponse.ok) {
        const errorText = await enhancedResponse.text();
        throw new Error(`خطا در Agent Zero Workflow: ${errorText}`);
      }
      
      const enhancedResult = await enhancedResponse.json();
      
      if (!enhancedResult.success) {
        throw new Error(enhancedResult.error || 'خطا در Agent Zero Workflow');
      }
      
      // Update all steps
      updateStepStatus(1, "completed", 100, `${enhancedResult.products_processed || 0} محصول بهبودانی شد`);
      updateStepStatus(2, "completed", 100, "تحقیق بازار تکمیل شد");
      updateStepStatus(3, "completed", 100, "تصاویر محصولات پردازش شد");
      updateStepStatus(4, "completed", 100, "صفحات برندها تولید شد");
      updateStepStatus(5, "completed", 100, "محتوای SEO تولید شد");
      updateStepStatus(6, "completed", 100, "فایل CSV نهایی صادر شد");
      
      // Update products in state
      const enhancedProducts = enhancedResult.products || [];
      setProducts(enhancedProducts);
      setProcessedData(enhancedResult);
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        agentZeroStatus: "active",
        lastWorkflow: enhancedResult,
        generatedFiles: enhancedResult.generated_files || [],
        totalProducts: enhancedResult.products_processed || 0
      }));
      
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Processing error:', error);
      alert(`خطا در پردازش: ${error.message}`);
      
      // Mark all steps as failed
      for (let i = 0; i < processingSteps.length; i++) {
        updateStepStatus(i, "error", 0, `خطا: ${error.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const updateStepStatus = (index: number, status: ProcessingStep["status"], progress: number, message: string) => {
    setProcessingSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, progress, message } : step
    ));
  };

  const downloadFile = async (filename: string, content: any) => {
    try {
      const response = await fetch(`/api/download-json/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "شوینده", "سرم", "مرطب‌کننده", "ضدآفتاب", "مکیاژ", "لوازم آرایشی"];

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          سیستم مدیریت محصولات زیبایی لیورا
        </h1>
        <p className="text-muted-foreground text-lg">
          سیستم پیشرفته هوشمند برای بهبودانی و SEO محصولات زیبایی
        </p>
      </div>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            وضعیت سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                systemStatus.apiStatus === 'connected' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.apiStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  {systemStatus.apiStatus === 'connected' ? 'متصل' : 'قطع'}
                </span>
              </div>
              <span className="text-sm">API</span>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                systemStatus.agentZeroStatus === 'active' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.agentZeroStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="text-sm font-medium">
                  {systemStatus.agentZeroStatus === 'active' ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              <span className="text-sm">Agent Zero</span>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                <div>محصولات پردازش شده:</div>
                <div className="text-2xl font-bold">{systemStatus.totalProducts}</div>
                <div>فایل‌های تولید شده:</div>
                <div className="text-sm">{systemStatus.generatedFiles.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>بارگذاری CSV</span>
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4" />
            <span>محصولات</span>
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="h-4 w-4" />
            <span>SEO و محتوا</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            <span>تنظیمات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بارگذاری و پردازش CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="csv-upload" className="text-right mb-2 block">
                    انتخاب فایل CSV
                  </Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="text-left"
                    placeholder="فایل CSV محصولات خود را انتخاب کنید"
                  />
                </div>
                <div>
                  <Button 
                    onClick={startProcessing}
                    disabled={!csvFile || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        شروع پردازش با Agent Zero
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Processing Steps */}
              {processing && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">مراحل پردازش:</h3>
                  <div className="space-y-3">
                    {processingSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-500' : 
                          step.status === 'processing' ? 'bg-blue-500' : 
                          step.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                          {step.status === 'completed' && <CheckCircle className="text-white" />}
                          {step.status === 'processing' && <Loader2 className="text-white" />}
                          {step.status === 'error' && <AlertCircle className="text-white" />}
                        </div>
                        <div className="text-sm text-white font-medium">
                          {step.name}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Progress value={step.progress} className="w-full" />
                        <div className="text-sm text-white mt-1">{step.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجوی محصولات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 w-full border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
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
                  className="text-xs md:text-sm h-8 px-3 border-2 border-gray-300 rounded-md hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                >
                  {category === "all" ? "همه" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="text-xs">
                        {product.brand}
                      </Badge>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      </div>
                    </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-green-600">
                        {product.price.toLocaleString()} تومان
                      </span>
                      <Button size="sm" variant="outline">
                        جزئیات بیشتر
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
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
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                محتوای SEO و بهبودانی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-lg font-semibold mb-2">ویژگی‌های کلیدی تولید شده:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• عنوان‌های متا SEO برای موتور جستجو</li>
                    <li>• توضیحات Schema.org برای نمایش غنی در نتایج جستجو</li>
                    <li>• محتوای متا Open Graph برای شبکه‌های اجتماعی</li>
                    <li>• کارت‌های کلیدی برای محصولات پوستی</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-lg font-semibold mb-2">محتوای صفحه اصلی:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• عنوان: لیورا - فروشگاه اینترنتی محصولات زیبایی</li>
                    <li>• توضیحات: بهترین انتخاب برای محصولات آرایشی و بهداشتی با ضمانت اصالت</li>
                    <li>• کلمات‌ها کلیدی: محصولات آرایشی، بهداشتی، لوازم آرایشی</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                تنظیمات سیستم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">پیکربندی Agent Zero</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>وضعیت:</span>
                      <Badge variant={systemStatus.agentZeroStatus === 'active' ? 'default' : 'secondary'}>
                        {systemStatus.agentZeroStatus === 'active' ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Agent Zero برای تحقیق بازار و بهبودانی محصولات</p>
                    <p>تعداد محصولات پردازش شده: {systemStatus.totalProducts}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-2">پیکربندی API</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>وضعیت:</span>
                      <Badge variant={systemStatus.apiStatus === 'connected' ? 'default' : 'secondary'}>
                        {systemStatus.apiStatus === 'connected' ? 'متصل' : 'قطع'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>اتصال به API اصلی سیستم</p>
                  </div>
                </div>
              </div>

              <div>
                  <h4 className="text-lg font-semibold mb-2">فایل‌های تولید شده</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>تعداد فایل‌های JSON تولید شده: {systemStatus.generatedFiles.length}</p>
                      <Button 
                        onClick={() => downloadFile('sitemap.json')}
                        variant="outline"
                        size="sm"
                      >
                        دانلود Sitemap
                      </Button>
                      <Button 
                        onClick={() => downloadFile('products.json')}
                        variant="outline"
                        size="sm"
                      >
                        دانلود محصولات
                      </Button>
                      <Button 
                        onClick={() => downloadFile('brands.json')}
                        variant="outline"
                        size="sm"
                      >
                        دانلود برندها
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Message */}
      {showSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="text-lg font-semibold mb-2">✅ پردازش با موفقیت انجام شد!</div>
            <div className="space-y-2">
              <div>📊 {systemStatus.totalProducts} محصول با موفقیت پردازش شد</div>
              <div>📁 {systemStatus.generatedFiles.length} فایل JSON تولید شد</div>
              <div>🤖 Agent Zero Workflow با موفقیت اجرا شد</div>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => setShowSuccess(false)} variant="outline" size="sm">
                  ادامه
                </Button>
                <Button onClick={() => window.location.reload()} variant="default" size="sm">
                  شروع مجدد
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}