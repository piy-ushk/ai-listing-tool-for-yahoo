import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: dict(sz=4, val='single', color='CBD5E1')
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="{kwargs.get("top", {}).get("val", "none")}" w:sz="{kwargs.get("top", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("top", {}).get("color", "auto")}"/>'
        f'<w:left w:val="{kwargs.get("left", {}).get("val", "none")}" w:sz="{kwargs.get("left", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("left", {}).get("color", "auto")}"/>'
        f'<w:bottom w:val="{kwargs.get("bottom", {}).get("val", "none")}" w:sz="{kwargs.get("bottom", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("bottom", {}).get("color", "auto")}"/>'
        f'<w:right w:val="{kwargs.get("right", {}).get("val", "none")}" w:sz="{kwargs.get("right", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("right", {}).get("color", "auto")}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

def add_styled_paragraph(doc, text, is_bold=False, color_rgb=(15, 23, 42), font_size=10.5, space_after=6, space_before=0, bullet=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.3

    if bullet:
        p.paragraph_format.left_indent = Inches(0.25)
        # Add bullet symbol
        run_b = p.add_run("•  ")
        run_b.font.name = "Arial"
        run_b.font.size = Pt(font_size)
        run_b.font.color.rgb = RGBColor(234, 88, 12) # Orange bullet

    # Parse inline markdown bold: **text**
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            content = part[2:-2]
            run = p.add_run(content)
            run.bold = True
        else:
            run = p.add_run(part)
            run.bold = is_bold
        
        run.font.name = "Yu Gothic"
        run.font.size = Pt(font_size)
        run.font.color.rgb = RGBColor(*color_rgb)
    return p

def main():
    md_path = "docs/PHASE_0_AND_1_SPECIFICATION.md"
    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found")
        return

    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = docx.Document()

    # Set Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("金剛洞 AI出品査定プラットフォーム")
    run_t.font.name = "Yu Gothic"
    run_t.font.size = Pt(22)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(234, 88, 12) # Kongo-do Orange

    # Subtitle
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(20)
    run_sub = sub_p.add_run("【Phase 0：要件定義・仕様確定書 ＆ Phase 1：MVP運用仕様】")
    run_sub.font.name = "Yu Gothic"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Decorative Line
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(16)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="EA580C"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)

    in_table = False
    table_lines = []

    def flush_table(t_lines):
        if not t_lines:
            return
        rows_data = []
        for l in t_lines:
            if not l.strip() or '---' in l:
                continue
            cells = [c.strip() for c in l.strip().strip('|').split('|')]
            if len(cells) >= 3:
                rows_data.append(cells[:3])

        if not rows_data:
            return

        table = doc.add_table(rows=len(rows_data), cols=3)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        col_widths = [Inches(2.2), Inches(1.1), Inches(3.2)]

        for r_idx, row in enumerate(rows_data):
            for c_idx, val in enumerate(row):
                cell = table.cell(r_idx, c_idx)
                cell.width = col_widths[c_idx]
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                set_cell_border(cell, 
                                top=dict(val="single", sz="4", color="E2E8F0"),
                                bottom=dict(val="single", sz="4", color="E2E8F0"),
                                left=dict(val="none"),
                                right=dict(val="none"))

                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.2

                if r_idx == 0:
                    set_cell_background(cell, "F1F5F9")
                    run = p.add_run(val)
                    run.bold = True
                    run.font.name = "Yu Gothic"
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(15, 23, 42)
                else:
                    if r_idx % 2 == 1:
                        set_cell_background(cell, "FFFFFF")
                    else:
                        set_cell_background(cell, "FAFAFA")
                    # Clean markdown formatting like ** or `
                    clean_val = val.replace('`', '')
                    parts = re.split(r'(\*\*.*?\*\*)', clean_val)
                    for pt in parts:
                        if pt.startswith('**') and pt.endswith('**'):
                            r = p.add_run(pt[2:-2])
                            r.bold = True
                        else:
                            r = p.add_run(pt)
                        r.font.name = "Yu Gothic"
                        r.font.size = Pt(9)
                        r.font.color.rgb = RGBColor(51, 65, 85)
        
        doc.add_paragraph().paragraph_format.space_after = Pt(12)

    for line in lines[4:]:
        stripped = line.strip()

        # Table detection
        if stripped.startswith('|'):
            in_table = True
            table_lines.append(stripped)
            continue
        elif in_table:
            flush_table(table_lines)
            in_table = False
            table_lines = []

        if not stripped or stripped == '---':
            continue

        # Headers
        if stripped.startswith('### '):
            h_text = stripped[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(h_text)
            run.font.name = "Yu Gothic"
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42)
            # Add light border bottom to H1 section
            border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="2" w:color="CBD5E1"/></w:pBdr>')
            p._p.get_or_add_pPr().append(border)
            continue

        if stripped.startswith('#### '):
            h_text = stripped[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(h_text)
            run.font.name = "Yu Gothic"
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(234, 88, 12)
            continue

        # Bullet list items
        if stripped.startswith('- ') or stripped.startswith('* '):
            content = stripped[2:].strip()
            add_styled_paragraph(doc, content, bullet=True, font_size=10, space_after=3)
            continue

        # Nested bullet or numbered
        if re.match(r'^\d+\.\s+', stripped):
            num_match = re.match(r'^(\d+\.)\s+(.*)', stripped)
            prefix = num_match.group(1)
            content = num_match.group(2)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.3
            r_num = p.add_run(f"{prefix} ")
            r_num.bold = True
            r_num.font.color.rgb = RGBColor(234, 88, 12)
            r_num.font.size = Pt(10)
            
            parts = re.split(r'(\*\*.*?\*\*)', content)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p.add_run(part)
                r.font.name = "Yu Gothic"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(30, 41, 59)
            continue

        # Regular text
        add_styled_paragraph(doc, stripped, font_size=10, space_after=6)

    if in_table:
        flush_table(table_lines)

    # Save to both paths
    out_path_1 = "docs/PHASE_0_AND_1_SPECIFICATION.docx"
    out_path_2 = "金剛洞_AI出品査定プラットフォーム_Phase0_1仕様書.docx"
    doc.save(out_path_1)
    doc.save(out_path_2)
    print(f"Successfully generated:\n- {out_path_1}\n- {out_path_2}")

if __name__ == "__main__":
    main()
