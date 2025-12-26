import pandas as pd
import json

def procesar_excel_con_descripciones(archivo_excel):
    """
    Procesa el archivo Excel y extrae tanto los productos como las descripciones
    de categorías y subcategorías.
    """
    # Leer ambas hojas del Excel
    df_menu = pd.read_excel(archivo_excel, sheet_name="menu")
    df_descripciones = pd.read_excel(archivo_excel, sheet_name="descripciones")
    
    # Crear estructura de menuData
    menu_data = {}
    
    # Procesar productos
    for _, row in df_menu.iterrows():
        local = row["Local"]
        categoria = row["Categoría"]
        subcategoria = row["Subcategoría"]
        nombre = row["Nombre"]
        detalle = "" if pd.isna(row["Detalle"]) else str(row["Detalle"])
        precio = row["Precio"]
        
        if pd.isna(precio) or not isinstance(precio, (int, float)):
            continue
        precio = str(int(precio))

        # Inicializar estructura si no existe
        if local not in menu_data:
            menu_data[local] = {}
        if categoria not in menu_data[local]:
            menu_data[local][categoria] = {}
        if subcategoria not in menu_data[local][categoria]:
            menu_data[local][categoria][subcategoria] = {"productos": []}
        
        # Agregar producto
        menu_data[local][categoria][subcategoria]["productos"].append({
            "nombre": nombre,
            "detalle": detalle,
            "precio": precio
        })
    
    # Procesar descripciones
    for _, row in df_descripciones.iterrows():
        categoria = row["Categoria"]
        subcategoria = row["Subcategoria"]
        descripcion = row["Descripcion"]
        
        # Si la subcategoría está vacía, la descripción corresponde a la categoría
        if pd.isna(subcategoria) or subcategoria == "":
            # Buscar la categoría en todos los locales
            for local in menu_data:
                if categoria in menu_data[local]:
                    menu_data[local][categoria]["descripcion"] = descripcion
        else:
            # La descripción corresponde a la subcategoría
            for local in menu_data:
                if categoria in menu_data[local] and subcategoria in menu_data[local][categoria]:
                    menu_data[local][categoria][subcategoria]["descripcion"] = descripcion
    
    return menu_data


def process_file(input_file, output_js):
    try:
        # Procesar con descripciones
        menu_data_con_descripciones = procesar_excel_con_descripciones(input_file)
        
        # Exportar como archivo JavaScript con estructura completa
        with open(output_js, "w", encoding="utf-8") as f:
            f.write("const menuData = ")
            json.dump(menu_data_con_descripciones, f, ensure_ascii=False, indent=2)
            f.write(";")
        print(f"Processed {input_file} -> {output_js}")
    except Exception as e:
        print(f"Error processing {input_file}: {e}")

# Process all files
files_to_process = [
    ("menu_data.xlsx", "data.js"),
    ("menu_pehuen.xlsx", "data_pehuen.js"),
    ("menu_parador.xlsx", "data_parador.js")
]

for input_name, output_name in files_to_process:
    process_file(input_name, output_name)
