import pandas as pd

# Define data for Pehuen
data = [
    {"Local": "Bar", "Categoría": "Bebidas", "Subcategoría": "Cervezas", "Nombre": "Pinta Rubia", "Detalle": "Artesanal", "Precio": 4000},
    {"Local": "Bar", "Categoría": "Tragos", "Subcategoría": "Clásicos", "Nombre": "Fernet", "Detalle": "Con Coca", "Precio": 5000},
    {"Local": "Pancho", "Categoría": "Panchos", "Subcategoría": "Gourmet", "Nombre": "Super Pancho", "Detalle": "Con papas", "Precio": 3000},
    {"Local": "Pizzas", "Categoría": "Pizzas", "Subcategoría": "Muzzarella", "Nombre": "Grande Muzza", "Detalle": "8 porciones", "Precio": 8000},
]

df_menu = pd.DataFrame(data)
df_descripciones = pd.DataFrame(columns=["Categoria", "Subcategoria", "Descripcion"])

with pd.ExcelWriter("menu_pehuen.xlsx") as writer:
    df_menu.to_excel(writer, sheet_name="menu", index=False)
    df_descripciones.to_excel(writer, sheet_name="descripciones", index=False)

print("menu_pehuen.xlsx created with Bar, Pancho, Pizzas.")

# Define data for Parador (just copy structure usually, but let's make sure it exists with valid format)
# Parador might just be the original data but we'll leave it as copy of main menu for now as per previous step, 
# or we can seed it too if needed. The user said "Parador con los precios del parador".
# I'll rely on the copy I made, or just re-save it to ensure format. 
# For now, just Pehuen needs structure change.
