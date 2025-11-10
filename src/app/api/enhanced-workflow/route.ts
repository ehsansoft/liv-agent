import { NextRequest, NextResponse } from 'next/server';
import { EnhancedBeautyProductManager } from '../../../enhanced_manager_new';

const productManager = new EnhancedBeautyProductManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { use_agent_zero = false, csv_file_path = 'uploaded_products.csv' } = body;
    
    if (use_agent_zero) {
      // Use the enhanced Agent Zero workflow
      const result = await productManager.process_with_agents(csv_file_path);
      return NextResponse.json(result);
    } else {
      // Fallback to original CSV processing
      const result = await productManager.process_with_agents(csv_file_path);
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('Enhanced workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to process workflow', details: error.message },
      { status: 500 }
    );
  }
}