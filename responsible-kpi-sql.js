"use strict";

const KPI_OVERRIDE_FIELDS = [
  "indicator_title",
  "indicator_sub_title",
  "unit",
  "frequency",
  "target",
  "target_direction",
  "tolerance_type",
  "up_tolerance",
  "low_tolerance",
  "max",
  "min",
  "calculation_on",
  "target_auto_adjustment",
  "high_limit",
  "low_limit"
];

const RESPONSIBLE_KPI_OVERRIDE_FIELDS = KPI_OVERRIDE_FIELDS;
const PLANT_KPI_OVERRIDE_FIELDS = KPI_OVERRIDE_FIELDS;

const buildNullIfEmptyTextExpression = (alias, field) =>
  alias ? `NULLIF(BTRIM(${alias}.${field}::text), '')` : null;

const buildResolvedKpiFieldExpression = (
  field,
  kpiAlias = "k",
  responsibleKpiAlias = "rk",
  plantKpiAlias = null
) => {
  const expressions = [
    buildNullIfEmptyTextExpression(responsibleKpiAlias, field),
    buildNullIfEmptyTextExpression(plantKpiAlias, field),
    buildNullIfEmptyTextExpression(kpiAlias, field)
  ].filter(Boolean);

  return `COALESCE(
    ${expressions.join(",\n    ")}
  )`;
};

const buildResolvedKpiSelect = (
  kpiAlias = "k",
  responsibleKpiAlias = "rk",
  plantKpiAlias = null
) =>
  KPI_OVERRIDE_FIELDS
    .map(
      (field) =>
        `${buildResolvedKpiFieldExpression(field, kpiAlias, responsibleKpiAlias, plantKpiAlias)} AS ${field}`
    )
    .join(",\n                ");

const buildResolvedKpiSearchExpression = (
  field,
  kpiAlias = "k",
  responsibleKpiAlias = "rk",
  plantKpiAlias = null
) =>
  `COALESCE(${buildResolvedKpiFieldExpression(field, kpiAlias, responsibleKpiAlias, plantKpiAlias)}, '')`;

const buildResponsibleKpiJoin = (
  kpiAlias = "k",
  responsibleKpiAlias = "rk",
  responsibleIdExpression = "$1"
) => `
LEFT JOIN public.responsible_kpis ${responsibleKpiAlias}
       ON ${responsibleKpiAlias}.kpi_id = ${kpiAlias}.kpi_id
      AND ${responsibleKpiAlias}.responsible_id = ${responsibleIdExpression}
`;

const buildPlantKpiJoin = (
  kpiAlias = "k",
  plantKpiAlias = "pk",
  plantIdExpression = "$1"
) => `
LEFT JOIN public.plant_kpis ${plantKpiAlias}
       ON ${plantKpiAlias}.kpi_id = ${kpiAlias}.kpi_id
      AND ${plantKpiAlias}.plant_id = ${plantIdExpression}
`;

module.exports = {
  KPI_OVERRIDE_FIELDS,
  PLANT_KPI_OVERRIDE_FIELDS,
  RESPONSIBLE_KPI_OVERRIDE_FIELDS,
  buildResolvedKpiFieldExpression,
  buildResolvedKpiSelect,
  buildResolvedKpiSearchExpression,
  buildPlantKpiJoin,
  buildResponsibleKpiJoin
};
