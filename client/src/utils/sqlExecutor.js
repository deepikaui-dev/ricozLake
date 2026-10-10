/**
 * Lightweight SQL & Natural Language Query execution engine for RicozLake.
 * Supports:
 * - Both Standard SQL (SELECT, WHERE, LIMIT, ORDER BY)
 * - Basic English / Natural Language queries (e.g. "show first 25 rows", "get 10 records", "find where company is Tech")
 */
export function translateEnglishToSql(inputStr, defaultTarget = 'table') {
  if (!inputStr || typeof inputStr !== 'string') return `SELECT * FROM ${defaultTarget};`;
  const str = inputStr.trim();

  // If already starts with a SQL verb, return as-is
  if (/^(SELECT|WITH|SHOW|EXPLAIN|UPDATE|DELETE|INSERT)\b/i.test(str)) {
    return str;
  }

  // Parse English Intent
  let sql = `SELECT * FROM ${defaultTarget}`;
  const lower = str.toLowerCase();

  // 1. Extract Limit numbers (e.g. "first 25", "top 10", "25 rows", "limit 15")
  const limitMatch = lower.match(/(?:first|top|limit|get|show)\s+(\d+)|(\d+)\s+(?:rows|records|items)/i);
  let limitNum = null;
  if (limitMatch) {
    limitNum = parseInt(limitMatch[1] || limitMatch[2], 10);
  }

  // 2. Extract WHERE conditions (e.g. "where status is active", "where company is Tech")
  const whereMatch = str.match(/where\s+([a-zA-Z0-9_]+)\s+(?:is|=|\bcontains\b|\blike\b)\s*['"]?([^'"\n\r;]+)['"]?/i);
  if (whereMatch) {
    const col = whereMatch[1];
    const val = whereMatch[2].trim();
    if (val.toLowerCase() === 'null') {
      sql += ` WHERE ${col} IS NULL`;
    } else {
      sql += ` WHERE ${col} LIKE '${val}'`;
    }
  } else {
    // Search keyword fallback if user wrote "find Tech" or "search Tech"
    const searchMatch = str.match(/(?:find|search|where)\s+['"]?([a-zA-Z0-9_@.\s]+)['"]?/i);
    if (searchMatch && !whereMatch && !/first|top|rows|records/i.test(searchMatch[1])) {
      const keyword = searchMatch[1].trim();
      sql += ` WHERE name LIKE '${keyword}'`;
    }
  }

  // 3. Append LIMIT if specified
  if (limitNum && !isNaN(limitNum)) {
    sql += ` LIMIT ${limitNum}`;
  }

  return sql + ';';
}

export function executeSqlOnDataset(sqlString, rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];
  if (!sqlString || typeof sqlString !== 'string') return rawRows;

  // Pre-translate Plain English into SQL if needed
  const normalizedSql = translateEnglishToSql(sqlString);

  let dataset = rawRows.map(row => ({ ...row }));
  const sql = normalizedSql.trim();

  // 1. Evaluate WHERE clause
  const whereMatch = sql.match(/WHERE\s+([^;\n\r]+?)(?:\s+ORDER\s+BY|\s+LIMIT|;|$)/i);
  if (whereMatch) {
    const condition = whereMatch[1].trim();
    const isNullMatch = condition.match(/([a-zA-Z0-9_]+)\s+IS\s+NULL/i);
    const isNotNullMatch = condition.match(/([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL/i);
    const eqMatch = condition.match(/([a-zA-Z0-9_]+)\s*(=|>|<|>=|<=|LIKE)\s*['"]?([^'"]+)['"]?/i);

    if (isNullMatch) {
      const col = isNullMatch[1];
      dataset = dataset.filter(row => row[col] === null || row[col] === undefined || row[col] === '');
    } else if (isNotNullMatch) {
      const col = isNotNullMatch[1];
      dataset = dataset.filter(row => row[col] !== null && row[col] !== undefined && row[col] !== '');
    } else if (eqMatch) {
      const col = eqMatch[1];
      const op = eqMatch[2].toUpperCase();
      const val = eqMatch[3].trim();

      dataset = dataset.filter(row => {
        // If exact column match or check all values
        const rowVal = row[col];
        if (rowVal !== undefined && rowVal !== null) {
          const rowStr = String(rowVal).toLowerCase();
          const searchVal = val.toLowerCase();

          if (op === '=') return rowStr === searchVal;
          if (op === 'LIKE') return rowStr.includes(searchVal.replace(/%/g, ''));
          if (op === '>') return parseFloat(rowVal) > parseFloat(val);
          if (op === '<') return parseFloat(rowVal) < parseFloat(val);
          if (op === '>=') return parseFloat(rowVal) >= parseFloat(val);
          if (op === '<=') return parseFloat(rowVal) <= parseFloat(val);
        }

        // Generic text search across all columns
        const searchVal = val.toLowerCase();
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(searchVal));
      });
    }
  }

  // 2. Evaluate ORDER BY clause
  const orderByMatch = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
  if (orderByMatch) {
    const col = orderByMatch[1];
    const dir = (orderByMatch[2] || 'ASC').toUpperCase();
    dataset.sort((a, b) => {
      const valA = a[col] !== undefined && a[col] !== null ? a[col] : '';
      const valB = b[col] !== undefined && b[col] !== null ? b[col] : '';
      if (valA < valB) return dir === 'ASC' ? -1 : 1;
      if (valA > valB) return dir === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  // 3. Evaluate LIMIT clause
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    const limitNum = parseInt(limitMatch[1], 10);
    if (!isNaN(limitNum) && limitNum >= 0) {
      dataset = dataset.slice(0, limitNum);
    }
  }

  // 4. Evaluate SELECT column projection
  const selectMatch = sql.match(/^SELECT\s+(.+?)\s+FROM/i);
  if (selectMatch) {
    const colsStr = selectMatch[1].trim();
    if (colsStr !== '*') {
      const selectedCols = colsStr.split(',').map(c => c.trim().replace(/['"]/g, ''));
      dataset = dataset.map(row => {
        const newRow = {};
        selectedCols.forEach(c => {
          if (c in row) {
            newRow[c] = row[c];
          } else {
            newRow[c] = null;
          }
        });
        return newRow;
      });
    }
  }

  return dataset;
}
