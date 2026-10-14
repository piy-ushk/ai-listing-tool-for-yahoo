import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const products = await getProducts({ search, status, category });
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!body.managementNumber) {
      return NextResponse.json({ error: 'Management number is required' }, { status: 400 });
    }

    const product = await createProduct({
      managementNumber: body.managementNumber,
      title: body.title,
      category: body.category || 'すべて>本、雑誌',
      publisher: body.publisher || '',
      janIsbn: body.janIsbn || '',
      price: Number(body.price) || 1000,
      buyoutPrice: body.buyoutPrice ? Number(body.buyoutPrice) : null,
      conditionRank: body.conditionRank || '目立った傷や汚れなし',
      shippingPayer: body.shippingPayer || 'seller',
      shippingMethod: body.shippingMethod || 'ネコポス',
      shippingOrigin: body.shippingOrigin || '東京都',
      description: body.description || '',
      imageUrl: body.imageUrl || null,
      productType: body.productType || 'other',
      status: body.status || 'pending',
    });

    return NextResponse.json({ product, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
