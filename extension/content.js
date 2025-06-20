(function() {
    'use strict';

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }

    function initializeExtension() {
        console.log('Elastic Support Matrix Enhancer: Initializing...');
        
        // Add the enhancer button to the page
        addEnhancerButton();
    }

    function addEnhancerButton() {
        // Add notification badge, which is now the main button
        const badge = document.createElement('div');
        badge.id = 'elastic-enhancer-badge';
        badge.innerHTML = '✨ Click for searchable matrix view';
        badge.addEventListener('click', showEnhancedInterface);
        document.body.appendChild(badge);
    }

    function findProductTables() {
        const productTables = new Map(); // Use a map to avoid duplicate product names

        document.querySelectorAll('table').forEach(table => {
            const rows = table.querySelectorAll('tr');
            let productName = null;

            // Check a few data rows for the pattern
            for (let i = 1; i < Math.min(rows.length, 10); i++) { // Check up to 9 data rows
                const firstCell = rows[i].querySelector('td, th');
                if (firstCell) {
                    const cellText = firstCell.textContent.trim();
                    // Look for "ProductName version.x" pattern
                    const match = cellText.match(/^(.*?)\s+([\d\.]+[x\d\.]*)$/);

                    if (match && match[1] && match[2]) {
                        const potentialName = match[1].trim();
                        // A simple sanity check for the product name
                        if (potentialName.length > 2 && !potentialName.match(/^\d/)) {
                            productName = potentialName;
                            break; // Found a good candidate for the product name
                        }
                    }
                }
            }

            if (productName && !productTables.has(productName)) {
                productTables.set(productName, {
                    name: productName,
                    table: table
                });
            }
        });

        const result = Array.from(productTables.values());
        console.log(`Found ${result.length} product tables.`);
        return result;
    }

    function parseTableToStructuredData(table) {
        if (!table) return [];
        
        const data = [];
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length === 0) return data;
        
        console.log('Parsing table with', rows.length, 'rows');
        
        // Check if this is a transposed table (OS names in headers, versions in rows)
        const headerRow = rows[0];
        const headerCells = Array.from(headerRow.cells);
        
        console.log('Header cells:', headerCells.map(cell => cell.textContent.trim()));
        
        // Look for OS names in headers (this might be the case for Elastic Agent)
        const osNamesInHeaders = headerCells.slice(1).map(cell => cell.textContent.trim())
            .filter(text => {
                const lowerText = text.toLowerCase();
                return lowerText.includes('linux') || 
                       lowerText.includes('windows') || 
                       lowerText.includes('macos') || 
                       lowerText.includes('ubuntu') || 
                       lowerText.includes('debian') || 
                       lowerText.includes('centos') || 
                       lowerText.includes('rhel') || 
                       lowerText.includes('amazon') ||
                       lowerText.includes('suse') ||
                       lowerText.includes('oracle');
            });
        
        console.log('OS names found in headers:', osNamesInHeaders);
        
        if (osNamesInHeaders.length > 0) {
            // This is a transposed table - OS names are in headers
            return parseTransposedTable(table, headerCells, rows);
        } else {
            // Traditional table - OS names should be in first column
            return parseTraditionalTable(table, rows);
        }
    }

    function parseTransposedTable(table, headerCells, rows) {
        const data = [];
        
        console.log('Parsing transposed table with', headerCells.length, 'headers and', rows.length, 'rows');
        
        // Skip the first header cell (usually "Version" or empty)
        const osHeaders = headerCells.slice(1);
        
        // For each OS column, collect supported versions by checking for checkmarks
        osHeaders.forEach((osHeader, columnIndex) => {
            const osName = osHeader.textContent.trim();
            const lowerOsName = osName.toLowerCase();
            
            // Skip if this doesn't look like an OS name
            if (!lowerOsName.includes('linux') && 
                !lowerOsName.includes('windows') && 
                !lowerOsName.includes('macos') && 
                !lowerOsName.includes('ubuntu') && 
                !lowerOsName.includes('debian') && 
                !lowerOsName.includes('centos') && 
                !lowerOsName.includes('rhel') && 
                !lowerOsName.includes('amazon') &&
                !lowerOsName.includes('suse') &&
                !lowerOsName.includes('oracle') &&
                !lowerOsName.includes('rocky') &&
                !lowerOsName.includes('almalinux') &&
                !lowerOsName.includes('sles')) {
                console.log('Skipping non-OS header:', osName);
                return;
            }
            
            console.log('Processing OS:', osName);
            
            const supportedVersions = new Set();
            const architectures = new Set();
            
            // Look through all data rows for this OS column
            for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];
                const cells = Array.from(row.cells);
                const cellIndex = columnIndex + 1; // +1 because we skipped first header
                
                if (cells[cellIndex]) {
                    const cell = cells[cellIndex];
                    const cellContent = cell.textContent.trim();
                    const versionCell = cells[0] ? cells[0].textContent.trim() : '';
                    
                    // Check if this cell indicates support
                    const isSupported = 
                        cell.querySelector('svg') || // SVG checkmark
                        cellContent === '✓' || 
                        cellContent === '✔' ||
                        cellContent === '✔️' ||
                        cellContent.includes('✓') ||
                        cell.innerHTML.includes('✓') ||
                        cell.innerHTML.includes('check') ||
                        cell.classList.contains('supported') ||
                        cell.style.color === 'green' ||
                        (cellContent && cellContent !== '×' && cellContent !== '✗' && cellContent !== '-' && cellContent !== '');
                    
                    console.log(`Row ${rowIndex}, Cell ${cellIndex} (${osName}): "${cellContent}" - Supported: ${isSupported}`);
                    
                    if (isSupported && versionCell) {
                        // Extract version number from the version cell
                        const versionMatch = versionCell.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
                        if (versionMatch) {
                            const version = versionMatch[0];
                            supportedVersions.add(version);
                            console.log(`Added version ${version} for ${osName}`);
                        }
                        
                        // Look for architecture info in cell attributes or content
                        const archInfo = extractArchitecturesFromCell(cell);
                        archInfo.forEach(arch => architectures.add(arch));
                    }
                }
            }
            
            console.log(`Final versions for ${osName}:`, Array.from(supportedVersions));
            
            // Determine status based on version range
            let status = 'supported';
            const versionArray = Array.from(supportedVersions);
            
            if (versionArray.length === 0) {
                return; // Skip if no versions found
            }
            
            // Check if this OS only supports older versions
            const hasModernVersions = versionArray.some(v => {
                const match = v.match(/(\d+)\.(\d+)/);
                if (match) {
                    const major = parseInt(match[1]);
                    const minor = parseInt(match[2]);
                    return major >= 8 || (major === 7 && minor >= 17);
                }
                return false;
            });
            
            if (!hasModernVersions) {
                status = 'limited';
            }
            
            // Default to x86_64 if no architecture found
            if (architectures.size === 0) {
                architectures.add('x86_64');
            }
            
            data.push({
                os: osName,
                versions: Array.from(supportedVersions),
                architecture: Array.from(architectures),
                status: status,
                notes: `Supported product versions: ${Array.from(supportedVersions).join(', ')}`
            });
        });
        
        console.log('Final parsed data:', data);
        return data;
    }

    function extractArchitecturesFromCell(cell) {
        const archs = new Set();
        const cellText = cell.textContent.toLowerCase();
        const cellHtml = cell.innerHTML.toLowerCase();
        const allText = cellText + ' ' + cellHtml;
        
        if (allText.includes('x86_64') || allText.includes('x64') || allText.includes('amd64')) {
            archs.add('x86_64');
        }
        if (allText.includes('aarch64') || allText.includes('arm64')) {
            archs.add('aarch64');
        }
        if (allText.includes('apple silicon') || allText.includes('m1') || allText.includes('m2')) {
            archs.add('aarch64 (Apple Silicon)');
        }
        
        return Array.from(archs);
    }

    function parseTraditionalTable(table, rows) {
        const data = [];
        
        // Parse data rows (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.cells);
            
            if (cells.length === 0) continue;
            
            // Extract data from each cell
            const rowData = {
                os: extractOS(cells, []),
                versions: extractVersions(cells, []),
                architecture: extractArchitectures(cells, []),
                status: extractStatus(cells, []),
                notes: extractNotes(cells, [])
            };
            
            // Only add if we have meaningful OS data
            if (rowData.os && rowData.os.length > 2) {
                data.push(rowData);
            }
        }
        
        return data;
    }

    function extractArchitecturesFromText(text) {
        const archs = new Set();
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('x86_64') || lowerText.includes('x64') || lowerText.includes('amd64')) {
            archs.add('x86_64');
        }
        if (lowerText.includes('aarch64') || lowerText.includes('arm64')) {
            archs.add('aarch64');
        }
        if (lowerText.includes('apple silicon') || lowerText.includes('m1') || lowerText.includes('m2')) {
            archs.add('aarch64 (Apple Silicon)');
        }
        
        return Array.from(archs);
    }

    function extractOS(cells, headers) {
        // First cell is usually the OS name
        if (cells.length > 0) {
            return cells[0].textContent.trim();
        }
        return '';
    }

    function extractVersions(cells, headers) {
        const versions = new Set();
        
        // Look through all cells for version patterns
        cells.forEach(cell => {
            const text = cell.textContent;
            
            // Common version patterns
            const patterns = [
                /\b\d+\.\d+(?:\.\d+)?\b/g,  // 1.2.3, 10.04
                /\b\d+\b/g,                 // 7, 8, 9
                /\b[a-zA-Z]+\d+[a-zA-Z]*\b/g // cos97-lts, SP4
            ];
            
            patterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length < 10 && !match.match(/^\d{4}$/)) { // Avoid years
                            versions.add(match.trim());
                        }
                    });
                }
            });
        });
        
        return Array.from(versions).slice(0, 8); // Limit to reasonable number
    }

    function extractArchitectures(cells, headers) {
        const archs = new Set();
        
        cells.forEach(cell => {
            const text = cell.textContent.toLowerCase();
            
            // Look for architecture keywords
            const archPatterns = [
                'x86_64', 'x64', 'amd64',
                'aarch64', 'arm64', 'arm',
                'apple silicon', 'm1', 'm2', 'm3',
                'intel', 'amd'
            ];
            
            archPatterns.forEach(pattern => {
                if (text.includes(pattern)) {
                    if (pattern.includes('apple') || pattern.includes('m1') || pattern.includes('m2')) {
                        archs.add('aarch64 (Apple Silicon)');
                    } else if (pattern.includes('aarch64') || pattern.includes('arm64')) {
                        archs.add('aarch64');
                    } else if (pattern.includes('x86_64') || pattern.includes('x64') || pattern.includes('amd64')) {
                        archs.add('x86_64');
                    } else {
                        archs.add(pattern);
                    }
                }
            });
        });
        
        // If no specific architecture found, assume common ones
        if (archs.size === 0) {
            archs.add('x86_64');
        }
        
        return Array.from(archs);
    }

    function extractStatus(cells, headers) {
        const allText = cells.map(cell => cell.textContent.toLowerCase()).join(' ');
        
        if (allText.includes('deprecated') || allText.includes('end of life') || allText.includes('eol')) {
            return 'deprecated';
        } else if (allText.includes('limited') || allText.includes('partial') || allText.includes('beta')) {
            return 'limited';
        } else {
            return 'supported';
        }
    }

    function extractNotes(cells, headers) {
        // Combine text from cells that look like notes
        const notes = [];
        
        cells.forEach((cell, index) => {
            const text = cell.textContent.trim();
            
            // Skip empty cells and very short text
            if (text.length > 10) {
                // Skip if it looks like a simple version number or OS name
                if (!text.match(/^\d+(\.\d+)*$/) && !text.match(/^[A-Za-z\s]+\d*$/) && index > 0) {
                    notes.push(text);
                }
            }
        });
        
        return notes.join('. ').substring(0, 400); // Limit length
    }

    function parseTextToStructuredData(agentText) {
        // Fallback: extract what we can from the text
        const data = [];
        
        // Split into lines and look for patterns
        const lines = agentText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Look for OS mentions and try to extract info
        const osPatterns = [
            { pattern: /amazon linux/i, name: "Amazon Linux" },
            { pattern: /centos/i, name: "CentOS" },
            { pattern: /debian/i, name: "Debian" },
            { pattern: /red hat|rhel/i, name: "Red Hat Enterprise Linux (RHEL)" },
            { pattern: /suse|sles/i, name: "SUSE Linux Enterprise Server (SLES)" },
            { pattern: /ubuntu/i, name: "Ubuntu" },
            { pattern: /oracle linux/i, name: "Oracle Linux" },
            { pattern: /rocky linux/i, name: "Rocky Linux" },
            { pattern: /almalinux/i, name: "AlmaLinux" },
            { pattern: /macos|mac os/i, name: "macOS" },
            { pattern: /windows server/i, name: "Windows Server" },
            { pattern: /windows(?!\s+server)/i, name: "Windows" },
            { pattern: /container.optimized|cos\d+/i, name: "Google Container-Optimized OS" }
        ];
        
        // Extract general information from the text
        const generalNotes = [];
        if (agentText.includes('aarch64')) generalNotes.push('ARM64 support available');
        if (agentText.includes('M1') || agentText.includes('M2')) generalNotes.push('Apple Silicon support');
        if (agentText.includes('32-bit')) generalNotes.push('32-bit systems not supported');
        if (agentText.includes('PowerShell ISE')) generalNotes.push('PowerShell ISE not supported');
        
        // For each OS pattern, create an entry if found
        osPatterns.forEach(osPattern => {
            if (osPattern.pattern.test(agentText)) {
                // Try to find version info near the OS mention
                const versions = extractVersionsFromText(agentText, osPattern.pattern);
                const architectures = extractArchFromText(agentText);
                const status = extractStatusFromText(agentText, osPattern.pattern);
                
                data.push({
                    os: osPattern.name,
                    versions: versions.length > 0 ? versions : ['See documentation'],
                    architecture: architectures.length > 0 ? architectures : ['x86_64'],
                    status: status,
                    notes: `${generalNotes.join('. ')}. Extracted from Elastic support matrix text.`
                });
            }
        });
        
        return data;
    }

    function extractVersionsFromText(text, osPattern) {
        // This is a simplified extraction - in a real implementation,
        // you'd want more sophisticated parsing
        const versionPatterns = /\b(\d+(?:\.\d+)*(?:\s*LTS)?)\b/g;
        const versions = new Set();
        
        const matches = text.match(versionPatterns);
        if (matches) {
            matches.forEach(match => {
                if (match.length < 10) {
                    versions.add(match.trim());
                }
            });
        }
        
        return Array.from(versions).slice(0, 6);
    }

    function extractArchFromText(text) {
        const archs = new Set();
        if (text.includes('aarch64')) archs.add('aarch64');
        if (text.includes('x86_64')) archs.add('x86_64');
        if (text.includes('M1') || text.includes('M2')) archs.add('aarch64 (Apple Silicon)');
        
        return Array.from(archs);
    }

    function extractStatusFromText(text, osPattern) {
        if (text.includes('end of life') || text.includes('deprecated')) {
            return 'limited';
        }
        return 'supported';
    }

    function showEnhancedInterface() {
        console.log('Finding product tables...');
        const productTables = findProductTables();

        if (productTables.length === 0) {
            alert('No product support tables found on this page.');
            return;
        }

        // Create a product selector UI
        const overlay = document.createElement('div');
        overlay.id = 'elastic-enhancer-overlay';
        overlay.innerHTML = createProductSelectorUI(productTables);
        document.body.appendChild(overlay);

        initializeProductSelection(productTables);
        setTimeout(() => overlay.classList.add('visible'), 10);
    }

    function createProductSelectorUI(productTables) {
        const productButtons = productTables.map((product, index) =>
            `<button class="product-selector-btn" data-table-index="${index}">
                ${product.name}
            </button>`
        ).join('');

        return `
            <div class="enhanced-container product-selector-container">
                <div class="enhanced-header">
                    <div class="header-icon">🛡️</div>
                    <h1>Select a Product</h1>
                    <p>Choose a product to view its support matrix.</p>
                    <button class="close-btn" onclick="this.closest('#elastic-enhancer-overlay').remove()">×</button>
                </div>
                <div class="product-selector-grid">
                    ${productButtons}
                </div>
            </div>
        `;
    }

    function initializeProductSelection(productTables) {
        document.querySelectorAll('.product-selector-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const tableIndex = event.currentTarget.dataset.tableIndex;
                const selectedProduct = productTables[tableIndex];
                showProductView(selectedProduct);
            });
        });
    }

    function showProductView(product) {
        console.log(`Parsing table for ${product.name}...`);
        const data = parseProductTable(product.table);

        if (data.length === 0) {
            alert(`Could not parse any support data from the ${product.name} table.`);
            return;
        }

        console.log('Successfully parsed data:', data);

        // Create the enhanced interface
        const overlay = document.getElementById('elastic-enhancer-overlay');
        overlay.innerHTML = createEnhancedInterfaceHTML(data, product.name);
        
        initializeEnhancedInterface(data);
    }

    function parseProductTable(table) {
        const data = [];
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length < 2) {
            console.log('Table has insufficient rows');
            return data;
        }
        
        console.log(`Parsing table with ${rows.length} rows`);
        
        // Get the header row (first row with OS names)
        const headerRow = rows[0];
        const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
        const osNames = headerCells.map(cell => cell.textContent.trim());
        
        console.log('OS Names from headers:', osNames);
        
        // Create a map to store support data for each OS
        const osSupport = new Map();
        
        // Initialize each OS with empty version sets
        osNames.forEach((osName, index) => {
            if (osName && osName.length > 2 && index > 0) { // Skip first empty cell
                osSupport.set(osName, {
                    versions: new Set(),
                    architecture: new Set(['x86_64']), // Default architecture
                    status: 'supported'
                });
            }
        });
        
        // Process each data row (Agent versions)
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cells = Array.from(row.querySelectorAll('th, td'));
            
            if (cells.length === 0) continue;
            
            // First cell should contain the Agent version
            const versionCell = cells[0];
            const versionText = versionCell ? versionCell.textContent.trim() : '';
            
            // Extract Agent version number
            const productVersionMatch = versionText.match(/(?:\S+)\s+(\d+\.\d+(?:\.\d+)?)/i) || versionText.match(/(\d+\.\d+(?:\.\d+)?)/);
            if (!productVersionMatch) {
                console.log(`No product version found in: "${versionText}"`);
                continue;
            }
            
            const productVersion = productVersionMatch[1];
            console.log(`Processing version ${productVersion}`);
            
            // Check support for each OS (skip first cell which is the version)
            for (let cellIndex = 1; cellIndex < cells.length && cellIndex < osNames.length; cellIndex++) {
                const cell = cells[cellIndex];
                const osName = osNames[cellIndex];
                
                if (!osName || !osSupport.has(osName)) continue;
                
                // Check if this cell indicates support
                const cellText = cell.textContent.trim();
                const cellHTML = cell.innerHTML;
                
                const isSupported = 
                    cellText === '✓' ||
                    cellText === '✔' ||
                    cellHTML.includes('✓') ||
                    cellHTML.includes('check') ||
                    cell.querySelector('svg[data-test-subj="checkInCircleFilled"]') ||
                    cell.style.color === 'green' ||
                    cell.classList.contains('supported');
                
                const isNotSupported = 
                    cellText === '×' ||
                    cellText === '✗' ||
                    cellText === 'X' ||
                    cellHTML.includes('×') ||
                    cellHTML.includes('cross') ||
                    cell.querySelector('svg[data-test-subj="cross"]');
                
                console.log(`  ${osName}: "${cellText}" -> ${isSupported ? 'SUPPORTED' : (isNotSupported ? 'NOT SUPPORTED' : 'UNKNOWN')}`);
                
                if (isSupported) {
                    osSupport.get(osName).versions.add(productVersion);
                }
                
                // Check for architecture info
                if (osName.toLowerCase().includes('mac')) {
                    osSupport.get(osName).architecture.add('aarch64 (Apple Silicon)');
                } else if (osName.toLowerCase().includes('linux') && productVersion >= '7.16') {
                    osSupport.get(osName).architecture.add('aarch64');
                }
            }
        }
        
        // Convert to final data format
        for (const [osName, supportInfo] of osSupport) {
            const versions = Array.from(supportInfo.versions);
            
            if (versions.length > 0) {
                // Determine status based on latest versions
                const hasRecentVersions = versions.some(v => {
                    const match = v.match(/(\d+)\.(\d+)/);
                    if (match) {
                        const major = parseInt(match[1]);
                        const minor = parseInt(match[2]);
                        return major >= 8 || (major === 7 && minor >= 17);
                    }
                    return false;
                });
                
                data.push({
                    os: osName,
                    versions: versions.sort((a, b) => {
                        // Sort versions numerically (newest first)
                        const aNum = parseFloat(a.replace(/[^\d\.]/g, ''));
                        const bNum = parseFloat(b.replace(/[^\d\.]/g, ''));
                        return bNum - aNum;
                    }),
                    architecture: Array.from(supportInfo.architecture),
                    status: hasRecentVersions ? 'supported' : 'limited',
                    notes: `Supports product versions: ${versions.join(', ')}`
                });
            }
        }
        
        console.log('Final parsed data:', data);
        return data;
    }

    function createDebugInterfaceHTML(tables) {
        let tableAnalysis = '';
        
        tables.forEach((table, index) => {
            const rows = table.querySelectorAll('tr');
            const firstRowCells = rows[0] ? Array.from(rows[0].querySelectorAll('th, td')) : [];
            const secondRowCells = rows[1] ? Array.from(rows[1].querySelectorAll('th, td')) : [];
            
            const tableText = table.innerText.substring(0, 300);
            const hasAgentText = tableText.toLowerCase().includes('elastic agent') || tableText.includes('7.') || tableText.includes('8.');
            
            tableAnalysis += `
                <div class="table-analysis ${hasAgentText ? 'potential-target' : ''}">
                    <h3>Table ${index + 1} ${hasAgentText ? '(POTENTIAL ELASTIC AGENT TABLE)' : ''}</h3>
                    <p><strong>Dimensions:</strong> ${rows.length} rows × ${firstRowCells.length} columns</p>
                    <p><strong>First row headers:</strong></p>
                    <div class="cell-preview">
                        ${firstRowCells.map(cell => `<span class="cell">${cell.textContent.trim()}</span>`).join('')}
                    </div>
                    <p><strong>Second row data:</strong></p>
                    <div class="cell-preview">
                        ${secondRowCells.map(cell => `<span class="cell">${cell.textContent.trim()}</span>`).join('')}
                    </div>
                    <p><strong>Table preview:</strong></p>
                    <div class="table-preview">${tableText}...</div>
                    <button onclick="analyzeTable(${index})" class="analyze-btn">Analyze This Table</button>
                </div>
            `;
        });
        
        return `
            <div class="enhanced-container">
                <div class="enhanced-header">
                    <h1>🔍 Debug Mode: Table Analysis</h1>
                    <p>Let's see what tables are actually on this page</p>
                    <button class="close-btn" onclick="this.closest('#elastic-enhancer-overlay').remove()">×</button>
                </div>
                
                <div class="debug-content">
                    <div class="instructions">
                        <h3>Instructions:</h3>
                        <ol>
                            <li>Look for the table that contains "Elastic Agent" or version numbers</li>
                            <li>Click "Analyze This Table" on the correct table</li>
                            <li>We'll then parse that specific table properly</li>
                        </ol>
                    </div>
                    
                    ${tableAnalysis}
                </div>
            </div>
        `;
    }

    // Global function for analyzing a specific table
    window.analyzeTable = function(tableIndex) {
        const tables = document.querySelectorAll('table');
        const targetTable = tables[tableIndex];
        
        if (!targetTable) {
            alert('Table not found');
            return;
        }
        
        console.log('=== ANALYZING TABLE ===');
        console.log('Table HTML:', targetTable.outerHTML);
        
        const rows = Array.from(targetTable.querySelectorAll('tr'));
        console.log(`Table has ${rows.length} rows`);
        
        // Analyze each row
        rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            console.log(`Row ${rowIndex}:`, cells.map(cell => cell.textContent.trim()));
            
            // Look for checkmarks or support indicators in each cell
            cells.forEach((cell, cellIndex) => {
                const text = cell.textContent.trim();
                const html = cell.innerHTML;
                const hasCheckmark = html.includes('✓') || html.includes('check') || cell.querySelector('svg');
                
                if (hasCheckmark || text === '✓') {
                    console.log(`  Cell [${rowIndex}][${cellIndex}] has checkmark: "${text}"`);
                }
            });
        });
        
        // Try to parse this specific table
        const data = parseSpecificTable(targetTable);
        
        if (data.length > 0) {
            // Replace debug interface with actual results
            const overlay = document.getElementById('elastic-enhancer-overlay');
            overlay.innerHTML = createEnhancedInterfaceHTML(data);
            initializeEnhancedInterface(data);
        } else {
            alert('Could not parse any data from this table. Check the console for details.');
        }
    };

    function parseSpecificTable(table) {
        const data = [];
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length < 2) return data;
        
        // Get headers
        const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        const headers = headerCells.map(cell => cell.textContent.trim());
        
        console.log('Headers:', headers);
        
        // Check if first column contains Agent versions or OS names
        const firstDataCell = rows[1] ? rows[1].querySelector('th, td') : null;
        const firstCellText = firstDataCell ? firstDataCell.textContent.trim() : '';
        
        console.log('First data cell:', firstCellText);
        
        const isAgentInRows = /elastic agent|^\d+\.\d+/i.test(firstCellText);
        
        if (isAgentInRows) {
            console.log('Agent versions are in rows, OS in columns');
            return parseWithAgentInRows(table, rows, headers);
        } else {
            console.log('OS names are in rows, versions in columns');  
            return parseWithOSInRows(table, rows, headers);
        }
    }

    function parseWithAgentInRows(table, rows, headers) {
        const osData = new Map();
        
        // Process each row (Agent version)
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cells = Array.from(row.querySelectorAll('th, td'));
            
            const versionText = cells[0] ? cells[0].textContent.trim() : '';
            const versionMatch = versionText.match(/(\d+\.\d+(?:\.\d+)?)/);
            
            if (!versionMatch) continue;
            
            const agentVersion = versionMatch[1];
            
            // Check each OS column
            for (let colIndex = 1; colIndex < cells.length && colIndex < headers.length; colIndex++) {
                const cell = cells[colIndex];
                const osName = headers[colIndex];
                
                if (!osName || osName.length < 2) continue;
                
                // Check for support indicators
                const cellText = cell.textContent.trim();
                const cellHTML = cell.innerHTML;
                const hasSupport = 
                    cellHTML.includes('✓') ||
                    cellHTML.includes('check') ||
                    cell.querySelector('svg') ||
                    (cellText !== '' && cellText !== '×' && cellText !== '-');
                
                if (hasSupport) {
                    if (!osData.has(osName)) {
                        osData.set(osName, new Set());
                    }
                    osData.get(osName).add(agentVersion);
                }
            }
        }
        
        // Convert to final format
        const result = [];
        for (const [osName, versionsSet] of osData) {
            const versions = Array.from(versionsSet).sort((a, b) => {
                const aNum = parseFloat(a);
                const bNum = parseFloat(b);
                return bNum - aNum; // Newest first
            });
            
            result.push({
                os: osName,
                versions: versions,
                architecture: ['x86_64'],
                status: 'supported',
                notes: `Supports Agent versions: ${versions.join(', ')}`
            });
        }
        
        return result;
    }

    function parseWithOSInRows(table, rows, headers) {
        const data = [];
        
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cells = Array.from(row.querySelectorAll('th, td'));
            
            const osName = cells[0] ? cells[0].textContent.trim() : '';
            if (!osName || osName.length < 2) continue;
            
            const versions = [];
            
            // Look for version info in other cells
            for (let colIndex = 1; colIndex < cells.length; colIndex++) {
                const cell = cells[colIndex];
                const cellText = cell.textContent.trim();
                
                // Extract version numbers
                const versionMatches = cellText.match(/\d+\.\d+(?:\.\d+)?/g);
                if (versionMatches) {
                    versions.push(...versionMatches);
                }
            }
            
            if (versions.length > 0) {
                data.push({
                    os: osName,
                    versions: [...new Set(versions)], // Remove duplicates
                    architecture: ['x86_64'],
                    status: 'supported',
                    notes: `Found versions: ${versions.join(', ')}`
                });
            }
        }
        
        return data;
    }

    function parseElasticAgentTable(table) {
        const data = [];
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length < 2) {
            console.log('Table has too few rows');
            return data;
        }
        
        console.log('Parsing table with', rows.length, 'rows');
        
        // Get header row
        const headerRow = rows[0];
        const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
        const headers = headerCells.map(cell => cell.textContent.trim());
        
        console.log('Headers:', headers);
        
        // Determine table orientation
        const firstRowText = rows[1] ? (rows[1].textContent || '') : '';
        const isAgentVersionInRows = /Elastic Agent|^\s*\d+\.\d+/.test(firstRowText);
        
        console.log('Agent versions in rows?', isAgentVersionInRows);
        console.log('First data row text:', firstRowText.substring(0, 100));
        
        if (isAgentVersionInRows) {
            // Rows = Agent versions, Columns = OS versions
            return parseTableWithAgentVersionsInRows(table, rows, headers);
        } else {
            // Traditional format: Rows = OS, Columns = versions/info
            return parseTableWithOSInRows(table, rows, headers);
        }
    }

    function parseTableWithAgentVersionsInRows(table, rows, headers) {
        const data = [];
        const osMap = new Map(); // Map OS name to supported versions
        
        console.log('Parsing table with Agent versions in rows');
        
        // Skip headers, process each row as an Agent version
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cells = Array.from(row.querySelectorAll('th, td'));
            
            if (cells.length < 2) continue;
            
            // First cell should be the Agent version
            const versionText = cells[0].textContent.trim();
            const versionMatch = versionText.match(/(\d+\.\d+(?:\.\d+)?)/);
            
            if (!versionMatch) {
                console.log('No version found in row:', versionText);
                continue;
            }
            
            const agentVersion = versionMatch[1];
            console.log('Processing Agent version:', agentVersion);
            
            // Check each OS column for support
            for (let colIndex = 1; colIndex < Math.min(cells.length, headers.length); colIndex++) {
                const cell = cells[colIndex];
                const osName = headers[colIndex];
                
                if (!osName || osName.length < 3) continue;
                
                // Check if this cell indicates support
                const isSupported = checkCellSupport(cell);
                
                if (isSupported) {
                    if (!osMap.has(osName)) {
                        osMap.set(osName, new Set());
                    }
                    osMap.get(osName).add(agentVersion);
                    console.log(`${osName} supports Agent ${agentVersion}`);
                }
            }
        }
        
        // Convert map to data array
        for (const [osName, versionsSet] of osMap) {
            const versions = Array.from(versionsSet);
            
            // Determine architecture (default to x86_64)
            const architecture = ['x86_64'];
            if (osName.toLowerCase().includes('mac')) {
                architecture.push('aarch64 (Apple Silicon)');
            } else if (osName.toLowerCase().includes('linux')) {
                architecture.push('aarch64');
            }
            
            // Determine status based on version range
            const hasModernVersions = versions.some(v => {
                const match = v.match(/(\d+)\.(\d+)/);
                if (match) {
                    const major = parseInt(match[1]);
                    return major >= 8;
                }
                return false;
            });
            
            data.push({
                os: osName,
                versions: versions,
                architecture: architecture,
                status: hasModernVersions ? 'supported' : 'limited',
                notes: `Supports Agent versions: ${versions.join(', ')}`
            });
        }
        
        return data;
    }

    function parseTableWithOSInRows(table, rows, headers) {
        const data = [];
        
        console.log('Parsing table with OS in rows');
        
        // Process each row as an OS
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cells = Array.from(row.querySelectorAll('th, td'));
            
            if (cells.length < 2) continue;
            
            const osName = cells[0].textContent.trim();
            if (!osName || osName.length < 3) continue;
            
            // Extract version info from other cells
            const versions = new Set();
            const architectures = new Set(['x86_64']);
            
            for (let colIndex = 1; colIndex < cells.length; colIndex++) {
                const cell = cells[colIndex];
                const cellText = cell.textContent.trim();
                
                // Look for version patterns
                const versionMatches = cellText.match(/\d+\.\d+(?:\.\d+)?/g);
                if (versionMatches) {
                    versionMatches.forEach(v => versions.add(v));
                }
                
                // Check for architecture info
                if (cellText.toLowerCase().includes('aarch64') || 
                    cellText.toLowerCase().includes('arm64')) {
                    architectures.add('aarch64');
                }
            }
            
            if (versions.size > 0) {
                data.push({
                    os: osName,
                    versions: Array.from(versions),
                    architecture: Array.from(architectures),
                    status: 'supported',
                    notes: `Extracted from support matrix`
                });
            }
        }
        
        return data;
    }

    function checkCellSupport(cell) {
        // Check various indicators of support
        const cellText = cell.textContent.trim();
        const cellHTML = cell.innerHTML;
        
        // Look for checkmarks, green indicators, etc.
        const hasCheckmark = 
            cellText === '✓' || 
            cellText === '✔' ||
            cellText === '✔️' ||
            cellText.includes('✓') ||
            cellHTML.includes('✓') ||
            cellHTML.includes('check') ||
            cellHTML.includes('tick') ||
            cell.querySelector('svg') !== null ||
            cell.style.backgroundColor.includes('green') ||
            cell.classList.contains('supported') ||
            cell.classList.contains('yes') ||
            (cellText !== '' && cellText !== '×' && cellText !== '✗' && cellText !== '-' && cellText !== 'No');
        
        return hasCheckmark;
    }

    function createEnhancedInterfaceHTML(data, productName) {
        return `
            <div class="enhanced-container">
                <div class="enhanced-header">
                    <h1>🛡️ ${productName} Support Matrix</h1>
                    <p>Enhanced view with search and filtering • Data from current page</p>
                    <button class="close-btn" onclick="this.closest('#elastic-enhancer-overlay').remove()">×</button>
                </div>
                
                <div class="enhanced-controls">
                    <div class="search-box">
                        <input type="text" id="enhanced-search" placeholder="🔍 Search operating systems...">
                        <select id="enhanced-agent-version">
                            <option value="">All Versions</option>
                        </select>
                        <select id="enhanced-os-filter">
                            <option value="">All Operating Systems</option>
                        </select>
                        <select id="enhanced-arch-filter">
                            <option value="">All Architectures</option>
                        </select>
                        <select id="enhanced-status-filter">
                            <option value="">All Status</option>
                            <option value="supported">Supported</option>
                            <option value="limited">Limited</option>
                            <option value="deprecated">Deprecated</option>
                        </select>
                        <button id="enhanced-clear">Clear</button>
                    </div>
                    
                    <div class="stats-bar">
                        <div class="stat">
                            <span class="stat-number" id="enhanced-total">0</span>
                            <span class="stat-label">Total OS</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number" id="enhanced-showing">0</span>
                            <span class="stat-label">Showing</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number" id="enhanced-supported">0</span>
                            <span class="stat-label">Supported</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number" id="enhanced-versions">0</span>
                            <span class="stat-label">Versions</span>
                        </div>
                    </div>
                </div>
                
                <div class="enhanced-table-container">
                    <table class="enhanced-table">
                        <thead>
                            <tr>
                                <th>Operating System</th>
                                <th>Version Range</th>
                                <th>Architecture</th>
                                <th>Status</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody id="enhanced-table-body">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function initializeEnhancedInterface(data) {
        let filteredData = [...data];
        
        // Populate filters
        populateFilters(data);
        
        // Render initial table
        renderEnhancedTable(filteredData);
        
        // Add event listeners
        document.getElementById('enhanced-search').addEventListener('input', applyFilters);
        document.getElementById('enhanced-agent-version').addEventListener('change', applyFilters);
        document.getElementById('enhanced-os-filter').addEventListener('change', applyFilters);
        document.getElementById('enhanced-arch-filter').addEventListener('change', applyFilters);
        document.getElementById('enhanced-status-filter').addEventListener('change', applyFilters);
        document.getElementById('enhanced-clear').addEventListener('click', clearFilters);
        
        function applyFilters() {
            const search = document.getElementById('enhanced-search').value.toLowerCase();
            const agentVersionFilter = document.getElementById('enhanced-agent-version').value;
            const osFilter = document.getElementById('enhanced-os-filter').value;
            const archFilter = document.getElementById('enhanced-arch-filter').value;
            const statusFilter = document.getElementById('enhanced-status-filter').value;
            
            filteredData = data.filter(item => {
                const matchesSearch = !search || 
                    item.os.toLowerCase().includes(search) ||
                    item.architecture.some(a => a.toLowerCase().includes(search));
                
                const matchesAgentVersion = !agentVersionFilter || 
                    item.versions.some(v => v.toLowerCase().includes(agentVersionFilter.toLowerCase()));
                
                const matchesOS = !osFilter || item.os === osFilter;
                const matchesArch = !archFilter || item.architecture.includes(archFilter);
                const matchesStatus = !statusFilter || item.status === statusFilter;
                
                return matchesSearch && matchesAgentVersion && matchesOS && matchesArch && matchesStatus;
            });
            
            renderEnhancedTable(filteredData);
        }
        
        function clearFilters() {
            document.getElementById('enhanced-search').value = '';
            document.getElementById('enhanced-agent-version').value = '';
            document.getElementById('enhanced-os-filter').value = '';
            document.getElementById('enhanced-arch-filter').value = '';
            document.getElementById('enhanced-status-filter').value = '';
            filteredData = [...data];
            renderEnhancedTable(filteredData);
        }
    }

    function populateFilters(data) {
        const agentVersionFilter = document.getElementById('enhanced-agent-version');
        const osFilter = document.getElementById('enhanced-os-filter');
        const archFilter = document.getElementById('enhanced-arch-filter');
        
        // Get unique Agent versions (sorted)
        const allVersions = [...new Set(data.flatMap(item => item.versions))];
        const sortedVersions = allVersions.sort((a, b) => {
            // Try to sort numerically if possible
            const aNum = parseFloat(a.replace(/[^\d\.]/g, ''));
            const bNum = parseFloat(b.replace(/[^\d\.]/g, ''));
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return bNum - aNum; // Descending order (newest first)
            }
            return a.localeCompare(b);
        });
        
        sortedVersions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = version;
            agentVersionFilter.appendChild(option);
        });
        
        // Get unique OS names
        const osNames = [...new Set(data.map(item => item.os))].sort();
        osNames.forEach(os => {
            const option = document.createElement('option');
            option.value = os;
            option.textContent = os;
            osFilter.appendChild(option);
        });
        
        // Get unique architectures
        const architectures = [...new Set(data.flatMap(item => item.architecture))].sort();
        architectures.forEach(arch => {
            const option = document.createElement('option');
            option.value = arch;
            option.textContent = arch;
            archFilter.appendChild(option);
        });
    }

    function renderEnhancedTable(data) {
        const tbody = document.getElementById('enhanced-table-body');
        const totalCount = document.getElementById('enhanced-total');
        const showingCount = document.getElementById('enhanced-showing');
        const supportedCount = document.getElementById('enhanced-supported');
        const versionsCount = document.getElementById('enhanced-versions');
        
        // Update stats
        const total = data.length;
        const showing = data.length;
        const supported = data.filter(item => item.status === 'supported').length;
        const allVersions = [...new Set(data.flatMap(item => item.versions))].length;
        
        totalCount.textContent = total;
        showingCount.textContent = showing;
        supportedCount.textContent = supported;
        versionsCount.textContent = allVersions;
        
        // Clear table
        tbody.innerHTML = '';
        
        // Populate table
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Create a clean version range instead of individual badges
            const sortedVersions = item.versions.sort((a, b) => {
                const aMatch = a.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
                const bMatch = b.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
                
                if (aMatch && bMatch) {
                    const aMajor = parseInt(aMatch[1]) || 0;
                    const aMinor = parseInt(aMatch[2]) || 0;
                    const aPatch = parseInt(aMatch[3]) || 0;
                    
                    const bMajor = parseInt(bMatch[1]) || 0;
                    const bMinor = parseInt(bMatch[2]) || 0;
                    const bPatch = parseInt(bMatch[3]) || 0;
                    
                    if (aMajor !== bMajor) return bMajor - aMajor;
                    if (aMinor !== bMinor) return bMinor - aMinor;
                    return bPatch - aPatch;
                }
                return b.localeCompare(a);
            });
            
            // Create a clean version range display
            let versionDisplay = '';
            if (sortedVersions.length === 0) {
                versionDisplay = '<span class="version-range">No versions found</span>';
            } else if (sortedVersions.length === 1) {
                versionDisplay = `<span class="version-range">${sortedVersions[0]} only</span>`;
            } else {
                const newest = sortedVersions[0];
                const oldest = sortedVersions[sortedVersions.length - 1];
                
                // Show the actual range
                if (newest === oldest) {
                    versionDisplay = `<span class="version-range">${newest}</span>`;
                } else {
                    versionDisplay = `<span class="version-range">${newest} ← ${oldest}</span>`;
                }
            }
            
            const archBadges = item.architecture.map(arch =>
                `<span class="arch-badge">${arch}</span>`
            ).join(' ');
            
            const statusClass = `status-${item.status}`;
            const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
            
            row.innerHTML = `
                <td class="os-cell">${item.os}</td>
                <td class="versions-cell">${versionDisplay}</td>
                <td class="arch-cell">${archBadges}</td>
                <td class="status-cell"><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="details-cell"></td>
            `;
            
            // Add hidden row for full version details
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.style.display = 'none';
            detailRow.innerHTML = `
                <td colspan="5" class="detail-content">
                    <div class="version-details">
                        <h4>All Supported Product Versions:</h4>
                        <div class="version-grid">
                            ${sortedVersions.map(v => `<span class="version-badge">${v}</span>`).join('')}
                        </div>
                    </div>
                </td>
            `;
            
            // Create and append the details button programmatically
            const detailsCell = row.querySelector('.details-cell');
            const detailsButton = document.createElement('button');
            detailsButton.className = 'details-btn';
            detailsButton.textContent = `View All Versions (${sortedVersions.length})`;
            detailsButton.addEventListener('click', () => toggleDetails(detailsButton, detailRow));
            detailsCell.appendChild(detailsButton);
            
            tbody.appendChild(row);
            tbody.appendChild(detailRow);
        });
    }

    // This function is now called directly from the event listener
    function toggleDetails(button, detailRow) {
        if (detailRow.style.display === 'none') {
            detailRow.style.display = 'table-row';
            button.textContent = button.textContent.replace('View', 'Hide');
        } else {
            detailRow.style.display = 'none';
            button.textContent = button.textContent.replace('Hide', 'View');
        }
    }
})();