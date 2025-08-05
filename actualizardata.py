import json
import sys
import zipfile
import xml.etree.ElementTree as ET
import re

NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def _read_rows(path: str):
    """Return a list of rows from the first sheet of an xlsx file.

    The function only relies on the Python standard library so it can run in
    minimal environments without external dependencies like pandas or
    openpyxl.  Cells are returned keyed by column letter (A, B, ...).
    """
    with zipfile.ZipFile(path) as zf:
        shared = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        strings = [t.text or "" for t in shared.findall(
            f".//{{{NAMESPACE}}}si/{{{NAMESPACE}}}t")]
        sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))

    rows = []
    for row in sheet.findall(f".//{{{NAMESPACE}}}row"):
        current = {}
        for c in row.findall(f"{{{NAMESPACE}}}c"):
            ref = c.get("r")  # e.g. "C12"
            col = re.sub(r"\d", "", ref)
            typ = c.get("t")
            v = c.find(f"{{{NAMESPACE}}}v")
            if v is None:
                value = ""
            else:
                raw = v.text or ""
                value = strings[int(raw)] if typ == "s" else raw
            current[col] = value
        rows.append(current)
    return rows


def _normalise_records(rows):
    """Map raw row dictionaries to records keyed by header name."""
    header = rows[0]
    # Map column letter to header text
    letter_to_header = {col: header[col] for col in header}
    records = []
    for row in rows[1:]:
        record = {letter_to_header[col]: row.get(col, "") for col in letter_to_header}
        records.append(record)
    return records


def _get_case_insensitive(row, *candidates):
    lower = {k.lower(): v for k, v in row.items()}
    for name in candidates:
        key = name.lower()
        if key in lower:
            return lower[key]
    return ""


def build_menu(records):
    menu = {}
    for row in records:
        local = row.get("Local", "General")
        categoria = row.get("Categoría", "")
        subcategoria = row.get("Subcategoría", "")
        nombre = row.get("Nombre", "").strip()
        detalle = row.get("Detalle", "").strip()
        precio = row.get("Precio", "").strip()

        cat_desc = _get_case_insensitive(row,
                                        "Descripción Categoría",
                                        "Descripcion Categoria",
                                        "Descripción categoría",
                                        "Descripcion categoría")
        sub_desc = _get_case_insensitive(row,
                                         "Descripción Subcategoría",
                                         "Descripcion Subcategoria",
                                         "Descripción subcategoría",
                                         "Descripcion subcategoría")
        if not categoria:
            continue

        cat_dict = menu.setdefault(local, {}).setdefault(categoria, {})
        if cat_desc and "descripcion" not in cat_dict:
            cat_dict["descripcion"] = cat_desc

        if not subcategoria:
            # Only category description available
            continue

        container = cat_dict.get(subcategoria)
        if sub_desc:
            if not isinstance(container, dict):
                container = {"descripcion": sub_desc, "productos": []}
                cat_dict[subcategoria] = container
            else:
                container.setdefault("descripcion", sub_desc)
                container.setdefault("productos", [])
            productos = container["productos"]
        else:
            if isinstance(container, dict):
                container.setdefault("productos", [])
                productos = container["productos"]
            else:
                if container is None:
                    container = []
                    cat_dict[subcategoria] = container
                productos = container

        if not nombre:
            # Row used only to provide description
            continue

        try:
            precio_str = str(int(float(precio))) if precio else ""
        except ValueError:
            precio_str = ""

        productos.append({
            "nombre": nombre,
            "detalle": detalle,
            "precio": precio_str,
        })
    return menu


def main():
    excel_file = sys.argv[1] if len(sys.argv) > 1 else "menu_data.xlsx"
    rows = _read_rows(excel_file)
    records = _normalise_records(rows)
    menu_data = build_menu(records)
    with open("data.js", "w", encoding="utf-8") as f:
        f.write("const menuData = ")
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
        f.write(";\n")


if __name__ == "__main__":
    main()
