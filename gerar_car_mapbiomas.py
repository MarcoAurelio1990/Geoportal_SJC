# gerar_car_mapbiomas.py
# Pré-processa estatísticas MapBiomas 2024 por imóvel CAR.
# Gera js/geodata_car_mapbiomas.js com lookup table para uso offline no Geoportal.
#
# Requer: OSGeo4W Python com osgeo (gdal/ogr) e numpy.
# Execute com: C:\OSGeo4W\apps\Python312\python.exe gerar_car_mapbiomas.py
#
# O GeoTIFF original NÃO é alterado.

import os, sys, json, math
import numpy as np
from osgeo import gdal, ogr, osr

gdal.UseExceptions()
ogr.UseExceptions()

ROOT      = os.path.dirname(os.path.abspath(__file__))
TIF_PATH  = os.path.join(ROOT, 'Raster', 'MapBiomas_2024.tif')
CAR_PATH  = os.path.join(ROOT, 'Vetor',  'Imoveis_Rurais_CAR.geojson')
OUT_JS    = os.path.join(ROOT, 'js',     'geodata_car_mapbiomas.js')

PIXEL_HA  = 0.00927  # área de 1 pixel MapBiomas em hectares (30 m × 30 m ~ 0,09 ha / 10 ≈ 0.00927 ha)

CLASS_NAMES = {
    3:  'Formação Florestal',
    9:  'Silvicultura',
    12: 'Formação Campestre',
    15: 'Pastagem',
    21: 'Mosaico de Usos',
    24: 'Área Urbana',
    25: 'Outras Áreas Não Vegetadas',
    31: 'Aquicultura',
    33: "Corpos d'Água",
    36: 'Área Urbanizada',
}

# ── Abrir raster de referência ────────────────────────────────────────────────
print('Abrindo raster:', TIF_PATH)
ds_src = gdal.Open(TIF_PATH, gdal.GA_ReadOnly)
if ds_src is None:
    sys.exit('ERRO: não foi possível abrir ' + TIF_PATH)

gt         = ds_src.GetGeoTransform()   # (x_min, px_w, 0, y_max, 0, -px_h)
rast_srs   = ds_src.GetSpatialRef()
rast_band  = ds_src.GetRasterBand(1)
nodata_val = rast_band.GetNoDataValue()
rast_w     = ds_src.RasterXSize
rast_h     = ds_src.RasterYSize

def world_to_pixel(x, y):
    """Converte coordenadas geográficas para índices de pixel (col, row)."""
    col = int((x - gt[0]) / gt[1])
    row = int((y - gt[3]) / gt[5])
    return col, row

# ── Abrir camada CAR ──────────────────────────────────────────────────────────
print('Abrindo camada CAR:', CAR_PATH)
ds_car = ogr.Open(CAR_PATH)
if ds_car is None:
    sys.exit('ERRO: não foi possível abrir ' + CAR_PATH)

lyr_car = ds_car.GetLayer(0)
car_srs = lyr_car.GetSpatialRef()

# Transformação de SRS (caso CAR não esteja em WGS84 como o raster)
transform = None
if rast_srs and car_srs and not car_srs.IsSame(rast_srs):
    transform = osr.CoordinateTransformation(car_srs, rast_srs)

total     = lyr_car.GetFeatureCount()
resultado = {}

print(f'Processando {total} imóveis CAR...')

for i, feat in enumerate(lyr_car):
    if (i + 1) % 50 == 0 or i == 0:
        print(f'  {i+1}/{total}...')

    props    = feat.GetFieldAsString
    cod      = feat.GetField('cod_imovel')
    if not cod:
        continue

    geom = feat.GetGeometryRef()
    if geom is None:
        continue

    geom = geom.Clone()
    if transform:
        geom.Transform(transform)

    # Bounding box do imóvel no espaço do raster
    env = geom.GetEnvelope()   # (x_min, x_max, y_min, y_max)
    col_min, row_min = world_to_pixel(env[0], env[3])
    col_max, row_max = world_to_pixel(env[1], env[2])

    # Clamp ao tamanho do raster
    col_min = max(col_min, 0);  row_min = max(row_min, 0)
    col_max = min(col_max + 1, rast_w - 1)
    row_max = min(row_max + 1, rast_h - 1)

    if col_max <= col_min or row_max <= row_min:
        continue

    win_w = col_max - col_min
    win_h = row_max - row_min

    # Ler janela de pixels
    arr = rast_band.ReadAsArray(col_min, row_min, win_w, win_h)
    if arr is None:
        continue

    # Criar máscara in-memory para o polígono
    mem_drv = gdal.GetDriverByName('MEM')
    mem_ds  = mem_drv.Create('', win_w, win_h, 1, gdal.GDT_Byte)
    sub_gt  = (
        gt[0] + col_min * gt[1],
        gt[1], 0,
        gt[3] + row_min * gt[5],
        0, gt[5]
    )
    mem_ds.SetGeoTransform(sub_gt)
    if rast_srs:
        mem_ds.SetSpatialRef(rast_srs)
    mem_ds.GetRasterBand(1).Fill(0)

    # Rasterizar o polígono na máscara
    vec_drv = ogr.GetDriverByName('Memory')
    vec_ds  = vec_drv.CreateDataSource('')
    vec_lyr = vec_ds.CreateLayer('', srs=rast_srs)
    vec_feat = ogr.Feature(vec_lyr.GetLayerDefn())
    vec_feat.SetGeometry(geom)
    vec_lyr.CreateFeature(vec_feat)

    gdal.RasterizeLayer(mem_ds, [1], vec_lyr, burn_values=[1])
    mem_ds.FlushCache()

    mask = mem_ds.GetRasterBand(1).ReadAsArray()

    # Contar pixels por classe dentro da máscara
    inside = arr[mask == 1]
    if nodata_val is not None:
        inside = inside[inside != int(nodata_val)]
    if inside.size == 0:
        continue

    unique, counts = np.unique(inside, return_counts=True)
    classes = {}
    for val, cnt in zip(unique.tolist(), counts.tolist()):
        if val in CLASS_NAMES:
            classes[str(val)] = int(cnt)

    if classes:
        resultado[cod] = classes

    # Liberar recursos da iteração
    mem_ds = None
    vec_ds = None

print(f'\nTotal imóveis com dados: {len(resultado)} de {total}')

# ── Gerar arquivo JS ──────────────────────────────────────────────────────────
lines = ['// geodata_car_mapbiomas.js — gerado automaticamente por gerar_car_mapbiomas.py',
         '// Contagem de pixels MapBiomas 2024 por imóvel CAR. NÃO EDITAR MANUALMENTE.',
         '// pixel_ha = ' + str(PIXEL_HA),
         'var CAR_MAPBIOMAS = ' + json.dumps(resultado, ensure_ascii=False, separators=(',', ':')) + ';']

with open(OUT_JS, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

sz = round(os.path.getsize(OUT_JS) / 1024, 1)
print(f'Gerado: {OUT_JS}  ({sz} KB)')
print('Concluído.')
