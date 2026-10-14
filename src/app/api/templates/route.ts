import { NextResponse } from 'next/server';
import { getTemplates, createTemplate } from '@/lib/db';

export async function GET() {
  try {
    const templates = await getTemplates();
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Template content is required' }, { status: 400 });
    }

    const template = await createTemplate({
      name: body.name.trim(),
      category: body.category || 'other',
      content: body.content.trim(),
      isDefault: false,
    });

    return NextResponse.json({ template, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}
