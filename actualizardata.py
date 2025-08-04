import pandas as pd
import json

# Leer el Excel
df = pd.read_excel("menu_data.xlsx")

# Crear estructura de menuData
menu_data = {}

for _, row in df.iterrows():
    local = row["Local"]
    categoria = row["Categoría"]
    subcategoria = row["Subcategoría"]
    nombre = row["Nombre"]
    detalle = "" if pd.isna(row["Detalle"]) else str(row["Detalle"])
    precio = row["Precio"]
    if pd.isna(precio) or not isinstance(precio, (int, float)):
        continue
    precio = str(int(precio))


    # Estructura anidada
    menu_data.setdefault(local, {}).setdefault(categoria, {}).setdefault(subcategoria, []).append({
        "nombre": nombre,
        "detalle": detalle,
        "precio": str(precio)
    })

# Exportar como archivo JavaScript
with open("data.js", "w", encoding="utf-8") as f:
    f.write("const menuData = ")
    json.dump(menu_data, f, ensure_ascii=False, indent=2)
    f.write(";")
