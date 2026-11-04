// Programa de inspecciones (Excel con diseño): equipos a inspeccionar en la semana y en el mes.
import ExcelJS from 'exceljs';
import { D } from '../state.js';
import {
  calcularControles,
  ordenarControles,
  equiposParaProgramar,
  HORIZONTE_SEMANA_DIAS,
  HORIZONTE_MES_DIAS,
  inicioDelDia,
  formatearISO,
} from '../core/estado.js';
import { CONTROLES_NOMBRE, FLOTAS, COLOR_ESTADO } from '../core/dominio.js';
import { formatearFecha } from './dom.js';

const AZUL = 'FF1E3A5F';
const BLANCO = 'FFFFFFFF';
const GRIS_TEXTO = 'FF5B6472';
const BORDE_SUAVE = 'FFE3E7ED';

const ENCABEZADOS = ['Código', 'Código 2', 'Descripción', 'Modelo', 'Flota', 'Ubicación', 'Control', 'Proveedor', 'Última', 'Próxima', 'Días', 'Estado'];
const ANCHOS = [12, 12, 30, 16, 14, 12, 22, 20, 12, 12, 8, 14];
const COL_DIAS = ENCABEZADOS.indexOf('Días') + 1;
const COL_ESTADO = ENCABEZADOS.indexOf('Estado') + 1;

function colorARGB(hex) {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

function filaDatos(r) {
  return [
    r.equipo.codigo,
    r.equipo.codigo2,
    r.equipo.descripcion,
    r.equipo.modelo,
    FLOTAS[r.equipo.flota] || r.equipo.flota,
    r.equipo.ubicacion,
    CONTROLES_NOMBRE[r.tipo],
    r.proveedor,
    formatearFecha(r.ultima),
    formatearFecha(r.proxima),
    r.dias ?? '',
    r.estado,
  ];
}

function construirHoja(libro, nombreHoja, subtitulo, filas) {
  const hoja = libro.addWorksheet(nombreHoja, { views: [{ state: 'frozen', ySplit: 4 }] });
  hoja.columns = ANCHOS.map((width) => ({ width }));

  hoja.mergeCells(1, 1, 1, ENCABEZADOS.length);
  const titulo = hoja.getCell(1, 1);
  titulo.value = 'CONEQUISA · Maquinaria Open Pit · Mina La Libertad';
  titulo.font = { bold: true, size: 14, color: { argb: BLANCO } };
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
  titulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  hoja.getRow(1).height = 28;

  hoja.mergeCells(2, 1, 2, ENCABEZADOS.length);
  const sub = hoja.getCell(2, 1);
  sub.value = subtitulo;
  sub.font = { bold: true, size: 12, color: { argb: AZUL } };
  sub.alignment = { vertical: 'middle', indent: 1 };
  hoja.getRow(2).height = 22;

  hoja.mergeCells(3, 1, 3, ENCABEZADOS.length);
  const pie = hoja.getCell(3, 1);
  pie.value = `Generado el ${formatearFecha(formatearISO(inicioDelDia()))} · ${filas.length} control(es)`;
  pie.font = { italic: true, size: 9, color: { argb: GRIS_TEXTO } };
  pie.alignment = { vertical: 'middle', indent: 1 };

  const filaEncabezados = hoja.getRow(4);
  filaEncabezados.values = ENCABEZADOS;
  filaEncabezados.height = 20;
  filaEncabezados.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: BLANCO } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    celda.alignment = { vertical: 'middle', horizontal: 'center' };
    celda.border = { bottom: { style: 'medium', color: { argb: AZUL } } };
  });

  filas.forEach((r) => {
    const fila = hoja.addRow(filaDatos(r));
    const color = COLOR_ESTADO[r.estado];
    fila.eachCell((celda, col) => {
      celda.alignment = { vertical: 'middle', horizontal: col === COL_DIAS ? 'right' : col === COL_ESTADO ? 'center' : 'left' };
      celda.border = { bottom: { style: 'thin', color: { argb: BORDE_SUAVE } } };
      if (col === COL_ESTADO) {
        celda.font = { bold: true, color: { argb: colorARGB(color.texto) } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorARGB(color.fondo) } };
      }
    });
  });

  hoja.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: ENCABEZADOS.length } };
  return hoja;
}

export async function generarProgramaInspecciones() {
  const rows = ordenarControles(calcularControles(D.equipos, D.inspecciones, D.config));
  const semana = ordenarControles(equiposParaProgramar(rows, HORIZONTE_SEMANA_DIAS));
  const mes = ordenarControles(equiposParaProgramar(rows, HORIZONTE_MES_DIAS));

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema de Inspecciones de Flota';
  libro.created = new Date();

  construirHoja(libro, 'Semana', `Programa de inspecciones — próximos ${HORIZONTE_SEMANA_DIAS} días (incluye vencidas y sin registro)`, semana);
  construirHoja(libro, 'Mes', `Programa de inspecciones — próximos ${HORIZONTE_MES_DIAS} días (incluye vencidas y sin registro)`, mes);

  const buffer = await libro.xlsx.writeBuffer();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = `programa_inspecciones_${formatearISO(inicioDelDia())}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
