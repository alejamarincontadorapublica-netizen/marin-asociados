import json
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
import os

# ============================================================
# AGENTE DIAN - METODO MARIN
# Alejandra Marin Contadora Publica - T.P. 327147
# Validado con datos reales DIAN - Junio 2026
# ============================================================

# Tipos que generan IVA en emitidos
TIPOS_FACTURA_VENTA = [
    "Factura electronica",
    "Factura electrónica"
]

# Tipos que generan IVA en recibidos
TIPOS_FACTURA_COMPRA = [
    "Factura electronica",
    "Factura electrónica",
    "Factura electronica de contingencia",
    "Factura electrónica de contingencia"
]

# Notas credito (se descuentan)
TIPOS_NOTA_CREDITO = [
    "Nota de credito electronica",
    "Nota de crédito electrónica"
]

# Notas debito (se suman)
TIPOS_NOTA_DEBITO = [
    "Nota de debito electronica",
    "Nota de débito electrónica"
]

# Documentos que se ignoran completamente
TIPOS_IGNORAR = [
    "Application response",
    "Documento soporte",
    "Nomina",
    "Nómina",
    "Nota de ajuste",
    "Documento equivalente",
    "cobro de peajes"
]

def cargar_clientes():
    with open("clientes.json", "r", encoding="utf-8") as f:
        return json.load(f)["clientes"]

def seleccionar_cliente(clientes):
    print("\n" + "="*60)
    print("   AGENTE DIAN - METODO MARIN")
    print("   Alejandra Marin Contadora Publica - T.P. 327147")
    print("="*60)
    print("\nClientes disponibles:\n")
    for i, c in enumerate(clientes):
        print(f"  {i+1}. {c['nombre']}")
    print()
    while True:
        try:
            opcion = int(input("Selecciona el numero del cliente: ")) - 1
            if 0 <= opcion < len(clientes):
                return clientes[opcion]
            print("Numero no valido. Intenta de nuevo.")
        except ValueError:
            print("Escribe solo el numero.")

def solicitar_fechas():
    print("\nIngresa el periodo a consultar:")
    fecha_inicio = input("  Fecha inicio (DD/MM/AAAA): ").strip()
    fecha_fin    = input("  Fecha fin   (DD/MM/AAAA): ").strip()
    return fecha_inicio, fecha_fin

def iniciar_navegador():
    print("\nAbriendo navegador Chrome...")
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    carpeta_descargas = os.path.abspath("descargas")
    if not os.path.exists(carpeta_descargas):
        os.makedirs(carpeta_descargas)
    prefs = {
        "download.default_directory": carpeta_descargas,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True
    }
    options.add_experimental_option("prefs", prefs)
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )
    return driver

def ingresar_portal_dian(driver, cliente):
    print("Abriendo portal DIAN...")
    driver.get("https://catalogo-vpfe.dian.gov.co/User/Login")
    wait = WebDriverWait(driver, 30)
    time.sleep(3)

    if cliente["tipo"] == "empresa":
        print(f"  Empresa  : {cliente['nombre']}")
        print(f"  NIT      : {cliente['nit']}")
        print(f"  Cedula RL: {cliente['cedula_rl']}")
        try:
            campo_nit = wait.until(EC.presence_of_element_located((By.ID, "NitEmpresa")))
            campo_nit.clear()
            campo_nit.send_keys(cliente["nit"])
            time.sleep(1)
            campo_cedula = driver.find_element(By.ID, "NumeroDocumento")
            campo_cedula.clear()
            campo_cedula.send_keys(cliente["cedula_rl"])
        except Exception as e:
            print(f"  AVISO: Revisa el portal manualmente. Error: {e}")
    else:
        print(f"  Persona natural: {cliente['nombre']}")
        print(f"  Cedula         : {cliente['cedula']}")
        try:
            campo_cedula = wait.until(EC.presence_of_element_located((By.ID, "NumeroDocumento")))
            campo_cedula.clear()
            campo_cedula.send_keys(cliente["cedula"])
        except Exception as e:
            print(f"  AVISO: No se encontro el campo. Error: {e}")

    print()
    print("="*60)
    print("ACCION REQUERIDA:")
    print(f"Los datos de {cliente['nombre']} ya estan en el portal.")
    print("Escribele al cliente para que revise su correo")
    print("y te envie el token que le llego.")
    print("Recuerda: el token vence en aprox. 40 minutos.")
    print("="*60)
    token = input("\nPega aqui el token cuando lo recibas: ").strip()

    try:
        campo_token = wait.until(EC.presence_of_element_located((By.ID, "CodigoOTP")))
        campo_token.clear()
        campo_token.send_keys(token)
        boton = driver.find_element(By.ID, "btnEntrar")
        boton.click()
        print("Ingresando al portal...")
        time.sleep(5)
    except Exception as e:
        print(f"  AVISO: Ingresa el token manualmente en el navegador.")
        input("  Presiona Enter cuando hayas ingresado al portal: ")

    return driver

def descargar_reporte(driver, tipo, fecha_inicio, fecha_fin):
    wait = WebDriverWait(driver, 30)
    print(f"\nDescargando {tipo}...")
    carpeta = os.path.abspath("descargas")
    archivos_antes = set(os.listdir(carpeta))

    try:
        driver.get("https://catalogo-vpfe.dian.gov.co/Document/SearchDocument")
        time.sleep(3)

        campo_inicio = wait.until(EC.presence_of_element_located((By.ID, "FechaDesde")))
        campo_inicio.clear()
        campo_inicio.send_keys(fecha_inicio)

        campo_fin = driver.find_element(By.ID, "FechaHasta")
        campo_fin.clear()
        campo_fin.send_keys(fecha_fin)

        select_tipo = driver.find_element(By.ID, "TipoDocumento")
        if tipo == "EMITIDOS":
            select_tipo.send_keys("Emitidos")
        else:
            select_tipo.send_keys("Recibidos")

        boton_buscar = driver.find_element(By.ID, "btnBuscar")
        boton_buscar.click()
        time.sleep(5)

        boton_excel = wait.until(EC.element_to_be_clickable((By.ID, "btnExportar")))
        boton_excel.click()
        print(f"  Descargando Excel de {tipo}... espera...")
        time.sleep(10)

        archivos_despues = set(os.listdir(carpeta))
        nuevos = archivos_despues - archivos_antes
        xls_nuevos = [f for f in nuevos if f.endswith(".xls") or f.endswith(".xlsx")]

        if xls_nuevos:
            archivo = os.path.join(carpeta, xls_nuevos.pop())
            print(f"  Archivo descargado: {archivo}")
            return archivo
        else:
            print(f"  AVISO: No se detecto descarga automatica.")
            print(f"  Guarda el Excel manualmente en: {carpeta}")
            nombre = input(f"  Escribe el nombre del archivo (ej: emitidos.xls): ").strip()
            return os.path.join(carpeta, nombre)

    except Exception as e:
        print(f"  AVISO: Error en descarga de {tipo}: {e}")
        print(f"  Guarda el Excel manualmente en: {carpeta}")
        nombre = input(f"  Escribe el nombre del archivo descargado: ").strip()
        return os.path.join(carpeta, nombre)

def clasificar_documento(tipo_doc):
    tipo = str(tipo_doc).strip()
    for t in TIPOS_IGNORAR:
        if t.lower() in tipo.lower():
            return "IGNORAR"
    for t in TIPOS_NOTA_CREDITO:
        if t.lower() in tipo.lower():
            return "NOTA_CREDITO"
    for t in TIPOS_NOTA_DEBITO:
        if t.lower() in tipo.lower():
            return "NOTA_DEBITO"
    return "FACTURA"

def procesar_excel(archivo, tipo_reporte):
    if not archivo or not os.path.exists(archivo):
        print(f"  AVISO: No se encontro el archivo de {tipo_reporte}")
        return pd.DataFrame()
    try:
        if archivo.endswith(".xls"):
            df = pd.read_excel(archivo, engine="xlrd")
        else:
            df = pd.read_excel(archivo, engine="openpyxl")
        print(f"  {len(df)} documentos encontrados en {tipo_reporte}")
        return df
    except Exception as e:
        print(f"  ERROR leyendo {tipo_reporte}: {e}")
        return pd.DataFrame()

def calcular_iva(df_emitidos, df_recibidos):
    print("\nCalculando IVA con reglas del Metodo Marin...")

    resumen = {
        "facturas_venta": 0.0,
        "notas_credito_venta": 0.0,
        "notas_debito_venta": 0.0,
        "facturas_compra": 0.0,
        "notas_credito_compra": 0.0,
        "notas_debito_compra": 0.0,
        "docs_ignorados_emitidos": 0,
        "docs_ignorados_recibidos": 0,
        "docs_desconocidos": []
    }

    COL_TIPO = "Tipo de documento"
    COL_IVA  = "IVA"

    if not df_emitidos.empty and COL_TIPO in df_emitidos.columns and COL_IVA in df_emitidos.columns:
        for _, row in df_emitidos.iterrows():
            clasificacion = clasificar_documento(row[COL_TIPO])
            try:
                valor = float(str(row[COL_IVA]).replace(",", "").replace("$", "").strip()) if pd.notna(row[COL_IVA]) else 0.0
            except:
                valor = 0.0
            if clasificacion == "FACTURA":
                resumen["facturas_venta"] += valor
            elif clasificacion == "NOTA_CREDITO":
                resumen["notas_credito_venta"] += valor
            elif clasificacion == "NOTA_DEBITO":
                resumen["notas_debito_venta"] += valor
            elif clasificacion == "IGNORAR":
                resumen["docs_ignorados_emitidos"] += 1
            elif clasificacion == "DESCONOCIDO":
                t = str(row[COL_TIPO])
                if t not in resumen["docs_desconocidos"]:
                    resumen["docs_desconocidos"].append(f"EMITIDO: {t}")

    if not df_recibidos.empty and COL_TIPO in df_recibidos.columns and COL_IVA in df_recibidos.columns:
        for _, row in df_recibidos.iterrows():
            clasificacion = clasificar_documento(row[COL_TIPO])
            try:
                valor = float(str(row[COL_IVA]).replace(",", "").replace("$", "").strip()) if pd.notna(row[COL_IVA]) else 0.0
            except:
                valor = 0.0
            if clasificacion == "FACTURA":
                resumen["facturas_compra"] += valor
            elif clasificacion == "NOTA_CREDITO":
                resumen["notas_credito_compra"] += valor
            elif clasificacion == "NOTA_DEBITO":
                resumen["notas_debito_compra"] += valor
            elif clasificacion == "IGNORAR":
                resumen["docs_ignorados_recibidos"] += 1
            elif clasificacion == "DESCONOCIDO":
                t = str(row[COL_TIPO])
                if t not in resumen["docs_desconocidos"]:
                    resumen["docs_desconocidos"].append(f"RECIBIDO: {t}")

    iva_generado    = resumen["facturas_venta"]  + resumen["notas_debito_venta"]  - resumen["notas_credito_venta"]
    iva_descontable = resumen["facturas_compra"] + resumen["notas_debito_compra"] - resumen["notas_credito_compra"]
    saldo           = iva_generado - iva_descontable

    return iva_generado, iva_descontable, saldo, resumen

def imprimir_resultado(cliente, fecha_inicio, fecha_fin, iva_generado, iva_descontable, saldo, resumen):
    sep = "=" * 60
    sep2 = "-" * 60
    print()
    print(sep)
    print("   RESULTADO - METODO MARIN")
    print(sep)
    print(f"  Cliente  : {cliente['nombre']}")
    print(f"  Periodo  : {fecha_inicio} al {fecha_fin}")
    print(f"  Generado : {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(sep2)
    print(f"  IVA Facturas venta       : $ {resumen['facturas_venta']:>15,.0f}")
    print(f"  IVA Notas debito venta   : $ {resumen['notas_debito_venta']:>15,.0f}")
    print(f"  IVA Notas credito venta  : $ {resumen['notas_credito_venta']:>15,.0f}")
    print(sep2)
    print(f"  IVA GENERADO NETO        : $ {iva_generado:>15,.0f}")
    print()
    print(f"  IVA Facturas compra      : $ {resumen['facturas_compra']:>15,.0f}")
    print(f"  IVA Notas debito compra  : $ {resumen['notas_debito_compra']:>15,.0f}")
    print(f"  IVA Notas credito compra : $ {resumen['notas_credito_compra']:>15,.0f}")
    print(sep2)
    print(f"  IVA DESCONTABLE NETO     : $ {iva_descontable:>15,.0f}")
    print()
    print(sep)
    if saldo > 0:
        print(f"  IVA A PAGAR A LA DIAN   : $ {saldo:>15,.0f}")
    else:
        print(f"  SALDO A FAVOR           : $ {abs(saldo):>15,.0f}")
    print(sep)

    total_ignorados = resumen["docs_ignorados_emitidos"] + resumen["docs_ignorados_recibidos"]
    if total_ignorados > 0:
        print(f"\n  INFO: {resumen['docs_ignorados_emitidos']} docs ignorados en emitidos")
        print(f"        {resumen['docs_ignorados_recibidos']} docs ignorados en recibidos")
        print(f"        (nomina, doc soporte, application response, peajes)")

    if resumen["docs_desconocidos"]:
        print(f"\n  ATENCION - Documentos no reconocidos (revisar manualmente):")
        for d in resumen["docs_desconocidos"]:
            print(f"    -> {d}")

def guardar_resultado(cliente, fecha_inicio, fecha_fin, iva_generado, iva_descontable, saldo, resumen):
    if not os.path.exists("resultados"):
        os.makedirs("resultados")
    fi = fecha_inicio.replace("/", "")
    ff = fecha_fin.replace("/", "")
    nombre = f"resultados/{cliente['nombre'].replace(' ', '_')}_{fi}_al_{ff}.txt"
    with open(nombre, "w", encoding="utf-8") as f:
        f.write("RESULTADO METODO MARIN\n")
        f.write(f"Cliente  : {cliente['nombre']}\n")
        f.write(f"Periodo  : {fecha_inicio} al {fecha_fin}\n")
        f.write(f"Generado : {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write("-"*50 + "\n")
        f.write(f"IVA Facturas venta       : $ {resumen['facturas_venta']:>15,.0f}\n")
        f.write(f"IVA Notas debito venta   : $ {resumen['notas_debito_venta']:>15,.0f}\n")
        f.write(f"IVA Notas credito venta  : $ {resumen['notas_credito_venta']:>15,.0f}\n")
        f.write(f"IVA GENERADO NETO        : $ {iva_generado:>15,.0f}\n")
        f.write("-"*50 + "\n")
        f.write(f"IVA Facturas compra      : $ {resumen['facturas_compra']:>15,.0f}\n")
        f.write(f"IVA Notas debito compra  : $ {resumen['notas_debito_compra']:>15,.0f}\n")
        f.write(f"IVA Notas credito compra : $ {resumen['notas_credito_compra']:>15,.0f}\n")
        f.write(f"IVA DESCONTABLE NETO     : $ {iva_descontable:>15,.0f}\n")
        f.write("="*50 + "\n")
        if saldo > 0:
            f.write(f"IVA A PAGAR              : $ {saldo:>15,.0f}\n")
        else:
            f.write(f"SALDO A FAVOR            : $ {abs(saldo):>15,.0f}\n")
    print(f"\n  Resultado guardado en: {nombre}")

def main():
    clientes = cargar_clientes()
    cliente  = seleccionar_cliente(clientes)
    fecha_inicio, fecha_fin = solicitar_fechas()

    driver = iniciar_navegador()
    try:
        driver = ingresar_portal_dian(driver, cliente)
        archivo_emitidos  = descargar_reporte(driver, "EMITIDOS",  fecha_inicio, fecha_fin)
        archivo_recibidos = descargar_reporte(driver, "RECIBIDOS", fecha_inicio, fecha_fin)
    finally:
        driver.quit()

    df_emitidos  = procesar_excel(archivo_emitidos,  "EMITIDOS")
    df_recibidos = procesar_excel(archivo_recibidos, "RECIBIDOS")

    iva_generado, iva_descontable, saldo, resumen = calcular_iva(df_emitidos, df_recibidos)

    imprimir_resultado(cliente, fecha_inicio, fecha_fin, iva_generado, iva_descontable, saldo, resumen)
    guardar_resultado(cliente, fecha_inicio, fecha_fin, iva_generado, iva_descontable, saldo, resumen)

    print("\nAgente finalizado correctamente.")

if __name__ == "__main__":
    main()