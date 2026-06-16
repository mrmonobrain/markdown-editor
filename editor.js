(function () {
  'use strict';

  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const previewPane = document.getElementById('preview-pane');
  const editorContainer = document.querySelector('.editor-container');
  const filenameEl = document.getElementById('filename');
  const modifiedEl = document.getElementById('modified-indicator');
  const btnOpen = document.getElementById('btn-open');
  const btnSave = document.getElementById('btn-save');
  const btnDownload = document.getElementById('btn-download');
  const btnPdf = document.getElementById('btn-pdf');
  const btnTogglePreview = document.getElementById('btn-toggle-preview');
  const fileInput = document.getElementById('file-input');
  const browserNotice = document.getElementById('browser-notice');
  const dismissNotice = document.getElementById('dismiss-notice');

  let fileHandle = null;
  let currentFilename = 'Neue Datei.md';
  let isModified = false;
  let savedContent = '';
  const hasFileSystemAccess = 'showOpenFilePicker' in window;

  // --- Markdown rendering ---

  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  function renderPreview() {
    if (!editorContainer.classList.contains('split-view')) return;
    preview.innerHTML = marked.parse(editor.value);
  }

  let renderTimeout;
  function debouncedRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderPreview, 120);
  }

  // --- Modified state ---

  function setModified(val) {
    isModified = val;
    modifiedEl.classList.toggle('hidden', !val);
  }

  function setFilename(name) {
    currentFilename = name;
    filenameEl.textContent = name;
    document.title = name + ' — Markdown Editor';
  }

  // --- File System Access API ---

  async function openFile() {
    if (hasFileSystemAccess) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Markdown',
            accept: { 'text/markdown': ['.md', '.markdown', '.mdx', '.txt'] },
          }],
        });
        fileHandle = handle;
        const file = await handle.getFile();
        const text = await file.text();
        editor.value = text;
        savedContent = text;
        setFilename(file.name);
        setModified(false);
        renderPreview();
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    } else {
      fileInput.click();
    }
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.value = reader.result;
      savedContent = reader.result;
      setFilename(file.name);
      setModified(false);
      renderPreview();
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  async function saveFile() {
    if (hasFileSystemAccess && fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(editor.value);
        await writable.close();
        savedContent = editor.value;
        setModified(false);
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    } else if (hasFileSystemAccess && !fileHandle) {
      await saveFileAs();
    } else {
      downloadFile();
    }
  }

  async function saveFileAs() {
    if (hasFileSystemAccess) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: currentFilename,
          types: [{
            description: 'Markdown',
            accept: { 'text/markdown': ['.md'] },
          }],
        });
        fileHandle = handle;
        setFilename(handle.name);
        const writable = await handle.createWritable();
        await writable.write(editor.value);
        await writable.close();
        savedContent = editor.value;
        setModified(false);
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    }
  }

  // --- PDF Export ---

  function exportPdf() {
    const content = marked.parse(editor.value);
    const title = currentFilename.replace(/\.(md|markdown|txt|mdx)$/i, '');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@font-face {
  font-family: 'Euclid Circular A';
  src: url('${location.href.replace(/[^/]*$/, '')}fonts/EuclidCircularA-Regular.otf') format('opentype');
  font-weight: 400;
}
@font-face {
  font-family: 'Euclid Circular A';
  src: url('${location.href.replace(/[^/]*$/, '')}fonts/EuclidCircularA-Medium.otf') format('opentype');
  font-weight: 500;
}
@font-face {
  font-family: 'Euclid Circular A';
  src: url('${location.href.replace(/[^/]*$/, '')}fonts/EuclidCircularA-Semibold.otf') format('opentype');
  font-weight: 600;
}
@font-face {
  font-family: 'Euclid Circular A';
  src: url('${location.href.replace(/[^/]*$/, '')}fonts/EuclidCircularA-Bold.otf') format('opentype');
  font-weight: 700;
}
@page {
  size: A4;
  margin: 25mm 20mm 25mm 20mm;
}
body {
  font-family: 'Euclid Circular A', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: #212529;
  -webkit-font-smoothing: antialiased;
  max-width: 100%;
}
h1 { font-size: 22pt; font-weight: 600; margin: 0.8em 0 0.4em; padding-bottom: 0.3em; border-bottom: 1px solid #dee2e6; letter-spacing: -0.02em; }
h2 { font-size: 16pt; font-weight: 600; margin: 0.8em 0 0.3em; padding-bottom: 0.2em; border-bottom: 1px solid #f1f3f5; letter-spacing: -0.015em; }
h3 { font-size: 13pt; font-weight: 600; margin: 0.7em 0 0.3em; }
h4, h5, h6 { font-weight: 600; margin: 0.6em 0 0.3em; }
p { margin: 0.5em 0; }
strong { font-weight: 600; }
a { color: #1971c2; text-decoration: none; }
ul, ol { padding-left: 1.5em; margin: 0.4em 0; }
li { margin: 0.2em 0; }
blockquote { padding: 8px 16px; margin: 0.6em 0; border-left: 3px solid #228be6; background: #f0f7ff; border-radius: 0 4px 4px 0; }
blockquote p { margin: 0.2em 0; }
code { font-family: 'SF Mono', 'Menlo', 'Consolas', monospace; font-size: 0.9em; padding: 1px 5px; background: #f1f3f5; border: 1px solid #dee2e6; border-radius: 3px; }
pre { padding: 14px; margin: 0.6em 0; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; overflow-x: auto; }
pre code { padding: 0; background: none; border: none; font-size: 9pt; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; margin: 0.6em 0; font-size: 10pt; }
th, td { padding: 7px 12px; text-align: left; border: 1px solid #dee2e6; }
th { background: #f8f9fa; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.03em; color: #495057; }
hr { border: none; height: 1px; background: #dee2e6; margin: 1.5em 0; }
img { max-width: 100%; }
input[type="checkbox"] { margin-right: 6px; }
</style>
</head>
<body>${content}</body>
</html>`);
    printWindow.document.close();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 300);
  }

  function downloadFile() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
    savedContent = editor.value;
    setModified(false);
  }

  // --- Preview toggle ---

  function togglePreview() {
    editorContainer.classList.toggle('split-view');
    const isOn = editorContainer.classList.contains('split-view');
    btnTogglePreview.classList.toggle('preview-active', isOn);
    if (isOn) renderPreview();
  }

  // --- Toolbar formatting ---

  function wrapSelection(before, after) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selected = text.slice(start, end);
    const replacement = before + (selected || 'Text') + (after || before);
    editor.value = text.slice(0, start) + replacement + text.slice(end);
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + (selected.length || 4);
    editor.focus();
    handleInput();
  }

  function prefixLines(prefix) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? text.length : lineEnd;
    const lines = text.slice(lineStart, actualEnd).split('\n');
    const prefixed = lines.map((line, i) => {
      if (prefix === 'ol') return `${i + 1}. ${line}`;
      if (prefix === 'checklist') return `- [ ] ${line}`;
      return prefix + line;
    }).join('\n');
    editor.value = text.slice(0, lineStart) + prefixed + text.slice(actualEnd);
    editor.focus();
    handleInput();
  }

  const formatActions = {
    bold: () => wrapSelection('**'),
    italic: () => wrapSelection('*'),
    strikethrough: () => wrapSelection('~~'),
    h1: () => prefixLines('# '),
    h2: () => prefixLines('## '),
    h3: () => prefixLines('### '),
    ul: () => prefixLines('- '),
    ol: () => prefixLines('ol'),
    checklist: () => prefixLines('checklist'),
    quote: () => prefixLines('> '),
    code: () => wrapSelection('`'),
    codeblock: () => wrapSelection('```\n', '\n```'),
    link: () => {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const selected = editor.value.slice(start, end);
      const text = selected || 'Link-Text';
      const replacement = `[${text}](url)`;
      editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
      const urlStart = start + text.length + 3;
      editor.selectionStart = urlStart;
      editor.selectionEnd = urlStart + 3;
      editor.focus();
      handleInput();
    },
    image: () => {
      const start = editor.selectionStart;
      const replacement = '![Alt-Text](bild-url)';
      editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = start + 12;
      editor.selectionEnd = start + 20;
      editor.focus();
      handleInput();
    },
    hr: () => {
      const start = editor.selectionStart;
      const text = editor.value;
      const before = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
      const insertion = before + '\n---\n\n';
      editor.value = text.slice(0, start) + insertion + text.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = start + insertion.length;
      editor.focus();
      handleInput();
    },
    table: () => openTableEditor(),
  };

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (formatActions[action]) formatActions[action]();
    });
  });

  // --- Table Editor ---

  const tableModal = document.getElementById('table-editor-modal');
  const tableGrid = document.getElementById('table-grid');
  const tableAlignCtrl = document.getElementById('table-alignment-controls');
  let tableData = { headers: [], rows: [], alignments: [] };

  function openTableEditor(existingTable) {
    if (existingTable) {
      tableData = parseMarkdownTable(existingTable);
    } else {
      tableData = {
        headers: ['Spalte 1', 'Spalte 2', 'Spalte 3'],
        rows: [['', '', ''], ['', '', '']],
        alignments: ['left', 'left', 'left'],
      };
    }
    renderTableGrid();
    tableModal.classList.remove('hidden');
  }

  function parseMarkdownTable(text) {
    const lines = text.trim().split('\n').filter((l) => l.trim());
    if (lines.length < 2) return { headers: ['Spalte 1'], rows: [['']], alignments: ['left'] };
    const parseRow = (line) => line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
    const headers = parseRow(lines[0]);
    const sepLine = lines[1];
    const alignments = parseRow(sepLine).map((cell) => {
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
      if (cell.endsWith(':')) return 'right';
      return 'left';
    });
    const rows = lines.slice(2).map(parseRow);
    const cols = headers.length;
    rows.forEach((row) => { while (row.length < cols) row.push(''); });
    while (alignments.length < cols) alignments.push('left');
    return { headers, rows, alignments };
  }

  function renderTableGrid() {
    const cols = tableData.headers.length;
    let html = '<table><thead><tr>';
    tableData.headers.forEach((h, ci) => {
      html += `<th><input type="text" value="${escapeAttr(h)}" data-type="header" data-col="${ci}"></th>`;
    });
    html += '</tr></thead><tbody>';
    tableData.rows.forEach((row, ri) => {
      html += '<tr>';
      for (let ci = 0; ci < cols; ci++) {
        const val = row[ci] || '';
        html += `<td><input type="text" value="${escapeAttr(val)}" data-type="cell" data-row="${ri}" data-col="${ci}"></td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
    tableGrid.innerHTML = html;

    tableGrid.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        const type = inp.dataset.type;
        const col = parseInt(inp.dataset.col);
        if (type === 'header') {
          tableData.headers[col] = inp.value;
        } else {
          tableData.rows[parseInt(inp.dataset.row)][col] = inp.value;
        }
      });
    });

    renderAlignmentControls();
  }

  function renderAlignmentControls() {
    tableAlignCtrl.innerHTML = '';
    tableData.alignments.forEach((align, i) => {
      const group = document.createElement('div');
      group.className = 'align-group';
      group.innerHTML = `<span>${i + 1}:</span><select data-col="${i}">
        <option value="left" ${align === 'left' ? 'selected' : ''}>Links</option>
        <option value="center" ${align === 'center' ? 'selected' : ''}>Mitte</option>
        <option value="right" ${align === 'right' ? 'selected' : ''}>Rechts</option>
      </select>`;
      group.querySelector('select').addEventListener('change', (e) => {
        tableData.alignments[i] = e.target.value;
      });
      tableAlignCtrl.appendChild(group);
    });
  }

  function generateMarkdownTable() {
    const cols = tableData.headers.length;
    const padCell = (str, width) => {
      const s = str || '';
      return s + ' '.repeat(Math.max(0, width - s.length));
    };

    const colWidths = [];
    for (let c = 0; c < cols; c++) {
      let max = tableData.headers[c].length;
      tableData.rows.forEach((row) => { max = Math.max(max, (row[c] || '').length); });
      colWidths.push(Math.max(max, 3));
    }

    const headerLine = '| ' + tableData.headers.map((h, i) => padCell(h, colWidths[i])).join(' | ') + ' |';
    const sepLine = '| ' + tableData.alignments.map((align, i) => {
      const w = colWidths[i];
      if (align === 'center') return ':' + '-'.repeat(w - 2) + ':';
      if (align === 'right') return '-'.repeat(w - 1) + ':';
      return '-'.repeat(w);
    }).join(' | ') + ' |';
    const dataLines = tableData.rows.map((row) =>
      '| ' + row.map((cell, i) => padCell(cell || '', colWidths[i])).join(' | ') + ' |'
    );
    return [headerLine, sepLine, ...dataLines].join('\n');
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  document.getElementById('table-add-row').addEventListener('click', () => {
    tableData.rows.push(new Array(tableData.headers.length).fill(''));
    renderTableGrid();
  });

  document.getElementById('table-add-col').addEventListener('click', () => {
    tableData.headers.push(`Spalte ${tableData.headers.length + 1}`);
    tableData.alignments.push('left');
    tableData.rows.forEach((row) => row.push(''));
    renderTableGrid();
  });

  document.getElementById('table-del-row').addEventListener('click', () => {
    if (tableData.rows.length > 1) {
      tableData.rows.pop();
      renderTableGrid();
    }
  });

  document.getElementById('table-del-col').addEventListener('click', () => {
    if (tableData.headers.length > 1) {
      tableData.headers.pop();
      tableData.alignments.pop();
      tableData.rows.forEach((row) => row.pop());
      renderTableGrid();
    }
  });

  document.getElementById('table-insert').addEventListener('click', () => {
    const md = generateMarkdownTable();
    const start = editor.selectionStart;
    const text = editor.value;
    const before = start > 0 && text[start - 1] !== '\n' ? '\n\n' : '\n';
    editor.value = text.slice(0, start) + before + md + '\n' + text.slice(editor.selectionEnd);
    tableModal.classList.add('hidden');
    editor.focus();
    handleInput();
  });

  document.getElementById('table-cancel').addEventListener('click', () => {
    tableModal.classList.add('hidden');
  });

  document.getElementById('table-modal-close').addEventListener('click', () => {
    tableModal.classList.add('hidden');
  });

  document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    tableModal.classList.add('hidden');
  });

  // --- Detect existing table under cursor for editing ---

  function getTableAtCursor() {
    const pos = editor.selectionStart;
    const text = editor.value;
    const lines = text.split('\n');
    let charCount = 0;
    let cursorLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= pos) { cursorLine = i; break; }
      charCount += lines[i].length + 1;
    }
    if (!lines[cursorLine].trim().startsWith('|')) return null;
    let startLine = cursorLine;
    while (startLine > 0 && lines[startLine - 1].trim().startsWith('|')) startLine--;
    let endLine = cursorLine;
    while (endLine < lines.length - 1 && lines[endLine + 1].trim().startsWith('|')) endLine++;
    if (endLine - startLine < 1) return null;
    const tableLines = lines.slice(startLine, endLine + 1);
    return {
      text: tableLines.join('\n'),
      startLine,
      endLine,
      startOffset: lines.slice(0, startLine).join('\n').length + (startLine > 0 ? 1 : 0),
      endOffset: lines.slice(0, endLine + 1).join('\n').length,
    };
  }

  // --- Double-click on table to edit ---
  editor.addEventListener('dblclick', () => {
    const table = getTableAtCursor();
    if (table) {
      openTableEditor(table.text);
      document.getElementById('table-insert').onclick = () => {
        const md = generateMarkdownTable();
        editor.value = editor.value.slice(0, table.startOffset) + md + editor.value.slice(table.endOffset);
        tableModal.classList.add('hidden');
        editor.focus();
        handleInput();
      };
    }
  });

  // --- Input handling ---

  function handleInput() {
    debouncedRender();
    if (editor.value !== savedContent) {
      setModified(true);
    } else {
      setModified(false);
    }
  }

  editor.addEventListener('input', handleInput);

  // --- Smart Paste (Word/HTML → Markdown) ---

  function htmlToMarkdown(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    function getAlign(el) {
      const style = el.getAttribute('style') || '';
      const align = el.getAttribute('align') || '';
      if (/text-align:\s*center/i.test(style) || align === 'center') return 'center';
      if (/text-align:\s*right/i.test(style) || align === 'right') return 'right';
      return 'left';
    }

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.replace(/\r?\n/g, ' ');
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName.toLowerCase();
      const children = () => Array.from(node.childNodes).map(processNode).join('');
      const inner = children().trim();

      switch (tag) {
        case 'h1': return `\n# ${inner}\n\n`;
        case 'h2': return `\n## ${inner}\n\n`;
        case 'h3': return `\n### ${inner}\n\n`;
        case 'h4': return `\n#### ${inner}\n\n`;
        case 'h5': return `\n##### ${inner}\n\n`;
        case 'h6': return `\n###### ${inner}\n\n`;
        case 'p': case 'div': return inner ? `\n${inner}\n\n` : '\n';
        case 'br': return '\n';
        case 'strong': case 'b': return inner ? `**${inner}**` : '';
        case 'em': case 'i': return inner ? `*${inner}*` : '';
        case 'u': return inner;
        case 's': case 'strike': case 'del': return inner ? `~~${inner}~~` : '';
        case 'a': {
          const href = node.getAttribute('href') || '';
          return href && inner ? `[${inner}](${href})` : inner;
        }
        case 'img': {
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || 'Bild';
          return src ? `![${alt}](${src})` : '';
        }
        case 'ul': {
          const items = Array.from(node.querySelectorAll(':scope > li'));
          return '\n' + items.map((li) => `- ${processNode(li).trim()}`).join('\n') + '\n\n';
        }
        case 'ol': {
          const items = Array.from(node.querySelectorAll(':scope > li'));
          return '\n' + items.map((li, i) => `${i + 1}. ${processNode(li).trim()}`).join('\n') + '\n\n';
        }
        case 'li': return children();
        case 'blockquote': return `\n> ${inner.replace(/\n/g, '\n> ')}\n\n`;
        case 'code': return `\`${inner}\``;
        case 'pre': return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
        case 'hr': return '\n---\n\n';
        case 'table': {
          const rows = Array.from(node.querySelectorAll('tr'));
          if (rows.length === 0) return '';
          const matrix = rows.map((row) =>
            Array.from(row.querySelectorAll('th, td')).map((cell) => processNode(cell).trim())
          );
          const isHeader = rows[0].querySelector('th') !== null;
          const cols = Math.max(...matrix.map((r) => r.length));
          matrix.forEach((r) => { while (r.length < cols) r.push(''); });
          const aligns = isHeader
            ? Array.from(rows[0].querySelectorAll('th, td')).map(getAlign)
            : new Array(cols).fill('left');
          while (aligns.length < cols) aligns.push('left');
          const widths = [];
          for (let c = 0; c < cols; c++) {
            widths.push(Math.max(3, ...matrix.map((r) => (r[c] || '').length)));
          }
          const pad = (s, w) => s + ' '.repeat(Math.max(0, w - s.length));
          const sepCell = (align, w) => {
            if (align === 'center') return ':' + '-'.repeat(w - 2) + ':';
            if (align === 'right') return '-'.repeat(w - 1) + ':';
            return '-'.repeat(w);
          };
          const headerRow = isHeader ? 0 : -1;
          let md = '';
          if (isHeader) {
            md += '| ' + matrix[0].map((c, i) => pad(c, widths[i])).join(' | ') + ' |\n';
          } else {
            md += '| ' + new Array(cols).fill('').map((_, i) => pad('', widths[i])).join(' | ') + ' |\n';
          }
          md += '| ' + aligns.map((a, i) => sepCell(a, widths[i])).join(' | ') + ' |\n';
          const dataRows = isHeader ? matrix.slice(1) : matrix;
          dataRows.forEach((row) => {
            md += '| ' + row.map((c, i) => pad(c, widths[i])).join(' | ') + ' |\n';
          });
          return '\n' + md + '\n';
        }
        case 'tr': case 'td': case 'th': case 'thead': case 'tbody': case 'tfoot':
          return children();
        case 'span': {
          const style = node.getAttribute('style') || '';
          let result = children();
          if (/font-weight:\s*(bold|[7-9]00)/i.test(style)) result = `**${result}**`;
          if (/font-style:\s*italic/i.test(style)) result = `*${result}*`;
          if (/text-decoration[^:]*:\s*line-through/i.test(style)) result = `~~${result}~~`;
          return result;
        }
        default: return children();
      }
    }

    let result = processNode(doc.body);
    result = result.replace(/\n{3,}/g, '\n\n').trim();
    return result;
  }

  function isRichContent(html) {
    if (!html) return false;
    return /<(p|h[1-6]|table|ul|ol|strong|em|b|i|div|span)\b/i.test(html);
  }

  editor.addEventListener('paste', (e) => {
    const html = e.clipboardData.getData('text/html');
    if (!isRichContent(html)) return;
    e.preventDefault();
    const md = htmlToMarkdown(html);
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + md + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + md.length;
    handleInput();
  });

  // --- Tab key support ---

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      handleInput();
    }
  });

  // --- Keyboard shortcuts ---

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'o') {
      e.preventDefault();
      openFile();
    } else if (mod && e.key === 's') {
      e.preventDefault();
      saveFile();
    } else if (mod && e.key === 'b') {
      e.preventDefault();
      formatActions.bold();
    } else if (mod && e.key === 'i') {
      e.preventDefault();
      formatActions.italic();
    } else if (mod && e.key === 'k') {
      e.preventDefault();
      formatActions.link();
    } else if (mod && e.key === 'p') {
      e.preventDefault();
      exportPdf();
    }
  });

  // --- Event bindings ---

  btnOpen.addEventListener('click', openFile);
  btnSave.addEventListener('click', saveFile);
  btnDownload.addEventListener('click', downloadFile);
  btnPdf.addEventListener('click', exportPdf);
  btnTogglePreview.addEventListener('click', togglePreview);

  dismissNotice?.addEventListener('click', () => {
    browserNotice.classList.add('hidden');
  });

  // --- Browser compatibility notice ---

  if (!hasFileSystemAccess) {
    browserNotice.classList.remove('hidden');
  }

  // --- Sync scroll ---

  editor.addEventListener('scroll', () => {
    if (!editorContainer.classList.contains('split-view')) return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    previewPane.scrollTop = ratio * (previewPane.scrollHeight - previewPane.clientHeight);
  });

  // --- Warn before unload ---

  window.addEventListener('beforeunload', (e) => {
    if (isModified) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // --- Drag & Drop ---

  const dropOverlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  function isMarkdownFile(file) {
    const name = file.name.toLowerCase();
    return /\.(md|markdown|mdx|txt)$/.test(name) || file.type === 'text/markdown' || file.type === 'text/plain';
  }

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) dropOverlay.classList.remove('hidden');
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) dropOverlay.classList.add('hidden');
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.add('hidden');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!isMarkdownFile(file)) {
      alert('Bitte eine Markdown-Datei (.md, .markdown, .txt) ablegen.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      editor.value = reader.result;
      savedContent = reader.result;
      fileHandle = null;
      setFilename(file.name);
      setModified(false);
      renderPreview();
    };
    reader.readAsText(file);
  });

  // --- Legal pages ---

  const legalModal = document.getElementById('legal-modal');
  const legalTitle = document.getElementById('legal-modal-title');
  const legalBody = document.getElementById('legal-modal-body');
  const legalClose = document.getElementById('legal-modal-close');

  const legalContent = {
    impressum: {
      title: 'Impressum',
      body: `## Angaben gemäss Schweizer Recht

**Betreiber**
Fabio Aresu
c/o Markenkern AG
Bahnhofstrasse 7
7000 Chur
Schweiz

**Kontakt**
E-Mail: fabio.aresu@markenkern.ch
Telefon: +41 81 322 98 88

## Haftungsausschluss

Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.

Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.

Der Autor behält es sich ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.

## Haftung für Links

Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene Gefahr des Nutzers.

## Urheberrechte

Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf der Website gehören ausschliesslich dem Betreiber oder den speziell genannten Rechtsinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.

## Anwendbares Recht

Es gilt Schweizer Recht. Gerichtsstand ist Chur, Schweiz.`,
    },
    datenschutz: {
      title: 'Datenschutzerklärung',
      body: `*Stand: Juni 2026*

## Verantwortliche Stelle

Fabio Aresu
c/o Markenkern AG
Bahnhofstrasse 7
7000 Chur, Schweiz
E-Mail: fabio.aresu@markenkern.ch

## Grundsatz

Der Schutz Ihrer Privatsphäre ist uns wichtig. Diese Datenschutzerklärung beschreibt, welche Daten beim Besuch dieser Website erhoben werden und wie wir damit umgehen.

## Datensparsamkeit

Diese Anwendung benötigt keine Registrierung und erhebt aktiv keine Namen, E-Mail-Adressen, Zahlungsdaten oder andere direkt personenbezogene Informationen. Es werden keine Analyse- oder Tracking-Tools eingesetzt.

## Datenverarbeitung im Browser

Sämtliche Inhalte, die Sie im Editor erstellen oder bearbeiten, werden ausschliesslich lokal in Ihrem Browser verarbeitet. Es findet keine Übermittlung Ihrer Dokumente an externe Server statt.

## Server-Logs

Der Hosting-Provider (Netlify Inc., USA) erfasst automatisch technisch notwendige Daten in sogenannten Server-Logs:

- IP-Adresse (anonymisiert)
- Datum und Uhrzeit des Zugriffs
- Angeforderte Seite/Datei
- Browser-Typ und -Version
- Betriebssystem

Diese Daten dienen ausschliesslich der Sicherstellung eines störungsfreien Betriebs und werden nicht mit anderen Datenquellen zusammengeführt.

## Cookies und Local Storage

Diese Anwendung verwendet keine Cookies. Technisch notwendige Daten (z.B. Nutzer-Einstellungen) können im Local Storage Ihres Browsers gespeichert werden. Diese Daten verlassen Ihren Browser nicht.

## Externe Ressourcen

Die Anwendung lädt die Bibliothek «marked.js» von einem Content Delivery Network (jsDelivr). Dabei kann der CDN-Betreiber technische Zugriffsdaten erfassen. Es werden keine personenbezogenen Daten übermittelt.

## Ihre Rechte

Sie haben jederzeit das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Da über die technischen Server-Logs hinaus keine personenbezogenen Daten gespeichert werden, ist der Umfang allfälliger Auskünfte entsprechend begrenzt.

Bei Fragen wenden Sie sich an: fabio.aresu@markenkern.ch

## Änderungen

Wir behalten uns vor, diese Datenschutzerklärung jederzeit anzupassen. Die aktuelle Version ist auf dieser Website einsehbar.

## Anwendbares Recht

Es gilt Schweizer Recht (DSG). Gerichtsstand ist Chur, Schweiz.`,
    },
    help: {
      title: 'Markdown Hilfe',
      body: `## Grundlagen

| Formatierung | Markdown | Ergebnis |
|---|---|---|
| Fett | \`**Text**\` | **Text** |
| Kursiv | \`*Text*\` | *Text* |
| Durchgestrichen | \`~~Text~~\` | ~~Text~~ |
| Code inline | \`\\\`Code\\\`\` | \`Code\` |
| Link | \`[Text](url)\` | [Text](url) |
| Bild | \`![Alt](url)\` | Bild-Einbettung |

## Überschriften

\`\`\`
# Überschrift 1
## Überschrift 2
### Überschrift 3
\`\`\`

## Listen

\`\`\`
- Aufzählung
- Weiterer Punkt

1. Nummeriert
2. Zweiter Punkt

- [ ] Aufgabe offen
- [x] Aufgabe erledigt
\`\`\`

## Querverweise innerhalb des Dokuments

Jede Überschrift wird automatisch zu einem Anker. Du kannst darauf verweisen:

\`\`\`
## Mein Abschnitt

Etwas Text hier...

## Anderer Abschnitt

Siehe [Mein Abschnitt](#mein-abschnitt) für Details.
\`\`\`

**Regeln für Anker-IDs:**
- Alles wird kleingeschrieben
- Leerzeichen werden zu Bindestrichen (\`-\`)
- Sonderzeichen werden entfernt
- Beispiel: \`## 3. Wichtige Punkte\` → \`#3-wichtige-punkte\`

## Bilder

Bilder werden in Markdown nur **verlinkt**, nicht eingebettet:

\`\`\`
![Beschreibung](https://example.com/bild.png)
\`\`\`

Die Bilder müssen extern gehostet sein (z.B. auf GitHub, Imgur oder einem eigenen Server). Der Editor speichert keine Bilddateien.

## Tabellen

\`\`\`
| Spalte 1 | Spalte 2 | Spalte 3 |
|----------|:--------:|---------:|
| Links    | Mitte    | Rechts   |
\`\`\`

**Tipp:** Nutze den visuellen Tabellen-Editor über den Tabellen-Button in der Toolbar. Bestehende Tabellen kannst du per Doppelklick bearbeiten.

## Code-Blöcke

\`\`\`
\\\`\\\`\\\`javascript
const greeting = 'Hallo Welt';
console.log(greeting);
\\\`\\\`\\\`
\`\`\`

## Blockquote

\`\`\`
> Dies ist ein Zitat.
> Es kann mehrzeilig sein.
\`\`\`

## Horizontale Linie

\`\`\`
---
\`\`\`

## Tastaturkürzel

| Kürzel | Aktion |
|--------|--------|
| Ctrl+O | Datei öffnen |
| Ctrl+S | Speichern |
| Ctrl+B | Fett |
| Ctrl+I | Kursiv |
| Ctrl+K | Link einfügen |
| Ctrl+P | PDF exportieren |

## Drag & Drop

Du kannst Markdown-Dateien (.md, .markdown, .txt) direkt in den Editor ziehen, um sie zu öffnen.`,
    },
    changelog: {
      title: 'Changelog',
      body: `## v1.2.0 — 16. Juni 2026

### Neu
- **Smart Paste:** Aus Word/Google Docs kopierte Inhalte werden automatisch in Markdown konvertiert (Überschriften, Fett/Kursiv, Listen, Tabellen, Links)

---

## v1.1.0 — 16. Juni 2026

### Neu
- **Drag & Drop:** Markdown-Dateien direkt in den Editor ziehen zum Öffnen
- **Hilfe-Seite:** Umfassende Markdown-Referenz mit Querverweisen, Bilder-Erklärung, Tastaturkürzeln und Tabellen-Tipps

---

## v1.0.0 — 16. Juni 2026

Erster Release des Markdown Editors.

### Features
- **Datei-Management:** Öffnen/Speichern via File System Access API (Chrome/Edge), Upload/Download-Fallback für andere Browser
- **Split-View:** Editor und Live-Preview nebeneinander, umschaltbar
- **Formatting-Toolbar:** Bold, Italic, Strikethrough, H1–H3, Listen (UL/OL/Checkliste), Blockquote, Code, Codeblock, Link, Bild, Horizontale Linie
- **Visueller Tabellen-Editor:** Zeilen/Spalten hinzufügen/entfernen, Ausrichtung pro Spalte, Doppelklick zum Bearbeiten bestehender Tabellen
- **PDF-Export:** Sauber formatiertes A4-Layout mit Euclid Circular A
- **Keyboard Shortcuts:** Ctrl+O, Ctrl+S, Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+P
- **Synchronized Scroll** zwischen Editor und Preview
- **Responsive Design:** Optimiertes Mobile-Layout mit scrollbarer Toolbar
- **Unsaved-Changes-Warnung** beim Schliessen des Tabs`,
    },
  };

  function openLegalModal(key) {
    const content = legalContent[key];
    if (!content) return;
    legalTitle.textContent = content.title;
    legalBody.innerHTML = marked.parse(content.body);
    legalModal.classList.remove('hidden');
  }

  document.getElementById('link-impressum').addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('impressum');
  });

  document.getElementById('link-datenschutz').addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('datenschutz');
  });

  document.getElementById('link-changelog').addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('changelog');
  });

  document.getElementById('link-help').addEventListener('click', (e) => {
    e.preventDefault();
    openLegalModal('help');
  });

  legalClose.addEventListener('click', () => {
    legalModal.classList.add('hidden');
  });

  legalModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    legalModal.classList.add('hidden');
  });

  // --- Init ---

  renderPreview();
  btnTogglePreview.classList.add('preview-active');
  editor.focus();
})();
