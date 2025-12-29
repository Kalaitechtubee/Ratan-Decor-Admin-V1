// ExportButton.jsx - Reusable export component for admin panel
import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, Filter, FileText, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Reusable Export Button Component
 * 
 * @param {Object} props
 * @param {Array} props.data - Current page data to export
 * @param {Array} props.columns - Column configuration [{key, header}]
 * @param {string} props.filename - Base filename for export
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.hasFilters - Shows indicator when filters are active
 * @param {Function} props.onExport - Custom export handler (format, exportType) => Promise
 * @param {number} props.totalRecords - Total records available (for "All" export)
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total pages available
 */
const ExportButton = ({
    data = [],
    columns = [],
    filename = 'export',
    loading = false,
    disabled = false,
    hasFilters = false,
    onExport,
    totalRecords = 0,
    currentPage = 1,
    totalPages = 1,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState('current'); // 'current' or 'all'
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format a single cell value
    const formatCellValue = (value, column) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            if (value.name) return value.name;
            return JSON.stringify(value);
        }
        return String(value);
    };

    // Generate timestamp for filename
    const getTimestamp = () => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    };

    // Get full filename with suffix
    const getFullFilename = (extension) => {
        const suffix = hasFilters ? '-filtered' : '';
        const pageSuffix = exportType === 'current' ? `-page${currentPage}` : '-all';
        return `${filename}${suffix}${pageSuffix}-${getTimestamp()}.${extension}`;
    };

    // Convert data to row format for export
    const convertToRows = (exportData) => {
        return exportData.map(item =>
            columns.reduce((row, col) => {
                const value = col.key.includes('.')
                    ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
                    : item[col.key];
                row[col.header] = formatCellValue(value, col);
                return row;
            }, {})
        );
    };

    // Export to CSV
    const exportToCSV = (exportData) => {
        const headers = columns.map(col => col.header);
        const rows = exportData.map(item =>
            columns.map(col => {
                const value = col.key.includes('.')
                    ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
                    : item[col.key];
                const formatted = formatCellValue(value, col);
                if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
                    return `"${formatted.replace(/"/g, '""')}"`;
                }
                return formatted;
            })
        );

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getFullFilename('csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // Export to Excel using xlsx library
    const exportToExcel = (exportData) => {
        const rows = convertToRows(exportData);
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Set column widths
        const columnWidths = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));
        worksheet['!cols'] = columnWidths;

        // Create workbook and add worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

        // Write file and trigger download
        XLSX.writeFile(workbook, getFullFilename('xlsx'));
    };

    // Export handler
    const handleExport = async (format) => {
        if (data.length === 0 && exportType === 'current') {
            alert('No data to export');
            return;
        }

        setExporting(true);
        try {
            let exportData = data;

            // If custom handler provided, attempt to use it
            if (onExport) {
                const result = await onExport(format, exportType);
                if (result) {
                    exportData = result;
                } else if (exportType === 'all') {
                    // If 'all' export returns null/false, we abort (assuming error or cancellation)
                    setExporting(false);
                    setIsOpen(false);
                    return;
                }
                // If 'current' export returns null/false, we fall back to using props.data (default behavior)
            }

            if (format === 'csv') {
                exportToCSV(exportData);
            } else if (format === 'excel') {
                exportToExcel(exportData);
            }

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
            setIsOpen(false);
        }
    };

    const isLoading = loading || exporting;
    const isDisabled = disabled || isLoading;
    const recordCount = exportType === 'all' ? totalRecords : data.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isDisabled}
                className={`
          flex items-center gap-2 px-4 py-2 h-[38px] rounded-lg font-medium text-sm
          transition-all duration-200 shadow-sm
          ${isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-red-600 hover:shadow-md active:scale-95'
                    }
        `}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <Download size={16} />
                        <span>Export</span>
                        {hasFilters && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                <Filter size={10} />
                            </span>
                        )}
                        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && !isDisabled && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                    {/* Page Selection */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Layers size={12} />
                            Export Range
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setExportType('current')}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${exportType === 'current'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Current Page
                            </button>
                            <button
                                onClick={() => setExportType('all')}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${exportType === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All Pages ({totalRecords || data.length})
                            </button>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide px-1">Export Format</p>
                    </div>


                    {/* Excel Option */}
                    <button
                        onClick={() => handleExport('excel')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileSpreadsheet size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Excel File</p>
                            <p className="text-xs text-gray-500">Microsoft Excel format (.xlsx)</p>
                        </div>
                    </button>

                    {/* Data count info */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500">
                            {hasFilters ? (
                                <span className="flex items-center gap-1">
                                    <Filter size={10} className="text-primary" />
                                    Exporting {recordCount} filtered {recordCount === 1 ? 'record' : 'records'}
                                </span>
                            ) : (
                                <span>{recordCount} {recordCount === 1 ? 'record' : 'records'} will be exported</span>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
